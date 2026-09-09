import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validateWheel, wheelBalanced, validateCheckin, validateMissions, validateCoinPack, validateChestOffer,
  coinPackPriceUsd, nextVersionTag, nextLedgerId, diffSummary, validateNickname,
  getSlice, setSlice, draftDiffers, resetDraftToLive, applyRelease, snapshotDiff, validateTranslations, validateGameGates, settledActivityRegion, applyActivityState,
} from './adminRules.js'
import { createTranslationReviews } from './translationReview.js'

const prizes = (probabilities) => probabilities.map((probability, i) => ({ id: `p${i}`, kind: 'coins', amount: 100 + i, probability }))

test('活动状态同步到生效记录，但不会提前发布地区草稿', () => {
  const live = { id: 'a', name: '签到活动', period: '每日', audience: '全部玩家', budget: '1000金币', type: '签到', status: '待审核', region: { mode: 'custom', countries: ['CN'] } }
  const draft = { ...live, region: { mode: 'custom', countries: ['US'] } }
  const source = { activities: [draft], live: { activities: [live] } }
  const result = applyActivityState(source, 'a', '进行中')
  assert.equal(result.ok, true)
  assert.equal(result.store.live.activities[0].status, '进行中')
  assert.deepEqual(result.store.live.activities[0].region.countries, ['CN'])
  assert.deepEqual(result.store.activities[0].region.countries, ['US'])
  assert.equal(source.live.activities[0].status, '待审核')
  const paused = applyActivityState(result.store, 'a', '已暂停')
  assert.equal(paused.store.live.activities[0].status, '已暂停')
  const second = { ...live, id: 'b', status: '进行中' }
  const conflict = { activities: [draft, second], live: { activities: [live, second] } }
  assert.equal(applyActivityState(conflict, 'a', '进行中').ok, false)
  assert.equal(applyActivityState({ activities: [draft], live: { activities: [] } }, 'a', '进行中').ok, false)
  const incomplete = { ...draft, period: '待定' }
  assert.equal(applyActivityState({ activities: [incomplete], live: { activities: [live] } }, 'a', '待审核').ok, false)
  assert.equal(applyActivityState({ activities: [incomplete], live: { activities: [live] } }, 'a', '进行中').ok, false)
})

test('转盘概率：负数、超出 100、非整数、总和不为 100、奖项数不为 8 都不能通过', () => {
  assert.equal(wheelBalanced(prizes([105, -5, 0, 0, 0, 0, 0, 0])), false)
  assert.equal(wheelBalanced(prizes([22, 15, 15, 10, 20, 6, 8, 4])), true)
  assert.ok(validateWheel({ prizes: prizes([22, 15, 15, 10, 20, 6, 8, 4]).slice(0, 6), freeSpins: 3 }).some((e) => e.includes('固定 8 格')))
  assert.ok(validateWheel({ prizes: prizes([22.5, 15, 15, 10, 20, 6, 8, 3.5]), freeSpins: 3 }).some((e) => e.includes('整数')))
  assert.deepEqual(validateWheel({ prizes: prizes([22, 15, 15, 10, 20, 6, 8, 4]), freeSpins: 3 }), [])
  assert.ok(validateWheel({ prizes: prizes([22, 15, 15, 10, 20, 6, 8, 4]), freeSpins: -1 }).some((e) => e.includes('免费次数')))
})

test('签到梯度：必须且只能最后一天为大奖，奖励不能为负', () => {
  const days = (grandIndex) => Array.from({ length: 7 }, (_, i) => ({ day: `D${i + 1}`, coins: 100, gems: 0, grand: i === grandIndex }))
  assert.deepEqual(validateCheckin(days(6)), [])
  assert.ok(validateCheckin(days(2)).some((e) => e.includes('最后一天')))
  assert.ok(validateCheckin(days(-1)).some((e) => e.includes('只能有一天')))
  assert.ok(validateCheckin([{ day: 'D1', coins: -1, gems: 0, grand: true }]).some((e) => e.includes('负数')))
})

