import assert from 'node:assert/strict'
import test from 'node:test'
import { buildLiveRoomUrl, openLiveRoom } from './liveRoomBridge.js'

test('构造直播间链接并固定 game_center 归因字段', () => {
  const url = new URL(
    buildLiveRoomUrl({
      roomId: 'room-7',
      gameId: 'golden-pharaoh',
      entry: 'banner',
      mode: 'half',
      lang: 'zh-CN',
      target: { location: { href: 'https://joyloop.test/lobby.html?mode=full&lang=en' } },
    }),
  )
  assert.equal(url.searchParams.get('from'), 'game_center')
  assert.equal(url.searchParams.get('entry'), 'banner')
  assert.equal(url.searchParams.get('room_id'), 'room-7')
  assert.equal(url.searchParams.get('game_id'), 'golden-pharaoh')
  assert.equal(url.searchParams.get('mode'), 'half')
  assert.equal(url.searchParams.get('lang'), 'zh-cn')
})

test('缺省 mode/lang 时沿用当前页面，非法 entry 回退到 hot_rooms', () => {
  const url = new URL(
    buildLiveRoomUrl({
      roomId: 'r',
      gameId: 'g',
      entry: 'unknown',
      target: { location: { href: 'https://joyloop.test/games.html?mode=half&lang=en' } },
    }),
  )
  assert.equal(url.searchParams.get('entry'), 'hot_rooms')
  assert.equal(url.searchParams.get('mode'), 'half')
  assert.equal(url.searchParams.get('lang'), 'en')
})

test('无宿主时返回静态预览状态且发出可观察事件', () => {
  const events = []
  const target = {
    location: { href: 'https://joyloop.test/games.html?mode=full&lang=zh' },
    CustomEvent: class CustomEvent {
      constructor(type, init) { this.type = type; this.detail = init.detail }
    },
    dispatchEvent(event) { events.push(event) },
  }
  const result = openLiveRoom(
    { roomId: 'room-1', gameId: 'fish-hunter', entry: 'game_detail' },
    { target },
  )
  assert.equal(result.status, 'preview')
  assert.equal(result.preview, true)
  assert.equal(result.transport, 'static-preview')
  assert.equal(result.payload.from, 'game_center')
  assert.equal(result.payload.entry, 'game_detail')
  assert.equal(events[0].type, 'joyloop:live-room-preview')
})

test('宿主存在时优先使用 jump2native，并保留归因 payload', () => {
  const calls = []
  const result = openLiveRoom(
    { roomId: 'room-2', gameId: 'fruit-party', entry: 'hot_rooms' },
    {
      target: { location: { href: 'https://joyloop.test/games.html?mode=half&lang=en' } },
      bridge: {
        jump2native(url, payload) { calls.push({ url, payload }); return { accepted: true } },
      },
    },
  )
  assert.equal(result.status, 'requested')
  assert.equal(result.transport, 'jump2native')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].payload.from, 'game_center')
  assert.equal(calls[0].payload.room_id, 'room-2')
  assert.equal(calls[0].payload.game_id, 'fruit-party')
})

test('缺少房间或游戏标识时拒绝跳转', () => {
  assert.deepEqual(openLiveRoom({ gameId: 'g' }), {
    status: 'failed',
    code: 'invalid-room',
    preview: false,
  })
})

test('兼容直接传入房间对象与第二参数入口配置', () => {
  const result = openLiveRoom(
    { id: 'room-object', gameId: 'bubble-pop' },
    {
      entry: 'banner',
      target: { location: { href: 'https://joyloop.test/games.html?mode=half&lang=en' } },
    },
  )
  assert.equal(result.status, 'preview')
  assert.equal(result.payload.entry, 'banner')
  assert.equal(result.payload.room_id, 'room-object')
})

test('保留大厅独立直播快速入口的归因来源', () => {
  const url = new URL(buildLiveRoomUrl({
    roomId: 'room-1',
    gameId: 'golden-pharaoh',
    entry: 'live_teaser',
    target: { location: { href: 'https://joyloop.test/lobby.html?mode=full' } },
  }))
  assert.equal(url.searchParams.get('entry'), 'live_teaser')
  assert.equal(url.searchParams.get('from'), 'game_center')
})
