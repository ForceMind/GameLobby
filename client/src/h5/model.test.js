import assert from 'node:assert/strict'
import test from 'node:test'
import { loadingProgress, normalizeMode, readEntryState } from './model.js'
import { requestHost } from './hostBridge.js'

test('直接展示完整大厅，缺失或损坏的布局配置不阻挡访问', () => {
  assert.deepEqual(readEntryState(null), { mode: 'full' })
  assert.deepEqual(readEntryState('broken'), { mode: 'full' })
  assert.deepEqual(
    readEntryState(
      JSON.stringify({ version: 1, accepted: true, mode: 'full' }),
    ),
    { mode: 'full' },
  )
  assert.deepEqual(
    readEntryState(
      JSON.stringify({ version: 2, accepted: true, mode: 'full' }),
    ),
    { mode: 'full' },
  )
  assert.equal(normalizeMode('invalid'), 'full')
  assert.equal(readEntryState(null, 'full').mode, 'full')
  assert.deepEqual(
    readEntryState(
      JSON.stringify({ version: 1, accepted: true, mode: 'half' }),
      'full',
    ),
    { mode: 'full' },
  )
  assert.deepEqual(
    readEntryState(
      JSON.stringify({ version: 1, accepted: false, mode: 'half' }),
    ),
    { mode: 'half' },
  )
})

test('游戏加载进度单调且不超出0到100', () => {
  assert.equal(loadingProgress(-1), 0)
  assert.equal(loadingProgress(1000), 50)
  assert.equal(loadingProgress(2000), 100)
  assert.equal(loadingProgress(9000), 100)
})

test('没有原生桥时不会伪造购买成功', async () => {
  assert.equal(
    (
      await requestHost(
        'purchase',
        { sku: 'coin-6', currency: 'USD', priceCents: 55 },
        { target: {} },
      )
    ).status,
    'unavailable',
  )
  assert.equal(
    (
      await requestHost(
        'purchase',
        { sku: 'coin-6', currency: 'CNY', priceCents: 55 },
        { target: {} },
      )
    ).status,
    'failed',
  )
  assert.equal(
    (await requestHost('unknown', {}, { target: {} })).status,
    'failed',
  )
})

test('App桥接收到明确的全屏/半屏请求与美元购买参数', async () => {
  const received = []
  const host = {
    request: (request) => {
      received.push(request)
      return { status: 'completed' }
    },
  }
  await requestHost(
    'setDisplayMode',
    { mode: 'full', reason: 'game' },
    { host },
  )
  await requestHost(
    'setDisplayMode',
    { mode: 'half', aspectRatio: 1, reason: 'return-to-lobby' },
    { host },
  )
  const result = await requestHost(
    'purchase',
    { sku: 'coin-6', currency: 'USD', priceCents: 55, coins: 6000, gems: 2 },
    { host },
  )
  assert.equal(result.status, 'completed')
  assert.deepEqual(
    received.map((x) => x.action),
    ['setDisplayMode', 'setDisplayMode', 'purchase'],
  )
  assert.equal(received[2].payload.priceCents, 55)
  assert.equal(received[2].payload.currency, 'USD')
})

test('原生桥异常、取消或超时均可恢复且不成为已支付', async () => {
  const offer = { sku: 'coin-6', currency: 'USD', priceCents: 55 }
  assert.equal(
    (
      await requestHost('purchase', offer, {
        host: { request: () => ({ status: 'cancelled' }) },
      })
    ).status,
    'cancelled',
  )
  assert.equal(
    (
      await requestHost('purchase', offer, {
        host: {
          request: () => {
            throw new Error('bridge failed')
          },
        },
      })
    ).status,
    'failed',
  )
  assert.deepEqual(
    await requestHost('purchase', offer, {
      host: { request: () => new Promise(() => {}) },
      timeoutMs: 2,
    }),
    { status: 'failed', code: 'timeout' },
  )
})

test('宿主必须返回明确状态，畸形响应不得成为已完成或已支付', async () => {
  const offer = { sku: 'coin-6', currency: 'USD', priceCents: 55 }
  for (const result of [
    undefined,
    null,
    true,
    'completed',
    {},
    { status: 'pending' },
  ]) {
    for (const action of ['purchase', 'setDisplayMode', 'closeLobby']) {
      assert.equal(
        (await requestHost(action, offer, { host: { request: () => result } }))
          .status,
        'failed',
      )
    }
  }
})

test('每次桥接请求标识唯一，重试可显式沿用原 requestId', async () => {
  const received = []
  const host = {
    request: (request) => {
      received.push(request)
      return { status: 'completed' }
    },
  }
  await requestHost('closeLobby', {}, { host, target: {} })
  await requestHost('closeLobby', {}, { host, target: {} })
  await requestHost(
    'closeLobby',
    {},
    { host, target: {}, requestId: received[0].requestId },
  )
  assert.equal(received[0].version, 1)
  assert.notEqual(received[0].requestId, received[1].requestId)
  assert.equal(received[0].requestId, received[2].requestId)
})
