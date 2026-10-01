/**
 * The dock side: which edge the drawing chrome takes, and what remembers it.
 *
 * The editor used to be right-only, which quietly broke a whole class of components: anything a
 * plugin pins to the window edge does not move when the page is inset, so the panel landed on top
 * of it. Switching sides is the fix, and these tests pin the three properties that make the switch
 * cheap and safe — one attribute on <html> owns the layout, the preference is remembered OUTSIDE
 * the skin document, and neither a corrupt value nor an unreadable storage can break the editor.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { loadTs } from './helpers/load-ts.mjs'

const dock = await loadTs('src/client/dock.ts')
const desktop = await loadTs('src/client/desktop.ts')
const canvasUi = await loadTs('src/client/canvas-ui.ts')

/**
 * A storage stub that behaves like the real one for one key.
 * @param initial - entries the storage starts with.
 * @returns a Storage-shaped object plus its backing map.
 */
function storage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)) },
  }
}

test('the side defaults to the right and survives a round trip', () => {
  const store = storage()
  assert.equal(dock.DEFAULT_DOCK, 'right')
  assert.equal(dock.readDockSide(store), 'right')
  dock.writeDockSide(store, 'left')
  assert.equal(store.map.get(dock.DOCK_STORAGE_KEY), 'left')
  assert.equal(dock.readDockSide(store), 'left')
  assert.equal(dock.otherDock('left'), 'right')
  assert.equal(dock.otherDock('right'), 'left')
})

test('a corrupt value or a hostile storage never breaks the editor', () => {
  assert.equal(dock.isDockSide('left'), true)
  assert.equal(dock.isDockSide('right'), true)
  assert.equal(dock.isDockSide('middle'), false)
  assert.equal(dock.isDockSide(undefined), false)
  assert.equal(dock.readDockSide(storage({ [dock.DOCK_STORAGE_KEY]: 'sideways' })), 'right')
  assert.equal(dock.readDockSide(storage({ [dock.DOCK_STORAGE_KEY]: '' })), 'right')
  assert.equal(dock.readDockSide(undefined), 'right')
  // Safari private mode / a blocked context throws on ACCESS — the editor must not care.
  const hostile = {
    getItem() { throw new Error('denied') },
    setItem() { throw new Error('denied') },
  }
  assert.equal(dock.readDockSide(hostile), 'right')
  assert.doesNotThrow(() => dock.writeDockSide(hostile, 'left'))
  assert.doesNotThrow(() => dock.browserStorage())
})

test('the side is ONE attribute on <html>, and unmount takes it back off', () => {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>')
  const doc = dom.window.document
  assert.equal(doc.documentElement.hasAttribute(dock.DOCK_ATTRIBUTE), false)
  dock.applyDockAttribute(doc, 'left')
  assert.equal(doc.documentElement.getAttribute('data-dsh-myskin-dock'), 'left')
  dock.applyDockAttribute(doc, 'right')
  assert.equal(doc.documentElement.getAttribute('data-dsh-myskin-dock'), 'right')
  dock.clearDockAttribute(doc)
  // Nothing of the editor may be left on the page: the frame rules are gated on this attribute.
  assert.equal(doc.documentElement.outerHTML.includes('data-dsh-myskin-dock'), false)
})

test('the attribute the editor writes is the one the stylesheets match on', () => {
  // The seam between three files: dock.ts publishes the side, desktop.ts lays the page out for it
  // and canvas-ui.ts mirrors the panel. Nothing shares the CSS text, so this is the test that says
  // a rename in one of them cannot silently leave the other two matching nothing.
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>')
  const doc = dom.window.document
  const shell = desktop.readDesktopShell(doc)
  const frame = desktop.editorFrameRules(shell).join('\n')
  const ui = canvasUi.canvasUiRules()
  for (const side of ['left', 'right']) {
    dock.applyDockAttribute(doc, side)
    const written = doc.documentElement.getAttributeNames().find((name) => name.startsWith('data-dsh-myskin'))
    // Quote style is the author's choice; the attribute name and value are the contract.
    const gated = ['\'', '"'].map((quote) => 'html[' + written + '=' + quote + side + quote + ']')
    assert.ok(gated.some((selector) => frame.includes(selector)), side + ': the frame rules are gated on ' + gated[0])
    // The panel stylesheet carries the RIGHT layout ungated (it is the default) and overrides the
    // left one, so only the mirror has to match the attribute.
    if (side === 'left') assert.ok(gated.some((selector) => ui.includes(selector)), side + ': the panel mirror is gated on ' + gated[0])
  }
})