test('任务与礼包与宝箱报价的数值校验', () => {
  assert.ok(validateMissions([{ name: '', target: 0, coinReward: -1, gemReward: 0 }]).length >= 3)
  assert.deepEqual(validateMissions([{ name: '完成 3 局', target: 3, coinReward: 500, gemReward: 1 }, { name: '过期', target: 0, expired: true }]), [])
  assert.ok(validateCoinPack({ coins: 6000, discountPercent: 120, gemBonus: 2 }).some((e) => e.includes('折扣')))
  assert.deepEqual(validateCoinPack({ coins: 6000, discountPercent: 8, gemBonus: 2 }), [])
  assert.ok(validateChestOffer({ version: 'v1', priceCoins: 0, maxRewardCoins: 7000 }).some((e) => e.includes('价格')))
})

test('礼包售价、版本递增、流水编号与昵称规则', () => {
  assert.equal(coinPackPriceUsd({ coins: 68000, discountPercent: 28 }), '$4.90')
  assert.equal(coinPackPriceUsd({ coins: 128000, discountPercent: 40 }), '$7.68')
  assert.equal(nextVersionTag('tomorrow-single-v1'), 'tomorrow-single-v1-r2')
  assert.equal(nextVersionTag('tomorrow-single-v1-r2'), 'tomorrow-single-v1-r3')
  assert.equal(nextLedgerId([{ id: '#WL-90107' }, { id: 'x' }]), '#WL-90108')
  assert.deepEqual(validateNickname('NovaPlayer'), [])
  assert.equal(validateNickname(' ').length, 1)
  assert.equal(diffSummary({ a: 1, b: 'x' }, { a: 2, b: 'x' }, [['a', 'A'], ['b', 'B']]), 'A: 1 → 2')
})

const baseStore = () => {
  const live = {
    wheelPrizes: prizes([22, 15, 15, 10, 20, 6, 8, 4]), wheelFreeSpins: 3, wheelVersion: 3,
    games: { test: [{ id: 'g1', status: '正常可玩' }], production: [{ id: 'g1', status: '正常可玩' }] },
    activities: [
      { id: 'act-1', type: '签到', status: '进行中', region: { mode: 'all', countries: [] } },
      { id: 'act-2', type: '签到', status: '已结束', region: { mode: 'custom', countries: ['BR', 'MX'] } },
    ],
  }
  return { ...JSON.parse(JSON.stringify(live)), live: JSON.parse(JSON.stringify(live)), liveHistory: {}, publish: [], todo: [], audit: [] }
}

test('草稿与生效版本隔离：编辑草稿不影响生效，驳回丢弃草稿，通过后生效并可回滚', () => {
  let store = baseStore()
  store = { ...store, wheelPrizes: prizes([25, 15, 15, 10, 20, 6, 8, 1]), wheelVersion: 4 }
  assert.equal(draftDiffers(store, 'wheel'), true)
  assert.equal(store.live.wheelVersion, 3)
  const entry = { id: 'pub-1', name: '主转盘 v4', status: '待审核', sourceModule: 'wheel', snapshot: getSlice(store, 'wheel') }
  store = { ...store, publish: [entry], todo: [{ id: 't1', title: '待审', status: '待审核', publishId: 'pub-1' }] }

  const rejected = applyRelease(store, entry, 'reject', '概率需复核', { seq: 1 })
  assert.equal(rejected.wheelVersion, 3)
  assert.equal(draftDiffers(rejected, 'wheel'), false)
  assert.equal(rejected.publish[0].status, '已驳回')
  assert.equal(rejected.todo[0].status, '已解决')
  assert.ok(rejected.audit[0].result.includes('概率需复核'))

  const approved = applyRelease(store, entry, 'approve', undefined, { seq: 2 })
  assert.equal(approved.live.wheelVersion, 4)
  assert.equal(approved.live.wheelPrizes[0].probability, 25)
  assert.equal(approved.publish[0].status, '已发布')
  assert.equal(approved.liveHistory.wheel.length, 1)

  const rolledBack = applyRelease(approved, { ...entry, status: '已发布' }, 'rollback', '线上异常', { seq: 3 })
  assert.equal(rolledBack.live.wheelVersion, 3)
  assert.equal(rolledBack.wheelVersion, 3)
  assert.equal(rolledBack.publish[0].status, '已回滚')
  assert.equal(rolledBack.liveHistory.wheel.length, 0)
})

