/**
 * 还原默认 — what "restore the default look" is allowed to touch.
 *
 * The two problems this pins down (both reported from the settings page and from draw mode):
 *   1. the identity document must be the native look — nothing of the skin left;
 *   2. it must NOT eat the user's skin library. Saved skins (with their canvases and images) are
 *      user data; a one-click restore that deletes them is a data-loss bug, not a feature.
 * The document it produces also has to be storable by the Host, so it is checked against the very
 * schema DSH validates the settings entry with.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs, schemasteryEntry } from './helpers/load-ts.mjs'

const entry = schemasteryEntry()
const alias = entry === undefined ? {} : { '@deepseek-ai/schemastery': entry }
const skip = entry === undefined ? 'no local DSH schemastery (set DSH_INSTALL)' : false

const skin = await loadTs('src/skin-schema.ts')
const host = await loadTs('src/host-schema.ts', alias)

/**
 * Resolve a volatile field accessor the way DSH's plainConfig() does.
 * @param value - schema output or stored value.
 * @returns the detached plain value.
 */
function plain(value) {
  if (value === null || typeof value !== 'object') return value
  if (typeof value.get === 'function') return plain(value.get())
  if (Array.isArray(value)) return value.map(plain)
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, plain(child)]))
}

/** A document with every layer in use, plus two saved skins. */
function loaded() {
  return {
    enabled: true,
    tokens: { '--dsw-alias-bg-base': { light: '#fff', dark: '#000' } },
    css: [{ selector: '#hero', rule: 'color: red' }],
    text: [{ selector: '#hero', before: 'Hello', after: '你好' }],
    canvas: { background: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', backgroundOpacity: 0.8, images: [] },
    layers: [{ id: 'char', kind: 'div', selector: '#app', attach: 'append' }],
    content: { workspaceTree: true },
    library: [
      { id: 'skin-1', name: '深海', tokens: { '--dsw-alias-bg-base': { light: '#f4f7fb', dark: '#0c1322' } }, css: [], text: [], canvas: { images: [] }, layers: [] },
      { id: 'skin-2', name: '暖阳', tokens: {}, css: [{ selector: '#a', rule: 'color: blue' }], text: [], canvas: { images: [] }, layers: [] },
    ],
  }
}

test('EMPTY_SKIN stays the truly empty document (the library included)', () => {
  assert.deepEqual(skin.EMPTY_SKIN.library, [], 'callers that mean "nothing at all" still get nothing')
  assert.equal(skin.EMPTY_SKIN.enabled, false)
})

test('resetSkin clears every layer of the look', () => {
  const next = skin.resetSkin(loaded())
  assert.equal(next.enabled, false, 'a restored document paints nothing')
  assert.deepEqual(next.tokens, {})
  assert.deepEqual(next.css, [])
  assert.deepEqual(next.text, [])
  assert.deepEqual(next.layers, [])
  assert.deepEqual(next.canvas.images, [])
  assert.equal(next.canvas.background, undefined)
})

test('resetSkin keeps the skin library, as an independent copy', () => {
  const before = loaded()
  const next = skin.resetSkin(before)
  assert.deepEqual(next.library.map((s) => s.id), ['skin-1', 'skin-2'])
  assert.equal(next.library[0].name, '深海')
  assert.deepEqual(next.library[1].css, [{ selector: '#a', rule: 'color: blue' }])
  assert.notEqual(next.library, before.library, 'the caller\'s document must not be shared')
  assert.notEqual(next.library[0], before.library[0])
  // Mutating the reset result cannot reach back into the document it came from.
  next.library[0].name = 'mutated'
  next.library[0].canvas.images.push({ id: 'x' })
  assert.equal(before.library[0].name, '深海')
  assert.deepEqual(before.library[0].canvas.images, [])
})

test('resetSkin without a document is the bare identity document', () => {
  const next = skin.resetSkin()
  assert.deepEqual(next.library, [])
  assert.equal(next.enabled, false)
})

test('the restored document is one the Host accepts, library and all', { skip }, () => {
  const value = plain(host.Config(skin.resetSkin(loaded())))
  assert.equal(value.enabled, false)
  assert.deepEqual(value.tokens, {})
  assert.deepEqual(value.css, [])
  assert.deepEqual(value.canvas.images, [])
  assert.equal(value.canvas.background, undefined)
  assert.deepEqual(value.library.map((s) => s.id), ['skin-1', 'skin-2'])
})
