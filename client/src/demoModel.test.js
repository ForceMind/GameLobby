import assert from 'node:assert/strict'
import test from 'node:test'
import { games, coinPacks } from './data.js'
import {
  filterGames,
  packSummary,
  validateDemoCode,
  nextWheelAngle,
  isValidNickname,
  gameGate,
} from './demoModel.js'

test('昵称按Unicode字符计数并覆盖空值与边界', () => {
  assert.equal(isValidNickname(' '), false)
  assert.equal(isValidNickname('A'), false)
  assert.equal(isValidNickname(' 玩家 '), true)
  assert.equal(isValidNickname('🙂'), false)
  assert.equal(isValidNickname('🙂🙂'), true)
  assert.equal(isValidNickname('A'.repeat(20)), true)
  assert.equal(isValidNickname('A'.repeat(21)), false)
})

test('分类包含双标签游戏，服务状态过滤可组合', () => {
  // Ocean 777 带地区白名单；不传国家时按 fail-closed 规则默认不可见，
  // 因此不传 country 的计数比总数少 1 —— 这条测试只关心分类/状态过滤，
  // 地区过滤本身的行为由下面「按玩家所在国家过滤」那条测试单独覆盖。
  assert.equal(filterGames(games, 'all').length, 7)
  assert.deepEqual(filterGames([], 'all'), [])
  assert.deepEqual(
    filterGames(games, 'realtime').map((game) => game.id),
    ['golden-pharaoh', 'fish-hunter'],
  )
  assert.equal(filterGames(games, 'slots').length, 3)
  assert.equal(filterGames(games, 'slots', true).length, 2)
  assert.ok(
    filterGames(games, 'all', true).every((game) => game.status === 'ready'),
  )
  assert.deepEqual(
    filterGames(games, 'popular').map((game) => game.id),
    ['golden-pharaoh', 'fruit-party', 'fish-hunter', 'bubble-pop'],
  )
  assert.deepEqual(
    filterGames(games, 'slots', true, true).map((game) => game.id),
    ['golden-pharaoh'],
  )
  assert.deepEqual(
    filterGames(games, 'casual', true, true).map((game) => game.id),
    ['fish-hunter'],
  )
})

test('礼包使用美元定价与独立折扣，金币不因折扣增加', () => {
  assert.deepEqual(
    coinPacks.map((pack) => packSummary(pack).priceCents),
    [55, 246, 490, 768],
  )
  for (const pack of coinPacks) {
    const summary = packSummary(pack)
    assert.equal(summary.totalCoins, summary.baseCoins)
    assert.equal(summary.baseCents, pack.coins / 100)
    assert.equal(summary.gems, pack.gemBonus)
  }
})

test('兑换码覆盖空值、无效、已用、过期与成功', () => {
  assert.equal(validateDemoCode(' ').type, 'error')
  assert.equal(validateDemoCode('missing').type, 'error')
  assert.match(validateDemoCode('USED-DEMO').message, /已被使用/)
  assert.match(validateDemoCode('old-demo').message, /已过期/)
  assert.equal(validateDemoCode(' joy-demo ').type, 'success')
})

test('转盘每次至少四圈且指向选中的奖项', () => {
  let angle = 0
  for (const prizeIndex of [0, 1, 3, 7]) {
    const next = nextWheelAngle(angle, prizeIndex)
    assert.ok(next - angle >= 1440)
    assert.equal((next + prizeIndex * 45) % 360, 0)
    angle = next
  }
})

test('游戏目录按玩家所在国家过滤：白名单之外的游戏不出现在列表里', async () => {
  const { filterGames, openInCountry } = await import('./demoModel.js')
  const catalog = [
    { id: 'global', tags: ['slots'], status: 'ready', popular: true },
    { id: 'asia-only', tags: ['slots'], status: 'ready', popular: true, region: { mode: 'custom', countries: ['JP', 'KR'] } },
    { id: 'explicit-all', tags: ['slots'], status: 'ready', popular: true, region: { mode: 'all', countries: [] } },
  ]
  // 没有地区限制、或明确全球开放的，任何国家都能看到
  assert.ok(openInCountry(catalog[0], 'CN'))
  assert.ok(openInCountry(catalog[2], 'CN'))
  // 白名单之外的国家看不到
  assert.equal(openInCountry(catalog[1], 'CN'), false)
  assert.ok(openInCountry(catalog[1], 'JP'))

  assert.deepEqual(filterGames(catalog, 'all', false, false, 'JP').map((g) => g.id), ['global', 'asia-only', 'explicit-all'])
  assert.deepEqual(filterGames(catalog, 'all', false, false, 'CN').map((g) => g.id), ['global', 'explicit-all'])
  // 宿主未提供国家时，白名单限定的游戏一律不显示（fail-closed）：未知位置不能当作默认放行，
  // 否则白名单形同虚设；没有地理限制的游戏不受影响。
  assert.deepEqual(filterGames(catalog, 'all', false, false, null).map((g) => g.id), ['global', 'explicit-all'])
  assert.equal(openInCountry(catalog[1], null), false)
})

