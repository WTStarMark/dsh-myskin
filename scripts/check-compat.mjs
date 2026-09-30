/**
 * Compatibility self-check against one or more local DSH installs.
 *
 * Verifies the surfaces that actually break when dsh-myskin moves between DSH
 * generations:
 *   1. the icon names the client bundle resolves from ui-primitives,
 *   2. the --dsw-* tokens the catalog and presets write,
 *   3. the client/host APIs the plugin calls (configForms, slots, theme, schema),
 *   4. the desktop contracts the editor depends on: the window-chrome markers the
 *      Electron preloads publish and the drag-recall attribute the shipped Web
 *      shell pulses (see src/client/desktop.ts).
 *
 * Usage: node scripts/check-compat.mjs [--dsh /opt/dsh-web] [--dsh .tmp/probe020]
 *        DSH_INSTALL=/opt/dsh-web,<other> node scripts/check-compat.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

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
/**
 * Report a fact that differs between generations without failing the run.
 * @param message - what was observed.
 */
function note(message) { console.log('  note  ' + message) }

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
    else if (/[.](js|mjs|cjs|css|ts|html)$/.test(entry.name)) into.push(fs.readFileSync(full, 'utf8'))
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

/** Project sources this run also audits (self-consistency, not the install). */
const iconsSource = fs.readFileSync(path.join(root, 'src', 'client', 'icons.ts'), 'utf8')
const desktopSource = fs.readFileSync(path.join(root, 'src', 'client', 'desktop.ts'), 'utf8')
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))

/**
 * Check one DSH install.
 * @param dshRoot - install root containing node_modules/.pnpm.
 */
function checkInstall(dshRoot) {
  const store = path.join(dshRoot, 'node_modules', '.pnpm')
  console.log(String.fromCharCode(10) + 'DSH install: ' + dshRoot)
  if (!fs.existsSync(store)) {
    note('no pnpm store here; skipped')
    return
  }

  const trees = new Map()
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
   * Cached text of one package tree.
   * @param dir - package directory, or undefined.
   * @returns the concatenated text ('' when the package is absent).
   */
  function tree(dir) {
    if (dir === undefined) return ''
    if (!trees.has(dir)) trees.set(dir, readTree(dir))
    return trees.get(dir)
  }
  /**
   * Assert an installed package exposes a string.
   * @param dir - package directory.
   * @param needle - substring to find.
   * @param label - check label.
   */
  function checkApi(dir, needle, label) {
    if (dir === undefined) { bad(label + ': package not installed'); return }
    if (tree(dir).includes(needle)) ok(label)
    else bad(label + ' missing "' + needle + '"')
  }

  // 1. Icon families the client aliases must be able to resolve. The regex has
  //    to match pick([...]) exactly: a stale pattern silently checks nothing.
  const primitives = pkgDir('@deepseek-ai/dsh-client-ui-primitives')
  const families = [...iconsSource.matchAll(/pick\(\s*\[([^\]]*)\]\s*\)/g)].map((match) => match[1])
  if (families.length === 0) bad('no icon candidate list found in src/client/icons.ts: the icon check would be vacuous')
  if (primitives === undefined) bad('@deepseek-ai/dsh-client-ui-primitives not installed')
  else {
    const names = new Set(unique(tree(path.join(primitives, 'lib', 'types')), /Icon[A-Za-z0-9]+/g))
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
    const available = new Set(unique(tree(theme), /--dsw-[a-z0-9-]+/g))
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
  checkApi(settings, 'whileServed', 'configForms.whileServed')
  checkApi(settings, 'getSnapshot()', 'ConfigForm.getSnapshot()')
  checkApi(settings, 'unset(field', 'ConfigForm.unset()')
  checkApi(slots, 'SlotMap', 'ui-slots SlotMap contract')
  checkApi(settings, 'settings.section', 'settings.section slot contract')
  checkApi(theme, 'overrideTokens', 'ctx.theme.overrideTokens')
  checkApi(hostSettings, 'SettingsForms', 'dsh-settings SettingsForms')
  checkApi(schema, 'volatile', 'schemastery .volatile()')
  if (hostSettings !== undefined && tree(hostSettings).includes('register<')) {
    bad('dsh-settings still exposes the removed settings.register: this DSH predates the Config model')
  }

  // 4. Desktop contracts. DSH Desktop is the same Web document in Electron, so
  //    the editor reads the preload markers and pulses the shell's recall
  //    attribute; both sides must still exist in this install.
  const frontend = pkgDir('@deepseek-ai/dsh-web-frontend')
  const layout = pkgDir('@deepseek-ai/dsh-client-ui-layout')
  checkApi(frontend, 'data-window-drag-recall', 'shell drag-recall attribute (editor pulse)')
  checkApi(frontend, 'body>:not(#root)', 'darwin overlay no-drag convention')
  checkApi(primitives, 'data-platform', 'desktop platform marker')
  checkApi(layout, 'data-windows-titlebar', 'Windows caption marker')
  checkApi(layout, '--dsh-windows-titlebar-height', 'Windows caption height')
  if (tree(frontend).includes('--dsh-frame-chrome-top')) note('publishes --dsh-frame-chrome-top / --dsh-frame-overlay-top (0.2.0 overlay geometry)')
  else note('predates --dsh-frame-chrome-top; the editor aligns to --dsh-windows-titlebar-height on both')
  if (tree(frontend).includes('body>:not(#root)') && !manifest.dsh?.client) note('package.json has no dsh.client declaration')

  // 4b. Font-role hooks. 界面/正文/代码 write ordinary CSS, but two of the three hang off
  //     variables the APP has to read: a role pointing at a variable nobody consumes looks
  //     applied and does nothing at all (the failure mode with no error message).
  const frontendSource = tree(frontend)
  if (frontendSource.includes('--dsw-font-family') && frontendSource.includes('--ds-font-family-code')) {
    ok('font roles resolve (--dsw-font-family for 界面, --ds-font-family-code for 代码)')
  } else {
    bad('font-role variables missing from the web frontend: 界面/代码 字体 would silently do nothing')
  }

  // 5. DOM contracts the skin engine and the editor read off the RENDERED app.
  //    These are not APIs, so no type check can see them: a renamed attribute
  //    silently turns a feature into a no-op (dark tokens would fall back to the
  //    light palette, selectors anchored at #root would match nothing, the
  //    workspace-tree decorator would stop tagging). Scan every @deepseek-ai
  //    package the install ships, not just one.
  let storeText
  /** @returns the concatenated text of every @deepseek-ai package in this install. */
  function storeSource() {
    if (storeText !== undefined) return storeText
    const chunks = []
    for (const entry of fs.readdirSync(store)) {
      if (!entry.startsWith('@deepseek-ai+dsh-') && !entry.startsWith('@deepseek-ai+cordis@')) continue
      const scopeDir = path.join(store, entry, 'node_modules', '@deepseek-ai')
      if (!fs.existsSync(scopeDir)) continue
      for (const name of fs.readdirSync(scopeDir)) chunks.push(tree(path.join(scopeDir, name)))
    }
    storeText = chunks.join(String.fromCharCode(10))
    return storeText
  }
  /**
   * Assert this install still renders one attribute our engine/editor reads.
   * @param needle - the literal the rendered app must contain.
   * @param label - check label.
   */
  function checkContract(needle, label) {
    if (storeSource().includes(needle)) ok(label)
    else bad(label + ' missing "' + needle + '"')
  }
  checkContract('data-ds-dark-theme', 'dark-palette marker (body[data-ds-dark-theme])')
  checkContract('_frame', 'frame surface class ([class*="_frame"])')
  checkContract('centerCol', 'conversation column class ([class*="_centerCol"])')
  checkContract('--dsh-windows-content-radius', 'Windows content corner radius (the column owns the wallpaper and clips it)')
  checkContract('composerSeat', 'composer seat class ([class*="_composerSeat"])')
  checkContract('data-composer-seat', 'composer seat marker (data-composer-seat)')
  checkContract('data-composer-input', 'composer editable surface (the gray default text is painted over it)')
  checkContract('data-composer-placeholder', 'composer gray default text (pointer-events:none, so the picker resolves it by marker)')
  checkContract('"data-slot"', 'slot host marker (data-slot="<slotKey>")')
  checkContract('conversation.session', 'conversation content slot (the token hand-back inside the column)')
  checkContract('conversation.view', 'conversation view slot (the token hand-back inside the column)')
  checkContract('data-shortcut-modal', 'modal marker (the body-portalled layer the editor insets)')
  checkContract('aria-current', 'settings nav marker (button[aria-current])')
  checkContract('role="tree"', 'workspace tree role ([role=\'tree\'])')
  checkContract('aria-selected', 'tree selection attribute')
  checkContract('aria-expanded', 'tree expansion attribute')
  if (storeSource().includes('position:fixed;inset:0')) note('modal layers are full-viewport fixed layers (what the editor insets)')
  else bad('no full-viewport fixed modal layer found: the editor can no longer inset upstream modals')
  checkContract('id="root"', 'app root id (#root selectors)')
  // The client bundle is wrapped as window.__ModuleLoader__.load({ id, factory });
  // a protocol rename would leave the browser half unregistered with no error.
  checkContract('__ModuleLoader__', 'client module-loader protocol')
}

