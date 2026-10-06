/**
 * 兼容模式 (`--dsh-myskin-compat`): the skin guests on a page whose background is somebody
 * else's — no wallpaper layer, no background-family tokens, no request for the wallpaper plugin to
 * step aside, and everything in FRONT of the background untouched.
 *
 * The mode is a marker declaration inside `css` (like the wallpaper anchor), so an older Host
 * keeps it without a restart — which is also why it has to share the single `:root` entry with
 * the other markers instead of replacing it.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { loadTs } from './helpers/load-ts.mjs'

const engine = await loadTs('src/client/skin-engine.ts')

const FIXTURE = '<!doctype html><html><head></head><body data-ds-dark-theme=""><div id="app"><span id="hero">Hello</span></div></body></html>'
const WALL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='

/**
 * Install a fresh jsdom document as the global DOM.
 * @returns the jsdom window.
 */
function setup() {
  const dom = new JSDOM(FIXTURE, { pretendToBeVisual: true })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.Node = dom.window.Node
  globalThis.MutationObserver = dom.window.MutationObserver
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)
  return dom.window
}

/**
 * Minimal stand-in for ctx.theme that records what reached the token registry.
 * @returns the fake registry plus its recorded calls.
 */
function fakeTheme() {
  const calls = []
  return {
    calls,
    overrideTokens(source, tokens) {
      calls.push({ source, tokens: JSON.parse(JSON.stringify(tokens)) })
      return () => {}
    },
  }
}

/** A document with every layer in use. */
function skin(extra = {}) {
  const base = {
    enabled: true,
    tokens: {
      '--dsw-alias-bg-base': { light: '#f4f7fb', dark: '#0c1322' },
      '--dsw-specific-sidebar-fill': { light: '#eaf0f8', dark: '#0e1727' },
      '--dsw-alias-label-primary': { light: '#0b1729', dark: '#e8eefb' },
      '--dsw-alias-border-l2': { light: '#c0cde0', dark: '#2f4059' },
    },
    css: [{ selector: '#hero', rule: 'color: red' }],
    text: [{ selector: '#hero', before: 'Hello', after: '你好' }],
    canvas: { background: WALL, backgroundOpacity: 0.75, images: [] },
    layers: [],
    library: [],
  }
  return { ...base, ...extra }
}

/** The same document, asking for 兼容模式. */
function compatSkin() {
  const doc = skin()
  return { ...doc, css: engine.withCompatMode(doc.css, true) }
}

test('only page/panel surfaces count as the background family', () => {
  for (const name of ['--dsw-alias-bg-base', '--dsw-alias-bg-layer-1', '--dsw-alias-bg-overlay', '--dsw-alias-bg-module-platform', '--dsw-specific-sidebar-fill']) {
    assert.equal(engine.isBackgroundToken(name), true, name + ' paints a surface')
  }
  for (const name of ['--dsw-alias-label-primary', '--dsw-alias-border-l2', '--dsw-alias-brand-primary', '--dsw-alias-button-primary-fill', '--dsw-specific-bubble', '--dsw-alias-scrollbar-bg-l1', '--dsw-specific-sidebar-nav-item-active']) {
    assert.equal(engine.isBackgroundToken(name), false, name + ' paints in front of the background')
  }
})

test('the mode round-trips through the one :root marker rule and leaves its neighbours alone', () => {
  let css = []
  css = engine.withBackgroundOpacity(css, 0.4)
  css = engine.withBackgroundAnchor(css, 'conversation')
  css = engine.withCompatMode(css, true)

  const roots = css.filter((entry) => entry.selector === ':root')
  assert.equal(roots.length, 1, 'every marker shares ONE :root entry — a second one would shadow the first')
  assert.match(roots[0].rule, /--dsh-myskin-bg-opacity: 0\.4/)
  assert.match(roots[0].rule, /--dsh-myskin-bg-anchor: conversation/)
  assert.match(roots[0].rule, /--dsh-myskin-compat: 1/)
  assert.equal(engine.readCompatMode({ css }), true)

  // Idempotent, and turning it off writes an EXPLICIT `0` — never an absent marker, because absent
  // means "follow the wallpaper plugin" and would flip the mode back on under the user.
  css = engine.withCompatMode(css, true)
  assert.equal(css.filter((entry) => entry.selector === ':root').length, 1)
  css = engine.withCompatMode(css, false)
  assert.equal(engine.readCompatMode({ css }), false)
  assert.equal(engine.readCompatChoice({ css }), 'off')
  const after = css.find((entry) => entry.selector === ':root')
  assert.match(after.rule, /--dsh-myskin-bg-opacity: 0\.4/)
  assert.match(after.rule, /--dsh-myskin-bg-anchor: conversation/)
  assert.match(after.rule, /--dsh-myskin-compat: 0/)
})

