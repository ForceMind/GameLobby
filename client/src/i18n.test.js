import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { parse } from '@babel/parser'
import {
  createTranslator,
  englishMessages,
  localizedHref,
  resolveLocale,
} from './i18n.js'
import * as data from './data.js'

const sourceFiles = [
  'App.jsx',
  'LocaleProvider.jsx',
  'navigation.js',
  'ui.jsx',
  'GameCatalog.jsx',
  'pages/LobbyPage.jsx',
  'pages/GamesPage.jsx',
  'pages/EventsPage.jsx',
  'pages/StorePage.jsx',
  'pages/TournamentsPage.jsx',
  'pages/ProfilePage.jsx',
  'h5/WalletDetails.jsx',
  'h5/GameSession.jsx',
  'h5/H5Provider.jsx',
  'h5/EntryGate.jsx',
  'components/LatestWins.jsx',
  'components/LiveRooms.jsx',
  'components/LiveRoomsTeaser.jsx',
  'components/WinnerFeed.jsx',
  'components/TomorrowChest.jsx',
  'components/ChestHelpDialog.jsx',
  'components/ChestLeaderboard.jsx',
  'components/WalletLedger.jsx',
  'components/ProfileSettings.jsx',
  'components/WinnersPanel.jsx',
  'useGameDetails.jsx',
]
const hasChinese = (value) => /[\u3400-\u9fff]/u.test(value)
const placeholders = (value) =>
  [
    ...new Set([...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1])),
  ].sort()

function walk(node, callback) {
  if (!node || typeof node !== 'object') return
  if (typeof node.type === 'string') callback(node)
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((child) => walk(child, callback))
    else if (value && typeof value === 'object') walk(value, callback)
  }
}

test('所有静态 t() 文案具备英文翻译，页面无未包装的中文正文', async () => {
  const missing = new Set()
  const raw = []
  for (const file of sourceFiles) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8')
    const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] })
    walk(ast, (node) => {
      if (node.type === 'StringLiteral' && /￥|\bCNY\b/.test(node.value))
        raw.push(`${file}: unexpected CNY pricing`)
      if (
        node.type === 'TemplateLiteral' &&
        node.quasis.some((part) =>
          /[\u3400-\u9fff，：；。！？（）]/u.test(part.value.cooked),
        )
      ) {
        raw.push(`${file}: unlocalized dynamic template`)
      }
      if (
        node.type === 'StringLiteral' &&
        hasChinese(node.value) &&
        node.value !== '热度 ' &&
        !Object.hasOwn(englishMessages, node.value)
      ) {
        missing.add(`${file}: ${node.value}`)
      }
      if (
        node.type === 'StringLiteral' &&
        hasChinese(node.value) &&
        Object.hasOwn(englishMessages, node.value)
      ) {
        const developerCopy =
          /演示|模拟|示例|原型|未接入|静态|人民币|￥|仅本页|只保存在本页|规则待确认/
        const developerEnglish =
          /\b(?:demo|sample|prototype|static|production|CNY)\b/i
        const reviewCopy =
          file === 'h5/EntryGate.jsx' ||
          (file === 'LocaleProvider.jsx' &&
            ['原型说明', 'Joyloop 高保真原型的展示范围与交互说明。'].includes(
              node.value,
            ))
        if (
          !reviewCopy &&
          (developerCopy.test(node.value) ||
            developerEnglish.test(englishMessages[node.value]))
        )
          raw.push(`${file}: development copy: ${node.value}`)
      }
      if (
        node.type === 'CallExpression' &&
        node.callee?.name === 't' &&
        node.arguments[0]?.type === 'StringLiteral'
      ) {
        const key = node.arguments[0].value
        if (hasChinese(key) && !Object.hasOwn(englishMessages, key))
          missing.add(`${file}: ${key}`)
      }
      if (node.type === 'JSXText' && hasChinese(node.value))
        raw.push(`${file}: ${node.value.trim()}`)
      if (
        node.type === 'JSXAttribute' &&
        ['title', 'placeholder', 'aria-label', 'aria-description'].includes(
          node.name?.name,
        ) &&
        node.value?.type === 'StringLiteral' &&
        hasChinese(node.value.value)
      )
        raw.push(`${file}: ${node.name.name}=${node.value.value}`)
    })
  }
  assert.deepEqual(raw, [], 'Unlocalized JSX content')
  assert.deepEqual([...missing], [], 'Missing English copy')
})

