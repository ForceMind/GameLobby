import { randomBytes } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
await writeFile(new URL('../.release-token', import.meta.url), `${randomBytes(8).toString('hex')}\n`, { mode: 0o600 })
