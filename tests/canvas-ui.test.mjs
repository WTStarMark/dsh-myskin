/**
 * The draw-mode chrome stylesheet: motion and looks that must not cost frames.
 *
 * The editor paints over the LIVE DSH page, so the interesting properties here are
 * negative ones — nothing may animate layout (width/height/top/left/padding/margin) and
 * nothing may blur the app behind it (backdrop-filter), because either would turn a
 * cosmetic effect into per-frame layout/paint work over the whole application.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { loadTs } from './helpers/load-ts.mjs'

const ui = await loadTs('src/client/canvas-ui.ts')

/** Install a fresh jsdom document as the global DOM. */
function setup() {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="app"></div></body></html>', { pretendToBeVisual: true })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.Node = dom.window.Node
  return dom.window
}

const RULES = ui.canvasUiRules()

test('the editor stylesheet animates only compositor-friendly properties', () => {
  const frames = [...RULES.matchAll(/@keyframes[^{]+{([^}]*}[^}]*)}/g)].map((m) => m[1])
  assert.ok(frames.length >= 4, 'expected the entrance/landing keyframes')
  for (const frame of frames) {
    assert.doesNotMatch(frame, /(^|[^-])(width|height|top|left|right|bottom|margin|padding|border-width)\s*:/, 'layout must never be animated')
    assert.match(frame, /(opacity|transform)\s*:/, 'keyframes should only carry opacity/transform')
  }
  // Blurring the live page behind a moving surface is the one effect that would be
  // genuinely expensive here; the token surface is used instead.
  assert.doesNotMatch(RULES, /backdrop-filter/)
  assert.doesNotMatch(RULES, /transition:\s*all/)
  // The panel folds with a fade/slide: its width feeds the page inset through a
  // ResizeObserver, so an animated width would re-layout the app every frame.
  assert.match(RULES, /\.dsh-myskin-panel\[data-open="0"\]\s*\{[^}]*transform: translateX/)
  assert.doesNotMatch(RULES, /transition:[^;]*(width|height|margin|padding)/)
})

test('the editor stylesheet respects prefers-reduced-motion and uses DSH tokens', () => {
  assert.match(RULES, /@media \(prefers-reduced-motion: reduce\)/)
  const reduced = RULES.slice(RULES.indexOf('@media (prefers-reduced-motion: reduce)'))
  for (const cls of ['dsh-myskin-bar', 'dsh-myskin-panel', 'dsh-myskin-box', 'dsh-myskin-chip', 'dsh-myskin-dot']) {
    assert.ok(reduced.includes(cls), 'reduced motion must cover ' + cls)
  }
  assert.doesNotMatch(RULES, /#[0-9a-fA-F]{3,8}\b/, 'colours come from --dsw-alias-* tokens, not hard-coded hex')
})

test('mountCanvasUi injects exactly one owned tag and removes it again', () => {
  const window = setup()
  const doc = window.document
  const before = doc.head.innerHTML
  const dispose = ui.mountCanvasUi(doc)
  const tag = doc.getElementById(ui.CANVAS_UI_STYLE_ID)
  assert.notEqual(tag, null)
  assert.equal(doc.querySelectorAll('style#' + ui.CANVAS_UI_STYLE_ID).length, 1)
  // Mounting twice (a re-open before the previous teardown) must not stack stylesheets.
  const dispose2 = ui.mountCanvasUi(doc)
  assert.equal(doc.querySelectorAll('style').length, 2)
  dispose2()
  dispose()
  assert.equal(doc.head.innerHTML, before)
})

test('the wheel nudge reads direction and Shift, and stops the panel scrolling', () => {
  assert.deepEqual(ui.wheelStep(-100, false), { direction: 1, big: false })
  assert.deepEqual(ui.wheelStep(100, true), { direction: -1, big: true })
  assert.equal(ui.wheelStep(0, false), undefined)
  const window = setup()
  const doc = window.document
  const host = doc.createElement('span')
  const input = doc.createElement('input')
  host.appendChild(input)
  doc.body.appendChild(host)
  const calls = []
  const dispose = ui.attachWheelNudge(host, (direction, big) => calls.push([direction, big]))
  const wheel = (deltaY, shiftKey) => {
    const event = new window.WheelEvent('wheel', { deltaY, shiftKey, bubbles: true, cancelable: true })
    input.dispatchEvent(event)
    return event
  }
  // The event bubbles from the input to the wrapper, and defaultPrevented is what keeps
  // the panel from scrolling under the pointer (React's passive onWheel cannot do this).
  assert.equal(wheel(-120, false).defaultPrevented, true)
  assert.equal(wheel(120, true).defaultPrevented, true)
  assert.deepEqual(calls, [[1, false], [-1, true]])
  // A zero-delta event is left alone: nothing to step, nothing to swallow.
  assert.equal(wheel(0, false).defaultPrevented, false)
  assert.equal(calls.length, 2)
  dispose()
  wheel(-120, false)
  assert.equal(calls.length, 2)
})

test('the picking cursor is a root attribute, so it is trivially reversible', () => {
  const window = setup()
  const doc = window.document
  assert.equal(doc.documentElement.hasAttribute(ui.CANVAS_UI_ATTR), false)
  ui.setDrawCursor(doc, true)
  assert.equal(doc.documentElement.getAttribute(ui.CANVAS_UI_ATTR), '1')
  assert.match(RULES, /html\[data-dsh-myskin-draw="1"\] body/)
  ui.setDrawCursor(doc, false)
  assert.equal(doc.documentElement.hasAttribute(ui.CANVAS_UI_ATTR), false)
  assert.equal(doc.documentElement.outerHTML.includes('data-dsh-myskin-draw'), false)
})
