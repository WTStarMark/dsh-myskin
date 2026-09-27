/**
 * Compatibility self-check against a local DSH install.
 *
 * Verifies the three surfaces that actually broke when dsh-myskin moved from
 * DSH <= 0.1.6 to 0.1.7-rc.2:
 *   1. the icon names the client bundle resolves from ui-primitives,
 *   2. the --dsw-* tokens the catalog and presets write,
 *   3. the client/host APIs the plugin calls (configForms, slots, theme, schema).
 *
 * Usage: node scripts/check-compat.mjs [--dsh /opt/dsh-web]
 */
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)
const flag = args.indexOf('--dsh')
const dshRoot = flag >= 0 ? args[flag + 1] : (process.env.DSH_INSTALL || '/opt/dsh-web')
const store = path.join(dshRoot, 'node_modules', '.pnpm')

let failures = 0
/**
 * Report one satisfied check.
 * @param message - what passed.
 */
function ok(message) { console.log('  ok    ' + message) }
/**
 * Report one failed check.
 * @param message - what failed.
 */
function bad(message) { console.log('  FAIL  ' + message); failures += 1 }

if (!fs.existsSync(store)) {
  console.log('SKIP: no pnpm store at ' + store + '; set DSH_INSTALL or pass --dsh <dir>')
  process.exit(0)
}

/**
 * Resolve one installed DSH package directory from the pnpm store.
 * @param name - package name, e.g. @deepseek-ai/dsh-client-ui-theme
 * @returns the newest matching package directory, or undefined.
 */
function pkgDir(name) {
  const mangled = name.split('/').join('+')
  const dirs = fs.readdirSync(store).filter((entry) => entry.startsWith(mangled + '@')).sort().reverse()
  for (const entry of dirs) {
    const dir = path.join(store, entry, 'node_modules', ...name.split('/'))
    if (fs.existsSync(dir)) return dir
  }
  return undefined
}

/**
 * Concatenate every source-ish text file under a directory.
 * @param dir - directory to walk.
 * @param into - accumulator.
 * @returns the concatenated text.
 */
function readTree(dir, into = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) readTree(full, into)
    else if (/[.](js|mjs|cjs|css|ts)$/.test(entry.name)) into.push(fs.readFileSync(full, 'utf8'))
  }
  return into.join(String.fromCharCode(10))
}

/**
 * Unique matches of a global pattern.
 * @param text - haystack.
 * @param pattern - global regex.
 * @returns unique matches.
 */
function unique(text, pattern) { return [...new Set(text.match(pattern) ?? [])] }

console.log('DSH install: ' + dshRoot)

// 1. Icon families the client aliases must be able to resolve.
const primitives = pkgDir('@deepseek-ai/dsh-client-ui-primitives')
const iconsSource = fs.readFileSync(path.join(root, 'src', 'client', 'icons.ts'), 'utf8')
const families = [...iconsSource.matchAll(/pick[(][[]([^]]*)[]][)]/g)].map((match) => match[1])
if (primitives === undefined) bad('@deepseek-ai/dsh-client-ui-primitives not installed')
else {
  const names = new Set(unique(readTree(path.join(primitives, 'lib', 'types')), /Icon[A-Za-z0-9]+/g))
  for (const family of families) {
    const candidates = family.split(',').map((entry) => entry.trim().replaceAll("'", ''))
    const hit = candidates.find((candidate) => names.has(candidate))
    if (hit === undefined) bad('no icon resolves: ' + candidates.join(' | '))
    else ok('icon ' + hit)
  }
}

// 2. Tokens the catalog and presets write must exist in the shipped theme.
const theme = pkgDir('@deepseek-ai/dsh-client-ui-theme')
if (theme === undefined) bad('@deepseek-ai/dsh-client-ui-theme not installed')
else {
  const available = new Set(unique(readTree(theme), /--dsw-[a-z0-9-]+/g))
  const used = new Set([
    ...unique(fs.readFileSync(path.join(root, 'src', 'client', 'token-catalog.ts'), 'utf8'), /--dsw-[a-z0-9-]+/g),
    ...unique(fs.readFileSync(path.join(root, 'src', 'client', 'presets.ts'), 'utf8'), /--dsw-[a-z0-9-]+/g),
  ])
  const missing = [...used].filter((token) => !available.has(token))
  if (missing.length > 0) bad('tokens absent from this DSH theme: ' + missing.join(', '))
  else ok(used.size + ' --dsw-* tokens resolve')
}

// 3. Client and host APIs the plugin calls.
const settings = pkgDir('@deepseek-ai/dsh-client-ui-settings')
const slots = pkgDir('@deepseek-ai/dsh-client-ui-slots')
const hostSettings = pkgDir('@deepseek-ai/dsh-settings')
const schema = pkgDir('@deepseek-ai/schemastery')
/**
 * Assert an installed package exposes a string.
 * @param dir - package directory.
 * @param needle - substring to find.
 * @param label - check label.
 */
function checkApi(dir, needle, label) {
  if (dir === undefined) { bad(label + ': package not installed'); return }
  if (readTree(dir).includes(needle)) ok(label)
  else bad(label + ' missing "' + needle + '"')
}
checkApi(settings, 'whileServed', 'configForms.whileServed')
checkApi(settings, 'getSnapshot()', 'ConfigForm.getSnapshot()')
checkApi(settings, 'unset(field', 'ConfigForm.unset()')
checkApi(slots, 'SlotMap', 'ui-slots SlotMap contract')
checkApi(settings, 'settings.section', 'settings.section slot contract')
checkApi(theme, 'overrideTokens', 'ctx.theme.overrideTokens')
checkApi(hostSettings, 'SettingsForms', 'dsh-settings SettingsForms')
checkApi(schema, 'volatile', 'schemastery .volatile()')
if (hostSettings !== undefined && readTree(hostSettings).includes('register<')) {
  bad('dsh-settings still exposes the removed settings.register: this DSH predates the Config model')
}
const hostSchema = fs.readFileSync(path.join(root, 'src', 'host-schema.ts'), 'utf8')
if (hostSchema.includes('.volatile()')) ok('host Config is volatile')
else bad('host Config is not marked volatile: settings writes would be refused')

console.log(failures === 0 ? 'PASS: dsh-myskin matches this DSH install' : 'FAIL: ' + failures + ' check(s) failed')
process.exit(failures === 0 ? 0 : 1)
