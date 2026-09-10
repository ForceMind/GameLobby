import { useMemo, useState } from 'react'
import EditDialog from './EditDialog.jsx'
import { translationLocales } from './adminSchema.js'
import { needsTranslationReview, translationReviewBasis, updateTranslationReviews } from './translationReview.js'
import './GameContentDialog.css'

const SOURCE_LOCALE = 'zh-Hans'
const FALLBACK_LOCALE = 'en'
const clone = (value) => JSON.parse(JSON.stringify(value ?? {}))
const text = (value) => String(value ?? '')
const hasText = (value) => text(value).trim() !== ''

function entriesEqual(left, right) {
  const leftKeys = Object.keys(left || {}).sort()
  const rightKeys = Object.keys(right || {}).sort()
  if (leftKeys.length !== rightKeys.length || leftKeys.some((key, index) => key !== rightKeys[index])) return false
  return leftKeys.every((key) => {
    const leftEntry = left[key] || {}
    const rightEntry = right[key] || {}
    const leftLocales = Object.keys(leftEntry).sort()
    const rightLocales = Object.keys(rightEntry).sort()
    return leftLocales.length === rightLocales.length
      && leftLocales.every((locale, index) => locale === rightLocales[index] && text(leftEntry[locale]) === text(rightEntry[locale]))
  })
}

function hasAnyContent(entry) {
  return Object.values(entry || {}).some(hasText)
}

function contentErrors(sections, entries) {
  return sections.flatMap((section) => {
    const entry = entries[section.key] || {}
    const started = section.required || hasAnyContent(entry)
    if (!started) return []
    const errors = []
    if (!hasText(entry[SOURCE_LOCALE])) errors.push(`${section.label}必须填写简体中文原文`)
    if (!hasText(entry[FALLBACK_LOCALE])) errors.push(`${section.label}必须填写英文，英文是玩家端兜底`)
    return errors
  })
}

function normalizeEntries(entries, sections) {
  const next = clone(entries)
  sections.filter((section) => !section.required).forEach((section) => {
    if (!hasAnyContent(next[section.key])) delete next[section.key]
  })
  return next
}

