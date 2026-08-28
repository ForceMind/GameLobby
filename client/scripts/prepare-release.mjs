import { copyFile } from 'node:fs/promises'
import { releaseEntry } from './release-config.mjs'

// A fresh entry URL avoids HTML previously cached on a phone or intermediary.
await copyFile(
  new URL('../dist/index.html', import.meta.url),
  new URL(`../dist/${releaseEntry}`, import.meta.url),
)
console.log(`✓ Fresh release entry: ${releaseEntry}`)
