/**
 * Token surface: the catalog and the built-in presets only ever write --dsw-*
 * variables, and never one DSH 0.1.7 stopped defining.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'

const catalog = await loadTs('src/client/token-catalog.ts')
const presets = await loadTs('src/client/presets.ts')

const TOKEN_RE = /^--dsw-[a-z0-9-]+$/
const REMOVED_IN_0_1_7 = ['--dsw-alias-fill-tsp-secondary', '--dsw-alias-label-quaternary', '--dsw-alias-label-error']

test('every catalog token is a unique --dsw-* variable with a known group', () => {
  const names = catalog.TOKEN_CATALOG.map((entry) => entry.name)
  assert.ok(names.length > 0)
  for (const name of names) assert.match(name, TOKEN_RE)
  assert.equal(new Set(names).size, names.length)
  for (const entry of catalog.TOKEN_CATALOG) {
    assert.ok(catalog.TOKEN_GROUP_KEYS[entry.group], 'missing group key for ' + entry.group)
  }
})

test('every preset token carries both palette modes', () => {
  const ids = new Set()
  for (const preset of presets.PRESETS) {
    assert.equal(ids.has(preset.id), false, 'duplicate preset id ' + preset.id)
    ids.add(preset.id)
    for (const [name, modes] of Object.entries(preset.tokens)) {
      assert.match(name, TOKEN_RE)
      assert.equal(typeof modes.light, 'string')
      assert.equal(typeof modes.dark, 'string')
    }
  }
})

test('presets no longer reference tokens DSH 0.1.7 removed', () => {
  const used = new Set()
  for (const preset of presets.PRESETS) for (const name of Object.keys(preset.tokens)) used.add(name)
  for (const removed of REMOVED_IN_0_1_7) {
    assert.equal(used.has(removed), false, removed + ' is not defined by DSH 0.1.7')
  }
})
