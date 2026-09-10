import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_CATEGORIES } from './catalogDefaults.js'
import { categoryText, gameContentKeys, validateCategories, validateGameCategories } from './catalogConfig.js'
import { catalogPublication, parseCatalogPublication, playerCatalog, writeCatalogPublication, readCatalogPublication, restoreCatalogPublication, catalogPreviewSelection } from './catalogPreview.js'
import { games } from './data.js'
import { applyRelease, validateGameConfig } from './admin/adminRules.js'

const clone = (value) => structuredClone(value)
const live = () => ({ categories: clone(DEFAULT_CATEGORIES), games: { test: games.map((game, i) => ({ ...game, gameId: game.id, sortWeight: i + 1 })), production: games.map((game, i) => ({ ...game, gameId: game.id, sortWeight: i + 1 })) }, translations: { 'games.desc.golden-pharaoh': { 'zh-Hans': '简介', en: 'Description', fr: '' }, 'games.instructions.golden-pharaoh': { 'zh-Hans': '玩法', en: 'Play' }, 'wallet.other': { en: 'Not a game description' } } })
const store = () => { const seed = live(); return { ...clone(seed), live: seed, publish: [], todo: [], audit: [], liveHistory: {} } }
const entry = (snapshot) => ({ id: 'C1', name: '分类', sourceModule: 'categories', status: '待审核', snapshot })

test('分类标识唯一、系统分类保留、名称必填；关联游戏前不能停用或删除', () => {
  const cats = clone(DEFAULT_CATEGORIES)
  assert.deepEqual(validateCategories(cats, games), [])
  assert.ok(validateCategories([...cats, { ...cats[0] }]).some((error) => error.includes('重复')))
  assert.ok(validateCategories([{ ...cats[0], id: 'all' }]).length)
  assert.ok(validateCategories([{ ...cats[0], id: 'popular' }]).length)
  assert.ok(validateCategories([{ ...cats[0], labels: { en: 'Slots' } }]).length)
  assert.ok(validateCategories(cats.map((c) => c.id === 'slots' ? { ...c, enabled: false } : c), games).some((error) => error.includes('重新关联')))
  assert.ok(validateCategories(cats.filter((c) => c.id !== 'slots'), games).length)
})

test('新分类发布前不能被游戏引用；分类修改不改变独立游戏类型', () => {
  assert.ok(validateGameCategories([{ name: 'Demo', tags: ['new-category'] }], DEFAULT_CATEGORIES).length)
  const changed = { ...games[0], tags: ['casual'], sortWeight: 1 }
  assert.equal(changed.gameType, 'slots')
  assert.deepEqual(validateGameConfig(changed), [])
  assert.deepEqual(gameContentKeys(changed), { description: 'games.desc.golden-pharaoh', instructions: 'games.instructions.golden-pharaoh', rules: 'games.rules.golden-pharaoh' })
})

test('分类审核时重新检查引用；新分类被游戏引用后不能回滚删除', () => {
  const s = store()
  const nextCategories = [...s.categories, { id: 'arcade', enabled: true, labels: { 'zh-Hans': '街机', en: 'Arcade' }, sortWeight: 40 }]
  const task = entry({ categories: nextCategories })
  const published = applyRelease({ ...s, publish: [task] }, task, 'approve')
  assert.equal(published.live.categories.length, 4)
  const linked = { ...published, games: { ...published.games, test: published.games.test.map((game, i) => i === 0 ? { ...game, tags: ['arcade'] } : game) } }
  const blocked = applyRelease(linked, linked.publish[0], 'rollback', '无法删除在用分类')
  assert.equal(blocked.live.categories.length, 4)
  assert.match(blocked.audit[0].result, /失败.*重新关联/)
  const disabled = entry({ categories: s.categories.map((c) => ({ ...c, enabled: false })) })
  assert.match(applyRelease({ ...s, publish: [disabled] }, disabled, 'approve').audit[0].result, /失败/)
})

test('仅已发布游戏内容写入预览；其他文案和草稿不会被夹带', () => {
  const s = store()
  s.translations['games.desc.golden-pharaoh'].en = 'Unreviewed draft'
  const publication = catalogPublication(s.live)
  assert.equal(publication.translations['games.desc.golden-pharaoh'].en, 'Description')
  assert.equal(publication.translations['wallet.other'], undefined)
  assert.equal(publication.categories[0].labelKey, undefined)
  assert.equal(publication.games.test[0].wealthLevel, undefined)
  assert.equal(publication.games.test[0].status, undefined)
  assert.deepEqual(parseCatalogPublication(JSON.stringify(publication)), publication)
  const restored = restoreCatalogPublication(store(), publication)
  assert.equal(restored.live.translations['games.instructions.golden-pharaoh'].en, 'Play')
})

