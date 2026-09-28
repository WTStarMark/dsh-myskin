/**
 * Type-level compatibility check: compile src/ with the REAL DSH installs' .d.ts.
 *
 * check-compat.mjs proves the strings/props a DSH install exposes still exist;
 * this proves our own source still type-checks against their declared API — the
 * difference that catches a signature change (a renamed slot field, a result type
 * that stopped being a boolean) instead of only a missing symbol.
 *
 * Each install gets a flat symlink shim under .tmp/typecheck/<label>/ so the
 * compiler resolves @deepseek-ai/* from that generation, then tsc runs over src.
 *
 * Usage: node scripts/check-types.mjs [--dsh /opt/dsh-web] [--dsh .tmp/probe020]
 *        DSH_INSTALL=/opt/dsh-web,.tmp/probe020 node scripts/check-types.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = path.resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)

/**
 * Install roots to check: every --dsh flag in order, else DSH_INSTALL, else the
 * conventional local install.
 * @returns absolute install directories (duplicates removed).
 */
function installRoots() {
  const roots = []
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--dsh' && args[i + 1] !== undefined) { roots.push(args[i + 1]); i += 1 }
  }
  if (roots.length === 0) {
    const env = process.env.DSH_INSTALL
    if (env !== undefined && env !== '') roots.push(...env.split(','))
  }
  if (roots.length === 0) roots.push('/opt/dsh-web')
  return [...new Set(roots.map((entry) => path.resolve(entry.trim())))]
}

/**
 * The DSH version one install carries, used to prefer that generation when the
 * pnpm store holds several.
 * @param dshRoot - install root.
 * @returns a version string, or '' when it cannot be told.
 */
function installVersion(dshRoot) {
  try {
    const deps = JSON.parse(fs.readFileSync(path.join(dshRoot, 'package.json'), 'utf8')).dependencies ?? {}
    const declared = deps['@deepseek-ai/dsh']
    if (typeof declared === 'string') return declared.replace(/^[^0-9]*/, '')
  } catch { /* fall through to the store scan */ }
  const store = path.join(dshRoot, 'node_modules', '.pnpm')
  if (!fs.existsSync(store)) return ''
  const versions = fs.readdirSync(store)
    .filter((name) => name.startsWith('@deepseek-ai+dsh@'))
    .map((name) => name.slice('@deepseek-ai+dsh@'.length).split('_')[0])
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  return versions[versions.length - 1] ?? ''
}

/**
 * Link every @deepseek-ai package one install provides into a flat shim directory.
 * @param dshRoot - install root.
 * @param prefer - version prefix to prefer when several are present.
 * @param shim - directory to (re)create.
 * @returns how many packages were linked.
 */
function linkShim(dshRoot, prefer, shim) {
  const candidates = new Map()
  const add = (dir) => {
    const manifest = path.join(dir, 'package.json')
    if (!fs.existsSync(manifest)) return
    const meta = JSON.parse(fs.readFileSync(manifest, 'utf8'))
    const list = candidates.get(meta.name) ?? []
    list.push({ dir, version: meta.version })
    candidates.set(meta.name, list)
  }
  const scope = path.join(dshRoot, 'node_modules', '@deepseek-ai')
  if (fs.existsSync(scope)) for (const name of fs.readdirSync(scope)) add(path.join(scope, name))
  const store = path.join(dshRoot, 'node_modules', '.pnpm')
  if (fs.existsSync(store)) {
    for (const entry of fs.readdirSync(store)) {
      const scopeDir = path.join(store, entry, 'node_modules', '@deepseek-ai')
      if (!fs.existsSync(scopeDir)) continue
      for (const name of fs.readdirSync(scopeDir)) add(path.join(scopeDir, name))
    }
  }
  fs.rmSync(shim, { recursive: true, force: true })
  const out = path.join(shim, 'node_modules', '@deepseek-ai')
  fs.mkdirSync(out, { recursive: true })
  let linked = 0
  for (const [name, list] of candidates) {
    const preferred = list.filter((entry) => prefer !== '' && entry.version.startsWith(prefer))
    const pool = (preferred.length > 0 ? preferred : list).sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }))
    const target = path.join(out, name.replace('@deepseek-ai/', ''))
    if (fs.existsSync(target)) continue
    fs.symlinkSync(pool[pool.length - 1].dir, target)
    linked += 1
  }
  return linked
}

