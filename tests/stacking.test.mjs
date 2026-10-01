/**
 * Why a z-index did nothing.
 *
 * A number in a field that changes nothing is indistinguishable from a broken field, so the panel
 * reads the three things that actually decide the answer from the live page: whether the element is
 * positioned, whether an ancestor caps it with its own stacking context, and whether anything
 * overlaps it at all. These tests pin that reading, plus the two numbers the buttons offer.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { loadTs } from './helpers/load-ts.mjs'

const stacking = await loadTs('src/client/stacking.ts')

/**
 * A viewport box. jsdom has no layout engine (everything measures 0x0), so overlapping elements
 * have to be given boxes explicitly - which is exactly the input the module consumes.
 * @param left - x.
 * @param top - y.
 * @param width - w.
 * @param height - h.
 * @returns a DOMRect-shaped object.
 */
function rect(left, top, width, height) {
  return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }
}

/**
 * Install a document.
 * @param html - body markup.
 * @returns the jsdom window and document.
 */
function setup(html) {
  const dom = new JSDOM('<!doctype html><html><head></head><body>' + html + '</body></html>', { pretendToBeVisual: true })
  return { dom, doc: dom.window.document }
}

test('the reasons an element starts a stacking context, most telling first', () => {
  const at = (style) => stacking.stackingContextReason(style)
  assert.equal(at({ position: 'relative', zIndex: '5' }), 'z-index: 5')
  assert.equal(at({ position: 'fixed', zIndex: 'auto' }), 'position: fixed')
  assert.equal(at({ position: 'sticky' }), 'position: sticky')
  assert.equal(at({ position: 'static', opacity: '0.5' }), 'opacity: 0.5')
  assert.equal(at({ position: 'static', transform: 'translateZ(0)' }), 'transform')
  assert.equal(at({ position: 'static', filter: 'blur(2px)' }), 'filter')
  assert.equal(at({ position: 'static', perspective: '800px' }), 'perspective')
  assert.equal(at({ position: 'static', isolation: 'isolate' }), 'isolation: isolate')
  assert.equal(at({ position: 'static', mixBlendMode: 'multiply' }), 'mix-blend-mode: multiply')
  // Nothing that starts one.
  assert.equal(at({ position: 'static', zIndex: '5' }), undefined, 'a z-index without positioning does not stack')
  assert.equal(at({ position: 'static', opacity: '1' }), undefined)
  assert.equal(at({ position: 'static', transform: 'none' }), undefined)
  assert.equal(at({}), undefined)
})

test('only overlapping neighbours count, and the buttons get a number above and below them', () => {
  const { doc } = setup(
    '<div id="host">'
    + '<div id="me" style="position: relative"></div>'
    + '<div id="over" style="position: relative; z-index: 5"></div>'
    + '<div id="below" style="position: relative; z-index: -2"></div>'
    + '<div id="far" style="position: relative; z-index: 99"></div>'
    + '</div>',
  )
  const byId = (id) => doc.getElementById(id)
  byId('me').getBoundingClientRect = () => rect(0, 0, 100, 100)
  byId('over').getBoundingClientRect = () => rect(50, 50, 100, 100)
  byId('below').getBoundingClientRect = () => rect(-40, -40, 60, 60)
  byId('far').getBoundingClientRect = () => rect(400, 400, 10, 10)

  const report = stacking.stackingReport(byId('me'), () => false, (el) => el.id)
  assert.deepEqual(report.neighbours.map((entry) => entry.label).sort(), ['below', 'over'])
  assert.deepEqual(report.neighbours.map((entry) => entry.zIndex).sort(), ['-2', '5'])
  // Above everything it fights with, and below all of them - the two buttons.
  assert.equal(report.above, 6)
  assert.equal(report.below, -3)
  assert.equal(report.position, 'relative')
  assert.equal(report.zIndex, 'auto', 'the element itself sets no z-index')
  assert.equal(report.context, undefined, 'nothing above it stacks')
})

test('nothing overlapping is reported as such: the number cannot do anything', () => {
  const { doc } = setup('<div id="host"><div id="me" style="position: fixed"></div><div id="other"></div></div>')
  doc.getElementById('me').getBoundingClientRect = () => rect(0, 0, 10, 10)
  doc.getElementById('other').getBoundingClientRect = () => rect(500, 500, 10, 10)
  const report = stacking.stackingReport(doc.getElementById('me'), () => false, (el) => el.id)
  assert.deepEqual(report.neighbours, [])
  assert.equal(report.above, 1)
  assert.equal(report.below, -1)
  assert.equal(report.position, 'fixed')
})

test('a static element is reported as static (that is the hint the field shows)', () => {
  const { doc } = setup('<div id="host"><div id="me"></div></div>')
  const report = stacking.stackingReport(doc.getElementById('me'), () => false, (el) => el.id)
  assert.equal(report.position, 'static')
})

test('the ceiling is named: the nearest ancestor that starts a context', () => {
  const { doc } = setup(
    '<div id="outer" style="transform: translateZ(0)">'
    + '<div id="middle" style="position: relative; z-index: 3">'
    + '<div id="me"></div>'
    + '</div></div>',
  )
  const report = stacking.stackingReport(doc.getElementById('me'), () => false, (el) => el.id)
  // `middle` is nearer than `outer`, and its own z-index is the more useful thing to report.
  assert.equal(report.context, doc.getElementById('middle'))
  assert.equal(report.contextReason, 'z-index: 3')

  const viaTransform = stacking.nearestStackingContext(doc.getElementById('me'), (node) => {
    const computed = doc.defaultView.getComputedStyle(node)
    // Pretend the middle wrapper does not stack, so the walk has to reach the transform above it.
    return node.id === 'middle' ? { position: 'static' } : computed
  })
  assert.equal(viaTransform.el, doc.getElementById('outer'))
  assert.equal(viaTransform.reason, 'transform')
})

test('the own UI of the editor is never a neighbour, nor are ancestors and descendants', () => {
  const { doc } = setup(
    '<div id="host">'
    + '<div id="me" style="position: relative"></div>'
    + '<div id="mine" data-dsh-myskin-ui="1" style="position: relative; z-index: 50"></div>'
    + '<div id="wrap" style="position: relative; z-index: 7"><div id="child" style="position: relative; z-index: 9"></div></div>'
    + '</div>',
  )
  const byId = (id) => doc.getElementById(id)
  for (const id of ['me', 'mine', 'wrap', 'child']) byId(id).getBoundingClientRect = () => rect(0, 0, 50, 50)
  const isOwn = (el) => el.getAttribute('data-dsh-myskin-ui') === '1'
  const report = stacking.stackingReport(byId('me'), isOwn, (el) => el.id)
  // `wrap` overlaps and is a sibling, so it counts; the own box and the nested child do not.
  assert.deepEqual(report.neighbours.map((entry) => entry.label), ['wrap'])
  assert.equal(report.above, 8)
})
