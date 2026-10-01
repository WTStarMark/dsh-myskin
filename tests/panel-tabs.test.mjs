/**
 * Panel tabs.
 *
 * The panel used to hold every kind of edit in one column; the tabs separate them. Two behaviours are
 * worth pinning: an unknown id (written by a newer build, or hand-edited) must not render an empty
 * panel, and a storage that throws (private mode) must not take the editor down with it.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'

const tabs = await loadTs('src/client/panel-tabs.ts')

/** A Map-backed storage stub. */
function storage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, value) },
    dump: () => Object.fromEntries(map),
  }
}

test('every kind of edit has its own tab, in a fixed order', () => {
  assert.deepEqual([...tabs.PANEL_TABS], ['variant', 'component', 'image', 'text', 'markdown', 'region', 'look'], 'variant leads: it is the tab that needs no CSS knowledge')
  for (const tab of tabs.PANEL_TABS) assert.equal(typeof tabs.PANEL_TAB_LABEL[tab], 'string', tab)
})

test('a remembered tab round-trips, and an unknown one falls back to the inspector', () => {
  const store = storage()
  assert.equal(tabs.readPanelTab(store), 'variant', 'nothing stored yet: the no-CSS tab')
  tabs.writePanelTab(store, 'markdown')
  assert.equal(store.dump()[tabs.PANEL_TAB_STORAGE_KEY], 'markdown')
  assert.equal(tabs.readPanelTab(store), 'markdown')
  assert.equal(tabs.readPanelTab(storage({ [tabs.PANEL_TAB_STORAGE_KEY]: 'from-a-newer-build' })), 'variant')
  assert.equal(tabs.readPanelTab(storage({ [tabs.PANEL_TAB_STORAGE_KEY]: '' })), 'variant')
})

test('a hostile or missing storage is survivable', () => {
  const boom = { getItem() { throw new Error('denied') }, setItem() { throw new Error('denied') } }
  assert.equal(tabs.readPanelTab(boom), 'variant')
  tabs.writePanelTab(boom, 'image')
  assert.equal(tabs.readPanelTab(undefined), 'variant')
  tabs.writePanelTab(undefined, 'look')
  assert.equal(tabs.isPanelTab('image'), true)
  assert.equal(tabs.isPanelTab(null), false)
})
