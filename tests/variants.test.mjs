/**
 * 「变体」: a look chosen by clicking.
 *
 * The contract that matters: choosing is IDEMPOTENT (an option writes its whole property set, including
 * `none`/`0`, so the result never depends on what came before), the current choices are read back out of
 * ONE marker, and clearing really puts the theme's own values back.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'

const variants = await loadTs('src/client/variants.ts')
const regions = await loadTs('src/client/regions.ts')
const markdown = await loadTs('src/client/markdown.ts')

const axis = (id) => {
  const found = variants.VARIANT_AXES.find((entry) => entry.id === id)
  assert.notEqual(found, undefined, 'unknown axis: ' + id)
  return found
}
const option = (axisId, optionId) => {
  const found = axis(axisId).options.find((entry) => entry.id === optionId)
  assert.notEqual(found, undefined, 'unknown option: ' + axisId + '/' + optionId)
  return found
}
const skin = (extra = {}) => ({ enabled: true, tokens: {}, css: [], text: [], layers: [], library: [], canvas: { images: [] }, ...extra })
const sidebarValue = (doc, fieldId) => regions.readRegionStyle(doc.css, regions.REGIONS.find((region) => region.id === 'sidebar')).get(fieldId)

test('every axis offers plain-language options', () => {
  assert.deepEqual(variants.VARIANT_AXES.map((entry) => entry.id), ['material', 'radius', 'density', 'accent'])
  for (const entry of variants.VARIANT_AXES) {
    assert.ok(entry.options.length >= 3, entry.id)
    for (const choice of entry.options) assert.match(choice.id, /^[a-z]+$/, entry.id)
  }
  // The whole looks only ever name real options — a typo would silently do nothing.
  for (const look of variants.VARIANT_LOOKS) {
    for (const [axisId, optionId] of Object.entries(look.choices)) option(axisId, optionId)
  }
})

test('choosing is idempotent: switching material overwrites, never accumulates', () => {
  let doc = variants.applyVariantOption(skin(), axis('material'), option('material', 'glass'))
  assert.equal(sidebarValue(doc, 'blur'), 'blur(18px)')
  assert.equal(sidebarValue(doc, 'borderStyle'), 'solid')
  assert.match(sidebarValue(doc, 'shadow'), /rgba\(0, 0, 0, 0\.06\)/)
  // 无框 must leave NO border, shadow or blur behind — the option owns all three properties.
  doc = variants.applyVariantOption(doc, axis('material'), option('material', 'bare'))
  assert.equal(sidebarValue(doc, 'blur'), 'none')
  assert.equal(sidebarValue(doc, 'shadow'), 'none')
  assert.equal(sidebarValue(doc, 'borderWidth'), '0px')
  assert.equal(sidebarValue(doc, 'bg'), 'transparent')
  // Radius applies to EVERY region, including the ones the material option did not mention.
  doc = variants.applyVariantOption(doc, axis('radius'), option('radius', 'pill'))
  for (const region of regions.REGIONS) {
    assert.equal(regions.readRegionStyle(doc.css, region).get('radius'), '28px', region.id)
  }
})

test('density moves the markdown tokens, and the accent moves the brand token', () => {
  let doc = variants.applyVariantOption(skin(), axis('density'), option('density', 'loose'))
  assert.equal(markdown.readMarkdownTokens(doc).get('tokBaseSize'), '15px')
  assert.equal(sidebarValue(doc, 'pad'), '20px')
  assert.equal(doc.tokens['--dsw-alias-brand-primary'], undefined, 'the theme keeps its colour')
  doc = variants.applyVariantOption(doc, axis('accent'), option('accent', 'violet'))
  assert.deepEqual(doc.tokens['--dsw-alias-brand-primary'], { light: '#7c5cff', dark: '#a78bfa' })
  // 跟随主题 drops the override instead of writing a colour.
  doc = variants.applyVariantOption(doc, axis('accent'), option('accent', 'theme'))
  assert.equal(doc.tokens['--dsw-alias-brand-primary'], undefined)
})

test('the choices round-trip through one marker, and a look sets all four axes', () => {
  let doc = skin()
  assert.deepEqual(variants.readVariantChoices(doc), {}, 'nothing chosen yet')
  doc = variants.applyVariantOption(doc, axis('radius'), option('radius', 's'))
  // Choosing one axis records ALL of them (the unchosen ones as their first option): the marker then
  // states the whole state, and the card never has to guess what is in effect.
  assert.deepEqual(variants.readVariantChoices(doc), { material: 'glass', radius: 's', density: 'tight', accent: 'theme' })
  const glass = variants.VARIANT_LOOKS.find((look) => look.id === 'glass')
  doc = variants.applyVariantLook(doc, glass)
  const choices = variants.readVariantChoices(doc)
  assert.equal(choices.material, 'glass')
  assert.equal(choices.radius, 'l')
  assert.equal(choices.density, 'normal')
  assert.equal(choices.accent, 'theme')
  assert.equal(doc.css.filter((rule) => rule.selector === ':root').length, 1, 'one :root rule carries the marker')
  // The card shows the option that is really in effect.
  assert.equal(variants.optionFor(axis('material'), choices).id, 'glass')
  assert.equal(variants.optionFor(axis('material'), {}).id, axis('material').options[0].id, 'no marker: the first option')
})

test('clearing a variant puts the theme back', () => {
  const glass = variants.VARIANT_LOOKS.find((look) => look.id === 'glass')
  let doc = variants.applyVariantLook(skin({ css: [{ selector: '#hand', rule: 'color: red' }], tokens: { '--other': { light: '1', dark: '2' } } }), glass)
  doc = variants.applyVariantOption(doc, axis('accent'), option('accent', 'teal'))
  assert.notEqual(doc.tokens['--dsw-alias-brand-primary'], undefined)
  const cleared = variants.clearVariant(doc)
  assert.deepEqual(variants.readVariantChoices(cleared), {})
  assert.equal(cleared.tokens['--dsw-alias-brand-primary'], undefined)
  assert.deepEqual(cleared.tokens['--other'], { light: '1', dark: '2' }, 'unrelated tokens survive')
  assert.equal(markdown.readMarkdownTokens(cleared).size, 0)
  assert.equal(regions.readRegionStyle(cleared.css, regions.REGIONS[0]).size, 0)
  assert.equal(cleared.css.find((rule) => rule.selector === '#hand').rule, 'color: red', 'hand-written rules survive')
})
