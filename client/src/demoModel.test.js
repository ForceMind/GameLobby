import assert from 'node:assert/strict'
import test from 'node:test'
import { games, coinPacks } from './data.js'
import {
  filterGames,
  packSummary,
  validateDemoCode,
  nextWheelAngle,
  isValidNickname,
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
  assert.equal(filterGames(games, 'all').length, 8)
  assert.deepEqual(filterGames([], 'all'), [])
  assert.deepEqual(
    filterGames(games, 'realtime').map((game) => game.id),
    ['golden-pharaoh', 'fish-hunter'],
  )
  assert.equal(filterGames(games, 'slots').length, 4)
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
