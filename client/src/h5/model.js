export const ENTRY_STORAGE_KEY = 'joyloop.h5-layout.v1'

export function normalizeMode(value) {
  return value === 'half' ? 'half' : 'full'
}

export function readEntryState(raw, requestedMode) {
  let saved = null
  try {
    saved = JSON.parse(raw || 'null')
  } catch {
    /* Invalid preferences fall back to the default layout. */
  }
  const requested = requestedMode === 'half' || requestedMode === 'full'
  return {
    mode: normalizeMode(requested ? requestedMode : saved?.mode),
  }
}

export function loadingProgress(elapsed, duration = 2000) {
  return Math.max(
    0,
    Math.min(100, Math.floor((Math.max(0, elapsed) / duration) * 100)),
  )
}
