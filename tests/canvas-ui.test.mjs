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

test('the font list rows cannot be shrunk out of existence', () => {
  // Reported from a screenshot: "本机字体 · 224" with a scrollable but completely EMPTY list.
  // A flex item with `overflow: hidden` has an automatic minimum size of ZERO, so 224 rows in a
  // height-constrained column collapsed to their padding floor — and the row's own
  // `overflow: hidden` (there for the ellipsis) then clipped the line box away. Rows you can
  // scroll past, not one you can read.
  const row = /\[data-dsh-myskin-canvas\] \.dsh-myskin-fontpick \{([^}]*)\}/.exec(RULES)
  assert.notEqual(row, null, 'the font row rule must exist')
  assert.match(row[1], /flex:\s*none|flex-shrink:\s*0/, 'a row must never shrink')
  assert.match(row[1], /min-height:\s*\d+px/, 'a row must keep its line box')
  assert.match(row[1], /box-sizing:\s*border-box/, 'width:100% + padding must not overflow sideways')
  // The card around it is content, not rubber: without this the panel squeezes it (and, at the
  // limit, everything after it) instead of scrolling.
  const card = /\[data-dsh-myskin-canvas\] \.dsh-myskin-card \{([^}]*)\}/.exec(RULES)
  assert.match(card[1], /flex:\s*none/)
})

test('a left-docked panel mirrors its motion and its edge', () => {
  // The dock side is one attribute on <html> (dock.ts). Everything about the panel that is not the
  // page inset has to follow it, or a flip would leave the panel entering from the wrong edge with
  // its divider and shadow on the wrong side — the layout half of the same switch lives in
  // desktop.ts and is asserted there.
  const left = 'html[data-dsh-myskin-dock="left"] [data-dsh-myskin-canvas] .dsh-myskin-panel'
  assert.ok(RULES.includes(left + ' { animation-name: dsh-myskin-slide-left; box-shadow: 12px 0 28px -24px rgba(0, 0, 0, .65) }'), 'the left panel mirrors its shadow')
  assert.ok(RULES.includes(left + '[data-open="0"] { transform: translateX(-16px) }'), 'folding slides toward its own edge')
  assert.match(RULES, /@keyframes dsh-myskin-slide-left \{ from \{ opacity: 0; transform: translateX\(-14px\) \}/)
  // The right-docked defaults stay exactly as they were.
  assert.match(RULES, /\.dsh-myskin-panel \{[^}]*box-shadow: -12px 0 28px -24px/)
})

