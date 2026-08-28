export function normalizeMode(value) {
  return value === 'half' ? 'half' : 'full'
}

export function readEntryState(_legacyState, requestedMode) {
  // Display mode is explicit. Old browser preferences must not reopen half mode.
  return { mode: normalizeMode(requestedMode) }
}

export function loadingProgress(elapsed, duration = 2000) {
  return Math.max(
    0,
    Math.min(100, Math.floor((Math.max(0, elapsed) / duration) * 100)),
  )
}
