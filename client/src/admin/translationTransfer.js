import { supportedLocales } from '../locales/registry.js'
import { validateTranslations } from './adminRules.js'

export const TRANSLATION_FILE_VERSION = 'joyloop-translation-v2'
export const TRANSLATION_FILE_HEADERS = [
  '格式版本',
  '键',
  '命名空间',
  '语言代码',
  '简中原文',
  '英文参考',
  '基准快照',
  '操作',
  '译文',
]

const SOURCE_LOCALE = 'zh-Hans'
const FALLBACK_LOCALE = 'en'
const ACTION_FILL = '填写'
const ACTION_CLEAR = '清空'
const CSV_PROTECTION_PREFIX = "'\u200B"

const isKnownLocale = (locale) => supportedLocales.includes(locale)
const namespaceOf = (key) => String(key).split('.')[0] || ''
const textOf = (entry, locale) => String(entry?.[locale] ?? '')
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key)
const cloneEntries = (entries) => Object.fromEntries(
  Object.entries(entries).map(([key, byLocale]) => [key, { ...byLocale }]),
)
const needsCsvProtection = (value) => {
  const text = String(value ?? '')
  return text.startsWith(CSV_PROTECTION_PREFIX)
    || /^[\s]*[=+\-@]/.test(text)
    || /^[\t\r\n]/.test(text)
}
const protectCsvCell = (value) => {
  const text = String(value ?? '')
  return needsCsvProtection(text) ? `${CSV_PROTECTION_PREFIX}${text}` : text
}
const unprotectCsvCell = (value) => value.startsWith(CSV_PROTECTION_PREFIX)
  ? value.slice(CSV_PROTECTION_PREFIX.length)
  : value

function snapshotFor(entry, locale) {
  return JSON.stringify({
    version: 2,
    locale,
    [SOURCE_LOCALE]: textOf(entry, SOURCE_LOCALE),
    [FALLBACK_LOCALE]: textOf(entry, FALLBACK_LOCALE),
    target: textOf(entry, locale),
  })
}

function parseSnapshot(value, locale) {
  try {
    const snapshot = JSON.parse(value)
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null
    if (snapshot.version !== 2 || snapshot.locale !== locale) return null
    if (typeof snapshot[SOURCE_LOCALE] !== 'string' || typeof snapshot[FALLBACK_LOCALE] !== 'string' || typeof snapshot.target !== 'string') return null
    return snapshot
  } catch {
    return null
  }
}

