/**
 * 「变体」: split axes (frame / fill) and a scope (where a click lands).
 *
 * The contracts that matter: choosing is IDEMPOTENT (an option writes its whole property set,
 * including `none`/`0`, so the result never depends on what came before), the two halves of a surface
 * are independent (glass edges without covering the background is a real answer), a scope constrains
 * the region writes only, the current choices are read back out of ONE marker per scope, and clearing
 * really puts the theme's own values back.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'

const variants = await loadTs('src/client/variants.ts')
const regions = await loadTs('src/client/regions.ts')
const markdown = await loadTs('src/client/markdown.ts')

const region = (id) => {
  const found = regions.REGIONS.find((entry) => entry.id === id)
  assert.notEqual(found, undefined, 'unknown region: ' + id)
  return found
}
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
/** The value one region holds for one field, straight out of the document. */
const styleOf = (doc, regionId, fieldId) => regions.readRegionStyle(doc.css, region(regionId)).get(fieldId)
/** The RAW declaration block one region wrote — what the page is actually painted with. */
const rawRule = (doc, regionId) => doc.css.find((rule) => rule.selector === regions.regionSelector(region(regionId)))?.rule ?? ''

test('the axes are the two halves of a surface, the radius with its four corners, then the tuning', () => {
  assert.deepEqual(variants.VARIANT_AXES.map((entry) => entry.id), [
    'frame', 'fill', 'radius', 'radiusTL', 'radiusTR', 'radiusBR', 'radiusBL', 'density', 'accent',
  ])
  // The four corners are folded under 圆角 in the panel (subOf) and each writes exactly ONE longhand —
  // that is what leaves the uniform value governing the corners nobody touched.
  for (const id of ['radiusTL', 'radiusTR', 'radiusBR', 'radiusBL']) {
    assert.equal(axis(id).subOf, 'radius', id)
    const fields = new Set(axis(id).options.flatMap((choice) => Object.values(choice.regions ?? {}).flatMap((props) => Object.keys(props))))
    assert.deepEqual([...fields], [id], id + ' writes only its own longhand')
  }
  const uniform = new Set(axis('radius').options.flatMap((choice) => Object.values(choice.regions ?? {}).flatMap((props) => Object.keys(props))))
  assert.deepEqual([...uniform], ['radius'], 'the uniform axis writes the shorthand')
  for (const entry of variants.VARIANT_AXES) {
    assert.ok(entry.options.length >= 3, entry.id)
    for (const choice of entry.options) assert.match(choice.id, /^[a-z]+$/, entry.id)
  }
  // The whole looks only ever name real options — a typo would silently do nothing.
  for (const look of variants.VARIANT_LOOKS) {
    for (const [axisId, optionId] of Object.entries(look.choices)) option(axisId, optionId)
  }
})

test('frame and fill are independent: glass edges that never cover the background', () => {
  let doc = variants.applyVariantOption(skin(), axis('frame'), option('frame', 'glass'))
  assert.equal(styleOf(doc, 'sidebar', 'blur'), '18px')
  assert.equal(styleOf(doc, 'sidebar', 'borderStyle'), 'solid')
  assert.match(styleOf(doc, 'sidebar', 'shadow'), /rgba\(0, 0, 0, 0\.06\)/)
  assert.equal(styleOf(doc, 'sidebar', 'bg'), undefined, 'the frame axis never writes a fill')
  // The PAINTED declaration, not just the value read back through the field's template: this is where
  // a double-wrapped `blur(blur(18px))` (invalid CSS ⇒ no blur at all) used to hide.
  assert.match(rawRule(doc, 'sidebar'), /backdrop-filter: blur\(18px\) !important/)

  doc = variants.applyVariantOption(doc, axis('fill'), option('fill', 'none'))
  assert.equal(styleOf(doc, 'sidebar', 'bg'), 'transparent')
  assert.equal(styleOf(doc, 'sidebar', 'blur'), '18px', 'the fill axis never touches the frame')

  // 无框 leaves NO frame behind, and the fill survives it.
  doc = variants.applyVariantOption(doc, axis('frame'), option('frame', 'none'))
  assert.equal(styleOf(doc, 'sidebar', 'blur'), undefined, 'no blur is the ABSENCE of the declaration, not `blur(none)`')
  assert.doesNotMatch(rawRule(doc, 'sidebar'), /backdrop-filter/)
  assert.equal(styleOf(doc, 'sidebar', 'shadow'), 'none')
  assert.equal(styleOf(doc, 'sidebar', 'borderWidth'), '0px')
  assert.equal(styleOf(doc, 'sidebar', 'bg'), 'transparent')

  // The fill axis writes every region — including the two that have to stay transparent.
  doc = variants.applyVariantOption(doc, axis('fill'), option('fill', 'glass'))
  assert.match(styleOf(doc, 'settings', 'bg'), /rgba\(255, 255, 255, 0\.72\)/)
  assert.equal(styleOf(doc, 'conversation', 'bg'), 'transparent')
  assert.equal(styleOf(doc, 'messages', 'bg'), 'transparent')
})

