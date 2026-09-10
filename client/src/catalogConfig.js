import { GAME_TYPES } from './catalogDefaults.js'

export { GAME_TYPES } from './catalogDefaults.js'
export const categoryText = (category, locale = 'zh-Hans', t) => {
  if (!category) return ''
  return category.labels?.[locale]?.trim() || (category.labelKey && t ? t(category.labelKey) : '') || category.labels?.en?.trim() || category.labels?.['zh-Hans']?.trim() || category.id
}

export function gameContentKeys(game) {
  const id = game.gameId || game.id
  return { description: game.descriptionKey || game.details?.descriptionKey || `games.desc.${id}`, instructions: `games.instructions.${id}`, rules: `games.rules.${id}` }
}

export function validateCategories(categories, games = []) {
  if (!Array.isArray(categories) || !categories.length) return ['至少保留一个游戏分类']
  const errors = []
  const seen = new Set()
  for (const category of categories) {
    if (!category || typeof category !== 'object') { errors.push('分类记录无效'); continue }
    if (!/^[a-z][a-z0-9-]{0,39}$/.test(category.id) || ['all', 'popular'].includes(category.id)) errors.push('分类标识须以小写字母开头，仅含小写字母、数字和短横线，且不能使用 all/popular')
    if (seen.has(category.id)) errors.push(`分类标识 ${category.id} 重复`)
    seen.add(category.id)
    for (const locale of ['zh-Hans', 'en']) if (typeof category.labels?.[locale] !== 'string' || !category.labels[locale].trim()) errors.push(`分类 ${category.id} 的${locale === 'en' ? '英文' : '中文'}名称必填`)
    if (Object.values(category.labels || {}).some((label) => typeof label !== 'string' || label.length > 80)) errors.push(`分类 ${category.id} 名称最多 80 个字符`)
    if (!Number.isSafeInteger(category.sortWeight) || category.sortWeight <= 0) errors.push(`分类 ${category.id} 排序须为正整数`)
    if (typeof category.enabled !== 'boolean') errors.push(`分类 ${category.id} 启用状态无效`)
  }
  const active = new Set(categories.filter((c) => c?.enabled).map((c) => c.id))
  if (!active.size) errors.push('至少启用一个游戏分类')
  for (const game of games) for (const tag of game.tags || []) if (!active.has(tag)) errors.push(`游戏「${game.name || game.id}」仍关联分类 ${tag}，请先重新关联游戏并发布，再停用或删除分类`)
  return [...new Set(errors)]
}

export function validateGameCategories(games, categories) {
  const active = new Set((categories || []).filter((c) => c.enabled).map((c) => c.id))
  return games.flatMap((game) => (game.tags || []).filter((tag) => !active.has(tag)).map((tag) => `游戏「${game.name}」引用的分类 ${tag} 未发布或已停用`))
}

export function validGameType(value) { return GAME_TYPES.some(([id]) => id === value) }

export const isCatalogModule = (moduleId) => moduleId === 'categories' || moduleId === 'translations' || String(moduleId).startsWith('games:')