test('目录预览只覆盖展示字段，不替换运行状态、准入、身份或资产', () => {
  const publication = catalogPublication(live())
  publication.games.test[0] = { ...publication.games.test[0], tags: ['casual'], name: 'New title', wealthLevel: 0, region: { mode: 'all' }, status: '正常可玩' }
  const shown = playerCatalog(publication).games.find((game) => game.id === games[0].id)
  assert.equal(shown.name, 'New title')
  assert.equal(shown.gameType, 'slots')
  assert.equal(shown.wealthLevel, games[0].wealthLevel)
  assert.equal(shown.status, games[0].status)
  const restored = restoreCatalogPublication(store(), publication)
  assert.equal(restored.live.games.test[0].wealthLevel, games[0].wealthLevel)
  assert.equal(restored.live.games.test[0].status, games[0].status)
  assert.deepEqual(shown.tags, ['casual'])
})

test('损坏或未知游戏的本地配置被忽略；浏览器存储异常返回明确失败', () => {
  assert.equal(parseCatalogPublication('not json'), null)
  const publication = catalogPublication(live())
  publication.games.test[0].id = 'unknown'
  publication.games.test[0].gameId = 'unknown'
  assert.equal(parseCatalogPublication(JSON.stringify(publication)), null)
  const broken = { getItem() { throw new Error('denied') }, setItem() { throw new Error('denied') } }
  assert.equal(readCatalogPublication(broken), null)
  assert.ok(writeCatalogPublication(live(), broken).error)
})

test('新增分类名称缺失目标语言时回退英文而不是暴露ID', () => {
  assert.equal(categoryText({ id: 'arcade', labels: { 'zh-Hans': '街机', en: 'Arcade', fr: '' } }, 'fr'), 'Arcade')
})

test('回滚保留更新的分类草稿，过期审核基线必须重新提交；预览不冒充灰度', () => {
  const s = store()
  const catsA = s.categories.map((category, i) => i === 0 ? { ...category, labels: { ...category.labels, en: 'Slots A' } } : category)
  const a = { ...entry({ categories: catsA }), baseReleaseId: null }
  const approved = applyRelease({ ...s, categories: catsA, publish: [a] }, a, 'approve')
  const catsB = catsA.map((category, i) => i === 0 ? { ...category, labels: { ...category.labels, en: 'Slots B' } } : category)
  const b = { ...entry({ categories: catsB }), id: 'C2', baseReleaseId: a.id }
  const pending = { ...approved, categories: catsB, publish: [b, ...approved.publish] }
  const rolled = applyRelease(pending, approved.publish[0], 'rollback', '撤回当前版本')
  assert.equal(rolled.categories[0].labels.en, 'Slots B')
  assert.equal(rolled.live.categories[0].labels.en, s.live.categories[0].labels.en)
  const denied = applyRelease(rolled, rolled.publish[0], 'approve')
  assert.match(denied.audit[0].result, /基线已变化/)
  const refreshed = { ...b, id: 'C3', baseReleaseId: null }
  const republished = applyRelease({ ...rolled, publish: [refreshed, ...rolled.publish] }, refreshed, 'approve')
  assert.equal(republished.live.categories[0].labels.en, 'Slots B')
  assert.match(applyRelease({ ...s, publish: [a] }, a, 'gray').audit[0].result, /不支持灰度/)
})

test('预览必须显式开启；真实宿主或 server 即使传参也不能启用，退出清除选择', () => {
  assert.equal(catalogPreviewSelection(), null)
  assert.equal(catalogPreviewSelection({ search: '?catalogPreview=1&catalogEnv=production' }), 'production')
  assert.equal(catalogPreviewSelection({ search: '?catalogPreview=1', hasHost: true }), null)
  assert.equal(catalogPreviewSelection({ search: '?catalogPreview=1', source: 'server', saved: 'test' }), null)
  assert.equal(catalogPreviewSelection({ search: '?catalogPreview=0', saved: 'production' }), null)
  assert.equal(catalogPreviewSelection({ saved: 'other' }), null)
})