test('翻译保留所有动态占位符', () => {
  for (const [key, translated] of Object.entries(englishMessages)) {
    assert.equal(typeof translated, 'string', key)
    assert.deepEqual(placeholders(translated), placeholders(key), key)
  }
  assert.equal(
    createTranslator('en')('显示 {count} / {total} 款', { count: 2, total: 8 }),
    'Showing 2 of 8 games',
  )
})

test('说明首页独立保留，大厅无全局同意门槛、缩放按钮或资产加号', async () => {
  const app = await readFile(new URL('App.jsx', import.meta.url), 'utf8')
  const provider = await readFile(
    new URL('h5/H5Provider.jsx', import.meta.url),
    'utf8',
  )
  const index = await readFile(
    new URL('../index.html', import.meta.url),
    'utf8',
  )
  const entry = await readFile(
    new URL('h5/EntryGate.jsx', import.meta.url),
    'utf8',
  )
  assert.match(index, /data-page="welcome"/)
  assert.match(app, /if \(page === 'welcome'\) return <EntryGate \/>/)
  assert.match(entry, /useState\('full'\)/)
  assert.doesNotMatch(entry, /type="checkbox"|acknowledged|disabled=/)
  assert.doesNotMatch(entry, /sessionStorage|localStorage|location.search/)
  assert.doesNotMatch(app, /lobby-mode-button|asset-add/)
  assert.doesNotMatch(app, /FullScreenPrompt/)
  assert.doesNotMatch(provider, /sessionStorage|accepted|enterLobby/)
  for (const key of [
    '进入游戏大厅前',
    '我已阅读并同意以上说明',
    '使用当前 App 账号进入，无需重复登录。',
  ]) {
    assert.equal(Object.hasOwn(englishMessages, key), false)
  }
})

test('静态数据中的中文文案有英文对应', () => {
  const missing = new Set()
  const visit = (value) => {
    if (typeof value === 'string') {
      if (
        hasChinese(value) &&
        !/^热度 \d+$/.test(value) &&
        !Object.hasOwn(englishMessages, value)
      )
        missing.add(value)
    } else if (Array.isArray(value)) value.forEach(visit)
    else if (value && typeof value === 'object')
      Object.values(value).forEach(visit)
  }
  visit(data)
  assert.deepEqual([...missing], [], 'Missing English data labels')
})

test('语言与展示配置的跨页链接保留筛选和锚点', () => {
  assert.equal(resolveLocale('?lang=en', 'zh'), 'en')
  assert.equal(resolveLocale('?lang=unknown', 'en'), 'en')
  // 旧链接与旧存储里的 zh/zh-CN/zh-TW 仍必须可解析到规范代码
  assert.equal(resolveLocale('?lang=zh'), 'zh-Hans')
  assert.equal(resolveLocale('?lang=zh-CN'), 'zh-Hans')
  assert.equal(resolveLocale('?lang=zh-TW'), 'zh-Hant')
  assert.equal(resolveLocale('', 'zh'), 'zh-Hans')
  // 宿主语言优先于本地存储，浏览器语言兜底
  assert.equal(resolveLocale('', 'en', 'ja'), 'ja')
  assert.equal(resolveLocale('', null, null, ['pt-PT', 'fr']), 'pt-BR')
  assert.equal(resolveLocale('', null, null, ['xx']), 'zh-Hans')
  assert.equal(resolveLocale('', 'unknown'), 'zh-Hans')
  assert.equal(
    localizedHref('games.html?category=slots#game-catalog', 'en'),
    'games.html?category=slots&lang=en#game-catalog',
  )
  assert.equal(localizedHref('#wheel', 'en'), '#wheel')
  assert.equal(
    localizedHref('games.html?category=slots#game-catalog', 'en', 'half'),
    'games.html?category=slots&lang=en&mode=half#game-catalog',
  )
  assert.equal(
    localizedHref('games.html?mode=full', 'zh', 'half'),
    'games.html?mode=half&lang=zh-Hans',
  )
  assert.equal(
    localizedHref('lobby.html?mode=full', 'zh'),
    'lobby.html?mode=full&lang=zh-Hans',
  )
  assert.equal(
    localizedHref('games.html?mode=half', 'en', 'full'),
    'games.html?mode=full&lang=en',
  )
  assert.equal(
    localizedHref('https://example.com', 'en'),
    'https://example.com',
  )
})