test('审核通过时再次校验快照，不合法则拒绝并留失败日志', () => {
  const store = baseStore()
  const badEntry = { id: 'pub-2', name: '坏快照', status: '待审核', sourceModule: 'wheel', snapshot: { wheelPrizes: prizes([50, 60, 0, 0, 0, 0, 0, 0]), wheelFreeSpins: 3, wheelVersion: 4 } }
  const result = applyRelease(store, badEntry, 'approve', undefined, { seq: 9 })
  assert.equal(result.live.wheelVersion, 3)
  assert.ok(result.audit[0].result.startsWith('失败'))
})

test('按环境隔离的游戏目录切片可以单独读写', () => {
  const store = baseStore()
  const slice = getSlice(store, 'games:test')
  assert.deepEqual(slice, { games: [{ id: 'g1', status: '正常可玩' }] })
  const next = setSlice(store, 'games:test', { games: [{ id: 'g1', status: '维护中' }] })
  assert.equal(next.games.test[0].status, '维护中')
  assert.equal(next.games.production[0].status, '正常可玩')
  assert.equal(draftDiffers(next, 'games:test'), true)
  assert.equal(draftDiffers(resetDraftToLive(next, 'games:test'), 'games:test'), false)
})

test('活动地区按记录独立读写：同类型的另一条记录不受影响', () => {
  const store = baseStore()
  assert.deepEqual(getSlice(store, 'activityRegion:act-1'), { region: { mode: 'all', countries: [] } })
  const next = setSlice(store, 'activityRegion:act-1', { region: { mode: 'custom', countries: ['JP'] } })
  assert.deepEqual(getSlice(next, 'activityRegion:act-1').region, { mode: 'custom', countries: ['JP'] })
  // act-2 是同一活动类型（签到）的另一条记录，地区必须保持不变
  assert.deepEqual(getSlice(next, 'activityRegion:act-2').region, { mode: 'custom', countries: ['BR', 'MX'] })
  assert.equal(draftDiffers(next, 'activityRegion:act-1'), true)
  assert.equal(draftDiffers(next, 'activityRegion:act-2'), false)
})

test('结算地区取自该类型状态为"进行中"的那一条记录，与其他记录无关', () => {
  const store = baseStore()
  // act-1（进行中）是全球开放，act-2（已结束）是自定义地区——结算结果应该是 act-1 的
  assert.deepEqual(settledActivityRegion(store.live.activities, '签到'), { mode: 'all', countries: [] })
  const reassigned = store.live.activities.map((a) => (a.id === 'act-1' ? { ...a, status: '已结束' } : a.id === 'act-2' ? { ...a, status: '进行中' } : a))
  assert.deepEqual(settledActivityRegion(reassigned, '签到'), { mode: 'custom', countries: ['BR', 'MX'] })
  assert.deepEqual(settledActivityRegion(store.live.activities, '转盘'), { mode: 'all', countries: [] })
})

test('配置差异：逐字段列出，只有变化项标记为 changed', () => {
  const live = { wheelPrizes: prizes([22, 15, 15, 10, 20, 6, 8, 4]), wheelFreeSpins: 3, wheelVersion: 3 }
  const draft = { wheelPrizes: prizes([25, 12, 15, 10, 20, 6, 8, 4]), wheelFreeSpins: 5, wheelVersion: 4 }
  const rows = snapshotDiff('wheel', live, draft)
  const changed = rows.filter((r) => r.changed).map((r) => r.label)
  assert.deepEqual(changed, ['每日免费次数', '配置版本', '第 1 格', '第 2 格'])
  assert.equal(rows.find((r) => r.label === '每日免费次数').before, '3 次 / 日')
  assert.equal(rows.find((r) => r.label === '每日免费次数').after, '5 次 / 日')
  assert.equal(rows.find((r) => r.label === '概率总和').changed, false)
  assert.equal(rows.length, 11)
})

test('配置差异：活动投放地区按记录出现在差异里，不与奖励配置的差异混在一起', () => {
  const before = { region: { mode: 'all', countries: [] } }
  const after = { region: { mode: 'custom', countries: ['JP', 'KR'] } }
  const rows = snapshotDiff('activityRegion:act-2', before, after)
  assert.equal(rows.length, 1)
  const regionRow = rows.find((r) => r.label === '投放地区')
  assert.equal(regionRow.changed, true)
  assert.equal(regionRow.before, '全球开放')
  assert.match(regionRow.after, /2 个国家\/地区/)
})

