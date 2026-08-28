import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { releaseAssets, releaseEntry } from './release-config.mjs'

const output = fileURLToPath(new URL('../dist/', import.meta.url))
const pages = {
  index: 'welcome',
  lobby: 'lobby',
  games: 'games',
  tournaments: 'tournaments',
  events: 'events',
  store: 'store',
  profile: 'profile',
}

for (const [file, page] of Object.entries(pages)) {
  const html = await readFile(resolve(output, `${file}.html`), 'utf8')
  assert.match(
    html,
    new RegExp(`data-page="${page}"`),
    `${file}: page identity is wrong`,
  )
  assert.match(
    html,
    /<title>[^<]*Joyloop<\/title>/,
    `${file}: brand title is missing`,
  )
  const assets = [...html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)].map(
    (match) => match[1],
  )
  assert.ok(
    assets.some((asset) => asset.endsWith('.js')),
    `${file}: no bundled script`,
  )
  assert.ok(
    assets.some((asset) => asset.endsWith('.css')),
    `${file}: no bundled stylesheet`,
  )
  for (const asset of assets) await access(resolve(output, asset))
  for (const asset of assets.filter((asset) => /\.(?:js|css)$/.test(asset))) {
    assert.ok(asset.startsWith(`./${releaseAssets}/`), `${file}: stale asset path ${asset}`)
    const content = await readFile(resolve(output, asset), 'utf8')
    assert.doesNotMatch(content, /^\s*<!doctype html/i, `${file}: HTML disguised as an asset`)
  }
  assert.doesNotMatch(
    html,
    /(?:src|href)="https?:\/\//,
    `${file}: external runtime asset`,
  )
}

const headers = await readFile(resolve(output, '_headers'), 'utf8')
assert.match(headers, /X-Content-Type-Options: nosniff/)
assert.match(headers, /Cache-Control: no-store/)
assert.doesNotMatch(headers, /immutable|max-age=31536000/)
const notFound = await readFile(resolve(output, '404.html'), 'utf8')
assert.match(notFound, /Page not found/)
assert.doesNotMatch(notFound, /<script/i, '404 recovery must not depend on JS')
assert.equal(
  await readFile(resolve(output, releaseEntry), 'utf8'),
  await readFile(resolve(output, 'index.html'), 'utf8'),
  'Fresh release entry must match the normal entry',
)
console.log(
  '✓ Seven pages, fresh release entry, versioned assets, 404 and no-store headers verified.',
)
