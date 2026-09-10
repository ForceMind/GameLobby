import { useMemo, useState } from 'react'
import EditDialog from './EditDialog.jsx'
import { translationLocales } from './adminSchema.js'
import './CategoryManager.css'

const NEW_CATEGORY_KEY = '__new-category__'
const REQUIRED_LOCALES = ['zh-Hans', 'en']

function categoryWeight(category) {
  const value = Number(category?.sortWeight)
  return Number.isInteger(value) && value > 0 ? value : Number.MAX_SAFE_INTEGER
}

function nextSortWeight(categories) {
  const weights = (Array.isArray(categories) ? categories : [])
    .map((category) => Number(category?.sortWeight))
    .filter((value) => Number.isInteger(value) && value > 0)
  return Math.max(0, ...weights) + 1
}

function sortCategories(categories) {
  return (Array.isArray(categories) ? categories : [])
    .map((category, index) => ({ category, index }))
    .sort((left, right) => categoryWeight(left.category) - categoryWeight(right.category) || left.index - right.index)
    .map(({ category }) => category)
}

function cloneCategory(category) {
  return {
    ...category,
    labels: { ...(category?.labels || {}) },
  }
}

function toDraft(category) {
  return {
    id: category?.id || '',
    labelKey: category?.labelKey || '',
    labels: { 'zh-Hans': '', en: '', ...(category?.labels || {}) },
    enabled: Boolean(category?.enabled),
    sortWeight: category?.sortWeight === undefined || category?.sortWeight === null ? '' : String(category.sortWeight),
  }
}

function labelFor(category, locale) {
  return category?.labels?.[locale] || (locale === 'zh-Hans' ? '未填写中文名' : locale === 'en' ? 'English name missing' : '—')
}

function gameName(game) {
  return game?.name || game?.gameId || game?.id || '未命名游戏'
}

function gamesUsingCategory(games, categoryId) {
  if (!categoryId) return []
  return [...new Map((Array.isArray(games) ? games : []).filter((game) => Array.isArray(game?.tags) && game.tags.includes(categoryId)).map((game) => [game.gameId || game.id, game])).values()]
}

function categoryListSignature(categories) {
  return JSON.stringify((Array.isArray(categories) ? categories : []).map((category) => ({
    ...category,
    labels: Object.fromEntries(Object.entries(category?.labels || {}).sort(([left], [right]) => left.localeCompare(right))),
  })))
}

function savedCategory(draft, source) {
  const next = {
    ...(source || {}),
    id: draft.id.trim(),
    labels: {
      ...draft.labels,
      'zh-Hans': draft.labels['zh-Hans'].trim(),
      en: draft.labels.en.trim(),
    },
    enabled: Boolean(draft.enabled),
    sortWeight: Number(draft.sortWeight),
  }
  const labelKey = draft.labelKey.trim()
  if (labelKey) next.labelKey = labelKey
  else delete next.labelKey
  return next
}

function localeName(locale) {
  return translationLocales.find((item) => item.code === locale)?.nativeName || locale
}

function validateDraft({ draft, categories, original, references, creating }) {
  const errors = { basic: [], languages: [], ordering: [] }
  const id = draft.id.trim()
  if (!id) errors.basic.push('请填写分类 ID。')
  else if (!/^[a-z][a-z0-9-]*$/.test(id)) errors.basic.push('分类 ID 须以小写字母开头，只能使用小写字母、数字和短横线。')
  else if (['all', 'popular'].includes(id)) errors.basic.push('分类 ID 不能使用 all 或 popular。')
  else if (creating && categories.some((category) => category.id === id)) errors.basic.push('分类 ID 已存在。')

  if (!draft.labels['zh-Hans']?.trim()) errors.languages.push('请填写简体中文名称。')
  if (!draft.labels.en?.trim()) errors.languages.push('请填写英文名称。')

  if (!/^[1-9]\d*$/.test(draft.sortWeight.trim())) errors.ordering.push('排序值须为正整数。')
  if (!creating && original?.enabled && !draft.enabled && references.length > 0) {
    errors.basic.push('关联游戏仍在使用此分类，不能停用。')
  }
  return errors
}

