/**
 * 「变体」in the panel: the two things that were reported missing.
 *
 *   · 作用对象 — a click can land on ONE place, so "只改输入框" no longer means leaving the card;
 *   · the split — frame (blur / border / shadow) and fill (the surface colour) are separate axes, so
 *     glass edges without covering the background is a thing you can actually choose.
 *
 * Both are pinned on the real component (tests/helpers/section-harness.mjs) through the editor's own
 * live stylesheet — the same sheet the page is painted with while the editor is open.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { DOC, mountSection, t } from './helpers/section-harness.mjs'

/** Escape a selector for use inside a RegExp. */
const re = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Open draw mode on the 变体 tab. */
async function openVariantPanel(h) {
  await h.clickLabel(t('edit'), h.mount)
  await h.clickLabel(t('tabVariant'), h.window.document)
}

test('变体卡的作用对象选中一处时，只改那一处', async () => {
  const h = await mountSection(DOC)
  await openVariantPanel(h)
  assert.notEqual([...h.window.document.querySelectorAll('button')].find((b) => (b.textContent ?? '').trim() === t('variantScopeAll')), undefined, 'the scope row exists')

  await h.clickLabel(t('regionComposer'), h.window.document)
  await h.clickLabel(t('variantRadiusPill'), h.window.document)

  const live = h.liveTag()?.textContent ?? ''
  assert.match(live, new RegExp(re('[data-composer-card], [data-composer-seat]') + ' \\{ border-radius: 28px !important \\}'), 'the composer got it')
  assert.doesNotMatch(live, new RegExp(re('[class*="_sidebarCol"], [class~="sidebarCol"]') + ' \\{ border-radius'), 'and nothing else did')
  await h.close()
})

test('质感与底色是两个轴：玻璃边缘可以不盖背景', async () => {
  const h = await mountSection(DOC)
  await openVariantPanel(h)
  await h.clickLabel(t('variantFrameGlass'), h.window.document)
  await h.clickLabel(t('variantFillNone'), h.window.document)

  const live = h.liveTag()?.textContent ?? ''
  const sidebar = new RegExp(re('[class*="_sidebarCol"], [class~="sidebarCol"]') + ' \\{([^}]*)\\}')
  const rule = sidebar.exec(live)
  assert.notEqual(rule, null, 'the left rail got a rule')
  assert.match(rule[1], /backdrop-filter: blur\(18px\)/, 'the frame is glass')
  assert.match(rule[1], /border-style: solid/)
  assert.match(rule[1], /background-color: transparent/, 'and the fill never covers anything')
  await h.close()
})

test('四角可以在变体卡里单独点选，统一圆角照旧', async () => {
  const h = await mountSection(DOC)
  await openVariantPanel(h)
  await h.clickLabel(t('variantRadiusL'), h.window.document)

  // The corner block is a <details> — its rows are in the DOM, so no need to open it to reach them.
  const summary = [...h.window.document.querySelectorAll('summary')].find((el) => (el.textContent ?? '').trim() === t('variantCorners'))
  assert.notEqual(summary, undefined, 'the 四角单独调 block exists')

  const label = [...h.window.document.querySelectorAll('span')].find((el) => (el.textContent ?? '').startsWith(t('regionRadiusTL')))
  assert.notEqual(label, undefined, '左上角 has its own row')
  assert.match(label.textContent, new RegExp(t('variantCornerFollow')), 'and says it follows the uniform value until it is picked')
  const row = label.parentElement
  const square = [...row.querySelectorAll('button')].find((b) => (b.textContent ?? '').trim() === t('variantRadiusSquare'))
  await h.click(square)

  const live = h.liveTag()?.textContent ?? ''
  const rule = new RegExp(re('[class*="_sidebarCol"], [class~="sidebarCol"]') + ' \\{([^}]*)\\}').exec(live)
  assert.notEqual(rule, null, 'the left rail got a rule')
  assert.match(rule[1], /border-radius: 20px !important/, 'the uniform radius is still there')
  assert.match(rule[1], /border-top-left-radius: 0px !important/, 'and the corner overrides itself only')
  assert.doesNotMatch(rule[1], /border-top-right-radius/, 'untouched corners are not written at all')
  await h.close()
})

test('兼容模式下底色轴被点名，且真的不画', async () => {
  const compatDoc = { ...DOC, css: [...DOC.css, { selector: ':root', rule: '--dsh-myskin-compat: 1;' }] }
  const h = await mountSection(compatDoc)
  await openVariantPanel(h)
  await h.clickLabel(t('variantFillGlass'), h.window.document)
  const panelText = [...h.window.document.querySelectorAll('.dsh-myskin-card, div')].map((el) => el.textContent ?? '').join(' ')
  assert.match(panelText, new RegExp(re(t('compatPanelTag'))), 'the fill axis says it is not painted')
  const live = h.liveTag()?.textContent ?? ''
  assert.doesNotMatch(live, /background-color: rgba\(255, 255, 255, 0\.42\)/, 'and the preview agrees with saving')
  await h.close()
})
