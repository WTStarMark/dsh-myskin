/**
 * The recycle bin: removed controls have to come back.
 *
 * 「移除控件（不占位）」 writes one CSS declaration (`display: none`), so the bin is
 * DERIVED from the document's rule list instead of being a second list that can drift
 * out of sync with it. That also fixes the actual trap: a removed element is no longer
 * hit-testable, so the canvas can never select it again — without a list of what was
 * removed there is no way back at all.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { loadTs } from './helpers/load-ts.mjs'

const engine = await loadTs('src/client/skin-engine.ts')
const REMOVE = 'display: none !important'

test('the bin lists exactly the elements the document removes', () => {
  const css = [
    { selector: '#a', rule: 'color: red' },
    { selector: '#b', rule: 'color: blue; ' + REMOVE },
    { selector: '#c', rule: 'display:none' },
    { selector: '#d', rule: 'visibility: hidden !important' },
    { selector: '', rule: REMOVE },
    { selector: '#e', rule: 'display: flex; color: red' },
  ]
  // Hiding keeps the layout slot, so it is not a removal; a hand-written
  // `display:none` IS one (same meaning, whoever typed it).
  assert.deepEqual(engine.removedControls(css).map((entry) => entry.selector), ['#b', '#c'])
  assert.equal(engine.isRemovedRule(undefined), false)
  assert.equal(engine.isRemovedRule('display: none!important'), true)
  assert.equal(engine.isRemovedRule('background-image: url("display:none")'), false)
})

test('restoring one entry drops only the display declaration', () => {
  const css = [
    { selector: '#b', rule: 'color: blue; ' + REMOVE },
    { selector: '#c', rule: REMOVE },
  ]
  // Everything else the element carried stays exactly as it was, and the other bin
  // entries are untouched.
  assert.deepEqual(engine.withControlRestored(css, '#b'), [
    { selector: '#b', rule: 'color: blue' },
    { selector: '#c', rule: REMOVE },
  ])
  // The removal was that element's only customization: its entry goes away entirely,
  // while the other bin entry stays exactly as it was.
  assert.deepEqual(engine.withControlRestored(css, '#c'), [
    { selector: '#b', rule: 'color: blue; ' + REMOVE },
  ])
  // Restoring something that is not in the bin is a no-op.
  assert.deepEqual(engine.withControlRestored(css, '#zzz'), css)
  // 全部恢复: the entry that carried other customizations survives (without display),
  // the one that was nothing but a removal disappears.
  assert.deepEqual(engine.withAllControlsRestored(css), [{ selector: '#b', rule: 'color: blue' }])
  const untouched = [{ selector: '#a', rule: 'color: red' }]
  assert.deepEqual(engine.withAllControlsRestored(untouched), untouched)
  // The input list is never mutated.
  assert.equal(css[0].rule, 'color: blue; ' + REMOVE)
})

test('a removal lands in the stylesheet and the restore takes it back out', () => {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"><button id="go">Send</button></div></body></html>', { pretendToBeVisual: true })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.Node = dom.window.Node
  globalThis.MutationObserver = dom.window.MutationObserver
  const theme = { overrideTokens: () => () => {} }
  const base = {
    enabled: true, tokens: {}, text: [], canvas: { images: [] }, layers: [], library: [],
    css: [{ selector: '#go', rule: engine.mergeDeclaration('color: red', REMOVE) }],
  }
  const bin = engine.removedControls(base.css)
  assert.deepEqual(bin.map((entry) => entry.selector), ['#go'])
  const override = engine.applySkin(theme, base)
  assert.match(document.getElementById('dsh-myskin-rule').textContent, /#go \{ color: red; display: none !important \}/)
  override.dispose()
  // 恢复: the derived list is empty and the element's own rule survives.
  const restored = engine.withAllControlsRestored(base.css)
  assert.deepEqual(engine.removedControls(restored), [])
  assert.deepEqual(restored, [{ selector: '#go', rule: 'color: red' }])
  const back = engine.applySkin(theme, { ...base, css: restored })
  assert.doesNotMatch(document.getElementById('dsh-myskin-rule').textContent, /display: none/)
  back.dispose()
})