function CategoryEditDialog({ categories, games, category, onSave, onClose }) {
  const creating = !category
  const initialDraft = useMemo(() => toDraft(category || {
    id: '',
    labels: { 'zh-Hans': '', en: '' },
    enabled: true,
    sortWeight: nextSortWeight(categories),
  }), [categories, category])
  const initialOrder = useMemo(() => [
    ...sortCategories(categories).map((item) => item.id),
    ...(creating ? [NEW_CATEGORY_KEY] : []),
  ], [categories, creating])
  const [draft, setDraft] = useState(initialDraft)
  const [sortOrder, setSortOrder] = useState(initialOrder)
  const [hasReordered, setHasReordered] = useState(false)
  const [localeToAdd, setLocaleToAdd] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const original = category || null
  const referenceGames = gamesUsingCategory(games, original?.id)
  const validation = validateDraft({ draft, categories, original, references: referenceGames, creating })
  const validationMessages = Object.values(validation).flat()
  const currentOrderKey = creating ? NEW_CATEGORY_KEY : original.id
  const orderPosition = sortOrder.indexOf(currentOrderKey)
  const previewWeight = hasReordered && orderPosition >= 0 ? orderPosition + 1 : draft.sortWeight || '—'

  const previewCategories = useMemo(() => sortOrder.map((id) => {
    if (id === NEW_CATEGORY_KEY) return { ...draft, id: draft.id.trim() || '未设置分类 ID', sortWeight: previewWeight }
    if (id === original?.id) return { ...draft, id: original.id, sortWeight: previewWeight }
    return categories.find((item) => item.id === id)
  }).filter(Boolean), [categories, draft, original?.id, previewWeight, sortOrder])

  const nextCategories = useMemo(() => {
    const nextCategory = savedCategory(draft, original)
    let next = creating
      ? [...categories.map(cloneCategory), nextCategory]
      : categories.map((item) => item.id === original.id ? nextCategory : cloneCategory(item))

    if (hasReordered) {
      const orderedIds = sortOrder.map((id) => id === NEW_CATEGORY_KEY ? nextCategory.id : id)
      const weightById = new Map(orderedIds.map((id, index) => [id, index + 1]))
      next = next.map((item) => weightById.has(item.id) ? { ...item, sortWeight: weightById.get(item.id) } : item)
    }
    return next
  }, [categories, creating, draft, hasReordered, original, sortOrder])

  const dirty = categoryListSignature(nextCategories) !== categoryListSignature(categories)

  const updateDraft = (update) => {
    setSaveError('')
    setDraft((current) => typeof update === 'function' ? update(current) : { ...current, ...update })
  }

  const updateLabel = (locale, value) => updateDraft((current) => ({
    ...current,
    labels: { ...current.labels, [locale]: value },
  }))

  const changeSortWeight = (value) => {
    updateDraft({ sortWeight: value })
    setHasReordered(false)
    setSortOrder(initialOrder)
  }

  const move = (direction) => {
    if (orderPosition < 0) return
    const targetPosition = orderPosition + direction
    if (targetPosition < 0 || targetPosition >= sortOrder.length) return
    setSaveError('')
    setSortOrder((current) => {
      const next = [...current]
      ;[next[orderPosition], next[targetPosition]] = [next[targetPosition], next[orderPosition]]
      return next
    })
    setHasReordered(true)
    updateDraft({ sortWeight: String(targetPosition + 1) })
  }

  const addLocale = () => {
    if (!localeToAdd || Object.hasOwn(draft.labels, localeToAdd)) return
    updateLabel(localeToAdd, '')
    setLocaleToAdd('')
  }

  const save = async () => {
    if (saving || validationMessages.length > 0) return
    setSaving(true)
    setSaveError('')
    try {
      const result = await Promise.resolve(onSave?.(nextCategories))
      if (result?.error) {
        setSaveError(result.error)
        return
      }
      onClose()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '保存分类时出现问题，请稍后重试。')
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async () => {
    if (!original || referenceGames.length > 0 || saving) return
    setSaving(true)
    setSaveError('')
    try {
      const result = await Promise.resolve(onSave?.(categories.filter((item) => item.id !== original.id).map(cloneCategory)))
      if (result?.error) {
        setSaveError(result.error)
        return
      }
      onClose()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '删除分类时出现问题，请稍后重试。')
    } finally {
      setSaving(false)
    }
  }

  const optionalLocales = Object.keys(draft.labels).filter((locale) => !REQUIRED_LOCALES.includes(locale))
  const availableLocales = translationLocales.filter((locale) => !Object.hasOwn(draft.labels, locale.code))
  const referenceNames = referenceGames.map(gameName)
  const isEnabledLocked = referenceGames.length > 0 && draft.enabled

  const tabs = [
    {
      id: 'basic',
      label: '基础信息',
      errors: validation.basic,
      content: <div className="category-dialog-section">
        <div className="category-field-grid">
          <label className="category-field">
            <span>分类 ID</span>
            <input value={draft.id} onChange={(event) => updateDraft({ id: event.target.value })} readOnly={!creating} aria-readonly={!creating} />
            <small>{creating ? '保存前确认 ID；已有分类的 ID 不可修改。' : '已有分类 ID 不可修改。'}</small>
          </label>
        </div>
        <label className="category-enable-toggle">
          <input type="checkbox" checked={draft.enabled} disabled={isEnabledLocked} onChange={(event) => updateDraft({ enabled: event.target.checked })} />
          <span><strong>{draft.enabled ? '已启用' : '已停用'}</strong><small>{isEnabledLocked ? '有关联游戏时不能停用此分类。' : '控制该分类是否可供游戏关联。'}</small></span>
        </label>
        {referenceGames.length > 0 && <section className="category-reference-notice" aria-label="关联游戏提示">
          <strong>当前有 {referenceGames.length} 款游戏关联此分类</strong>
          <p>{referenceNames.join('、')}</p>
          <small>请先在游戏管理中重新关联这些游戏，再停用或删除分类。</small>
        </section>}
        {!creating && referenceGames.length === 0 && <section className="category-delete-panel">
          {!confirmDelete
            ? <button className="admin-btn subtle category-delete-action" type="button" onClick={() => setConfirmDelete(true)}>删除分类</button>
            : <div className="category-delete-confirm" role="alert">
              <strong>确认删除“{labelFor(original, 'zh-Hans')}”吗？</strong>
              <span>删除后分类将不再出现在目录中。</span>
              <div><button className="admin-btn subtle" type="button" disabled={saving} onClick={() => setConfirmDelete(false)}>返回编辑</button><button className="admin-btn category-delete-action" type="button" disabled={saving} onClick={deleteCategory}>确认删除</button></div>
            </div>}
        </section>}
      </div>,
    },
    {
      id: 'languages',
      label: '多语言',
      errors: validation.languages,
      content: <div className="category-dialog-section">
        <p className="category-section-note">简体中文和英文为必填名称；已填写的其他语言会随分类一并保存。</p>
        <div className="category-language-list">
          {REQUIRED_LOCALES.map((locale) => <label className="category-field" key={locale}>
            <span>{localeName(locale)} <b>必填</b></span>
            <input value={draft.labels[locale] || ''} onChange={(event) => updateLabel(locale, event.target.value)} placeholder={locale === 'zh-Hans' ? '填写中文名称' : 'Enter English name'} />
          </label>)}
          {optionalLocales.map((locale) => <label className="category-field" key={locale}>
            <span>{localeName(locale)} <em>{locale}</em></span>
            <input value={draft.labels[locale] || ''} onChange={(event) => updateLabel(locale, event.target.value)} placeholder={`填写 ${localeName(locale)} 名称`} />
          </label>)}
        </div>
        <div className="category-add-locale">
          <label className="category-field"><span>添加语言</span><select value={localeToAdd} onChange={(event) => setLocaleToAdd(event.target.value)} disabled={!availableLocales.length}><option value="">选择语言</option>{availableLocales.map((locale) => <option key={locale.code} value={locale.code}>{locale.nativeName}（{locale.code}）</option>)}</select></label>
          <button className="admin-btn subtle" type="button" onClick={addLocale} disabled={!localeToAdd}>添加语言</button>
        </div>
      </div>,
    },
    {
      id: 'order',
      label: '排序及预览',
      errors: validation.ordering,
      content: <div className="category-dialog-section">
        <div className="category-order-controls">
          <label className="category-field"><span>排序值</span><input type="number" min="1" step="1" inputMode="numeric" value={draft.sortWeight} onChange={(event) => changeSortWeight(event.target.value)} /><small>使用上移或下移后，保存时会按预览顺序更新分类排序值。</small></label>
          <div className="category-move-actions"><span>当前预览位置：{orderPosition >= 0 ? orderPosition + 1 : '—'}</span><div><button className="admin-btn subtle" type="button" disabled={orderPosition <= 0} onClick={() => move(-1)}>上移</button><button className="admin-btn subtle" type="button" disabled={orderPosition < 0 || orderPosition >= sortOrder.length - 1} onClick={() => move(1)}>下移</button></div></div>
        </div>
        <section className="category-sort-preview" aria-label="分类排序预览">
          <div><strong>保存后目录顺序</strong><small>当前编辑仅影响此弹窗中的预览。</small></div>
          <ol>{previewCategories.map((item, index) => <li key={`${item.id}-${index}`} className={item.id === (creating ? draft.id.trim() || '未设置分类 ID' : original.id) ? 'is-current' : ''}><b>{index + 1}</b><span><strong>{labelFor(item, 'zh-Hans')}</strong><small>{labelFor(item, 'en')} · {item.id}</small></span><em>排序 {hasReordered ? index + 1 : item.sortWeight}</em></li>)}</ol>
        </section>
      </div>,
    },
  ]

  return <EditDialog
    eyebrow="游戏目录"
    title={creating ? '新增游戏分类' : `编辑分类 · ${labelFor(original, 'zh-Hans')}`}
    subtitle={creating ? '填写分类信息后保存。' : `分类 ID：${original.id}`}
    tabs={tabs}
    dirty={dirty}
    onClose={onClose}
    onSave={save}
    saveDisabled={saving || validationMessages.length > 0}
    saveLabel={saving ? '正在保存…' : '保存草稿并提交审核'}
    footNote="保存后生成审核任务，审核通过才生效；取消不修改分类。"
    errors={saveError ? [saveError] : []}
  />
}