const roots = installRoots()
for (const dshRoot of roots) checkInstall(dshRoot)

// Sources this run audits, independent of any install.
console.log(String.fromCharCode(10) + 'Self-check: ' + root)
const hostSchema = fs.readFileSync(path.join(root, 'src', 'host-schema.ts'), 'utf8')
if (hostSchema.includes('.volatile()')) ok('host Config is volatile')
else bad('host Config is not marked volatile: settings writes would be refused')
// A linked / copied / zip-extracted install has no node_modules of its own, so any
// bare import in the host half makes app-boot report
// "dsh-myskin (dsh-myskin): failed to import" (it swallows the real error).
const hostBundlePath = path.join(root, 'lib', 'index.js')
if (!fs.existsSync(hostBundlePath)) bad('lib/index.js is missing: run npm run build')
else {
  const bare = [...fs.readFileSync(hostBundlePath, 'utf8').matchAll(/from\s+["'](@deepseek-ai\/[^"']+)["']/g)].map((match) => match[1])
  if (bare.length > 0) bad('host bundle imports ' + bare.join(', ') + ': a linked/copied install would fail to import')
  else ok('host bundle is self-contained (no bare imports)')
}
for (const marker of ['data-platform', 'data-fullscreen', 'data-windows-titlebar', 'data-window-drag-recall']) {
  if (desktopSource.includes(marker)) ok('editor reads ' + marker)
  else bad('editor no longer reads ' + marker)
}
if (manifest.dsh?.client?.platform === 'web') ok('dsh.client.platform is "web" (the only platform the Host serves)')
else bad('dsh.client.platform must stay "web", found ' + JSON.stringify(manifest.dsh?.client?.platform))

console.log(failures === 0
  ? 'PASS: dsh-myskin matches ' + roots.length + ' DSH install(s)'
  : 'FAIL: ' + failures + ' check(s) failed')
process.exit(failures === 0 ? 0 : 1)
