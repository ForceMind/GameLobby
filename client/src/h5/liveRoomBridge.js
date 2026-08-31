// Live-room navigation boundary.
//
// The prototype deliberately never pretends to enter a real live room.  When
// no host bridge is available openLiveRoom returns a deterministic preview
// state and emits a browser event that the UI can use to open its preview
// modal.  A native/web host can opt in by supplying pageJump or jump2native.

const ENTRY_VALUES = new Set(['hot_rooms', 'banner', 'game_detail'])
const MODE_VALUES = new Set(['full', 'half'])

function stringValue(value) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

function cleanId(value) {
  const result = stringValue(value)
  return result.length > 0 && result.length <= 120 ? result : ''
}

function cleanLang(value) {
  const result = stringValue(value).toLowerCase()
  return /^[a-z]{2}(?:-[a-z]{2})?$/.test(result) ? result : ''
}

function currentLocation(target) {
  if (target?.location?.href) return target.location.href
  return 'https://joyloop.invalid/games.html'
}

/**
 * Build a live-room destination while preserving display mode and locale.
 * `from` is intentionally fixed to game_center so callers cannot accidentally
 * create an unattributed room visit.
 */
export function buildLiveRoomUrl({
  roomId,
  gameId,
  entry = 'hot_rooms',
  mode,
  lang,
  base = 'live-room.html',
  target,
} = {}) {
  const room = cleanId(roomId)
  const game = cleanId(gameId)
  if (!room || !game) return null

  const source = new URL(currentLocation(target))
  const destination = new URL(base, source)
  const chosenMode = MODE_VALUES.has(mode)
    ? mode
    : MODE_VALUES.has(source.searchParams.get('mode'))
      ? source.searchParams.get('mode')
      : 'full'
  const chosenLang = cleanLang(lang) || cleanLang(source.searchParams.get('lang'))
  destination.search = ''
  destination.searchParams.set('from', 'game_center')
  destination.searchParams.set('entry', ENTRY_VALUES.has(entry) ? entry : 'hot_rooms')
  destination.searchParams.set('room_id', room)
  destination.searchParams.set('game_id', game)
  destination.searchParams.set('mode', chosenMode)
  if (chosenLang) destination.searchParams.set('lang', chosenLang)
  return destination.href
}

function bridgeFor(target, explicitBridge) {
  if (explicitBridge && typeof explicitBridge === 'object') return explicitBridge
  return target?.JoyloopHost ?? target?.jsBridge ?? null
}

function bridgeMethod(bridge) {
  if (typeof bridge?.jump2native === 'function') {
    return { name: 'jump2native', call: bridge.jump2native.bind(bridge) }
  }
  if (typeof bridge?.pageJump === 'function') {
    return { name: 'pageJump', call: bridge.pageJump.bind(bridge) }
  }
  return null
}

/**
 * Navigate to a live room, or return a safe static preview state in a browser.
 * The returned object is intentionally serializable so tests and UI previews
 * can inspect the exact attribution query without relying on a real host.
 */
export function openLiveRoom(input = {}, options = {}) {
  const roomId = cleanId(input.roomId ?? input.room_id ?? input.id)
  const gameId = cleanId(input.gameId ?? input.game_id)
  if (!roomId || !gameId) {
    return { status: 'failed', code: 'invalid-room', preview: false }
  }

  const target = options.target ?? (typeof window === 'undefined' ? null : window)
  // Accept an optional second-argument `{ entry, mode, lang }` for callers
  // that already pass a room object as the first argument.  The canonical
  // form remains openLiveRoom({ roomId, gameId, entry, mode, lang }, options).
  const url = buildLiveRoomUrl({
    ...input,
    roomId,
    gameId,
    entry: input.entry ?? options.entry,
    mode: input.mode ?? options.mode,
    lang: input.lang ?? options.lang,
    target,
  })
  const params = new URL(url).searchParams
  const payload = {
    from: params.get('from'),
    entry: params.get('entry'),
    room_id: params.get('room_id'),
    game_id: params.get('game_id'),
    mode: params.get('mode'),
    ...(params.has('lang') ? { lang: params.get('lang') } : {}),
  }

  const bridge = bridgeFor(target, options.bridge)
  const method = bridgeMethod(bridge)
  if (method) {
    try {
      const result = method.call(url, payload)
      return {
        status: 'requested',
        preview: false,
        transport: method.name,
        url,
        payload,
        ...(result !== undefined ? { result } : {}),
      }
    } catch {
      return { status: 'failed', code: 'bridge-error', preview: false, url, payload }
    }
  }

  const detail = { type: 'live-room-preview', url, payload }
  if (typeof options.onPreview === 'function') options.onPreview(detail)
  if (target?.dispatchEvent && typeof target.CustomEvent === 'function') {
    target.dispatchEvent(new target.CustomEvent('joyloop:live-room-preview', { detail }))
  }
  return {
    status: 'preview',
    preview: true,
    transport: 'static-preview',
    url,
    payload,
  }
}
