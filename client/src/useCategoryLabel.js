import { useLocale } from './useLocale.js'

// A game's category line is built from its tags rather than stored as one of nine
// pre-joined strings, so a new language needs three words instead of nine phrases.
const TAG_KEYS = { slots: 'games.tagSlots', casual: 'games.tagCasual', realtime: 'games.tagLive' }

export function useCategoryLabel() {
  const { t } = useLocale()
  return (game) => (game.tags ?? []).map((tag) => t(TAG_KEYS[tag] ?? tag)).join(' · ')
}
