/**
 * Host schema + browser document normalizer.
 *
 * DSH 0.1.7 derives a plugin's settings page from the exported `Config`, so the
 * schema must resolve defaults, accept a partial stored document and mark every
 * field volatile (live-editable). The client normalizes defensively on top.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs, schemasteryEntry } from './helpers/load-ts.mjs'

const entry = schemasteryEntry()
const alias = entry === undefined ? {} : { '@deepseek-ai/schemastery': entry }
const skip = entry === undefined ? 'no local DSH schemastery (set DSH_INSTALL)' : false
const host = await loadTs('src/host-schema.ts', alias)
const skin = await loadTs('src/skin-schema.ts')

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

test('Config resolves an empty document to the documented defaults', { skip }, () => {
  const value = plain(host.Config({}))
  assert.equal(value.enabled, false)
  assert.deepEqual(value.tokens, {})
  assert.deepEqual(value.css, [])
  assert.deepEqual(value.text, [])
  assert.deepEqual(value.layers, [])
  assert.deepEqual(value.library, [])
  assert.deepEqual(value.content, { workspaceTree: false })
  assert.deepEqual(value.canvas.images, [])
})

test('every top-level field is volatile so DSH accepts live form writes', { skip }, () => {
  assert.equal(host.Config.meta.volatile, undefined)
  for (const field of ['enabled', 'tokens', 'css', 'text', 'canvas', 'layers', 'content', 'library']) {
    assert.equal(host.Config.dict[field].meta.volatile, true, field + ' must be volatile')
  }
})

test('Config accepts a realistic skin document and fills nested defaults', { skip }, () => {
  const value = plain(host.Config({
    enabled: true,
    tokens: { '--dsw-alias-bg-base': { light: '#ffffff', dark: '#000000' } },
    text: [{ selector: '#hero', before: 'a', after: 'b' }],
    layers: [{ id: 'char', selector: 'body', x: 4 }],
    library: [{ id: 'one', name: 'One', layers: [{ id: 'l', selector: 'body' }] }],
  }))
  assert.equal(value.enabled, true)
  assert.equal(value.tokens['--dsw-alias-bg-base'].dark, '#000000')
  assert.equal(value.layers[0].kind, 'img')
  assert.equal(value.layers[0].x, 4)
  assert.equal(value.layers[0].attach, 'append')
  assert.equal(value.library[0].layers[0].selector, 'body')
})

test('parseSkin normalizes a partial document without mutating the input', () => {
  const input = { enabled: true, tokens: { t: { light: '#111111', dark: '#222222' } } }
  const doc = skin.parseSkin(input)
  assert.equal(doc.enabled, true)
  assert.deepEqual(doc.layers, [])
  assert.deepEqual(doc.css, [])
  assert.equal(doc.tokens.t.light, '#111111')
  assert.deepEqual(skin.parseSkin(undefined), skin.EMPTY_SKIN)
})

test('cloneSkin deep-copies the nested layers and library', () => {
  const source = skin.parseSkin({ layers: [{ id: 'a', selector: 'body' }], library: [{ id: 'x', name: 'X' }] })
  const copy = skin.cloneSkin(source)
  copy.layers[0].selector = '#changed'
  copy.library[0].name = 'changed'
  assert.equal(source.layers[0].selector, 'body')
  assert.equal(source.library[0].name, 'X')
})