test('配置差异：新增与移除的条目分别标记', () => {
  const before = { missions: [{ id: 'a', name: '旧任务', target: 3, coinReward: 500, gemReward: 1, status: '生效中' }] }
  const after = { missions: [{ id: 'b', name: '新任务', target: 5, coinReward: 800, gemReward: 2, status: '生效中' }] }
  const rows = snapshotDiff('missions', before, after)
  assert.equal(rows.find((r) => r.label === '旧任务').removed, true)
  assert.equal(rows.find((r) => r.label === '新任务').added, true)
})

test('配置差异：游戏改名按 gameId 归位，不算作删除加新增', () => {
  const g = (name) => ({ games: [{ gameId: 'g1', name, status: '正常可玩', categoryLabel: 'Slots', popular: true, badges: [] }] })
  const rows = snapshotDiff('games:test', g('旧名'), g('新名'))
  assert.equal(rows.filter((r) => r.added || r.removed).length, 0)
  assert.equal(rows.find((r) => r.key === 'order').changed, true)
})

const gameRecord = (overrides = {}) => ({
  id: 'g1', gameId: 'g1', name: '准入示例', status: '正常可玩', categoryLabel: 'Slots', tags: ['slots'], badges: [], popular: false,
  heat: 50, sortWeight: 10, cover: 'demo.png', maintenanceNote: '', launchAt: '', region: { mode: 'all', countries: [] },
  wealthLevel: 0, charmLevel: 0, minBalance: 0, playLevel: 0, genders: ['male', 'female'], familyOnly: false, promoTag: 'none',
  winRate: '', rtp: '', winRangeMin: '', winRangeMax: '', maxMultiplier: '', minBet: '', paylines: '', volatility: '', ...overrides,
})

test('游戏门槛：缺失字段兼容旧快照，非法门槛和空性别被拦截', () => {
  assert.deepEqual(validateGameGates({ gameId: 'legacy' }), [])
  const errors = validateGameGates(gameRecord({ wealthLevel: Number.NaN, minBalance: -1, genders: [], promoTag: 'bad' }))
  assert.ok(errors.some((error) => error.includes('财富等级')))
  assert.ok(errors.some((error) => error.includes('账户余额')))
  assert.ok(errors.some((error) => error.includes('至少选择一项')))
  assert.ok(errors.some((error) => error.includes('运营标签')))
  ;['5', true, []].forEach((value) => {
    assert.ok(validateGameGates(gameRecord({ wealthLevel: value })).some((error) => error.includes('财富等级')), `应拒绝非 number 门槛：${String(value)}`)
  })
})

test('游戏门槛：草稿隔离、审核发布与回滚，并逐字段显示可读差异', () => {
  const liveGame = gameRecord()
  let store = {
    games: { test: [gameRecord({ wealthLevel: 5, genders: ['male'], familyOnly: true, promoTag: 'hot' })], production: [gameRecord()] },
    live: { games: { test: [liveGame], production: [gameRecord()] } }, liveHistory: {}, publish: [], todo: [], audit: [],
  }
  const moduleId = 'games:test'
  assert.equal(draftDiffers(store, moduleId), true)
  assert.equal(store.live.games.test[0].wealthLevel, 0, '草稿门槛不能直接影响生效版本')
  const snapshot = getSlice(store, moduleId)
  const diff = snapshotDiff(moduleId, getSlice(store.live, moduleId), snapshot)
  assert.equal(diff.length, 28, '目录排序 1 项 + 每游戏 27 个实际审核字段')
  assert.equal(diff.find((row) => row.label === '准入示例 · 允许性别').after, '男')
  assert.equal(diff.find((row) => row.label === '准入示例 · 家族专属').after, '是')
  assert.equal(diff.find((row) => row.label === '准入示例 · 运营标签').after, 'Hot')

  const entry = { id: 'pub-game', name: '准入示例配置更新', status: '待审核', sourceModule: moduleId, snapshot }
  store = { ...store, publish: [entry] }
  const approved = applyRelease(store, entry, 'approve', undefined, { seq: 21 })
  assert.equal(approved.live.games.test[0].wealthLevel, 5)
  assert.equal(approved.live.games.test[0].promoTag, 'hot')
  assert.equal(approved.liveHistory[moduleId].length, 1)
  const rolledBack = applyRelease(approved, { ...entry, status: '已发布' }, 'rollback', '门槛误配', { seq: 22 })
  assert.equal(rolledBack.live.games.test[0].wealthLevel, 0)
  assert.equal(rolledBack.games.test[0].promoTag, 'none')
})