// ---- 多语言目录守卫 --------------------------------------------------------
// 这些断言随语言数量自动伸缩：新增一种语言只需在 registry 里加一行加一个 JSON 文件，
// 不需要改动下面任何一条测试。
test('语言注册表自洽：编码唯一、BCP 47 可用、RTL 标注正确', async () => {
  const { locales, supportedLocales, normalizeLocale, isRtl, intlTag } = await import('./locales/registry.js')
  assert.ok(locales.length >= 20, `主流语言应不少于 20 种，当前 ${locales.length}`)
  assert.equal(new Set(supportedLocales).size, locales.length, '语言编码必须唯一')
  for (const entry of locales) {
    assert.match(entry.code, /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/, `编码格式异常：${entry.code}`)
    assert.ok(entry.nativeName?.trim(), `${entry.code} 缺少自称`)
    assert.ok(['ltr', 'rtl'].includes(entry.dir), `${entry.code} 的方向必须是 ltr 或 rtl`)
    // Intl 必须认得这个标签，否则数字与日期会静默回退
    assert.doesNotThrow(() => new Intl.NumberFormat(intlTag(entry.code)).format(1), `${entry.code} 的 Intl 标签不可用`)
    assert.equal(normalizeLocale(entry.code), entry.code, `${entry.code} 无法解析回自身`)
  }
  assert.ok(supportedLocales.filter(isRtl).length >= 1, '至少应有一种 RTL 语言')
})

test('每种语言的目录都不含孤儿键，且占位符与英文一致', async () => {
  const messages = (await import('./locales/index.js')).default
  const { supportedLocales, FALLBACK_LOCALE } = await import('./locales/registry.js')
  const fallback = messages[FALLBACK_LOCALE]
  assert.ok(fallback && Object.keys(fallback).length > 0, '英文目录不能为空，它是所有语言的兜底')
  const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
  for (const locale of supportedLocales) {
    const catalogue = messages[locale]
    assert.ok(catalogue, `缺少 ${locale} 的目录文件`)
    for (const [key, value] of Object.entries(catalogue)) {
      assert.ok(Object.hasOwn(fallback, key), `${locale} 存在英文目录里没有的孤儿键：${key}`)
      assert.deepEqual(placeholders(value), placeholders(fallback[key]),
        `${locale} 的 ${key} 占位符与英文不一致`)
    }
  }
})

test('未翻译的语言回退到英文而不是泄漏原始键或中文', async () => {
  const { translate, translationCoverage } = await import('./i18n.js')
  const messages = (await import('./locales/index.js')).default
  const sample = Object.keys(messages.en)[0]
  // 取一种尚无翻译的语言，验证回退链
  const coverage = translationCoverage()
  const untranslated = coverage.find((row) => row.translated === 0)
  if (untranslated) {
    assert.equal(translate(untranslated.locale, sample), messages.en[sample],
      `${untranslated.locale} 未翻译时应回退英文`)
  }
  // 完全不存在的键才允许回落到键名本身
  assert.equal(translate('en', 'no.such.key.exists'), 'no.such.key.exists')
  // 覆盖率统计必须覆盖每一种语言
  assert.equal(coverage.length, (await import('./locales/registry.js')).supportedLocales.length)
})

test('打包进前端的语言目录体积仍在同步加载的合理范围内', async () => {
  const messages = (await import('./locales/index.js')).default
  const bytes = new TextEncoder().encode(JSON.stringify(messages)).length
  // 超过阈值就该改为按语言懒加载，而不是继续全量同步打包
  assert.ok(bytes < 512 * 1024,
    `语言目录已达 ${(bytes / 1024).toFixed(0)}KB，应改为按语言懒加载`)
})