// This parser deliberately accepts only RFC-style quoted fields. In particular,
// quotes inside an unquoted field and text after a closing quote are rejected,
// because accepting them makes the displayed columns ambiguous.
function parseCsv(text, maxDataRows) {
  const input = String(text ?? '').replace(/^\ufeff/, '')
  const rows = []
  const rowNumbers = []
  let row = []
  let field = ''
  let state = 'start'
  let line = 1
  let rowStartLine = 1
  let endedWithNewline = false

  const finishRow = () => {
    // The first row is the header. Stop before retaining an over-limit row so
    // a small file containing many empty records cannot create a huge preview.
    if (rows.length >= maxDataRows + 1) return false
    row.push(unprotectCsvCell(field))
    rows.push(row)
    rowNumbers.push(rowStartLine)
    row = []
    field = ''
    state = 'start'
    rowStartLine = line + 1
    return true
  }
  const finishField = () => {
    row.push(unprotectCsvCell(field))
    field = ''
    state = 'start'
  }
  const newlineAt = (index) => {
    if (input[index] === '\r') {
      if (input[index + 1] !== '\n') return 0
      return 2
    }
    return input[index] === '\n' ? 1 : 0
  }

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]
    const newlineLength = newlineAt(index)
    if (state === 'quoted') {
      if (char === '"') state = 'afterQuote'
      else {
        // Quoted cells are content, not row delimiters. Preserve CRLF and a
        // literal lone CR exactly so the source, English reference and target
        // can round-trip through the snapshot check byte-for-byte.
        if (char === '\r') {
          field += '\r'
          if (input[index + 1] === '\n') {
            index += 1
            field += '\n'
          }
          line += 1
        } else {
          field += char
          if (char === '\n') line += 1
        }
      }
      endedWithNewline = false
      continue
    }

    if (char === '\r' && newlineLength === 0) return { error: `第 ${line} 行使用了不支持的单独 CR 换行` }

    if (state === 'afterQuote') {
      if (char === '"') {
        field += '"'
        state = 'quoted'
        endedWithNewline = false
        continue
      }
      if (char === ',') {
        finishField()
        endedWithNewline = false
        continue
      }
      if (newlineLength) {
        if (!finishRow()) return { error: `CSV 数据行超过当前目录可导入上限（${maxDataRows} 条）` }
        if (newlineLength === 2) index += 1
        line += 1
        endedWithNewline = true
        continue
      }
      return { error: `第 ${line} 行的引号字段后出现了非法字符` }
    }

    if (char === ',') {
      finishField()
      endedWithNewline = false
      continue
    }
    if (newlineLength) {
      if (!finishRow()) return { error: `CSV 数据行超过当前目录可导入上限（${maxDataRows} 条）` }
      if (newlineLength === 2) index += 1
      line += 1
      endedWithNewline = true
      continue
    }
    if (state === 'start' && char === '"') {
      state = 'quoted'
      endedWithNewline = false
      continue
    }
    if (char === '"') return { error: `第 ${line} 行的未引用字段中包含引号` }
    field += char
    state = 'plain'
    endedWithNewline = false
  }

  if (state === 'quoted') return { error: `第 ${line} 行存在未闭合的引号字段` }
  if (!endedWithNewline || row.length > 0 || field) {
    if (rows.length >= maxDataRows + 1) return { error: `CSV 数据行超过当前目录可导入上限（${maxDataRows} 条）` }
    row.push(unprotectCsvCell(field))
    rows.push(row)
    rowNumbers.push(rowStartLine)
  }
  return { rows, rowNumbers }
}

function emptyPreview(locale, errors = []) {
  return {
    locale,
    rows: [],
    errors,
    changes: [],
    counts: { changed: 0, unchanged: 0, skipped: 0, errors: errors.length },
    baseline: [],
  }
}

function addError(result, row, message) {
  row.status = 'error'
  row.message = message
  result.errors.push(`第 ${row.rowNumber} 行：${message}`)
}

function baselineMatches(entry, snapshot, locale) {
  return textOf(entry, SOURCE_LOCALE) === snapshot[SOURCE_LOCALE]
    && textOf(entry, FALLBACK_LOCALE) === snapshot[FALLBACK_LOCALE]
    && textOf(entry, locale) === snapshot.target
}

function checkHeader(rows) {
  const header = rows[0] ?? []
  if (header.length === 5) return '检测到旧版五列表格，请重新导出当前格式的 CSV 文件'
  if (header.length !== TRANSLATION_FILE_HEADERS.length || header.some((cell, index) => cell !== TRANSLATION_FILE_HEADERS[index])) {
    return `CSV 表头不匹配；请使用当前格式的 ${TRANSLATION_FILE_HEADERS.length} 列模板重新导出`
  }
  return null
}

export function buildTranslationFile(entries, keys, locale) {
  if (!isKnownLocale(locale)) throw new Error(`未知的目标语言：${locale}`)
  const selectedKeys = keys ?? Object.keys(entries)
  const rows = selectedKeys.map((key) => {
    if (!hasOwn(entries, key)) throw new Error(`无法导出未知键：${key}`)
    const entry = entries[key]
    return [
      TRANSLATION_FILE_VERSION,
      key,
      namespaceOf(key),
      locale,
      textOf(entry, SOURCE_LOCALE),
      textOf(entry, FALLBACK_LOCALE),
      snapshotFor(entry, locale),
      ACTION_FILL,
      textOf(entry, locale),
    ]
  })
  return { headers: [...TRANSLATION_FILE_HEADERS], rows }
}

