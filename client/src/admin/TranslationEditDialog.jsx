import { useState } from 'react'
import EditDialog from './EditDialog.jsx'
import { translationLocales } from './adminSchema.js'
import { validateTranslations } from './adminRules.js'
import { needsTranslationReview, translationReviewBasis } from './translationReview.js'

const SOURCE_LOCALE = 'zh-Hans'
const FALLBACK = 'en'
const clone = (value) => JSON.parse(JSON.stringify(value ?? {}))

export default function TranslationEditDialog({ entryKey, entry, review, locale = SOURCE_LOCALE, onSave, onClose }) {
  const [openedEntry] = useState(() => clone(entry))
  const [draft, setDraft] = useState(() => clone(entry))
  const [confirmed, setConfirmed] = useState({})
  const errors = validateTranslations({ [entryKey]: draft })
  const confirmedLocales = Object.keys(confirmed).filter((code) => confirmed[code] === translationReviewBasis(draft, code))
  const dirty = confirmedLocales.length > 0 || translationLocales.some(({ code }) => (draft[code] ?? '') !== (openedEntry[code] ?? ''))
  const active = translationLocales.find((item) => item.code === locale)
  const pending = (code) => needsTranslationReview(draft, review, code) && (draft[code] ?? '') === (openedEntry[code] ?? '')
  const updateLocale = (code) => (event) => setDraft((current) => ({ ...current, [code]: event.target.value }))
  const renderRow = ({ code, nativeName, dir }) => <div className="translation-edit-row" key={code}>
    <label className={`translation-row${code === SOURCE_LOCALE || code === FALLBACK ? ' is-source' : ''}`}>
      <span className="translation-locale">{nativeName}<small>{code} · {code === SOURCE_LOCALE ? '原文' : code === FALLBACK ? '参考 / 兜底' : '译文'}</small></span>
      <textarea value={draft[code] ?? ''} dir={dir} aria-label={`${nativeName}（${code}）文案`} placeholder={code === SOURCE_LOCALE || code === FALLBACK ? '' : '未翻译 · 玩家使用英文兜底'} onChange={updateLocale(code)} />
    </label>
    {pending(code) && <label className="translation-review-check"><input type="checkbox" checked={confirmedLocales.includes(code)} onChange={(event) => setConfirmed((current) => ({ ...current, [code]: event.target.checked ? translationReviewBasis(draft, code) : null }))} />已核对当前原文{code === FALLBACK ? '' : '及英文参考'}，此译文无需修改，确认复核。</label>}
  </div>
  const currentErrors = errors.filter((error) => error.includes(` ${locale} `) || (locale === FALLBACK && error.includes('缺少英文')) || (locale === SOURCE_LOCALE && error.includes('简体中文')))
  const otherErrors = errors.filter((error) => !currentErrors.includes(error))
  const tabs = [
    { id: 'current', label: locale === SOURCE_LOCALE ? '当前原文' : `当前译文 · ${active.nativeName}`, errors: currentErrors, content: <>
      <p className="editor-hint">{locale === SOURCE_LOCALE ? '修改简体中文原文后，英文与其他已有译文会进入待复核。' : locale === FALLBACK ? '英文是所有语言的兜底，不能为空；修改后其他已有译文会进入待复核。' : '对照原文与英文参考填写当前译文。保留 {coins} 等占位符；清空表示未翻译。'}</p>
      <div className="translation-reference">{[SOURCE_LOCALE, FALLBACK].filter((code) => code !== locale).map((code) => <div key={code}><strong>{code === SOURCE_LOCALE ? '简体中文 · 原文' : 'English · 参考 / 兜底'}</strong><p>{draft[code] || '未填写'}</p></div>)}</div>
      {renderRow(active)}
    </> },
    { id: 'others', label: '其他语言', errors: otherErrors, content: <>
      <p className="editor-hint">改动基准文案后，已有译文需要复核。修改译文会更新其复核依据；内容仍适用时可勾选确认。</p>
      <div className="translation-rows">{translationLocales.filter(({ code }) => code !== locale).map(renderRow)}</div>
    </> },
    { id: 'preview', label: '变更预览', content: <>
      <p className="editor-hint">保存只更新会话草稿；模拟审核不会更新玩家端，刷新页面会重置。请导出保留工作成果。</p>
      <div className="diff-table">{translationLocales.map(({ code, nativeName }) => {
        const before = openedEntry[code] ?? ''
        const after = draft[code] ?? ''
        return <div className={`diff-row${before === after && !confirmedLocales.includes(code) ? '' : ' is-changed'}`} key={code}>
          <span className="diff-label">{nativeName}<small> {code}{confirmedLocales.includes(code) ? ' · 确认复核' : pending(code) ? ' · 待复核' : ''}</small></span><span className="diff-before">{before || '未翻译'}</span><span className="diff-arrow">→</span><span className="diff-after">{after || '未翻译'}</span>
        </div>
      })}</div>
    </> },
  ]
  const save = () => {
    if (errors.length) return
    onSave?.(clone(draft), confirmedLocales)
    onClose?.()
  }
  return <EditDialog eyebrow="玩家侧文案" title={entryKey} subtitle={`当前编辑：${active.nativeName}（${locale}） · 共 ${translationLocales.length} 种语言`} tabs={tabs} dirty={dirty} onClose={onClose} onSave={save} saveDisabled={!dirty} saveLabel="保存会话草稿" footNote="保存仅在当前会话保留；完成复核后可提交模拟审核。" />
}
