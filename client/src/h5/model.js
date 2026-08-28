export const ENTRY_STORAGE_KEY = 'joyloop.h5-entry.v1'

export function normalizeMode(value) {
  return value === 'full' ? 'full' : 'half'
}

export function readEntryState(raw, requestedMode) {
  let saved = null
  try {
    saved = JSON.parse(raw || 'null')
  } catch {
    /* A corrupt preference must not bypass consent. */
  }
  const requested = requestedMode === 'half' || requestedMode === 'full'
  return {
    accepted: saved?.version === 1 && saved?.accepted === true,
    mode: normalizeMode(requested ? requestedMode : saved?.mode),
  }
}

export function loadingProgress(elapsed, duration = 2000) {
  return Math.max(
    0,
    Math.min(100, Math.floor((Math.max(0, elapsed) / duration) * 100)),
  )
}
