/**
 * What the panel is covering.
 *
 * The chrome insets the page, so the app's own layout never sits under the panel — but an element
 * pinned to the window edge does NOT move with the body, and that is exactly the component a user
 * cannot reach (or see) while the panel is open. These tests pin the decision and the two
 * properties that keep the scan honest: the grid stays inside the panel and never runs away with
 * its size, and an engine with no hit test answers "nothing" instead of throwing.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { loadTs } from './helpers/load-ts.mjs'

const occ = await loadTs('src/client/occlusion.ts')

/**
 * A document shaped like the real one, plus the editor's own own-element predicate.
 * @returns the document, the predicate and a shorthand for elements by id.
 */
function fixture() {
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body>'
    + '<div data-dsh-myskin-ui="1" id="chrome"></div>'
    + '<div id="root"><div id="app"><div id="plugin"><button id="deep">Send</button></div></div></div>'
    + '</body></html>',
  )
  const doc = dom.window.document
  const isOwn = (el) =>
    el.getAttribute('data-dsh-myskin-ui') === '1'
    || el.closest('[data-dsh-myskin-ui="1"]') !== null
    || el === doc.body || el === doc.documentElement || el === doc.getElementById('root')
  return { doc, isOwn, byId: (id) => doc.getElementById(id) }
}

test('the topmost element under our chrome is the one that counts', () => {
  const { doc, isOwn, byId } = fixture()
  // elementsFromPoint order: hit node first, ancestors after, document roots last.
  const stack = [byId('chrome'), byId('deep'), byId('plugin'), byId('app'), byId('root'), doc.body, doc.documentElement]
  assert.equal(occ.occludingElement(stack, isOwn), byId('deep'))
  // Our own UI never counts, however deep it is.
  assert.equal(occ.occludingElement([byId('chrome')], isOwn), undefined)
})

test('a point that only reaches our chrome and the page covers nothing', () => {
  const { doc, isOwn, byId } = fixture()
  // This is the normal case everywhere the panel is: the page is INSET, so nothing of the app is
  // painted under it and the stack ends at the roots.
  const stack = [byId('chrome'), byId('root'), doc.body, doc.documentElement]
  assert.equal(occ.occludingElement(stack, isOwn), undefined)
  assert.equal(occ.occludingElement([], isOwn), undefined)
})

test('the sampling grid stays inside the panel and scales with its shape', () => {
  const panel = { left: 100, top: 60, width: 340, height: 700 }
  const points = occ.panelSamplePoints(panel)
  assert.equal(points.length, occ.SAMPLE_COLUMNS * occ.SAMPLE_ROWS)
  for (const point of points) {
    assert.ok(point.x > panel.left && point.x < panel.left + panel.width, 'x inside the panel: ' + point.x)
    assert.ok(point.y > panel.top && point.y < panel.top + panel.height, 'y inside the panel: ' + point.y)
  }
  // A panel folded to nothing has no interior: the scan must not fire on its edge.
  assert.deepEqual(occ.panelSamplePoints({ left: 0, top: 0, width: 8, height: 700 }), [])
  assert.deepEqual(occ.panelSamplePoints({ left: 0, top: 0, width: 340, height: 12 }), [])
  // An explicit grid is honoured (tests and a future coarse/fine switch).
  assert.equal(occ.panelSamplePoints(panel, { columns: 1, rows: 1 }).length, 1)
})

test('the scan dedupes, and answers "nothing" when the engine cannot hit-test', () => {
  const { doc, isOwn, byId } = fixture()
  const chrome = byId('chrome')
  const plugin = byId('plugin')
  const calls = []
  // jsdom implements no hit test at all: the wrapper must not throw, it must report nothing.
  assert.deepEqual(occ.occludedBehindPanel({ left: 0, top: 0, width: 340, height: 700 }, doc, isOwn), [])
  doc.elementsFromPoint = (x, y) => {
    calls.push([x, y])
    // The plugin panel covers the top half; the bottom half only reaches the page itself.
    return y < 400 ? [chrome, plugin, byId('root'), doc.body, doc.documentElement] : [chrome, byId('root'), doc.body, doc.documentElement]
  }
  const found = occ.occludedBehindPanel({ left: 0, top: 0, width: 340, height: 700 }, doc, isOwn)
  assert.deepEqual(found, [plugin], 'one element, however many points hit it')
  assert.equal(calls.length, occ.SAMPLE_COLUMNS * occ.SAMPLE_ROWS)
})

test('the same-answer comparison is what stops the timer re-rendering the toolbar', () => {
  const { byId } = fixture()
  const a = byId('plugin')
  assert.equal(occ.sameElements([], []), true)
  assert.equal(occ.sameElements([a], [a]), true)
  assert.equal(occ.sameElements([a], []), false)
  assert.equal(occ.sameElements([], [a]), false)
  const b = byId('deep')
  assert.equal(occ.sameElements([a], [b]), false)
  assert.equal(occ.sameElements([a, b], [b, a]), false)
})