test('both halves reach the native right sidebar, not just the left rail', () => {
  let doc = variants.applyVariantOption(skin(), axis('frame'), option('frame', 'glass'))
  assert.equal(styleOf(doc, 'rightSidebar', 'blur'), '18px')
  assert.equal(styleOf(doc, 'rightSidebar', 'borderStyle'), 'solid')
  doc = variants.applyVariantOption(doc, axis('fill'), option('fill', 'glass'))
  assert.match(styleOf(doc, 'rightSidebar', 'bg'), /rgba\(255, 255, 255, 0\.42\)/)
  const bare = variants.applyVariantOption(doc, axis('fill'), option('fill', 'none'))
  assert.equal(styleOf(bare, 'rightSidebar', 'bg'), 'transparent')
})

test('a corner can be set on its own without disturbing the uniform radius', () => {
  let doc = variants.applyVariantOption(skin(), axis('radius'), option('radius', 'l'))
  doc = variants.applyVariantOption(doc, axis('radiusTL'), option('radiusTL', 'square'))
  doc = variants.applyVariantOption(doc, axis('radiusTL'), option('radiusTL', 'square'))
  assert.equal(styleOf(doc, 'sidebar', 'radius'), '20px', 'the uniform value is untouched')
  assert.equal(styleOf(doc, 'sidebar', 'radiusTL'), '0px')
  assert.equal(styleOf(doc, 'sidebar', 'radiusTR'), undefined, 'the other corners still follow it')
  assert.equal(rawRule(doc, 'sidebar'), 'border-radius: 20px !important; border-top-left-radius: 0px !important', 'and the shorthand stays FIRST')
  // The marker records the corner like any other choice, per place.
  doc = variants.applyVariantOption(doc, axis('radiusBR'), option('radiusBR', 'pill'), 'composer')
  const recorded = variants.readVariantChoices(doc)
  assert.equal(recorded['*'].radiusTL, 'square')
  assert.equal(recorded.composer.radiusBR, 'pill')
  assert.equal(styleOf(doc, 'composer', 'radiusBR'), '28px')
  assert.equal(styleOf(doc, 'sidebar', 'radiusBR'), undefined)
  // 恢复默认 clears the corners with everything else (they are ordinary axes).
  const cleared = variants.clearVariant(doc)
  assert.equal(styleOf(cleared, 'sidebar', 'radius'), undefined)
  assert.equal(styleOf(cleared, 'sidebar', 'radiusTL'), undefined)
  assert.equal(styleOf(cleared, 'composer', 'radiusBR'), undefined)
})

test('a scope applies one click to one place, and the marker records where it went', () => {
  let doc = variants.applyVariantOption(skin(), axis('radius'), option('radius', 'pill'), 'composer')
  assert.equal(styleOf(doc, 'composer', 'radius'), '28px')
  assert.equal(styleOf(doc, 'sidebar', 'radius'), undefined, 'every other region is untouched')
  assert.equal(styleOf(doc, 'rightSidebar', 'radius'), undefined)

  const recorded = variants.readVariantChoices(doc)
  assert.deepEqual(Object.keys(recorded), ['composer'])
  assert.equal(recorded.composer.radius, 'pill')
  assert.equal(recorded.composer.frame, undefined, 'an axis nobody chose stays unrecorded — the card shows its first option')
  assert.equal(variants.choicesFor(recorded, 'composer').radius, 'pill')
  assert.deepEqual(variants.choicesFor(recorded, 'sidebar'), {}, 'a place with no choice of its own has none')

  // A global choice reaches every place…
  doc = variants.applyVariantOption(doc, axis('fill'), option('fill', 'card'))
  const both = variants.readVariantChoices(doc)
  assert.equal(styleOf(doc, 'sidebar', 'bg'), 'var(--dsw-alias-bg-layer-1)')
  assert.equal(variants.choicesFor(both, 'messages').fill, 'card')
  assert.equal(variants.choicesFor(both, 'composer').fill, 'card', 'the global choice applies there too')
  // …while the place's own choice rides on top of it.
  assert.equal(variants.choicesFor(both, 'composer').radius, 'pill')
  assert.equal(both['*'].radius, undefined, 'the global record was not overwritten by the scoped one')
  doc = variants.applyVariantOption(doc, axis('fill'), option('fill', 'none'), 'composer')
  const overridden = variants.readVariantChoices(doc)
  assert.equal(variants.choicesFor(overridden, 'composer').fill, 'none')
  assert.equal(variants.choicesFor(overridden, 'sidebar').fill, 'card', 'the global choice is untouched')
  assert.equal(styleOf(doc, 'composer', 'bg'), 'transparent')
})