test('an untouched switch follows the wallpaper plugin; an explicit choice does not', () => {
  const marker = (value) => ({ css: [{ selector: ':root', rule: '--dsh-myskin-compat: ' + value + ';' }] })
  assert.equal(engine.readCompatChoice({ css: [] }), 'auto', 'a document that never met the switch decides nothing')
  assert.equal(engine.readCompatChoice(marker('1')), 'on')
  assert.equal(engine.readCompatChoice(marker('0')), 'off')
  assert.equal(engine.readCompatChoice({ css: [{ selector: '#hero', rule: 'color: red' }] }), 'auto')

  assert.equal(engine.resolveCompatMode('auto', true), true, 'installed ⇒ stay out of the background')
  assert.equal(engine.resolveCompatMode('auto', false), false)
  assert.equal(engine.resolveCompatMode('on', false), true, 'an explicit on survives an uninstall')
  assert.equal(engine.resolveCompatMode('off', true), false, 'and an explicit off wins over the plugin')
  // The old single-argument reader keeps meaning "the document alone, nothing installed".
  assert.equal(engine.readCompatMode({ css: [] }), false)
})

test('with the wallpaper plugin loaded, an untouched document is 兼容模式 by itself', () => {
  const window = setup()
  const doc = window.document
  // `data-we-glass-page` is the gate that plugin keeps mounted for as long as it is loaded — it is
  // there even when no wallpaper is selected, which is exactly when the user cannot tell us.
  doc.body.setAttribute('data-we-glass-page', 'on')
  const override = engine.applySkin(fakeTheme(), skin())
  const css = doc.getElementById('dsh-myskin-rule')?.textContent ?? ''
  assert.doesNotMatch(css, /background-image: url\(/, 'no wallpaper of ours')
  assert.doesNotMatch(css, /--dsw-alias-bg-base: rgba\(/)
  assert.equal(doc.body.style.getPropertyValue('--dsw-alias-bg-base'), '', 'no surface colour over theirs')
  assert.equal(doc.body.style.getPropertyValue('--dsw-alias-label-primary'), '#e8eefb', 'foreground still paints')
  assert.equal(doc.documentElement.hasAttribute('data-dsh-skin'), false, 'and we do not ask them to step aside')
  override.dispose()

  // …but the user's explicit 关闭 wins over the detection, and everything paints again.
  const explicitOff = { ...skin(), css: engine.withCompatMode(skin().css, false) }
  const second = engine.applySkin(fakeTheme(), explicitOff)
  const painted = doc.getElementById('dsh-myskin-rule')?.textContent ?? ''
  assert.match(painted, /background-image: url\(/)
  assert.equal(doc.body.style.getPropertyValue('--dsw-alias-bg-base'), '#0c1322')
  assert.equal(doc.documentElement.getAttribute('data-dsh-skin'), 'dsh-myskin')
  second.dispose()
})

test('paintableTokens drops exactly the background family, and only in 兼容模式', () => {
  const tokens = skin().tokens
  assert.equal(engine.paintableTokens(tokens, false), tokens, 'the off path must not copy')
  const kept = engine.paintableTokens(tokens, true)
  assert.deepEqual(Object.keys(kept).sort(), ['--dsw-alias-border-l2', '--dsw-alias-label-primary'])
  assert.equal(kept['--dsw-alias-label-primary'].dark, '#e8eefb', 'values survive untouched')
})

test('兼容模式: no wallpaper, no surface tokens, no yield request — the rest keeps painting', () => {
  const window = setup()
  const doc = window.document
  doc.body.style.backgroundColor = '#ffffff'
  const theme = fakeTheme()
  const before = doc.body.outerHTML

  const override = engine.applySkin(theme, compatSkin())
  const css = doc.getElementById('dsh-myskin-rule')?.textContent ?? ''
  assert.doesNotMatch(css, /background-image: url\(/, 'our wallpaper stays out of the way')
  assert.doesNotMatch(css, /--dsw-alias-bg-base: rgba\(/, 'and so does the translucency that exists for it')
  assert.match(css, /#hero \{ color: red \}/, 'rules still apply')
  assert.equal(doc.body.style.getPropertyValue('--dsw-alias-bg-base'), '', 'no surface colour on <body>')
  assert.equal(doc.body.style.getPropertyValue('--dsw-specific-sidebar-fill'), '')
  assert.equal(doc.body.style.getPropertyValue('--dsw-alias-label-primary'), '#e8eefb', 'foreground keeps applying')
  assert.deepEqual(theme.calls[0].tokens['--dsw-alias-label-primary'], { light: '#0b1729', dark: '#e8eefb' })
  assert.equal(theme.calls[0].tokens['--dsw-alias-bg-base'], undefined, 'the registry never sees the background family')
  assert.equal(doc.documentElement.hasAttribute('data-dsh-skin'), false, 'we are the guest: no yield request')
  assert.equal(doc.getElementById('hero').textContent, '你好', 'text overrides still land')

  override.dispose()
  assert.equal(doc.body.outerHTML, before, 'the mode is as reversible as the rest of the skin')
  assert.equal(doc.getElementById('dsh-myskin-rule'), null)
})

test('兼容模式 keeps its promise even while a wallpaper plugin is on stage', () => {
  const window = setup()
  const doc = window.document
  doc.body.setAttribute('data-we-wallpaper', 'on')
  const override = engine.applySkin(fakeTheme(), compatSkin())
  const css = doc.getElementById('dsh-myskin-rule')?.textContent ?? ''
  assert.doesNotMatch(css, /background-image: url\(/)
  assert.match(css, /#hero \{ color: red \}/)
  assert.equal(doc.documentElement.hasAttribute('data-dsh-skin'), false)
  override.dispose()
})

test('兼容模式 drops a marked panel fill and keeps the rest of that rule', () => {
  const marker = engine.PANEL_FILL_PROPERTY
  const css = [
    { selector: '[data-dockkit-pane]', rule: 'background-color: #101010 !important; ' + marker + ': 1; border-radius: 12px !important; backdrop-filter: blur(18px) !important' },
    { selector: '#fillOnly', rule: 'background-color: #202020 !important; ' + marker + ': 1' },
    { selector: '#hand', rule: 'background-color: red !important' },
  ]
  const kept = engine.paintableRules(css, true)
  const pane = kept.find((rule) => rule.selector === '[data-dockkit-pane]')
  assert.doesNotMatch(pane.rule, /background-color/)
  assert.doesNotMatch(pane.rule, new RegExp(marker), 'the marker is ours and does not need painting')
  assert.match(pane.rule, /border-radius: 12px !important/)
  assert.match(pane.rule, /backdrop-filter: blur\(18px\) !important/, 'blur is not a surface: it stays')
  assert.equal(kept.some((rule) => rule.selector === '#fillOnly'), false, 'a fill-only rule disappears instead of painting an empty block')
  assert.match(kept.find((rule) => rule.selector === '#hand').rule, /background-color: red/, 'a hand-written rule is not ours to filter')
  assert.equal(engine.paintableRules(css, false), css, 'the off path must not copy')
})

test('applySkin in 兼容模式 paints the surface rule without its fill', () => {
  const window = setup()
  const doc = window.document
  const base = skin({
    css: [
      { selector: '[data-dockkit-pane]', rule: 'background-color: #101010 !important; ' + engine.PANEL_FILL_PROPERTY + ': 1; border-radius: 12px !important' },
      { selector: '#hero', rule: 'color: red' },
    ],
  })
  const override = engine.applySkin(fakeTheme(), { ...base, css: engine.withCompatMode(base.css, true) })
  const painted = doc.getElementById('dsh-myskin-rule')?.textContent ?? ''
  assert.doesNotMatch(painted, /background-color: #101010/)
  assert.match(painted, /\[data-dockkit-pane\] \{ border-radius: 12px !important \}/)
  assert.match(painted, /#hero \{ color: red \}/)
  override.dispose()
  assert.equal(doc.getElementById('dsh-myskin-rule'), null)
})

test('without the mode everything still paints (regression guard)', () => {
  const window = setup()
  const doc = window.document
  doc.body.style.backgroundColor = '#ffffff'
  const theme = fakeTheme()
  const override = engine.applySkin(theme, skin())
  const css = doc.getElementById('dsh-myskin-rule')?.textContent ?? ''
  assert.match(css, /background-image: url\(/)
  assert.match(css, /--dsw-alias-bg-base: rgba\(/)
  assert.equal(doc.body.style.getPropertyValue('--dsw-alias-bg-base'), '#0c1322')
  assert.equal(doc.documentElement.getAttribute('data-dsh-skin'), 'dsh-myskin')
  override.dispose()
})