// Spreadsheet applications may evaluate a cell beginning with a formula
// sigil even when the cell is RFC-quoted. The marker is reversible and is
// stripped once by parseCsv, including for a literal value that starts with it.
export function serializeTranslationFile(file) {
  if (!file || !Array.isArray(file.headers) || !Array.isArray(file.rows)) {
    throw new Error('翻译导出文件无效')
  }
  if (file.headers.length !== TRANSLATION_FILE_HEADERS.length || file.headers.some((cell, index) => cell !== TRANSLATION_FILE_HEADERS[index])) {
    throw new Error('翻译导出文件表头无效')
  }
  const serializeRow = (row) => {
    if (!Array.isArray(row) || row.length !== TRANSLATION_FILE_HEADERS.length) throw new Error('翻译导出文件行数无效')
    return row.map((cell) => `"${protectCsvCell(cell).replaceAll('"', '""')}"`).join(',')
  }
  return `\ufeff${[file.headers, ...file.rows].map(serializeRow).join('\r\n')}`
}

export function previewTranslationImport(text, entries, locale) {
  if (!isKnownLocale(locale)) return emptyPreview(locale, [`未知的目标语言：${locale}`])
  const parsed = parseCsv(text, Object.keys(entries).length)
  if (parsed.error) return emptyPreview(locale, [parsed.error])
  if (parsed.rows.length === 0) return emptyPreview(locale, ['CSV 文件为空'])
  const headerError = checkHeader(parsed.rows)
  if (headerError) return emptyPreview(locale, [headerError])

  const result = emptyPreview(locale)
  const seenKeys = new Map()
  const candidates = []
  const verified = []
  parsed.rows.slice(1).forEach((cells, index) => {
    const rowNumber = parsed.rowNumbers[index + 1]
    const row = {
      rowNumber,
      key: cells[1] ?? '',
      before: hasOwn(entries, cells[1]) ? textOf(entries[cells[1]], locale) : '',
      after: cells[8] ?? '',
      status: 'skipped',
      message: '',
    }
    result.rows.push(row)
    if (cells.length !== TRANSLATION_FILE_HEADERS.length) {
      addError(result, row, `列数应为 ${TRANSLATION_FILE_HEADERS.length}，实际为 ${cells.length}`)
      return
    }

    const [version, key, namespace, fileLocale, source, english, encodedSnapshot, actionValue, translation] = cells
    row.key = key
    row.after = translation
    if (version !== TRANSLATION_FILE_VERSION) {
      addError(result, row, '格式版本不受支持，请重新导出文件')
      return
    }
    if (!isKnownLocale(fileLocale)) {
      addError(result, row, `未知的语言代码：${fileLocale || '空'}`)
      return
    }
    if (fileLocale !== locale) {
      addError(result, row, `文件语言为 ${fileLocale}，当前导入语言为 ${locale}`)
      return
    }
    if (!key || namespace !== namespaceOf(key)) {
      addError(result, row, '键或命名空间与稳定格式不一致')
      return
    }
    if (seenKeys.has(key)) {
      addError(result, row, `重复键「${key}」`)
      const first = seenKeys.get(key)
      if (first.status !== 'error') addError(result, first, `重复键「${key}」`)
      return
    }
    seenKeys.set(key, row)
    if (!hasOwn(entries, key)) {
      addError(result, row, `未知键「${key}」`)
      return
    }

    const snapshot = parseSnapshot(encodedSnapshot, fileLocale)
    if (!snapshot) {
      addError(result, row, '基准快照无效或与文件语言不一致')
      return
    }
    if (source !== snapshot[SOURCE_LOCALE] || english !== snapshot[FALLBACK_LOCALE]) {
      addError(result, row, '简中原文或英文参考与基准快照不一致')
      return
    }
    const entry = entries[key]
    if (!baselineMatches(entry, snapshot, locale)) {
      addError(result, row, '基准文案已变化，请重新导出后再导入')
      return
    }

    const action = actionValue.trim() || ACTION_FILL
    if (action !== ACTION_FILL && action !== ACTION_CLEAR) {
      addError(result, row, `动作只能是「${ACTION_FILL}」或「${ACTION_CLEAR}」`)
      return
    }
    if (action === ACTION_CLEAR && translation.trim()) {
      addError(result, row, '动作是「清空」时，译文必须留空')
      return
    }
    if (action === ACTION_CLEAR && locale === FALLBACK_LOCALE) {
      addError(result, row, '英文是兜底，不能清空')
      return
    }

    const before = textOf(entry, locale)
    const after = action === ACTION_CLEAR ? '' : translation
    row.before = before
    row.after = after
    if (action === ACTION_FILL && !translation.trim()) {
      row.status = 'skipped'
      row.message = '空白译文已跳过'
      return
    }
    if (before === after) {
      row.status = 'unchanged'
      row.message = '译文未变化'
      verified.push({ key, before, after, snapshot, rowNumber })
      return
    }
    row.status = 'changed'
    row.message = action === ACTION_CLEAR ? '将清空译文' : '将更新译文'
    candidates.push({ key, before, after, snapshot, rowNumber })
  })

  const next = cloneEntries(entries)
  candidates.forEach(({ key, after }) => {
    next[key] = { ...next[key], [locale]: after }
  })
  const validationErrors = validateTranslations(next)
  validationErrors.forEach((message) => result.errors.push(`导入后校验失败：${message}`))

  result.baseline = verified.concat(candidates).map(({ key, before, after, snapshot, rowNumber }) => ({ key, before, after, snapshot, rowNumber }))
  result.changes = candidates.map(({ key, before, after }) => ({ key, before, after }))
  result.counts = {
    changed: result.rows.filter((row) => row.status === 'changed').length,
    unchanged: result.rows.filter((row) => row.status === 'unchanged').length,
    skipped: result.rows.filter((row) => row.status === 'skipped').length,
    errors: result.rows.filter((row) => row.status === 'error').length + validationErrors.length,
  }
  return result
}