export default function GameContentDialog({ game, entries, reviews, onSave, onClose }) {
  const gameId = game?.gameId || game?.id
  const sections = useMemo(() => [
    { id: 'description', label: '简介', required: true, key: game?.descriptionKey || `games.desc.${gameId}` },
    { id: 'instructions', label: '玩法', required: false, key: `games.instructions.${gameId}` },
    { id: 'rules', label: '规则', required: false, key: `games.rules.${gameId}` },
  ], [game?.descriptionKey, gameId])
  const [openedEntries] = useState(() => clone(entries))
  const [draftEntries, setDraftEntries] = useState(() => clone(entries))
  const [locale, setLocale] = useState(SOURCE_LOCALE)
  const [confirmed, setConfirmed] = useState({})
  const [saveError, setSaveError] = useState('')

  const activeLocale = translationLocales.find((item) => item.code === locale) || translationLocales[0]
  const normalizedDraft = useMemo(() => normalizeEntries(draftEntries, sections), [draftEntries, sections])
  const normalizedOpened = useMemo(() => normalizeEntries(openedEntries, sections), [openedEntries, sections])
  const errors = useMemo(() => contentErrors(sections, normalizedDraft), [normalizedDraft, sections])
  const confirmedByKey = useMemo(() => Object.entries(confirmed).reduce((next, [key, byLocale]) => {
    const locales = Object.entries(byLocale || {})
      .filter(([code, basis]) => basis === translationReviewBasis(normalizedDraft[key] || {}, code))
      .map(([code]) => code)
    if (locales.length) next[key] = locales
    return next
  }, {}), [confirmed, normalizedDraft])
  const hasConfirmation = Object.values(confirmedByKey).some((locales) => locales.length > 0)
  const dirty = !entriesEqual(normalizedOpened, normalizedDraft) || hasConfirmation

  const updateText = (key, code) => (event) => {
    const value = event.target.value
    setSaveError('')
    setDraftEntries((current) => ({
      ...current,
      [key]: { ...(current[key] || {}), [code]: value },
    }))
  }

  const referenceLocales = [SOURCE_LOCALE, FALLBACK_LOCALE].filter((code) => code !== locale)
  const isPending = (key, entry) => needsTranslationReview(entry, reviews?.[key], locale)
    && text(entry[locale]) === text(openedEntries[key]?.[locale])
  const isConfirmed = (key, entry) => confirmed[key]?.[locale] === translationReviewBasis(entry, locale)

  const toggleConfirmation = (key, entry, checked) => {
    setSaveError('')
    setConfirmed((current) => ({
      ...current,
      [key]: { ...(current[key] || {}), [locale]: checked ? translationReviewBasis(entry, locale) : null },
    }))
  }

  const languagePicker = <label className="game-content-language">
    <span>当前编辑语言</span>
    <select value={locale} onChange={(event) => setLocale(event.target.value)} aria-label="当前编辑语言">
      {translationLocales.map(({ code, nativeName }) => <option key={code} value={code}>{nativeName}（{code}）</option>)}
    </select>
  </label>

  const sectionContent = (section) => {
    const entry = draftEntries[section.key] || {}
    const pending = isPending(section.key, entry)
    const confirmedCurrent = isConfirmed(section.key, entry)
    const showReviewCheck = locale !== SOURCE_LOCALE && pending
    return <div className="game-content-editor">
      {saveError && <p className="game-content-save-error" role="alert">保存失败：{saveError}</p>}
      <div className="game-content-toolbar">
        {languagePicker}
        <span className={`game-content-status${pending ? ' is-pending' : ''}`}>
          {pending ? '此语言内容待复核' : locale === SOURCE_LOCALE ? '简体中文为原文' : locale === FALLBACK_LOCALE ? '英文为玩家端兜底' : '当前语言内容'}
        </span>
      </div>
      <p className="editor-hint">
        {section.required
          ? '简介必须同时填写简体中文和英文。'
          : '整段可留空；只要任一语言有内容，就必须补齐简体中文和英文。'}
        {locale === SOURCE_LOCALE
          ? ' 修改原文后，已有英文和其他译文会保留并进入待复核。'
          : locale === FALLBACK_LOCALE
            ? ' 修改英文后，已有其他译文会保留并进入待复核。'
            : ' 只编辑当前语言；其他语言不会被覆盖。'}
      </p>
      <div className="translation-reference game-content-reference">
        {referenceLocales.map((code) => <div key={code}>
          <strong>{code === SOURCE_LOCALE ? '简体中文 · 原文' : 'English · 玩家端兜底'}</strong>
          <p>{entry[code] || '未填写'}</p>
        </div>)}
      </div>
      <label className="game-content-field">
        <span>{activeLocale.nativeName}（{locale}）</span>
        <textarea
          value={entry[locale] ?? ''}
          dir={activeLocale.dir}
          aria-label={`${section.label}${activeLocale.nativeName}文案`}
          placeholder={section.required || locale === SOURCE_LOCALE || locale === FALLBACK_LOCALE ? '请输入文案' : '未翻译 · 玩家端将显示英文'}
          onChange={updateText(section.key, locale)}
        />
      </label>
      {showReviewCheck && <label className="translation-review-check game-content-review-check">
        <input type="checkbox" checked={confirmedCurrent} onChange={(event) => toggleConfirmation(section.key, entry, event.target.checked)} />
        已核对当前原文和英文参考；此语言内容无需修改，确认复核。
      </label>}
    </div>
  }

  const preview = <div className="game-content-preview">
    {saveError && <p className="game-content-save-error" role="alert">保存失败：{saveError}</p>}
    <div className="game-content-toolbar">
      {languagePicker}
      <span className="game-content-status">玩家侧预览</span>
    </div>
    <p className="editor-hint">以下按当前语言显示；当前语言未填写时回退英文。此处仅显示纯文本预览，不渲染 HTML。</p>
    <div className="game-content-preview-card">
      <h3>{game?.name || gameId || '游戏'}</h3>
      {sections.map((section) => {
        const entry = normalizedDraft[section.key] || {}
        const value = entry[locale] || entry[FALLBACK_LOCALE] || ''
        if (!value && !section.required) return null
        return <section key={section.id} className="game-content-preview-section">
          <h4>{section.label}</h4>
          <p>{value || '未填写'}</p>
        </section>
      })}
    </div>
  </div>

  const tabs = [
    ...sections.map((section) => ({
      id: section.id,
      label: section.label,
      errors: contentErrors([section], normalizedDraft),
      content: sectionContent(section),
    })),
    { id: 'preview', label: '预览', content: preview },
  ]

  const save = async () => {
    if (errors.length || !dirty) return
    setSaveError('')
    try {
      const nextEntries = normalizeEntries(draftEntries, sections)
      const nextReviews = updateTranslationReviews(reviews, openedEntries, nextEntries, confirmedByKey)
      const result = await onSave?.(nextEntries, nextReviews)
      if (result?.error) {
        setSaveError(String(result.error))
        return
      }
      onClose?.()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '保存文案草稿失败，请重试。')
    }
  }

  return <EditDialog
    eyebrow="游戏玩家侧内容"
    title={`${game?.name || gameId || '游戏'} · 多语言文案`}
    subtitle="按语言维护游戏简介、玩法和规则；不会直接发布到玩家端。"
    tabs={tabs}
    dirty={dirty}
    onClose={onClose}
    onSave={save}
    saveDisabled={!dirty}
    saveLabel="保存文案草稿"
    footNote="保存文案草稿，完成复核后到多语言内容提交审核"
  />
}