test('游戏门槛：审核时复核快照，脏快照不能绕过表单直接发布', () => {
  const liveGame = gameRecord()
  const store = {
    games: { test: [liveGame], production: [gameRecord()] }, live: { games: { test: [liveGame], production: [gameRecord()] } },
    liveHistory: {}, publish: [], todo: [], audit: [],
  }
  const entry = { id: 'pub-bad-game', name: '脏游戏快照', status: '待审核', sourceModule: 'games:test', snapshot: { games: [gameRecord({ genders: [] })] } }
  const result = applyRelease(store, entry, 'approve', undefined, { seq: 23 })
  assert.deepEqual(result.live.games.test, [liveGame])
  assert.match(result.audit[0].result, /失败.*允许性别至少选择一项/)
})

test('游戏门槛：审核发布与回滚不覆盖更晚的紧急状态，差异按实际应用结果显示', () => {
  const moduleId = 'games:test'
  const queued = gameRecord({ wealthLevel: 5 })
  const maintenance = gameRecord({ status: '维护中', maintenanceNote: '紧急维护' })
  let store = {
    games: { test: [queued], production: [gameRecord()] }, live: { games: { test: [maintenance], production: [gameRecord()] } },
    liveHistory: {}, publish: [], todo: [], audit: [],
  }
  const entry = { id: 'pub-emergency', name: '待审门槛', status: '待审核', sourceModule: moduleId, snapshot: { games: [queued] } }
  const queuedDiff = snapshotDiff(moduleId, getSlice(store.live, moduleId), entry.snapshot)
  const queuedStatus = queuedDiff.find((row) => row.label === '准入示例 · 运行状态')
  assert.equal(queuedStatus.changed, false)
  assert.equal(queuedStatus.after, '维护中')

  const approved = applyRelease(store, entry, 'approve', undefined, { seq: 24 })
  assert.equal(approved.live.games.test[0].wealthLevel, 5)
  assert.equal(approved.live.games.test[0].status, '维护中')
  assert.equal(approved.live.games.test[0].maintenanceNote, '紧急维护')
  assert.equal(approved.games.test[0].status, '维护中', '草稿在发布后与生效紧急状态同步')

  const unavailable = gameRecord({ wealthLevel: 5, status: '暂不可用', maintenanceNote: '紧急下架' })
  store = { ...approved, games: { ...approved.games, test: [unavailable] }, live: { ...approved.live, games: { ...approved.live.games, test: [unavailable] } } }
  const rollbackDiff = snapshotDiff(moduleId, getSlice(store.live, moduleId), approved.liveHistory[moduleId][0])
  const rollbackStatus = rollbackDiff.find((row) => row.label === '准入示例 · 运行状态')
  assert.equal(rollbackStatus.changed, false)
  assert.equal(rollbackStatus.after, '暂不可用')

  const rolledBack = applyRelease(store, { ...entry, status: '已发布' }, 'rollback', '门槛误配', { seq: 25 })
  assert.equal(rolledBack.live.games.test[0].wealthLevel, 0)
  assert.equal(rolledBack.live.games.test[0].status, '暂不可用')
  assert.equal(rolledBack.live.games.test[0].maintenanceNote, '紧急下架')
  assert.equal(rolledBack.games.test[0].status, '暂不可用')
})

test('游戏门槛：灰度发布同样保留已生效的紧急状态', () => {
  const moduleId = 'games:test'
  const queued = gameRecord({ gameId: undefined, wealthLevel: 5 })
  const store = {
    games: { test: [queued], production: [gameRecord()] },
    live: { games: { test: [gameRecord({ status: '维护中', maintenanceNote: '紧急维护' })], production: [gameRecord()] } },
    liveHistory: {}, publish: [], todo: [], audit: [],
  }
  const entry = { id: 'pub-gray-emergency', name: '灰度门槛', status: '待审核', sourceModule: moduleId, snapshot: { games: [queued] } }
  const grayed = applyRelease(store, entry, 'gray', undefined, { seq: 26 })
  assert.equal(grayed.live.games.test[0].wealthLevel, 5)
  assert.equal(grayed.live.games.test[0].status, '维护中', '快照仅有 id 时仍须匹配当前游戏')
  assert.equal(grayed.games.test[0].maintenanceNote, '紧急维护')
})

