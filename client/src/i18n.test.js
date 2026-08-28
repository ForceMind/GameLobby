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

test('语言选择与跨页链接保留筛选和锚点', () => {
  assert.equal(resolveLocale('?lang=en', 'zh'), 'en')
  assert.equal(resolveLocale('?lang=unknown', 'en'), 'en')
  assert.equal(resolveLocale('', 'unknown'), 'zh')
  assert.equal(
    localizedHref('games.html?category=slots#game-catalog', 'en'),
    'games.html?category=slots&lang=en#game-catalog',
  )
  assert.equal(localizedHref('#wheel', 'en'), '#wheel')
  assert.equal(
    localizedHref('https://example.com', 'en'),
    'https://example.com',
  )
})
