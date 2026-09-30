/**
 * 组件嵌入 vs 组件锚定 — the two ways an embedded image can be painted.
 *
 * 组件嵌入 (embed) is the 0.3.8 behaviour: a ::after INSIDE the anchored component, clipped with
 * it. 组件锚定 (anchor) paints on a skin-owned, pointer-transparent layer OUTSIDE the component,
 * so nothing about the host element's own position/overflow has to change. These tests pin that
 * split — including the one thing that is easy to get wrong: an anchored image must leave the
 * host element completely alone, and the layer must vanish byte-exactly on dispose.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { loadTs } from './helpers/load-ts.mjs'

const engine = await loadTs('src/client/skin-engine.ts')
const schema = await loadTs('src/skin-schema.ts')

/**
 * Install a fresh jsdom document as the global DOM.
 * @param html - body markup.
 * @returns the jsdom window.
 */
function setup(html) {
  const dom = new JSDOM('<!doctype html><html><head></head><body>' + html + '</body></html>', { pretendToBeVisual: true })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.Node = dom.window.Node
  globalThis.Element = dom.window.Element
  globalThis.MutationObserver = dom.window.MutationObserver
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)
  return dom.window
}

const fakeTheme = () => ({ overrideTokens: () => () => {} })
/** A skin document with exactly these images. */
const skinWith = (images) => ({
  enabled: true, tokens: {}, css: [], text: [], layers: [], library: [],
  canvas: { background: undefined, images },
})
/** One embedded image; only the parts a test cares about are overridden. */
const IMG = {
  id: 'e1',
  selector: '[data-dsh-myskin-embed="e1"]',
  url: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
  x: 0, y: 0, w: 40, h: 20,
}
const SEAT = '<div id="root"><div data-composer-seat id="seat"></div></div>'

test('the painting mode defaults to 组件嵌入 and is only anchor when asked for', () => {
  assert.equal(schema.imageModeOf(IMG), 'embed')
  assert.equal(schema.imageModeOf({ ...IMG, mode: 'anchor' }), 'anchor')
  // Anything else (a document from a newer build, a typo) must not silently become "outside".
  assert.equal(schema.imageModeOf({ ...IMG, mode: 'whatever' }), 'embed')
})

