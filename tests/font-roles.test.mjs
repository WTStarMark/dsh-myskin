/**
 * The three whole-app font roles: 界面 / 正文 / 代码.
 *
 * The interesting property is that they are ordinary `css` entries, so they must coexist: 界面 and
 * 代码 both live in the `:root` entry (as does the background-strength marker), and clearing one
 * role must never take the others with it. The last test checks the levers against the installed
 * DSH, because a variable the app does not read would make a role look applied and do nothing.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { dshRoot, loadTs } from './helpers/load-ts.mjs'

const roles = await loadTs('src/client/font-roles.ts')

/**
 * Every text asset of the newest local DSH web frontend, concatenated.
 * @returns the sources, or undefined when no install is present.
 */
function frontendSources() {
  const store = path.join(dshRoot(), 'node_modules', '.pnpm')
  if (!fs.existsSync(store)) return undefined
  const dirs = fs.readdirSync(store).filter((name) => name.startsWith('@deepseek-ai+dsh-web-frontend@')).sort().reverse()
  for (const dir of dirs) {
    const assets = path.join(store, dir, 'node_modules', '@deepseek-ai', 'dsh-web-frontend', 'dist', 'assets')
    if (!fs.existsSync(assets)) continue
    const files = fs.readdirSync(assets).filter((name) => name.endsWith('.css') || name.endsWith('.js'))
    if (files.length === 0) continue
    return files.map((name) => fs.readFileSync(path.join(assets, name), 'utf8')).join('\n')
  }
  return undefined
}

const SOURCES = frontendSources()
const skipContracts = SOURCES === undefined ? 'no local DSH web frontend to check against' : false

test('each role writes its own declaration and reads back', () => {
  let css = []
  css = roles.withRoleFont(css, 'ui', '"Inter", system-ui, sans-serif')
  assert.equal(roles.roleFont(css, 'ui'), '"Inter", system-ui, sans-serif')
  assert.equal(roles.roleFont(css, 'text'), '')
  assert.equal(roles.roleFont(css, 'code'), '')

  css = roles.withRoleFont(css, 'text', '"Songti SC"')
  css = roles.withRoleFont(css, 'code', '"JetBrains Mono", monospace')
  assert.equal(roles.roleFont(css, 'ui'), '"Inter", system-ui, sans-serif')
  assert.equal(roles.roleFont(css, 'text'), '"Songti SC"')
  assert.equal(roles.roleFont(css, 'code'), '"JetBrains Mono", monospace')

  // Clearing one role leaves the others exactly where they were.
  css = roles.withRoleFont(css, 'text', '')
  assert.equal(roles.roleFont(css, 'text'), '')
  assert.equal(roles.roleFont(css, 'ui'), '"Inter", system-ui, sans-serif')
  assert.equal(roles.roleFont(css, 'code'), '"JetBrains Mono", monospace')
  assert.equal(css.length, 1, 'the :root entry survives and the prose entry is gone')
})

test('the two :root roles merge by property instead of overwriting each other', () => {
  // 界面 and 代码 share one selector; replacing the entry would wipe whichever was set first.
  let css = [{ selector: ':root', rule: '--dsh-myskin-bg-opacity: 0.55' }]
  css = roles.withRoleFont(css, 'ui', 'Inter')
  css = roles.withRoleFont(css, 'code', 'Mono')
  assert.equal(css.length, 1, 'still ONE :root entry')
  assert.match(css[0].rule, /--dsw-font-family: Inter/)
  assert.match(css[0].rule, /--ds-font-family-code: Mono/)
  // …and the background-strength marker that already lived there survives both writes.
  assert.match(css[0].rule, /--dsh-myskin-bg-opacity: 0\.55/)
  // The code role sets the markdown code family too (DSH reads both).
  assert.match(css[0].rule, /--dsw-font-markdown-code-font-family: Mono/)

  // Clearing the last role drops the whole entry: no empty rule is left behind.
  css = roles.withRoleFont(css, 'ui', '')
  css = roles.withRoleFont(css, 'code', '')
  assert.deepEqual(css, [{ selector: ':root', rule: '--dsh-myskin-bg-opacity: 0.55' }])
})

test('prose is an explicit override, not another variable', () => {
  const css = roles.withRoleFont([], 'text', 'Songti')
  assert.equal(css.length, 1)
  assert.equal(css[0].selector, roles.TEXT_FONT_SELECTOR)
  assert.equal(css[0].rule, 'font-family: Songti')
  // No \`!important\`: the conversation slots and markdown blocks are ordinary author rules, and an
  // important family here would also drag inline code inside a paragraph out of the code face.
  assert.doesNotMatch(css[0].rule, /!important/)
  for (const marker of ['data-slot="conversation.session"', 'data-slot^="conversation.view"', '_markdown_', 'data-composer-input']) {
    assert.ok(roles.TEXT_FONT_SELECTOR.includes(marker), 'prose selector covers ' + marker)
  }
})

test('a picked family carries a fallback of the right kind', () => {
  assert.equal(roles.roleStackFor('"Inter"', 'ui'), '"Inter", system-ui, sans-serif')
  assert.equal(roles.roleStackFor('"Songti SC"', 'text'), '"Songti SC", system-ui, sans-serif')
  assert.equal(roles.roleStackFor('"JetBrains Mono"', 'code'), '"JetBrains Mono", monospace')
  assert.deepEqual([...roles.FONT_ROLES], ['ui', 'text', 'code'])
})

test('the roles hang off variables this DSH generation actually reads', { skip: skipContracts }, () => {
  // body { font-family: var(--dsw-font-family, …) } — the app-wide base the UI role sets…
  assert.match(SOURCES, /body\{font-family:var\(\s*--dsw-font-family/, 'body must read --dsw-font-family')
  // …and the family every code surface uses (code blocks, inline code, editors).
  assert.ok(SOURCES.includes('--ds-font-family-code'), 'code surfaces must read --ds-font-family-code')
  // The prose selector's markdown hook has to exist in the shipped app too. (The slot keys are
  // defined in the conversation package, not the shell — `check:compat` covers those.)
  assert.ok(SOURCES.includes('_markdown_'), 'markdown blocks carry a _markdown_ class')
})
