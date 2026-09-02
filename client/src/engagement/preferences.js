export const defaultPreferences = {
  receiveWinNotifications: true,
  allowSendWins: true,
  shareRecentGames: true,
}

export function normalizePreferences(value = {}) {
  return Object.fromEntries(Object.entries(defaultPreferences).map(([key, fallback]) => [key,
    typeof value[key] === 'boolean' ? value[key] : fallback]))
}

export function readPreferences(storage, accountId) {
  const saved = storage.getItem(`joyloop.preferences.v1:${accountId}`)
  return normalizePreferences(saved ? JSON.parse(saved) : {})
}

export function writePreferences(storage, accountId, value) {
  const preferences = normalizePreferences(value)
  storage.setItem(`joyloop.preferences.v1:${accountId}`, JSON.stringify(preferences))
  return preferences
}
