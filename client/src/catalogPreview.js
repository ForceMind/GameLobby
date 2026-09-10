import { games as seedGames } from './data.js'
import { DEFAULT_CATEGORIES } from './catalogDefaults.js'
import { gameContentKeys, validateCategories, validateGameCategories, validGameType } from './catalogConfig.js'

export const CATALOG_STORAGE_KEY = 'joyloop.catalog.preview.v1'
export const CATALOG_EVENT = 'joyloop:catalog-published'
const idOf = (game) => game.gameId || game.id
const clone = (value) => JSON.parse(JSON.stringify(value))
const DISPLAY_FIELDS = ['id', 'gameId', 'name', 'gameType', 'tags', 'popular', 'heat', 'sortWeight', 'descriptionKey', 'winRate', 'rtp', 'winRangeMin', 'winRangeMax', 'maxMultiplier']
const displayRecord = (game) => Object.fromEntries(DISPLAY_FIELDS.filter((key) => game[key] !== undefined).map((key) => [key, clone(game[key])]))

export function catalogPublication(live) {
  const contentKeys = new Set(Object.values(live.games).flat().flatMap((game) => Object.values(gameContentKeys(game))))
  return { schema: 1, categories: clone(live.categories).map((category) => { delete category.labelKey; return category }), games: Object.fromEntries(['test', 'production'].map((env) => [env, live.games[env].map(displayRecord)])), translations: Object.fromEntries(Object.entries(live.translations).filter(([key]) => contentKeys.has(key))) }
}

export function parseCatalogPublication(raw) {
  if (!raw || raw.length > 2_000_000) return null
  try {
    const value = JSON.parse(raw)
    if (value.schema !== 1 || !value.games || !value.translations || typeof value.translations !== 'object' || Array.isArray(value.translations)) return null
    if (validateCategories(value.categories).length) return null
    const ids = new Set(seedGames.map((game) => game.id))
    for (const env of ['test', 'production']) {
      const list = value.games[env]
      if (!Array.isArray(list) || list.length !== ids.size || new Set(list.map(idOf)).size !== ids.size) return null
      if (list.some((game) => !ids.has(idOf(game)) || !validGameType(game.gameType) || !Array.isArray(game.tags) || !game.tags.length || typeof game.name !== 'string')) return null
      if (validateGameCategories(list, value.categories).length) return null
    }
    const keys = new Set(Object.values(value.games).flat().flatMap((game) => Object.values(gameContentKeys(game))))
    if (Object.entries(value.translations).some(([key, entry]) => !keys.has(key) || !entry || typeof entry !== 'object' || Array.isArray(entry) || Object.values(entry).some((text) => typeof text !== 'string'))) return null
    return value
  } catch { return null }
}

export function readCatalogPublication(storage) {
  try { return parseCatalogPublication((storage || window.localStorage).getItem(CATALOG_STORAGE_KEY)) } catch { return null }
}

export function writeCatalogPublication(live, storage) {
  try {
    storage = storage || window.localStorage
    const value = catalogPublication(live)
    const raw = JSON.stringify(value)
    if (!parseCatalogPublication(raw)) return { error: '目录预览数据未通过校验，未更新玩家预览。' }
    if (storage.getItem(CATALOG_STORAGE_KEY) !== raw) {
      storage.setItem(CATALOG_STORAGE_KEY, raw)
      if (typeof window !== 'undefined') window.dispatchEvent(new Event(CATALOG_EVENT))
    }
    return { ok: true }
  } catch { return { error: '浏览器存储不可用；后台会话已更新，但玩家预览尚未同步。' } }
}

export function restoreCatalogPublication(store, publication) {
  if (!publication) return store
  const merge = (container) => ({ ...container, categories: clone(publication.categories), games: Object.fromEntries(['test', 'production'].map((env) => [env, container.games[env].map((game) => ({ ...game, ...displayRecord(publication.games[env].find((record) => idOf(record) === idOf(game))) }))])), translations: { ...container.translations, ...clone(publication.translations) } })
  return { ...merge(store), live: merge(store.live) }
}

export function playerCatalog(publication, environment = 'test') {
  if (!publication) return { games: seedGames, categories: DEFAULT_CATEGORIES, translations: {} }
  const base = new Map(seedGames.map((game) => [game.id, game]))
  const games = publication.games[environment].map((record) => {
    const seed = base.get(idOf(record))
    // Published preview controls display only; identity, balances, gates and live availability remain unchanged.
    const { name, tags, gameType, popular, heat, sortWeight } = record
    return { ...seed, name, tags, gameType, popular, heat, sortWeight, category: tags.join(' '), details: { descriptionKey: record.descriptionKey, winRate: record.winRate, rtp: record.rtp, winRangeMin: record.winRangeMin === '' ? null : record.winRangeMin, winRangeMax: record.winRangeMax === '' ? null : record.winRangeMax, maxMultiplier: record.maxMultiplier } }
  }).sort((a, b) => a.sortWeight - b.sortWeight)
  return { games, categories: publication.categories.filter((category) => category.enabled).sort((a, b) => a.sortWeight - b.sortWeight), translations: publication.translations }
}

export function catalogPreviewSelection({ search = '', saved = null, hasHost = false, source = '' } = {}) {
  if (hasHost || source === 'server') return null
  const query = new URLSearchParams(search)
  if (query.get('catalogPreview') === '0') return null
  if (query.get('catalogPreview') === '1') return query.get('catalogEnv') === 'production' ? 'production' : 'test'
  return ['test', 'production'].includes(saved) ? saved : null
}
