/**
 * Interop with the wallpaper plugin (`dsh-plugin-wallpaper-engine`).
 *
 * The two plugins paint the same pixels and must agree without importing each other. The contract
 * is two DOM markers (see src/client/interop.ts): we publish `html[data-dsh-skin]` while a skin
 * is on stage and their client yields; we read their `body[data-we-wallpaper]` and stand our own
 * wallpaper down. These tests pin both directions AND the rule that neither side ever writes the
 * other's marker.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { loadTs } from './helpers/load-ts.mjs'

const interop = await loadTs('src/client/interop.ts')
const engine = await loadTs('src/client/skin-engine.ts')

const FIXTURE = '<!doctype html><html><head></head><body data-ds-dark-theme=""><div id="app"><span id="hero">Hello</span></div></body></html>'

/**
 * Install a fresh jsdom document as the global DOM.
 * @param html - the document to install.
 * @returns the jsdom window.
 */
function setup(html = FIXTURE) {
  const dom = new JSDOM(html, { pretendToBeVisual: true })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.Node = dom.window.Node
  globalThis.MutationObserver = dom.window.MutationObserver
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)
  return dom.window
}

/**
 * Minimal stand-in for ctx.theme.
 * @returns the fake registry.
 */
function fakeTheme() {
  return { overrideTokens() { return () => {} } }
}

/** Let queued MutationObserver microtasks run. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

const WALL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='
const SKIN = {
  enabled: true,
  tokens: { '--dsw-alias-bg-base': { light: '#101010', dark: '#202020' } },
  css: [{ selector: '#hero', rule: 'color: red' }],
  text: [],
  canvas: { background: WALL, backgroundOpacity: 0.75, images: [] },
  layers: [],
  library: [],
}

test('the skin marker is published, withdrawn, and never clobbers another plugin\'s', () => {
  const window = setup()
  const root = window.document.documentElement
  interop.publishSkinMarker(window.document, true)
  assert.equal(root.getAttribute('data-dsh-skin'), 'dsh-myskin')
  interop.publishSkinMarker(window.document, false)
  assert.equal(root.hasAttribute('data-dsh-skin'), false)
  // Idempotent: withdrawing an absent marker is a no-op, not an error.
  interop.publishSkinMarker(window.document, false)
  assert.equal(root.hasAttribute('data-dsh-skin'), false)
  // Another skin plugin's marker is somebody else's business: read-only both ways.
  root.setAttribute('data-dsh-skin', 'dsh-skins')
  interop.publishSkinMarker(window.document, true)
  assert.equal(root.getAttribute('data-dsh-skin'), 'dsh-skins', 'an active publish must not overwrite it')
  interop.publishSkinMarker(window.document, false)
  assert.equal(root.getAttribute('data-dsh-skin'), 'dsh-skins', 'and our teardown must not remove it')
})

test('the wallpaper marker is read, and a change of it is observed until disposed', async () => {
  const window = setup()
  const body = window.document.body
  assert.equal(interop.wallpaperEngineOnStage(window.document), false)
  body.setAttribute('data-we-wallpaper', 'on')
  assert.equal(interop.wallpaperEngineOnStage(window.document), true)

  let changes = 0
  const off = interop.observeWallpaperEngine(window.document, () => { changes += 1 })
  body.removeAttribute('data-we-wallpaper')
  await flush()
  assert.equal(changes, 1, 'the engine giving the canvas back has to reach the skin')
  body.setAttribute('data-we-wallpaper', 'on')
  await flush()
  assert.equal(changes, 2)
  off()
  body.removeAttribute('data-we-wallpaper')
  await flush()
  assert.equal(changes, 2, 'a disposed observer must stay quiet')
})

test('the plugin being LOADED is recognised by the markers it always mounts', () => {
  const window = setup()
  const body = window.document.body
  assert.equal(interop.wallpaperEngineInstalled(window.document), false)
  // Each of these is unconditional in its own client half (1.3.0-r2): the glass gate, the adapter
  // target, and the wallpaper marker while one is on stage. Any one means it is installed and running.
  for (const marker of ['data-we-glass-page', 'data-we-adapter', 'data-we-wallpaper']) {
    body.setAttribute(marker, 'on')
    assert.equal(interop.wallpaperEngineInstalled(window.document), true, marker)
    body.removeAttribute(marker)
    assert.equal(interop.wallpaperEngineInstalled(window.document), false, marker)
  }

  // Loading it mid-session has to reach the skin too: 兼容模式 follows that answer.
  let changes = 0
  const off = interop.observeWallpaperEngine(window.document, () => { changes += 1 })
  body.setAttribute('data-we-glass-page', 'on')
  return flush().then(async () => {
    assert.equal(changes, 1, 'installing the plugin mid-session is a change we must see')
    body.removeAttribute('data-we-glass-page')
    await flush()
    assert.equal(changes, 2, 'and so is removing it')
    off()
  })
})

test('applySkin announces the skin while it paints and takes the announcement back', async () => {
  const window = setup()
  const root = window.document.documentElement
  const before = root.outerHTML
  const override = engine.applySkin(fakeTheme(), SKIN)
  assert.equal(root.getAttribute('html'), null)
  assert.equal(root.getAttribute('data-dsh-skin'), 'dsh-myskin', 'the wallpaper plugin has to see us')
  override.dispose()
  await flush()
  assert.equal(root.outerHTML, before, 'the marker must not outlive the skin')
})

test('a wallpaper on stage keeps the canvas, and our skin keeps painting the rest', () => {
  const window = setup()
  const doc = window.document
  // An opaque surface colour is what the translucency rules are derived from, so without one the
  // second assertion below would pass for the wrong reason.
  doc.body.style.backgroundColor = '#ffffff'
  doc.body.setAttribute('data-we-wallpaper', 'on')
  const override = engine.applySkin(fakeTheme(), SKIN)
  const css = doc.getElementById('dsh-myskin-rule')?.textContent ?? ''
  assert.doesNotMatch(css, /background-image: url\(/, 'two wallpapers at once is never the answer')
  assert.doesNotMatch(css, /--dsw-alias-bg-base: rgba\(/, 'the translucency exists only for OUR image')
  assert.match(css, /#hero \{ color: red \}/, 'everything that does not fight the wallpaper still applies')
  override.dispose()

  // …and the canvas comes back the moment they give it back.
  doc.body.removeAttribute('data-we-wallpaper')
  const again = engine.applySkin(fakeTheme(), SKIN)
  const css2 = doc.getElementById('dsh-myskin-rule')?.textContent ?? ''
  assert.match(css2, /background-image: url\(/)
  assert.match(css2, /--dsw-alias-bg-base: rgba\(/)
  again.dispose()
  assert.equal(doc.getElementById('dsh-myskin-rule'), null)
})

test('with the plugin present, an explicit 关闭 keeps the colours and only the canvas yields', () => {
  const window = setup()
  const doc = window.document
  doc.body.setAttribute('data-we-wallpaper', 'on')
  // 兼容模式 would be ON by itself here (the plugin is loaded) — this is the user who turned it off
  // and wants their palette anyway; the inbound yield still keeps their wallpaper untouched.
  const override = engine.applySkin(fakeTheme(), { ...SKIN, canvas: { images: [] }, css: engine.withCompatMode(SKIN.css, false) })
  const css = doc.getElementById('dsh-myskin-rule')?.textContent ?? ''
  assert.match(css, /#hero \{ color: red \}/)
  assert.equal(doc.body.style.getPropertyValue('--dsw-alias-bg-base'), '#202020')
  override.dispose()
})
