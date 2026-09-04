import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validateWheel, wheelBalanced, validateCheckin, validateMissions, validateCoinPack, validateChestOffer,
  coinPackPriceUsd, nextVersionTag, nextLedgerId, diffSummary, validateNickname,
  getSlice, setSlice, draftDiffers, resetDraftToLive, applyRelease,
} from './adminRules.js'

const prizes = (probabilities) => probabilities.map((probability, i) => ({ id: `p${i}`, kind: 'coins', amount: 100 + i, probability }))

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
  const live = { wheelPrizes: prizes([22, 15, 15, 10, 20, 6, 8, 4]), wheelFreeSpins: 3, wheelVersion: 3, games: { test: [{ id: 'g1', status: '正常可玩' }], production: [{ id: 'g1', status: '正常可玩' }] } }
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
