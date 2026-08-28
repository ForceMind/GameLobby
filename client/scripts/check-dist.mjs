import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const output = fileURLToPath(new URL('../dist/', import.meta.url))
const pages = {
  index: 'lobby',
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
  assert.doesNotMatch(
    html,
    /(?:src|href)="https?:\/\//,
    `${file}: external runtime asset`,
  )
}

const headers = await readFile(resolve(output, '_headers'), 'utf8')
assert.match(headers, /X-Content-Type-Options: nosniff/)
console.log(
  '✓ Seven static HTML entries, relative JS/CSS assets, and Pages headers verified.',
)