test('组件锚定 paints on a tracked layer and leaves the host element alone', () => {
  const window = setup(SEAT)
  const doc = window.document
  const before = doc.body.outerHTML
  const image = {
    ...IMG, mode: 'anchor', fallbackSelector: '',
    anchor: { kind: 'component', value: 'composer' },
    x: 4, y: -6, w: 30, h: 20, opacity: 0.5, blend: 'multiply',
  }
  const override = engine.applySkin(fakeTheme(), skinWith([image]))
  // No rule at all: an anchored image is not painted into the component…
  assert.equal(doc.getElementById('dsh-myskin-rule'), null)
  // …and no tag either — the component keeps its own position/overflow untouched.
  assert.equal(doc.getElementById('seat').getAttribute('data-dsh-myskin-embed'), null)
  const host = doc.querySelector('[' + engine.OVERLAY_ATTR + '="1"]')
  assert.notEqual(host, null, 'the layer exists')
  assert.equal(host.style.pointerEvents, 'none', 'a decoration must never steal a click')
  const node = doc.querySelector('[' + engine.ANCHOR_IMAGE_ATTR + '="e1"]')
  // jsdom has no layout, so every rect is zero: left/top are exactly the offsets, which is
  // what "positioned from the anchor's box" means.
  assert.equal(node.style.display, 'block')
  assert.equal(node.style.left, '4px')
  assert.equal(node.style.top, '-6px')
  assert.equal(node.style.width, '30px')
  assert.equal(node.style.height, '20px')
  assert.equal(node.style.opacity, '0.5')
  assert.equal(node.style.mixBlendMode, 'multiply')
  assert.match(node.style.backgroundImage, /^url\("data:image\/gif/)
  override.dispose()
  assert.equal(doc.body.outerHTML, before, 'dispose leaves the page byte-exact')
})

test('a document can carry both kinds side by side', () => {
  const window = setup(SEAT)
  const doc = window.document
  const before = doc.body.outerHTML
  const inside = { ...IMG, id: 'in', selector: '[data-dsh-myskin-embed="in"]', fallbackSelector: '#seat', anchor: { kind: 'element', value: '#seat' } }
  const outside = { ...IMG, id: 'out', selector: '[data-dsh-myskin-embed="out"]', mode: 'anchor', fallbackSelector: '', anchor: { kind: 'component', value: 'composer' } }
  const override = engine.applySkin(fakeTheme(), skinWith([inside, outside]))
  const sheet = doc.getElementById('dsh-myskin-rule').textContent
  assert.match(sheet, /\[data-dsh-myskin-embed="in"\] \{ position: relative; \}/)
  assert.doesNotMatch(sheet, /data-dsh-myskin-embed="out"/, 'the anchored image emits no CSS')
  assert.equal(doc.getElementById('seat').getAttribute('data-dsh-myskin-embed'), 'in')
  assert.notEqual(doc.querySelector('[data-dsh-myskin-anchor-image="out"]'), null)
  assert.equal(doc.querySelector('[data-dsh-myskin-anchor-image="in"]'), null, 'an embedded image needs no layer node')
  override.dispose()
  assert.equal(doc.body.outerHTML, before)
})

test('the anchor layer follows its component and hides when it cannot', () => {
  const window = setup(SEAT)
  const doc = window.document
  let images = [{ ...IMG, mode: 'anchor', fallbackSelector: '', anchor: { kind: 'component', value: 'composer' } }]
  const overlay = engine.mountImageOverlay(() => images, doc)
  const node = doc.querySelector('[data-dsh-myskin-anchor-image="e1"]')
  assert.equal(node.style.display, 'block')
  // The caller's live view is what sync reads: a drag updates the offsets without remounting.
  images = [{ ...images[0], x: 12, y: 3, w: 50, h: 50 }]
  overlay.sync()
  assert.equal(node.style.left, '12px')
  assert.equal(node.style.top, '3px')
  assert.equal(node.style.width, '50px')
  // The anchor leaves the page (settings page switch, unmounted section): hide, never misplace.
  doc.getElementById('seat').remove()
  overlay.sync()
  assert.equal(node.style.display, 'none')
  // An image that is no longer in the list loses its node.
  images = []
  overlay.sync()
  assert.equal(doc.querySelector('[data-dsh-myskin-anchor-image="e1"]'), null)
  overlay.dispose()
  assert.equal(doc.querySelector('[' + engine.OVERLAY_ATTR + ']'), null)
})

test('a page-scoped anchored image stays off the pages it does not belong to', () => {
  const window = setup(SEAT)
  const doc = window.document
  const image = { ...IMG, mode: 'anchor', fallbackSelector: '', anchor: { kind: 'component', value: 'composer' }, pageKey: 'plugins' }
  const overlay = engine.mountImageOverlay(() => [image], doc)
  const node = doc.querySelector('[data-dsh-myskin-anchor-image="e1"]')
  assert.equal(node.style.display, 'none', 'the current page is not the one it was embedded on')
  overlay.dispose()
})

test('整组 anchor paints one node per member of the block', () => {
  const window = setup('<div id="root"><div class="seat" data-composer-seat></div><div class="seat" data-composer-seat></div></div>')
  const doc = window.document
  // Same picture on every member: the outside layer needs one node per element, not one node.
  const image = { ...IMG, mode: 'anchor', fallbackSelector: '', anchor: { kind: 'group', value: '[data-composer-seat]' } }
  const overlay = engine.mountImageOverlay(() => [image], doc)
  const nodes = doc.querySelectorAll('[data-dsh-myskin-anchor-image="e1"]')
  assert.equal(nodes.length, 2)
  for (const node of nodes) assert.equal(node.style.display, 'block')
  overlay.dispose()
  assert.equal(doc.querySelector('[' + engine.OVERLAY_ATTR + ']'), null)
})

test('the editor owns the embed tags while it is open', () => {
  const window = setup(SEAT)
  const doc = window.document
  const canvas = doc.createElement('div')
  canvas.setAttribute('data-dsh-myskin-canvas', '1')
  doc.body.appendChild(canvas)
  const image = { ...IMG, fallbackSelector: '#seat', anchor: { kind: 'element', value: '#seat' } }
  const override = engine.applySkin(fakeTheme(), skinWith([image]))
  // The canvas editor previews the DRAFT (it may have moved or deleted this image); the engine
  // re-tagging from the committed document here would undo that preview one mutation later.
  assert.equal(doc.getElementById('seat').getAttribute('data-dsh-myskin-embed'), null)
  canvas.remove()
  override.dispose()
})