export default function CategoryManager({ categories = [], liveCategories = [], games = [], onSave }) {
  const [editing, setEditing] = useState(null)
  const sortedCategories = useMemo(() => sortCategories(categories), [categories])
  const liveCategoryCount = Array.isArray(liveCategories) ? liveCategories.length : 0

  return <section className="admin-card category-manager">
    <div className="category-manager-heading">
      <div><h2>游戏分类管理</h2><p>下表展示分类草稿；保存后需审核，审核通过才进入游戏分类选项和玩家目录预览。</p></div>
      <div className="category-manager-actions"><span>分类 {sortedCategories.length} 个 · 生效分类 {liveCategoryCount} 个</span><button className="admin-btn primary" type="button" onClick={() => setEditing({ mode: 'create' })}>新增分类</button></div>
    </div>
    <div className="table-wrap category-table-wrap">
      <table className="editor-action-table category-table">
        <thead><tr><th>ID</th><th>中文名</th><th>英文名</th><th>启停</th><th>排序</th><th>关联游戏数</th><th className="fixed-actions">操作</th></tr></thead>
        <tbody>
          {sortedCategories.length === 0 && <tr><td className="category-empty" colSpan="7">暂无分类，可新增分类后再关联游戏。</td></tr>}
          {sortedCategories.map((category) => {
            const references = gamesUsingCategory(games, category.id)
            return <tr key={category.id}>
              <td><code>{category.id}</code></td>
              <td>{labelFor(category, 'zh-Hans')}</td>
              <td>{labelFor(category, 'en')}</td>
              <td><span className={`category-status ${category.enabled ? 'is-enabled' : 'is-disabled'}`}>{category.enabled ? '已启用' : '已停用'}</span></td>
              <td>{category.sortWeight}</td>
              <td><strong>{references.length} 款</strong>{references.length > 0 && <small className="category-game-names">{references.map(gameName).join('、')}</small>}</td>
              <td className="fixed-actions"><button className="admin-btn primary" type="button" onClick={() => setEditing({ mode: 'edit', id: category.id })}>编辑</button></td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
    {editing && <CategoryEditDialog
      key={editing.mode === 'create' ? 'create' : editing.id}
      categories={categories}
      games={games}
      category={editing.mode === 'edit' ? categories.find((category) => category.id === editing.id) : null}
      onSave={onSave}
      onClose={() => setEditing(null)}
    />}
  </section>
}
