#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { spawn } from 'node:child_process'
import { releaseEntry } from './release-config.mjs'

const execFile = promisify((command, args, options, callback) => {
  const child = spawn(command, args, {
    ...options,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', (chunk) => {
    stdout += chunk
  })
  child.stderr.on('data', (chunk) => {
    stderr += chunk
  })
  child.on('error', (error) => callback(error))
  child.on('close', (code) => {
    if (code === 0) callback(null, { stdout, stderr })
    else
      callback(new Error(`${command} exited with ${code}: ${stderr || stdout}`))
  })
})

const clientDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoDir = resolve(clientDir, '..')
const distDir = resolve(clientDir, 'dist')
const artifactDir = resolve(repoDir, 'artifacts')
const entryFiles = [
  'index.html',
  'docs.html',
  'lobby.html',
  'games.html',
  'events.html',
  'store.html',
  'profile.html',
  'admin.html',
  releaseEntry,
]
const omittedBuildFiles = new Set(['vite.svg'])

const pathIsInside = (root, candidate) => {
  const rootPath = resolve(root)
  const candidatePath = resolve(candidate)
  return (
    candidatePath === rootPath || candidatePath.startsWith(`${rootPath}${sep}`)
  )
}

async function walk(root, current = root) {
  const entries = await fs.readdir(current, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = join(current, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(root, full)))
    else if (entry.isFile())
      files.push(relative(root, full).split(sep).join('/'))
    else
      throw new Error(
        `Unsupported non-file entry in package: ${relative(root, full)}`,
      )
  }
  return files.sort()
}

async function sha256(file) {
  return createHash('sha256')
    .update(await fs.readFile(file))
    .digest('hex')
}

async function assertDist() {
  await fs.access(distDir)
  const files = await walk(distDir)
  const allowed = new Set([...entryFiles, '_headers', '404.html'])
  const assetFiles = files.filter((file) => file.startsWith('assets/'))
  for (const file of files) {
    if (
      !allowed.has(file) &&
      !file.startsWith('assets/') &&
      !omittedBuildFiles.has(file)
    ) {
      throw new Error(`Unexpected dist file; refusing to package: ${file}`)
    }
  }
  if (assetFiles.length === 0)
    throw new Error('dist/assets is empty; build the client first')
  for (const file of [...entryFiles, '_headers', '404.html', ...assetFiles]) {
    const full = join(distDir, file)
    const stat = await fs.stat(full)
    if (!stat.isFile()) throw new Error(`Expected a regular file: dist/${file}`)
  }
  for (const file of entryFiles) {
    const html = await fs.readFile(join(distDir, file), 'utf8')
    const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(
      (match) => match[1],
    )
    for (const ref of references) {
      if (
        /^(?:https?:)?\/\//i.test(ref) ||
        ref.startsWith('data:') ||
        ref.startsWith('#')
      )
        continue
      const clean = ref.split(/[?#]/, 1)[0].replace(/^\.\//, '')
      if (!clean || !pathIsInside(distDir, join(distDir, clean)))
        throw new Error(`${file}: unsafe local resource ${ref}`)
      await fs.access(join(distDir, clean))
    }
  }
}

async function gitOutput(args) {
  try {
    return (await execFile('git', args, { cwd: repoDir })).stdout.trim()
  } catch {
    return null
  }
}

async function compareTrees(extractedDir, packagedFiles) {
  const extractedFiles = await walk(extractedDir)
  if (
    JSON.stringify(extractedFiles) !== JSON.stringify([...packagedFiles].sort())
  ) {
    throw new Error(
      `ZIP contents differ from expected files:\nexpected ${packagedFiles.join(', ')}\nactual ${extractedFiles.join(', ')}`,
    )
  }
  for (const file of packagedFiles) {
    const source = join(distDir, file)
    const extracted = join(extractedDir, file)
    const [sourceHash, extractedHash] = await Promise.all([
      sha256(source),
      sha256(extracted),
    ])
    if (sourceHash !== extractedHash)
      throw new Error(`ZIP verification failed for ${file}`)
  }
}

async function main() {
  await assertDist()
  const assetFiles = (await walk(join(distDir, 'assets'))).map(
    (file) => `assets/${file}`,
  )
  const packagedFiles = [...entryFiles, ...assetFiles, '_headers', '404.html']
  const date = new Date().toISOString().slice(0, 10)
  const gitShort =
    (await gitOutput(['rev-parse', '--short', 'HEAD'])) || 'nogit'
  const output = resolve(
    artifactDir,
    `joyloop-cf-pages-${date}-${gitShort}.zip`,
  )
  const tempRoot = await fs.mkdtemp(join(os.tmpdir(), 'joyloop-pages-'))
  const staging = join(tempRoot, 'site')
  const extracted = join(tempRoot, 'extracted')
  const candidateZip = join(tempRoot, 'joyloop-site.zip')
  try {
    await fs.mkdir(join(staging, 'assets'), { recursive: true })
    for (const file of packagedFiles) {
      const destination = join(staging, file)
      await fs.mkdir(dirname(destination), { recursive: true })
      await fs.copyFile(join(distDir, file), destination)
    }
    await fs.mkdir(artifactDir, { recursive: true })
    await execFile('zip', ['-q', '-X', candidateZip, ...packagedFiles], {
      cwd: staging,
    })
    await execFile('unzip', ['-t', candidateZip], { cwd: repoDir })
    await fs.mkdir(extracted)
    await execFile('unzip', ['-q', candidateZip, '-d', extracted], {
      cwd: repoDir,
    })
    const zipListing = (
      await execFile('unzip', ['-Z1', candidateZip], { cwd: repoDir })
    ).stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .sort()
    if (
      JSON.stringify(zipListing) !== JSON.stringify([...packagedFiles].sort())
    ) {
      throw new Error(
        `ZIP contains an unexpected or unsafe path: ${zipListing.join(', ')}`,
      )
    }
    await compareTrees(extracted, packagedFiles)

    const sourceCommit = await gitOutput(['rev-parse', 'HEAD'])
    const gitStatus = await gitOutput(['status', '--porcelain'])
    const dirty = gitStatus === null ? null : Boolean(gitStatus)
    const packageInfo = JSON.parse(
      await fs.readFile(join(clientDir, 'package.json'), 'utf8'),
    )
    const manifest = {
      version: packageInfo.version,
      languages: ['zh', 'en'],
      sourceCommit,
      dirty,
      generatedAt: new Date().toISOString(),
      files: await Promise.all(
        packagedFiles.map(async (file) => ({
          path: file,
          bytes: (await fs.stat(join(distDir, file))).size,
          sha256: await sha256(join(distDir, file)),
        })),
      ),
    }
    await fs.rename(candidateZip, output)
    await fs.writeFile(
      `${output}.manifest.json`,
      `${JSON.stringify(manifest, null, 2)}\n`,
    )
    const digest = await sha256(output)
    await fs.writeFile(
      `${output}.sha256`,
      `${digest}  ${output.split(sep).pop()}\n`,
    )
    console.log(`✓ Cloudflare Pages ZIP verified: ${output}`)
    console.log(`  ${packagedFiles.length} files, sha256 ${digest}`)
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(`✗ ${error.message}`)
  process.exitCode = 1
})