/**
 * Write the tsconfig for one shim: the project's own compiler options plus a
 * paths map onto the shim.
 * @param shim - shim directory holding node_modules/@deepseek-ai.
 * @returns the tsconfig path.
 */
function writeTsconfig(shim) {
  const relative = path.relative(shim, path.join(root, 'src')).split(path.sep).join('/')
  // The service-name probe lives with the other test fixtures: it must compile
  // against each install so a dropped/renamed injected service fails the gate.
  const probe = path.relative(shim, path.join(root, 'tests', 'types')).split(path.sep).join('/')
  const config = {
    compilerOptions: {
      target: 'ES2024', module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx',
      strict: true, skipLibCheck: true, noEmit: true, allowImportingTsExtensions: true,
      resolveJsonModule: true, esModuleInterop: true, isolatedModules: true,
      lib: ['ES2024', 'DOM', 'DOM.Iterable'], types: [],
      baseUrl: '.', paths: { '@deepseek-ai/*': ['./node_modules/@deepseek-ai/*'] },
    },
    include: [relative + '/**/*.ts', relative + '/**/*.tsx', probe + '/**/*.ts'],
  }
  const file = path.join(shim, 'tsconfig.json')
  fs.writeFileSync(file, JSON.stringify(config, null, 2))
  return file
}

/** @returns the bundled tsc entry, or undefined when typescript is not installed. */
function tscEntry() {
  const local = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc')
  return fs.existsSync(local) ? local : undefined
}

const tsc = tscEntry()
if (tsc === undefined) {
  console.log('SKIP: typescript is not installed; run "npm install --include=dev" (a production NODE_ENV prunes devDependencies)')
  process.exit(0)
}

let failures = 0
for (const dshRoot of installRoots()) {
  const version = installVersion(dshRoot)
  const label = (version === '' ? path.basename(dshRoot) : version).replace(/[^A-Za-z0-9._-]/g, '_')
  const shim = path.join(root, '.tmp', 'typecheck', label)
  console.log(String.fromCharCode(10) + 'DSH install: ' + dshRoot + (version === '' ? '' : ' (' + version + ')'))
  if (!fs.existsSync(path.join(dshRoot, 'node_modules'))) {
    console.log('  note  no node_modules here; skipped')
    continue
  }
  const linked = linkShim(dshRoot, version, shim)
  const config = writeTsconfig(shim)
  console.log('  shim: ' + linked + ' packages -> ' + path.relative(root, shim))
  const result = spawnSync(process.execPath, [tsc, '-p', config, '--pretty', 'false'], { encoding: 'utf8' })
  const output = (result.stdout ?? '') + (result.stderr ?? '')
  const diagnostics = output.split(String.fromCharCode(10)).filter((line) => line.includes('error TS'))
  const own = diagnostics.filter((line) => !line.includes('node_modules'))
  const foreign = diagnostics.length - own.length
  if (own.length === 0) console.log('  ok    src/ type-checks against this install' + (foreign > 0 ? ' (' + foreign + ' diagnostics inside shipped .d.ts, ignored)' : ''))
  else {
    failures += own.length
    for (const line of own.slice(0, 20)) console.log('  FAIL  ' + line.replace(root + path.sep, ''))
    if (own.length > 20) console.log('  FAIL  ... ' + (own.length - 20) + ' more')
  }
}

console.log(failures === 0 ? 'PASS: src/ matches every checked DSH install' : 'FAIL: ' + failures + ' diagnostic(s) in src/')
process.exit(failures === 0 ? 0 : 1)