test('游戏默认准入配置与演示门槛可供玩家侧和后台共用', () => {
  for (const game of games) {
    for (const key of ['wealthLevel', 'charmLevel', 'minBalance', 'playLevel', 'genders', 'familyOnly', 'promoTag']) {
      assert.ok(Object.hasOwn(game, key))
    }
  }
  assert.equal(games.find((game) => game.id === 'golden-pharaoh').wealthLevel, 5)
  assert.equal(games.find((game) => game.id === 'golden-pharaoh').promoTag, 'hot')
  assert.equal(games.find((game) => game.id === 'fish-hunter').familyOnly, true)
  assert.equal(games.find((game) => game.id === 'fish-hunter').promoTag, 'club')
})

test('游戏准入逐项报告未满足的数值门槛', () => {
  const player = {
    account: { wealthLevel: 3, charmLevel: 2, level: 10 },
    wallet: { coins: 900 },
  }
  const cases = [
    ['wealthLevel', { wealthLevel: 4 }, 4, 3],
    ['charmLevel', { charmLevel: 3 }, 3, 2],
    ['minBalance', { minBalance: 1000 }, 1000, 900],
    ['playLevel', { playLevel: 11 }, 11, 10],
  ]
  for (const [key, game, need, have] of cases) {
    assert.deepEqual(gameGate(game, player), {
      ok: false,
      reasons: [{ key, need, have }],
    })
  }
})

test('游戏准入在等于门槛时通过，并同时检查性别和家族', () => {
  const game = {
    wealthLevel: 3,
    charmLevel: 2,
    minBalance: 900,
    playLevel: 10,
    genders: ['male'],
    familyOnly: true,
  }
  const player = {
    account: { wealthLevel: 3, charmLevel: 2, level: 10, gender: 'male', familyId: 'nova' },
    wallet: { coins: 900 },
  }
  assert.deepEqual(gameGate(game, player), { ok: true, reasons: [] })
  assert.deepEqual(gameGate({ genders: ['female'] }, player), {
    ok: false,
    reasons: [{ key: 'genders', need: ['female'], have: 'male' }],
  })
  assert.deepEqual(gameGate({ familyOnly: true }, { ...player, account: { ...player.account, familyId: '' } }), {
    ok: false,
    reasons: [{ key: 'familyOnly', need: true, have: null }],
  })
})

test('游戏准入对缺失或非法玩家数据保持 fail-closed', () => {
  const game = {
    wealthLevel: 1,
    charmLevel: 1,
    minBalance: 1,
    playLevel: 1,
    genders: ['male'],
    familyOnly: true,
  }
  assert.deepEqual(gameGate(game, { account: {}, wallet: {} }), {
    ok: false,
    reasons: [
      { key: 'wealthLevel', need: 1, have: null },
      { key: 'charmLevel', need: 1, have: null },
      { key: 'minBalance', need: 1, have: null },
      { key: 'playLevel', need: 1, have: null },
      { key: 'genders', need: ['male'], have: null },
      { key: 'familyOnly', need: true, have: null },
    ],
  })
  assert.deepEqual(gameGate({ wealthLevel: 1 }, { account: { wealthLevel: 1.5 } }), {
    ok: false,
    reasons: [{ key: 'wealthLevel', need: 1, have: null }],
  })
  assert.deepEqual(gameGate({ minBalance: 1 }, { wallet: { coins: Number.MAX_SAFE_INTEGER + 1 } }), {
    ok: false,
    reasons: [{ key: 'minBalance', need: 1, have: null }],
  })
})

test('未配置的门槛不限制玩家', () => {
  const unrestricted = {
    wealthLevel: 0,
    charmLevel: null,
    minBalance: undefined,
    playLevel: '',
    genders: [],
    familyOnly: false,
  }
  assert.deepEqual(gameGate(unrestricted, {}), { ok: true, reasons: [] })
  assert.deepEqual(gameGate({ genders: ['male', 'female'] }, {}), { ok: true, reasons: [] })
  assert.deepEqual(gameGate(null, { account: null, wallet: null }), { ok: true, reasons: [] })
})
