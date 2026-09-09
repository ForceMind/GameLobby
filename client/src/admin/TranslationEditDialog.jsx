import { useState } from 'react'
import EditDialog from './EditDialog.jsx'
import { translationLocales } from './adminSchema.js'
import { validateTranslations } from './adminRules.js'

const SOURCE_LOCALE = 'zh-Hans'
const FALLBACK = 'en'
const clone = (value) => JSON.parse(JSON.stringify(value ?? {}))

function placeholdersOf(text) {
  return [...String(text ?? '').matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(',')
}

function translationRow({ code, nativeName, dir, value, source, onChange, sourceRow = false }) {
  const mismatch = !sourceRow && value.trim() && placeholdersOf(value) !== placeholdersOf(source)
  return <label className={`translation-row${sourceRow ? ' is-source' : ''}${!value.trim() ? ' is-empty' : ''}${mismatch ? ' is-bad' : ''}`} key={code}>
    <span className="translation-locale">{nativeName}<small>{code}</small></span>
    <textarea value={value} dir={dir} aria-label={`${nativeName}（${code}）文案`} placeholder={sourceRow ? '' : '未翻译 · 玩家看到英文'} onChange={onChange} />
  </label>
}

export default function TranslationEditDialog({ entryKey, entry, onSave, onClose }) {
  const [openedEntry] = useState(() => clone(entry))
  const [draft, setDraft] = useState(() => clone(entry))
  const errors = validateTranslations({ [entryKey]: draft })
  const dirty = translationLocales.some(({ code }) => (draft[code] ?? '') !== (openedEntry[code] ?? ''))
  const source = draft[FALLBACK] ?? ''
  const baseErrors = errors.filter((error) => error.includes('缺少英文') || error.includes(` ${SOURCE_LOCALE} `))
  const otherErrors = errors.filter((error) => !baseErrors.includes(error))
  const updateLocale = (code) => (event) => setDraft((current) => ({ ...current, [code]: event.target.value }))
  const baselineRows = [SOURCE_LOCALE, FALLBACK].map((code) => {
    const meta = translationLocales.find((locale) => locale.code === code)
    return translationRow({ ...meta, code, value: draft[code] ?? '', source, sourceRow: true, onChange: updateLocale(code) })
  })
  const otherRows = translationLocales
    .filter(({ code }) => code !== SOURCE_LOCALE && code !== FALLBACK)
    .map(({ code, nativeName, dir }) => translationRow({ code, nativeName, dir, value: draft[code] ?? '', source, onChange: updateLocale(code) }))
  const tabs = [
    {
      id: 'baseline', label: '基准文案', errors: baseErrors, content: <>
        <p className="editor-hint">中文与英文是基准文案。英文不能为空；其他语言缺失时，玩家会看到英文。</p>
        <div className="translation-rows">{baselineRows}</div>
      </>,
    },
    {
      id: 'other-locales', label: '其他语言', errors: otherErrors, content: <>
        <p className="editor-hint">保留全部 {otherRows.length} 种其他语言。留空表示尚未翻译；非空翻译的占位符必须与英文一致{source.includes('{') ? `（本条含 ${placeholdersOf(source).split(',').map((placeholder) => `{${placeholder}}`).join(' ')}）` : '。'}</p>
        <div className="translation-rows">{otherRows}</div>
      </>,
    },
    {
      id: 'preview', label: '变更预览', content: <>
        <p className="editor-hint">保存只更新该条玩家侧文案草稿；页面会另行提交审核，审核通过后才对玩家生效。</p>
        <div className="diff-table">{translationLocales.map(({ code, nativeName }) => {
          const before = openedEntry[code] ?? ''
          const after = draft[code] ?? ''
          return <div className={`diff-row${before === after ? '' : ' is-changed'}`} key={code}>
            <span className="diff-label">{nativeName}<small> {code}</small></span><span className="diff-before">{before || '未翻译'}</span><span className="diff-arrow">→</span><span className="diff-after">{after || '未翻译'}</span>
          </div>
        })}</div>
      </>,
    },
  ]

  const save = () => {
    onSave?.(clone(draft))
    onClose?.()
  }

  return <EditDialog
    eyebrow="玩家侧文案"
    title={entryKey}
    subtitle={`共 ${translationLocales.length} 种语言 · 英文为兜底，缺翻译时玩家看到英文`}
    tabs={tabs}
    dirty={dirty}
    onClose={onClose}
    onSave={save}
    saveLabel="保存草稿"
    footNote="保存仅更新文案草稿；页面会另行提交审核。"
  />
}
