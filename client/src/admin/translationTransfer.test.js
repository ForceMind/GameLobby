import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildTranslationFile,
  previewTranslationImport,
  applyTranslationImport,
  serializeTranslationFile,
  TRANSLATION_FILE_HEADERS,
} from './translationTransfer.js'

const entries = () => ({
  'store.buy': {
    'zh-Hans': '购买 {coins} 金币，立刻到账',
    en: 'Buy {coins} coins, delivered now',
    ja: '',
    de: 'Kaufe {coins} Münzen',
  },
  'home.welcome': {
    'zh-Hans': '欢迎回来',
    en: 'Welcome back',
    ja: 'おかえりなさい',
    de: 'Willkommen zurück',
  },
})

const csvEscape = (value) => `"${String(value).replaceAll('"', '""')}"`
const toCsv = ({ headers, rows }) => [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n')
const imported = (file, source, locale = 'ja') => previewTranslationImport(toCsv(file), source, locale)

test('翻译文件：v2 表头自描述，往返只更新目标语言', () => {
  const source = entries()
  const file = buildTranslationFile(source, ['store.buy', 'home.welcome'], 'ja')
  assert.deepEqual(file.headers, TRANSLATION_FILE_HEADERS)
  assert.equal(file.rows[0][3], 'ja')
  assert.equal(file.headers[7], '操作')
  assert.equal(file.rows[0][7], '填写')
  assert.equal(file.rows[0][8], '')
  assert.ok(file.rows[0][6].includes('"target"'))

  file.rows[0][8] = '{coins} コインを購入'
  const preview = imported(file, source)
  assert.deepEqual(preview.errors, [])
  assert.deepEqual(preview.changes, [{ key: 'store.buy', before: '', after: '{coins} コインを購入' }])
  const applied = applyTranslationImport(source, preview, 'ja')
  assert.deepEqual(applied.errors, [])
  assert.equal(applied.entries['store.buy'].ja, '{coins} コインを購入')
  assert.equal(applied.entries['store.buy'].de, 'Kaufe {coins} Münzen')
  assert.equal(source['store.buy'].ja, '')
})

test('CSV 解析支持 BOM、CRLF、多行、逗号和双引号', () => {
  const source = entries()
  const file = buildTranslationFile(source, ['store.buy'], 'ja')
  file.rows[0][8] = '一行目、"引用"\n二行目 {coins}'
  const preview = previewTranslationImport(`\ufeff${toCsv(file)}`, source, 'ja')
  assert.deepEqual(preview.errors, [])
  assert.equal(preview.rows[0].after, '一行目、"引用"\n二行目 {coins}')
  assert.equal(preview.rows[0].rowNumber, 2)
})

test('专用翻译 CSV 序列化无损保护公式开头单元格', () => {
  const marker = "'\u200B"
  const values = [
    '=HYPERLINK("https://example.invalid")',
    '+合法加号文案',
    '-合法减号文案',
    '@合法符号文案',
    ' =前导空格公式',
    '\t前导 Tab 文案',
    '\n前导换行文案',
    "'普通单引号文案",
    `${marker}原本就有保护标记`,
  ]
  const source = Object.fromEntries(values.map((_, index) => [`copy.${index}`, {
    'zh-Hans': `中文 ${index}`,
    en: `English ${index}`,
    ja: '',
  }]))
  const file = buildTranslationFile(source, Object.keys(source), 'ja')
  file.rows.forEach((row, index) => { row[8] = values[index] })
  const text = serializeTranslationFile(file)

  assert.ok(text.startsWith('\ufeff'))
  assert.ok(text.includes(`"${marker}=`))
  assert.ok(text.includes(`"${marker}+`))
  assert.ok(text.includes(`"${marker}-`))
  assert.ok(text.includes(`"${marker}@`))
  assert.ok(text.includes(`"${marker}\t`))
  assert.doesNotMatch(text.slice(1), /(?:^|,|\r\n)"?[\s]*[=+\-@]/)

  const preview = previewTranslationImport(text, source, 'ja')
  assert.deepEqual(preview.errors, [])
  assert.deepEqual(preview.rows.map((row) => row.after), values)
})

test('专用翻译 CSV 保留基准和译文中的 CRLF 与单独 CR', () => {
  const source = {
    'copy.multiline': {
      'zh-Hans': '简中第一行\r\n简中第二行\r简中第三段',
      en: 'English first line\r\nEnglish second line\rEnglish third part',
      ja: '日本語一行目\r\n日本語二行目\r日本語三段目',
    },
  }
  const file = buildTranslationFile(source, ['copy.multiline'], 'ja')
  const preview = previewTranslationImport(serializeTranslationFile(file), source, 'ja')

  assert.deepEqual(preview.errors, [])
  assert.equal(preview.rows[0].before, source['copy.multiline'].ja)
  assert.equal(preview.rows[0].after, source['copy.multiline'].ja)
  assert.equal(preview.baseline[0].snapshot['zh-Hans'], source['copy.multiline']['zh-Hans'])
  assert.equal(preview.baseline[0].snapshot.en, source['copy.multiline'].en)
  assert.equal(preview.baseline[0].snapshot.target, source['copy.multiline'].ja)
})

test('导入拒绝未知语言、错误表头、旧五列格式和不合法 CSV', () => {
  const source = entries()
  const file = buildTranslationFile(source, ['store.buy'], 'ja')
  file.rows[0][3] = 'xx'
  assert.match(imported(file, source).errors.join('\n'), /未知的语言代码/)
  assert.match(previewTranslationImport('键,命名空间,简体中文,英文,日语\nstore.buy,store,x,y,z', source, 'ja').errors[0], /旧版五列表格/)
  assert.match(previewTranslationImport('a,b\nc"d,e', source, 'ja').errors[0], /表头|引号/)
  assert.throws(() => buildTranslationFile(source, ['store.buy'], 'xx'), /未知的目标语言/)
})

test('低于 4MB 但超过目录键数的空行文件会在解析阶段整体拒绝', () => {
  const source = entries()
  const headerOnly = toCsv({ headers: TRANSLATION_FILE_HEADERS, rows: [] })
  const text = `${headerOnly}\n${'\n'.repeat(100000)}`
  assert.ok(text.length < 4 * 1024 * 1024)

  const preview = previewTranslationImport(text, source, 'ja')
  assert.equal(preview.rows.length, 0)
  assert.equal(preview.errors.length, 1)
  assert.match(preview.errors[0], /超过当前目录可导入上限/)
  assert.deepEqual(preview.counts, { changed: 0, unchanged: 0, skipped: 0, errors: 1 })
})

test('重复键、未知键和基准版本变化都会阻止整批导入', () => {
  const source = entries()
  const duplicate = buildTranslationFile(source, ['store.buy', 'store.buy'], 'ja')
  duplicate.rows[0][8] = '{coins} コインを購入'
  const duplicatePreview = imported(duplicate, source)
  assert.ok(duplicatePreview.errors.some((error) => error.includes('重复键')))
  assert.equal(applyTranslationImport(source, duplicatePreview, 'ja').entries, source)

  const unknown = buildTranslationFile(source, ['store.buy'], 'ja')
  unknown.rows[0][1] = 'missing.key'
  unknown.rows[0][2] = 'missing'
  assert.ok(imported(unknown, source).errors.some((error) => error.includes('未知键')))

  const stale = buildTranslationFile(source, ['store.buy'], 'ja')
  stale.rows[0][8] = '{coins} コインを購入'
  const changedSource = entries()
  changedSource['store.buy'].en = 'Purchase {coins} coins now'
  assert.ok(imported(stale, changedSource).errors.some((error) => error.includes('基准文案已变化')))
})

test('空白译文跳过，明确清空才清空，简中和英文不能清空', () => {
  const source = entries()
  const blank = buildTranslationFile(source, ['home.welcome'], 'ja')
  blank.rows[0][8] = '   '
  const blankPreview = imported(blank, source)
  assert.equal(blankPreview.counts.skipped, 1)
  assert.equal(blankPreview.changes.length, 0)

  const clear = buildTranslationFile(source, ['home.welcome'], 'ja')
  clear.rows[0][7] = '清空'
  clear.rows[0][8] = ''
  const clearPreview = imported(clear, source)
  assert.deepEqual(clearPreview.errors, [])
  assert.deepEqual(clearPreview.changes, [{ key: 'home.welcome', before: 'おかえりなさい', after: '' }])

  const english = buildTranslationFile(source, ['home.welcome'], 'en')
  english.rows[0][7] = '清空'
  english.rows[0][8] = ''
  assert.ok(imported(english, source, 'en').errors.some((error) => error.includes('英文是兜底')))

  const chinese = buildTranslationFile(source, ['home.welcome'], 'zh-Hans')
  chinese.rows[0][7] = '清空'
  chinese.rows[0][8] = ''
  assert.ok(imported(chinese, source, 'zh-Hans').errors.some((error) => error.includes('缺少简体中文原文')))
})

test('应用会再次检查预览后的修改，并阻止英文变更破坏其他语言的占位符', () => {
  const source = entries()
  const file = buildTranslationFile(source, ['store.buy'], 'ja')
  file.rows[0][8] = '{coins} コインを購入'
  const preview = imported(file, source)
  const changedAfterPreview = entries()
  changedAfterPreview['store.buy'].ja = '人工更新 {coins}'
  const blocked = applyTranslationImport(changedAfterPreview, preview, 'ja')
  assert.ok(blocked.errors.some((error) => error.includes('预览后基准文案已变化')))
  assert.equal(blocked.entries, changedAfterPreview)

  const english = buildTranslationFile(source, ['store.buy'], 'en')
  english.rows[0][8] = 'Buy coins now'
  const invalid = imported(english, source, 'en')
  assert.ok(invalid.errors.some((error) => error.includes('占位符')))
  assert.ok(invalid.counts.errors >= 1)
})

test('填写但未变化的译文也会在应用前再次核查基准', () => {
  const source = entries()
  const file = buildTranslationFile(source, ['home.welcome'], 'ja')
  const preview = imported(file, source)
  assert.equal(preview.rows[0].status, 'unchanged')
  assert.deepEqual(preview.changes, [])
  assert.equal(preview.baseline.length, 1)

  const changedAfterPreview = entries()
  changedAfterPreview['home.welcome'].en = 'Welcome again'
  const blocked = applyTranslationImport(changedAfterPreview, preview, 'ja')
  assert.ok(blocked.errors.some((error) => error.includes('预览后基准文案已变化')))
  assert.equal(blocked.entries, changedAfterPreview)
})
