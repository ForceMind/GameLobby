import assert from 'node:assert/strict'
import test from 'node:test'
import { createDisplayModeDispatcher } from './displayMode.js'

const deferred = () => {
  let resolve
  const promise = new Promise((finish) => {
    resolve = finish
  })
  return { promise, resolve }
}

test('同一时刻只发送一个请求，并在完成后发送最新排队请求', async () => {
  const calls = []
  const first = deferred()
  const second = deferred()
  const send = (payload) => {
    calls.push(payload)
    return calls.length === 1 ? first.promise : second.promise
  }
  const dispatcher = createDisplayModeDispatcher(send)

  const firstRequest = dispatcher.request({ mode: 'full' })
  await Promise.resolve()
  const latestRequest = dispatcher.request({ mode: 'half', aspectRatio: 1 })
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], { mode: 'full', revision: 1 })

  first.resolve({ status: 'completed' })
  assert.deepEqual(await firstRequest, { status: 'completed' })
  await Promise.resolve()
  assert.equal(calls.length, 2)
  assert.deepEqual(calls[1], { mode: 'half', aspectRatio: 1, revision: 2 })

  second.resolve({ status: 'completed' })
  assert.deepEqual(await latestRequest, { status: 'completed' })
})

test('快速 half/full/half 只保留最新排队请求，并保持单调递增 revision', async () => {
  const calls = []
  const first = deferred()
  const second = deferred()
  const send = (payload) => {
    calls.push(payload)
    return calls.length === 1 ? first.promise : second.promise
  }
  const dispatcher = createDisplayModeDispatcher(send)
  const firstRequest = dispatcher.request({ mode: 'half' })
  await Promise.resolve()
  const superseded = dispatcher.request({ mode: 'full' })
  const latestRequest = dispatcher.request({ mode: 'half', aspectRatio: 1 })

  assert.deepEqual(await superseded, {
    status: 'cancelled',
    code: 'superseded',
  })
  first.resolve({ status: 'completed' })
  assert.deepEqual(await firstRequest, { status: 'completed' })
  await Promise.resolve()
  assert.deepEqual(calls, [
    { mode: 'half', revision: 1 },
    { mode: 'half', aspectRatio: 1, revision: 3 },
  ])
  second.resolve({ status: 'completed' })
  assert.deepEqual(await latestRequest, { status: 'completed' })
})

test('send 拒绝或同步抛错后仍会继续处理最新请求', async () => {
  const calls = []
  const send = (payload) => {
    calls.push(payload)
    if (calls.length === 1) return Promise.reject(new Error('rejected'))
    if (calls.length === 2) throw new Error('thrown')
    return { status: 'completed' }
  }
  const dispatcher = createDisplayModeDispatcher(send)
  const rejected = dispatcher.request({ mode: 'full' })
  await Promise.resolve()
  const thrown = dispatcher.request({ mode: 'half' })
  assert.deepEqual(await rejected, { status: 'failed' })
  assert.deepEqual(await thrown, { status: 'failed' })

  const recovered = dispatcher.request({ mode: 'full' })
  assert.deepEqual(await recovered, { status: 'completed' })
  assert.deepEqual(calls, [
    { mode: 'full', revision: 1 },
    { mode: 'half', revision: 2 },
    { mode: 'full', revision: 3 },
  ])
})

test('cancelPending 只取消未发送请求，之后 dispatcher 仍可复用', async () => {
  const calls = []
  const first = deferred()
  const send = (payload) => {
    calls.push(payload)
    return calls.length === 1 ? first.promise : { status: 'completed' }
  }
  const dispatcher = createDisplayModeDispatcher(send)
  const active = dispatcher.request({ mode: 'full' })
  await Promise.resolve()
  const pending = dispatcher.request({ mode: 'half' })
  dispatcher.cancelPending()
  assert.deepEqual(await pending, { status: 'cancelled', code: 'cancelled' })
  assert.equal(calls.length, 1)

  first.resolve({ status: 'completed' })
  assert.deepEqual(await active, { status: 'completed' })
  const reusable = dispatcher.request({ mode: 'half', aspectRatio: 1 })
  assert.deepEqual(await reusable, { status: 'completed' })
  assert.deepEqual(calls, [
    { mode: 'full', revision: 1 },
    { mode: 'half', aspectRatio: 1, revision: 3 },
  ])
})
