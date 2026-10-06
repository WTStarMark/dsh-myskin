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
const engine = await loadTs('src/client/skin-engine.ts')

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
      // A semantic half of a CSS-module class, or one-or-more chained `data-*` hooks. Chaining is
      // allowed because some containers only exist to be styled in ONE state (the right sidebar is
      // mounted while closed too — see regions.ts).
      assert.match(selector, /^\[class\*="_[A-Za-z]+"\]$|^\[class~="[A-Za-z]+"\]$|^\[data-[a-z-]+\](?:\[data-[a-z-]+\])*$/, entry.id + ': ' + selector)
    }
  }
  assert.equal(regions.regionSelector(region('sidebar')), '[class*="_sidebarCol"], [class~="sidebarCol"]')
  assert.equal(regions.regionSelector(region('composer')), '[data-composer-card], [data-composer-seat]')
})

test('the native right sidebar is a region of its own, on the hooks its package publishes', () => {
  const right = region('rightSidebar')
  // `data-dockkit-*` belongs to @deepseek-ai/dsh-client-ui-sidebar-right alone (checked against the
  // install), so these anchors cannot match the left rail or a third-party panel by accident.
  assert.deepEqual([...right.selectors], [
    '[data-sidebar-right-panel][data-sidebar-right-open]',
    '[data-dockkit-pane]',
    '[data-dockkit-float]',
  ])
  // ⚠️ The panel container STAYS MOUNTED while the panel is closed (only its children hide), so the
  // panel anchor must be scoped to the open state — otherwise a plate would hang there behind a
  // closed sidebar. The "开始" guide state (no pane mounted at all) is why the panel is an anchor:
  // anchoring panes alone matched nothing there, and 圆角 "did nothing".
  assert.match(right.selectors[0], /\[data-sidebar-right-open\]$/)
  assert.equal(right.selectors.some((selector) => selector === '[data-sidebar-right-panel]'), false)
})

test('a rule that paints a fill is marked, so 兼容模式 can drop it at paint time', () => {
  const marker = engine.PANEL_FILL_PROPERTY
  let css = regions.writeRegionStyle([], region('sidebar'), field('bg'), 'rgba(255, 255, 255, 0.5)')
  assert.match(css[0].rule, /background-color: rgba\(255, 255, 255, 0\.5\) !important/)
  assert.match(css[0].rule, new RegExp(marker + ': 1'))
  // A field that is not a surface carries no marker…
  const borders = regions.writeRegionStyle([], region('sidebar'), field('borderColor'), '#ffffff')
  assert.doesNotMatch(borders[0].rule, new RegExp(marker))
  // …and clearing the fill takes the marker with it, leaving the rest of the rule alone.
  css = regions.writeRegionStyle(css, region('sidebar'), field('radius'), '20px')
  css = regions.writeRegionStyle(css, region('sidebar'), field('bg'), undefined)
  assert.doesNotMatch(css[0].rule, new RegExp(marker))
  assert.doesNotMatch(css[0].rule, /background-color/)
  assert.match(css[0].rule, /border-radius: 20px !important/)
})

test('each corner can be defined on its own, while the uniform value keeps the rest', () => {
  let css = []
  css = regions.writeRegionStyle(css, region('composer'), field('radius'), '20px')
  css = regions.writeRegionStyle(css, region('composer'), field('radiusTL'), '4px')
  const selector = regions.regionSelector(region('composer'))
  const rule = css.find((entry) => entry.selector === selector).rule
  // The shorthand has to come FIRST: it sets all four corners, so a corner written before it would be
  // silently erased (this is the whole reason for the hoist).
  assert.equal(rule, 'border-radius: 20px !important; border-top-left-radius: 4px !important')
  const values = regions.readRegionStyle(css, region('composer'))
  assert.equal(values.get('radius'), '20px', 'the uniform row still reads its value')
  assert.equal(values.get('radiusTL'), '4px')
  assert.equal(values.get('radiusTR'), undefined, 'the other three follow the uniform value')

  // A second corner lands next to the first; the shorthand stays in front.
  css = regions.writeRegionStyle(css, region('composer'), field('radiusBR'), '0px')
  const after = css.find((entry) => entry.selector === selector).rule
  assert.match(after, /^border-radius: 20px !important;/)
  assert.match(after, /border-top-left-radius: 4px !important/)
  assert.match(after, /border-bottom-right-radius: 0px !important/)
  assert.equal(regions.readRegionStyle(css, region('composer')).get('radiusBR'), '0px')

  // Clearing a corner hands it back to the uniform value — and touches nothing else.
  css = regions.writeRegionStyle(css, region('composer'), field('radiusTL'), undefined)
  const cleared = regions.readRegionStyle(css, region('composer'))
  assert.equal(cleared.get('radiusTL'), undefined)
  assert.equal(cleared.get('radius'), '20px')
  assert.equal(cleared.get('radiusBR'), '0px')

  // Four independent corners, with no uniform value at all.
  let only = []
  for (const [id, value] of [['radiusTL', '2px'], ['radiusTR', '4px'], ['radiusBR', '6px'], ['radiusBL', '8px']]) {
    only = regions.writeRegionStyle(only, region('sidebar'), field(id), value)
  }
  const corners = regions.readRegionStyle(only, region('sidebar'))
  assert.deepEqual(
    [corners.get('radiusTL'), corners.get('radiusTR'), corners.get('radiusBR'), corners.get('radiusBL')],
    ['2px', '4px', '6px', '8px'],
  )
  assert.equal(corners.get('radius'), undefined, 'no shorthand is invented')
  assert.doesNotMatch(only[0].rule, /(^|; )border-radius:/, 'and none is left behind')
})

test('the corners survive a whole-look preset only if the preset names them', () => {
  const glass = regions.REGION_PRESETS.find((preset) => preset.id === 'glass')
  let css = regions.writeRegionStyle([], region('composer'), field('radiusTL'), '30px')
  css = regions.applyRegionPreset(css, region('composer'), glass)
  const values = regions.readRegionStyle(css, region('composer'))
  assert.equal(values.get('radius'), '20px', 'the preset radius is the uniform one')
  assert.equal(values.get('radiusTL'), undefined, 'a preset describes the WHOLE surface, corners included')
  assert.doesNotMatch(css.find((entry) => entry.selector === regions.regionSelector(region('composer'))).rule, /border-top-left-radius/)
})

test('hoisting a shorthand is a reorder, never a rewrite', () => {
  const rule = 'color: red !important; border-radius: 12px !important; padding: 4px !important'
  assert.equal(regions.hoistShorthand(rule, 'border-radius'), 'border-radius: 12px !important; color: red !important; padding: 4px !important')
  assert.equal(regions.hoistShorthand('color: red', 'border-radius'), 'color: red', 'nothing to hoist')
  assert.equal(regions.hoistShorthand(undefined, 'border-radius'), '', 'no rule yet')
  assert.equal(regions.hoistShorthand('border-radius: 0', 'border-radius'), 'border-radius: 0', 'already first')
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