export function applyTranslationImport(entries, preview, locale) {
  const errors = []
  if (!isKnownLocale(locale)) return { entries, errors: [`未知的目标语言：${locale}`] }
  if (!preview || preview.locale !== locale) return { entries, errors: ['导入预览与当前语言不一致，请重新预览'] }
  if (Array.isArray(preview.errors) && preview.errors.length > 0) return { entries, errors: ['导入预览存在错误，不能应用'] }
  if (!Array.isArray(preview.baseline)) return { entries, errors: ['导入预览缺少基准快照，请重新预览'] }

  const next = cloneEntries(entries)
  preview.baseline.forEach(({ key, before, after, snapshot, rowNumber }) => {
    const label = rowNumber ? `第 ${rowNumber} 行` : `键「${key}」`
    if (!hasOwn(entries, key)) {
      errors.push(`${label}：键已不存在，请重新预览`)
      return
    }
    if (!snapshot || !baselineMatches(entries[key], snapshot, locale) || textOf(entries[key], locale) !== before) {
      errors.push(`${label}：预览后基准文案已变化，请重新预览`)
      return
    }
    if (locale === FALLBACK_LOCALE && !String(after ?? '').trim()) {
      errors.push(`${label}：英文是兜底，不能清空`)
      return
    }
    next[key] = { ...next[key], [locale]: after }
  })
  const validationErrors = validateTranslations(next)
  validationErrors.forEach((message) => errors.push(`导入后校验失败：${message}`))
  if (errors.length) return { entries, errors }
  return { entries: next, errors: [] }
}