test('玩家侧文案：简中与英文不可为空，各语言占位符必须与英文一致', () => {
  assert.deepEqual(validateTranslations({
    'store.buy': { 'zh-Hans': '购买 {coins} 金币', en: 'Buy {coins} coins', ja: '{coins} コインを購入' },
  }), [], '占位符一致时应通过')

  const missingEn = validateTranslations({ 'a.b': { 'zh-Hans': '你好', en: '', ja: 'こんにちは' } })
  assert.ok(missingEn.some((e) => e.includes('缺少英文')), '英文是兜底，不能为空')

  const badPlaceholder = validateTranslations({
    'store.buy': { 'zh-Hans': '购买 {coins} 金币', en: 'Buy {coins} coins', ja: '{wrong} コインを購入' },
  })
  assert.equal(badPlaceholder.length, 1)
  assert.ok(badPlaceholder[0].includes('ja') && badPlaceholder[0].includes('占位符'))

  // 未翻译（留空）不算错误，运行时回退英文
  assert.deepEqual(validateTranslations({ 'store.buy': { 'zh-Hans': '购买 {coins} 金币', en: 'Buy {coins} coins', ja: '', de: '   ' } }), [])

  const missingOriginal = validateTranslations({ 'store.buy': { 'zh-Hans': '  ', en: 'Buy coins' } })
  assert.ok(missingOriginal.some((error) => error.includes('缺少简体中文原文')))
})

test('文案差异精确到「键 · 语言」，只标出真正改动的那一格', () => {
  const before = { translations: { 'a.b': { 'zh-Hans': '你好', en: 'Hello', ja: '' }, 'a.c': { 'zh-Hans': '再见', en: 'Bye', ja: 'さようなら' } } }
  const after = { translations: { 'a.b': { 'zh-Hans': '你好', en: 'Hello', ja: 'こんにちは' }, 'a.c': { 'zh-Hans': '再见', en: 'Bye', ja: 'さようなら' } } }
  const rows = snapshotDiff('translations', before, after)
  assert.equal(rows.length, 6, '两个键 × 三种语言')
  const changed = rows.filter((r) => r.changed)
  assert.equal(changed.length, 1)
  assert.equal(changed[0].label, 'a.b · ja')
  assert.equal(changed[0].before, '—')
  assert.equal(changed[0].after, 'こんにちは')
})

test('文案审核快照会显示译文复核状态变化，并阻止待复核快照发布', () => {
  const live = { translations: { 'a.b': { 'zh-Hans': '你好', en: 'Hello', ja: 'こんにちは' } } }
  live.translationReviews = createTranslationReviews(live.translations)
  const stale = { translations: { 'a.b': { ...live.translations['a.b'], 'zh-Hans': '您好' } }, translationReviews: live.translationReviews }
  const rows = snapshotDiff('translations', live, stale)
  const japanese = rows.find((row) => row.key === 'a.b|ja')
  assert.match(japanese.before, /已复核$/)
  assert.match(japanese.after, /待复核$/)

  const store = { ...stale, live, liveHistory: {}, publish: [], todo: [], audit: [] }
  const entry = { id: 'pub-stale-copy', name: '待复核文案', status: '待审核', sourceModule: 'translations', snapshot: stale }
  const rejected = applyRelease(store, entry, 'approve', undefined, { seq: 41 })
  assert.equal(rejected.live.translations['a.b']['zh-Hans'], '你好')
  assert.match(rejected.audit[0].result, /ja.*需要复核/)
})