test('density and accent land globally — DSH has no per-region form for them', () => {
  const doc = variants.applyVariantOption(skin(), axis('density'), option('density', 'loose'), 'composer')
  assert.equal(markdown.readMarkdownTokens(doc).get('tokBaseSize'), '15px')
  assert.equal(styleOf(doc, 'composer', 'pad'), '20px')
  assert.equal(styleOf(doc, 'sidebar', 'pad'), undefined)
  const accent = variants.applyVariantOption(doc, axis('accent'), option('accent', 'violet'), 'composer')
  assert.deepEqual(accent.tokens['--dsw-alias-brand-primary'], { light: '#7c5cff', dark: '#a78bfa' })
})

test('an old material= marker is read as the two axes that replaced it', () => {
  const legacy = (id) => skin({ css: [{ selector: ':root', rule: '--dsh-myskin-variant: material=' + id + ',radius=l,density=normal,accent=theme' }] })
  assert.deepEqual(variants.readVariantChoices(legacy('glass'))['*'], { frame: 'glass', fill: 'glass', radius: 'l', density: 'normal', accent: 'theme' })
  assert.equal(variants.readVariantChoices(legacy('paper'))['*'].fill, 'card')
  assert.equal(variants.readVariantChoices(legacy('outline'))['*'].frame, 'outline')
  assert.deepEqual(variants.readVariantChoices(legacy('bare'))['*'], { frame: 'none', fill: 'none', radius: 'l', density: 'normal', accent: 'theme' })
  // …and the card reads those back as the options really in effect.
  const choices = variants.choicesFor(variants.readVariantChoices(legacy('paper')), '*')
  assert.equal(variants.optionFor(axis('fill'), choices).id, 'card')
  assert.equal(variants.optionFor(axis('frame'), choices).id, 'none')
})

test('a look sets every axis at the chosen scope, in one marker', () => {
  let doc = variants.applyVariantLook(skin(), variants.VARIANT_LOOKS.find((look) => look.id === 'glass'))
  assert.equal(styleOf(doc, 'sidebar', 'blur'), '18px')
  assert.match(styleOf(doc, 'sidebar', 'bg'), /rgba\(255, 255, 255, 0\.42\)/)
  assert.equal(styleOf(doc, 'sidebar', 'radius'), '20px')
  assert.equal(markdown.readMarkdownTokens(doc).get('tokBaseSize'), '14px')
  assert.equal(doc.css.filter((rule) => rule.selector === ':root').length, 1, 'one :root rule carries the marker')

  // The same look, pointed at one place.
  const scoped = variants.applyVariantLook(skin(), variants.VARIANT_LOOKS.find((look) => look.id === 'paper'), 'settings')
  assert.equal(styleOf(scoped, 'settings', 'radius'), '14px')
  assert.equal(styleOf(scoped, 'sidebar', 'radius'), undefined)
  assert.equal(styleOf(scoped, 'settings', 'bg'), 'var(--dsw-alias-bg-layer-1)')
})

test('clearing a variant puts the theme back, scoped choices included', () => {
  let doc = variants.applyVariantLook(skin({ css: [{ selector: '#hand', rule: 'color: red' }], tokens: { '--other': { light: '1', dark: '2' } } }), variants.VARIANT_LOOKS.find((look) => look.id === 'glass'))
  doc = variants.applyVariantOption(doc, axis('fill'), option('fill', 'none'), 'composer')
  doc = variants.applyVariantOption(doc, axis('accent'), option('accent', 'teal'))
  assert.notEqual(doc.tokens['--dsw-alias-brand-primary'], undefined)
  const cleared = variants.clearVariant(doc)
  assert.deepEqual(variants.readVariantChoices(cleared), {})
  assert.equal(cleared.tokens['--dsw-alias-brand-primary'], undefined)
  assert.deepEqual(cleared.tokens['--other'], { light: '1', dark: '2' }, 'unrelated tokens survive')
  assert.equal(markdown.readMarkdownTokens(cleared).size, 0)
  for (const entry of regions.REGIONS) {
    assert.equal(regions.readRegionStyle(cleared.css, entry).size, 0, entry.id)
  }
  assert.equal(cleared.css.find((rule) => rule.selector === '#hand').rule, 'color: red', 'hand-written rules survive')
})
