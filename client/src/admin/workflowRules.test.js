import test from 'node:test'
import assert from 'node:assert/strict'
import { applyRelease, getSlice } from './adminRules.js'
import { ledgerTransitions, canReviewAdjustment, reviewAdjustment } from './workflowRules.js'

const days = (coins) => Array.from({ length: 7 }, (_, i) => ({ day: `D${i + 1}`, coins, gems: 0, grand: i === 6 }))
const configStore = () => ({ checkinDays: days(100), live: { checkinDays: days(100) }, liveHistory: {}, publish: [], todo: [], audit: [] })
const publish = (store, id, coins) => {
  const draft = { ...store, checkinDays: days(coins) }
  const entry = { id, name: id, status: '待审核', sourceModule: 'checkin', snapshot: getSlice(draft, 'checkin') }
  return applyRelease({ ...draft, publish: [entry, ...draft.publish] }, entry, 'approve')
}

test('旧任务不能回滚较新版本；回滚当前任务后可继续回滚恢复的旧版本', () => {
  const a = publish(configStore(), 'A', 200)
  const b = publish(a, 'B', 300)
  const denied = applyRelease(b, b.publish.find((p) => p.id === 'A'), 'rollback', '旧任务')
  assert.equal(denied.live.checkinDays[0].coins, 300)
  assert.equal(denied.publish[0].status, '已发布')
  assert.match(denied.audit[0].result, /失败.*当前生效/)
  const backToA = applyRelease(b, b.publish[0], 'rollback', '回滚当前版本')
  assert.equal(backToA.live.checkinDays[0].coins, 200)
  assert.equal(backToA.activeReleaseIds.checkin, 'A')
  const baseline = applyRelease(backToA, backToA.publish.find((p) => p.id === 'A'), 'rollback', '继续回滚')
  assert.equal(baseline.live.checkinDays[0].coins, 100)
})

test('人工调整枚举一致；模拟复核关闭关联待办且不修改余额，系统流水保持只读', () => {
  const adjustment = { id: 'L1', source: 'manual_adjust', status: 'processing', amount: 10 }
  const system = { id: 'L2', source: 'chest_reward', status: 'processing' }
  const store = { ledger: [adjustment, system], players: [{ coins: 100 }], todo: [{ id: 'T1', status: '待处理', link: { page: 'ledger', focusId: 'L1' } }], audit: [] }
  assert.equal(ledgerTransitions.processing.length, 2)
  assert.equal(canReviewAdjustment(system), false)
  assert.ok(reviewAdjustment(store, 'L2', 'completed').error)
  assert.ok(reviewAdjustment(store, 'L1', 'failed').error)
  const result = reviewAdjustment(store, 'L1', 'completed').store
  assert.equal(result.ledger[0].status, 'completed')
  assert.equal(result.todo[0].status, '已解决')
  assert.deepEqual(result.players, store.players)
  assert.ok(reviewAdjustment(result, 'L1', 'completed').error)
  assert.equal(reviewAdjustment(store, 'L1', 'failed', '拒绝').store.ledger[0].status, 'failed')
})

const versionStore = () => {
  const source = { id: 'V1', game: 'Demo', version: 'v2', production: '生产 v1', status: '待审核' }
  const entry = { id: 'P1', name: 'Demo v2', sourceModule: 'versions', sourceId: 'V1', status: '待审核', snapshot: null, baseReleaseId: null }
  return { versions: [source], production: [{ id: 'D1', game: 'Demo', version: 'Demo v1', status: '已发布', env: '生产环境' }, { id: 'other', game: 'Other', version: 'Other v9' }], publish: [entry], todo: [{ publishId: 'P1', status: '待审核' }], audit: [], live: {}, liveHistory: {} }
}

test('统一版本审核同步来源及模拟生产视图，回滚恢复原指针且不改其他游戏', () => {
  const source = versionStore()
  const approved = applyRelease(source, source.publish[0], 'approve')
  assert.equal(approved.publish[0].status, '已发布')
  assert.equal(approved.versions[0].status, '已发布')
  assert.equal(approved.versions[0].production, '模拟 Demo v2')
  assert.equal(approved.production.find((row) => row.version === 'Demo v2').simulated, true)
  const restored = applyRelease(approved, approved.publish[0], 'rollback', '验证')
  assert.equal(restored.versions[0].production, '生产 v1')
  assert.equal(restored.versions[0].status, '已回滚')
  assert.deepEqual(restored.production, source.production)
  const rejected = applyRelease(source, source.publish[0], 'reject', '需修改')
  assert.equal(rejected.versions[0].status, '测试通过')
  assert.deepEqual(rejected.production, source.production)
})

test('同一游戏的旧待审版本不能在较新版本发布后覆盖生产视图', () => {
  const oldSource = { id: 'V1', game: 'Demo', version: 'v2', production: '生产 v1', status: '待审核' }
  const newSource = { id: 'V2', game: 'Demo', version: 'v3', production: '生产 v1', status: '待审核' }
  const oldEntry = { id: 'P1', name: 'Demo v2', sourceModule: 'versions', sourceId: 'V1', status: '待审核', snapshot: null, baseReleaseId: null }
  const newEntry = { id: 'P2', name: 'Demo v3', sourceModule: 'versions', sourceId: 'V2', status: '待审核', snapshot: null, baseReleaseId: null }
  const store = {
    versions: [oldSource, newSource],
    production: [{ id: 'D1', game: 'Demo', version: 'Demo v1', status: '已发布', env: '生产环境' }],
    publish: [newEntry, oldEntry], todo: [], audit: [], live: {}, liveHistory: {},
  }

  const newerPublished = applyRelease(store, newEntry, 'approve')
  const denied = applyRelease(newerPublished, oldEntry, 'approve')

  assert.equal(denied.production[0].version, 'Demo v3')
  assert.equal(denied.activeReleaseIds['version:Demo'], 'P2')
  assert.equal(denied.publish.find((entry) => entry.id === 'P1').status, '待审核')
  assert.match(denied.audit[0].result, /基线已过期/)
})

test('无 v 前缀时，test 和 production 来源仍使用稳定 game 同步生产视图', () => {
  for (const sourceModule of ['test', 'production']) {
    const source = { id: `${sourceModule}-new`, game: 'Demo', version: 'Demo 2.0.0', build: 'build 2', env: '生产环境', status: '待审核' }
    const entry = { id: `P-${sourceModule}`, name: 'Demo 2.0.0', sourceModule, sourceId: source.id, status: '待审核', snapshot: null, baseReleaseId: null }
    const store = {
      versions: [{ id: 'V1', game: 'Demo', version: 'v2.0.0', production: '生产 Demo v1.0.0' }],
      test: sourceModule === 'test' ? [source] : [],
      production: sourceModule === 'production'
        ? [{ id: 'D1', game: 'Demo', version: 'Demo v1.0.0', status: '已发布', env: '生产环境' }, source]
        : [{ id: 'D1', game: 'Demo', version: 'Demo v1.0.0', status: '已发布', env: '生产环境' }],
      publish: [entry], todo: [], audit: [], live: {}, liveHistory: {},
    }

    const approved = applyRelease(store, entry, 'approve')
    const demoProduction = approved.production.filter((row) => row.game === 'Demo')

    assert.equal(demoProduction.length, 1, sourceModule)
    assert.equal(demoProduction[0].version, 'Demo 2.0.0', sourceModule)
    assert.equal(approved.versions[0].production, '模拟 Demo 2.0.0', sourceModule)
  }
})
