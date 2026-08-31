import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

export const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
)
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid release version')
let token
try { token = readFileSync(new URL('../.release-token', import.meta.url), 'utf8').trim() } catch { token = randomBytes(8).toString('hex') }
if (!/^[a-f0-9]{16}$/.test(token)) throw new Error('Invalid release token')
export const releaseToken = token
export const releaseAssets = `assets/release-${version}-${releaseToken}`
export const releaseEntry = `start-v${version}-${releaseToken}.html`
