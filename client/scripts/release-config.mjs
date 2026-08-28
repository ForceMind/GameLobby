import { readFileSync } from 'node:fs'

export const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
)
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid release version')
export const releaseAssets = `assets/release-${version}`
export const releaseEntry = `start-v${version}.html`
