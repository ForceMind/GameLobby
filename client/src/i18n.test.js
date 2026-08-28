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
  'h5/FullScreenPrompt.jsx',
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
  assert.equal(resolveLocale('', 'unknown'), 'zh')
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
    'games.html?mode=full&lang=zh',
  )
  assert.equal(
    localizedHref('https://example.com', 'en'),
    'https://example.com',
  )
})
