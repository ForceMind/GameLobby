// Legacy Chinese-source catalogue: the pre-migration lookup tables, where the
// Chinese sentence itself is the key and the value is its English rendering.
//
// These back the screens that are not part of the five-page lite v1 lobby and are
// no longer reachable from any entry point (tournaments, live rooms, social
// activities and friends). They are kept so those files still render correctly in
// Chinese and English if they are ever re-enabled, but they are deliberately NOT
// part of the multi-language catalogue: translating copy for unreachable screens
// into 24 languages would be waste, and it would clutter the admin translation
// module with keys no player can ever see.
//
// Nothing new should be added here. New player-facing copy goes into the per-locale
// catalogues next to this file, keyed by a stable dotted key.
import common from './common.js'
import profileTournaments from './profileTournaments.js'
import eventsStore from './eventsStore.js'
import h5Product from './h5Product.js'
import storeProduct from './storeProduct.js'
import profileProduct from './profileProduct.js'
import activitiesProduct from './activitiesProduct.js'
import entryProduct from './entryProduct.js'
import compactProduct from './compactProduct.js'
import compactAccountStore from './compactAccountStore.js'

export const catalogs = {
  common,
  profileTournaments,
  eventsStore,
  h5Product,
  storeProduct,
  profileProduct,
  activitiesProduct,
  entryProduct,
  compactProduct,
  compactAccountStore,
}

// Spread order is preserved from the original implementation so the rendered
// English text for these screens is byte-identical to before the migration.
const legacyEnglish = {
  ...profileTournaments,
  ...eventsStore,
  ...common,
  ...storeProduct,
  ...profileProduct,
  ...activitiesProduct,
  ...h5Product,
  ...entryProduct,
  ...compactProduct,
  ...compactAccountStore,
}

// The mirror direction: latin product terms that Chinese screens render translated.
// GameCatalog still reaches these through a dynamic key (t(game.categoryLabel)), so
// they stay live until per-game text carries stable keys of its own.
export const legacyChinese = {
  Slots: '老虎机',
  'Slots · 实时': '老虎机 · 实时',
  'Slot 赛事': '老虎机赛事',
  'Slot 冲榜赛': '老虎机冲榜赛',
  'Jackpot 争夺赛': '累积大奖争夺赛',
  'Jackpot 猎手': '大奖猎手',
  'Lucky Spin 狂欢季': '幸运旋转狂欢季',
  'Classic Slot 周挑战': '经典老虎机周挑战',
  'Free Spin': '免费旋转',
}

export default legacyEnglish