test('较早文案快照的通过、灰度、驳回和回滚保留较新的草稿及复核元数据', () => {
  const translationSlice = (zh, en, ja) => {
    const translations = { 'a.b': { 'zh-Hans': zh, en, ja } }
    return { translations, translationReviews: createTranslationReviews(translations) }
  }
  const live = translationSlice('初始中文', 'Initial English', '初期日本語')
  const queued = translationSlice('待审中文', 'Queued English', '審査中の日本語')
  const newer = translationSlice('较新中文', 'Newer English', '新しい日本語')
  const store = { ...newer, live, liveHistory: {}, publish: [], todo: [], audit: [] }
  const entry = { id: 'pub-old-copy', name: '较早文案快照', status: '待审核', sourceModule: 'translations', snapshot: queued }

  const approved = applyRelease(store, entry, 'approve', undefined, { seq: 42 })
  assert.deepEqual(approved.live.translations, queued.translations)
  assert.deepEqual(getSlice(approved, 'translations'), newer)
  assert.deepEqual(approved.translationReviews, newer.translationReviews)
  assert.equal(approved.audit[0].action, '模拟 · 通过并发布')

  const grayed = applyRelease(store, entry, 'gray', undefined, { seq: 43 })
  assert.deepEqual(grayed.live.translations, queued.translations)
  assert.deepEqual(getSlice(grayed, 'translations'), newer)

  const rejected = applyRelease(store, entry, 'reject', '已存在新草稿', { seq: 44 })
  assert.deepEqual(getSlice(rejected, 'translations'), newer)

  const rollbackEntry = { ...entry, status: '已发布' }
  const rolledBack = applyRelease(approved, rollbackEntry, 'rollback', '恢复旧版本', { seq: 45 })
  assert.deepEqual(rolledBack.live.translations, live.translations)
  assert.deepEqual(getSlice(rolledBack, 'translations'), newer)
  assert.deepEqual(rolledBack.translationReviews, newer.translationReviews)
})

test('地理范围：默认全球开放，指定模式为白名单，空白名单会被拦截', async () => {
  const { normalizeRegion, regionOpensIn, validateRegion, regionSummary, regionByContinent, REGION_ALL, REGION_CUSTOM } =
    await import('./adminRules.js')
  const { countryContinent, continents } = await import('../data/regions.js')
  const codes = continents.map((c) => c.code)

  // 迁移前的自由文本一律视为全球开放
  assert.deepEqual(normalizeRegion('全区'), { mode: REGION_ALL, countries: [] })
  assert.deepEqual(normalizeRegion(undefined), { mode: REGION_ALL, countries: [] })
  assert.ok(regionOpensIn('全区', 'CN'))

  // 白名单：只有列出的国家可见，没列的一律关闭
  const jpOnly = { mode: REGION_CUSTOM, countries: ['JP', 'KR'] }
  assert.ok(regionOpensIn(jpOnly, 'JP'))
  assert.equal(regionOpensIn(jpOnly, 'CN'), false, '未列出的国家必须默认关闭')

  assert.deepEqual(validateRegion(jpOnly), [])
  assert.equal(validateRegion({ mode: REGION_CUSTOM, countries: [] }).length, 1, '空白名单等于全员看不到，必须拦截')
  assert.deepEqual(validateRegion({ mode: REGION_ALL, countries: [] }), [])

  // 「整个洲除某几国」：选中全洲后取消勾选，靠的是解析后的国家清单
  const asia = Object.keys(countryContinent).filter((c) => countryContinent[c] === 'AS')
  const asiaMinusTwo = { mode: REGION_CUSTOM, countries: asia.filter((c) => c !== 'KP' && c !== 'IR') }
  const grouped = regionByContinent(asiaMinusTwo, countryContinent, codes)
  const asiaGroup = grouped.find((g) => g.continent === 'AS')
  assert.equal(asiaGroup.state, 'some')
  assert.equal(asiaGroup.selected.length, asia.length - 2)
  assert.equal(grouped.find((g) => g.continent === 'EU').state, 'none')

  assert.equal(regionSummary('全区', countryContinent, codes), '全球开放')
  assert.match(regionSummary(asiaMinusTwo, countryContinent, codes), /个国家\/地区/)
  assert.equal(regionSummary({ mode: REGION_CUSTOM, countries: [] }, countryContinent, codes), '未选择任何国家/地区')

  // 国家码去重并排序，便于比对与审计
  assert.deepEqual(normalizeRegion({ mode: REGION_CUSTOM, countries: ['KR', 'JP', 'JP'] }).countries, ['JP', 'KR'])
})
