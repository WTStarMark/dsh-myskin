/**
 * Why an embedded image cannot be seen.
 *
 * Three failures look identical to the user ("I embedded a picture, applied, and it is not there"):
 * the anchor resolved to nothing, the page scope hides it, or the layer put it under opaque content.
 * The diagnosis has to tell them apart — a wrong verdict sends the user to fix the wrong thing.
 * jsdom has no layout engine, so rects and `elementsFromPoint` are stubbed here on purpose.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { loadTs } from './helpers/load-ts.mjs'

const diag = await loadTs('src/client/image-diag.ts')

const FIXTURE = [
  '<!doctype html><html><body>',
  '<div class="settingsRoot">',
  '  <nav><button>账号</button><button aria-current="true">皮肤管理</button></nav>',
  '  <div id="host"><div id="row"><span id="label">一行</span></div></div>',
  '</div>',
  '</body></html>',
].join('')

/**
 * Install a fresh document and hand out an image record anchored to an element id.
 * @param selector - the element the image is anchored to.
 * @param extra - extra image fields.
 * @returns the window plus the image record.
 */
function setup(selector = '#host', extra = {}) {
  const dom = new JSDOM(FIXTURE, { pretendToBeVisual: true })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  const doc = dom.window.document
  /** jsdom measures nothing; give the host a box the diagnosis can reason about. */
  const rect = (el, box) => { el.getBoundingClientRect = () => ({ ...box, left: box.x, top: box.y, right: box.x + box.width, bottom: box.y + box.height }) }
  rect(doc.getElementById('host'), { x: 100, y: 50, width: 300, height: 200 })
  rect(doc.getElementById('row'), { x: 100, y: 50, width: 300, height: 40 })
  const img = {
    id: 'e1',
    selector: '[data-dsh-myskin-embed="e1"]',
    fallbackSelector: '',
    anchor: { kind: 'element', value: selector },
    url: 'data:image/gif;base64,AAA',
    x: 0, y: 0, w: 120, h: 80,
    ...extra,
  }
  doc.getElementById('host').setAttribute('data-dsh-myskin-embed', 'e1')
  return { window: dom.window, doc, img }
}

test('an anchor that resolves to nothing is reported as such', () => {
  const { doc, img } = setup('#missing')
  assert.equal(diag.diagnoseEmbeddedImage(img, doc, true).verdict, 'unresolved')
})

test('page scoping is reported only when the image asked for it', () => {
  const { doc, img } = setup('#host', { pageKey: '模型' })
  // Not opted in: the recorded page is information, not a switch — the image is painted.
  assert.equal(diag.diagnoseEmbeddedImage(img, doc, true).verdict, 'ok')
  const verdict = diag.diagnoseEmbeddedImage(img, doc, true, 3, 0, true)
  assert.equal(verdict.verdict, 'page-scope', 'the current page is 皮肤管理')
  assert.equal(verdict.host.id, 'host')
  // On its own page it is fine — and the stored key may come from the older label@position format.
  const home = diag.diagnoseEmbeddedImage({ ...img, pageKey: '皮肤管理@1' }, doc, true, 3, 0, true)
  assert.equal(home.verdict, 'ok', 'same label, different position: still its page')
})

test('the below-content layer is blamed only when a descendant really covers the picture', () => {
  const { doc, img } = setup()
  assert.equal(diag.diagnoseEmbeddedImage(img, doc, true).verdict, 'ok', 'above the content: never covered')
  // Nothing under the pointer: the picture shows through (the host itself is hit, not a child).
  doc.elementsFromPoint = () => [doc.getElementById('host')]
  assert.equal(diag.diagnoseEmbeddedImage(img, doc, false).verdict, 'ok')
  // A child of the host is hit first: with z-index -1 it paints over the picture.
  doc.elementsFromPoint = () => [doc.getElementById('label'), doc.getElementById('row'), doc.getElementById('host')]
  const covered = diag.diagnoseEmbeddedImage(img, doc, false)
  assert.equal(covered.verdict, 'covered')
  assert.equal(covered.cover.id, 'label')
  // …and the very same hit is harmless when the picture is configured ABOVE the content.
  assert.equal(diag.diagnoseEmbeddedImage(img, doc, true).verdict, 'ok')
})

test('a feather reaches outside the box, so it can be what gets clipped', () => {
  const { doc, img } = setup()
  doc.elementsFromPoint = () => [doc.getElementById('host')]
  assert.equal(diag.diagnoseEmbeddedImage(img, doc, true).verdict, 'ok')
  // The host is 300x200; move the 120x80 picture to 50,50 so the box has room around it, and the
  // feather becomes the thing that pushes it past the container.
  const inset = { ...img, x: 50, y: 50 }
  assert.equal(diag.diagnoseEmbeddedImage(inset, doc, true, 3, 40).verdict, 'ok', '40px still fits')
  assert.equal(diag.diagnoseEmbeddedImage(img, doc, true, 3, 1).verdict, 'clipped', 'at the very corner any feather reaches outside')
  const clipped = diag.diagnoseEmbeddedImage(inset, doc, true, 3, 200)
  assert.equal(clipped.verdict, 'clipped')
  assert.equal(clipped.feather, 200)
  // Below the content, the feather widens the area a covering descendant can hide.
  doc.elementsFromPoint = () => [doc.getElementById('label'), doc.getElementById('host')]
  assert.equal(diag.diagnoseEmbeddedImage(img, doc, false, 3, 20).verdict, 'covered')
  assert.equal(diag.diagnoseEmbeddedImage(inset, doc, true, 3, 20).verdict, 'ok', 'above the content it stays visible')
})

test('a picture bigger than its host is reported as clipped, with the numbers', () => {
  const { doc, img } = setup()
  doc.elementsFromPoint = () => [doc.getElementById('host')]
  const verdict = diag.diagnoseEmbeddedImage({ ...img, w: 400, h: 300 }, doc, true)
  assert.equal(verdict.verdict, 'clipped')
  assert.deepEqual(verdict.hostSize, { w: 300, h: 200 })
  assert.deepEqual(verdict.box, { x: 0, y: 0, w: 400, h: 300 })
  // A host jsdom cannot measure must not be reported as clipped.
  const other = setup()
  other.doc.getElementById('host').getBoundingClientRect = () => ({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0, right: 0, bottom: 0 })
  assert.equal(diag.diagnoseEmbeddedImage(other.img, other.doc, true).verdict, 'ok')
})
