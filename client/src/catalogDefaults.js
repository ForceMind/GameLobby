// Stable game types describe the game, independently of operator-defined filters.
export const GAME_TYPES = [
  ['slots', '老虎机'], ['fishing', '捕鱼'], ['casual', '休闲游戏'], ['other', '其他'],
]

export const DEFAULT_CATEGORIES = [
  { id: 'slots', labelKey: 'games.tagSlots', labels: { 'zh-Hans': '老虎机', en: 'Slots' }, enabled: true, sortWeight: 10 },
  { id: 'casual', labelKey: 'games.tagCasual', labels: { 'zh-Hans': '休闲', en: 'Casual' }, enabled: true, sortWeight: 20 },
  { id: 'realtime', labelKey: 'games.tagLive', labels: { 'zh-Hans': '实时', en: 'Live' }, enabled: true, sortWeight: 30 },
]
