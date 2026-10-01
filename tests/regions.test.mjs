/**
 * 「区域外观」: shaping a whole surface.
 *
 * Two things decide whether this card works: the anchors (a build renames a container and the region
 * must keep matching — or say it does not) and the rule bookkeeping (one rule per region, values read
 * back out of it, a preset that describes a WHOLE look rather than one property).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'

const regions = await loadTs('src/client/regions.ts')

const region = (id) => {
  const found = regions.REGIONS.find((entry) => entry.id === id)
  assert.notEqual(found, undefined, 'unknown region: ' + id)
  return found
}
const field = (id) => {
  const found = regions.REGION_FIELDS.find((entry) => entry.id === id)
  assert.notEqual(found, undefined, 'unknown field: ' + id)
  return found
}

test('every region is anchored on something a build cannot rename away', () => {
  // The semantic half of a CSS-module class (`[class*="_sidebarCol"]`) or a published `data-*` hook —
  // never a literal hashed class, which is what would break on the next release.
  for (const entry of regions.REGIONS) {
    assert.ok(entry.selectors.length > 0, entry.id)
    for (const selector of entry.selectors) {
      assert.match(selector, /^\[class\*="_[A-Za-z]+"\]$|^\[class~="[A-Za-z]+"\]$|^\[data-[a-z-]+\]$/, entry.id + ': ' + selector)
    }
  }
  assert.equal(regions.regionSelector(region('sidebar')), '[class*="_sidebarCol"], [class~="sidebarCol"]')
  assert.equal(regions.regionSelector(region('composer')), '[data-composer-card], [data-composer-seat]')
})

test('fields round-trip through one rule per region, and clear cleanly', () => {
  let css = []
  css = regions.writeRegionStyle(css, region('sidebar'), field('radius'), '20px')
  css = regions.writeRegionStyle(css, region('sidebar'), field('blur'), '18px')
  css = regions.writeRegionStyle(css, region('composer'), field('bg'), 'rgba(255, 255, 255, 0.55)')
  assert.equal(css.length, 2, 'one rule per region, not per field')
  const rule = css.find((entry) => entry.selector === regions.regionSelector(region('sidebar')))
  assert.equal(rule.rule, 'border-radius: 20px !important; backdrop-filter: blur(18px) !important')
  assert.deepEqual(new Map(regions.readRegionStyle(css, region('sidebar'))), new Map([['radius', '20px'], ['blur', '18px']]))
  assert.equal(regions.readRegionStyle(css, region('composer')).get('bg'), 'rgba(255, 255, 255, 0.55)')
  // Clearing the last field prunes the rule; clearing one keeps its neighbour.
  css = regions.writeRegionStyle(css, region('sidebar'), field('radius'), undefined)
  assert.equal(regions.readRegionStyle(css, region('sidebar')).has('blur'), true)
  css = regions.writeRegionStyle(css, region('sidebar'), field('blur'), undefined)
  assert.equal(css.length, 1)
  assert.equal(css[0].selector, regions.regionSelector(region('composer')))
})

test('a preset writes a whole look and clears what it does not name', () => {
  const glass = regions.REGION_PRESETS.find((preset) => preset.id === 'glass')
  const flat = regions.REGION_PRESETS.find((preset) => preset.id === 'flat')
  let css = regions.applyRegionPreset([{ selector: '#hand', rule: 'color: red' }], region('composer'), glass)
  const values = regions.readRegionStyle(css, region('composer'))
  assert.equal(values.get('blur'), '18px')
  assert.equal(values.get('radius'), '20px')
  assert.equal(values.get('borderStyle'), 'solid')
  assert.match(values.get('shadow'), /rgba\(0, 0, 0, 0\.06\)/)
  // 极简 must not leave the glass border or shadow behind: a preset describes the WHOLE surface.
  css = regions.applyRegionPreset(css, region('composer'), flat)
  const flatValues = regions.readRegionStyle(css, region('composer'))
  assert.equal(flatValues.get('blur'), undefined)
  assert.equal(flatValues.get('shadow'), undefined)
  assert.equal(flatValues.get('radius'), '14px')
  assert.equal(flatValues.get('borderStyle'), 'none', 'switched off explicitly, not left over')
  assert.equal(css.find((entry) => entry.selector === '#hand').rule, 'color: red', 'other rules survive')
  // 恢复默认 removes exactly the region rules and nothing else.
  const regionSelectors = new Set(regions.REGIONS.map((entry) => regions.regionSelector(entry)))
  const cleared = regions.clearRegionStyles([...css, { selector: '#hand', rule: 'color: red' }])
  assert.equal(cleared.length, 2, 'both hand-written rules survive')
  assert.equal(cleared.every((entry) => entry.selector === '#hand' && !regionSelectors.has(entry.selector)), true)
})
