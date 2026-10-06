/**
 * 兼容模式 in the settings page, and the removal of 「实时预览」.
 *
 * Both are user-visible promises, so both are pinned on the real component
 * (tests/helpers/section-harness.mjs) rather than on the helpers alone:
 *
 *   · the 实时预览 button and its copy are GONE (the switch above it already enables the skin);
 *   · 兼容模式 stops the wallpaper, the surface tokens and the yield request, and turning it off
 *     restores all three — while colours, rules and text never stop.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { DOC, mountSection, t, zh } from './helpers/section-harness.mjs'

/** The switch inside the row whose label is this text. */
function switchFor(h, label) {
  const rows = [...h.mount.querySelectorAll('div')]
  const row = rows.find((div) => [...div.children].some((child) => (child.textContent ?? '').trim() === label))
  assert.notEqual(row, undefined, 'the row for "' + label + '" has to exist')
  const toggle = row.querySelector('button[role="switch"]')
  assert.notEqual(toggle, undefined, 'a row with a switch is expected')
  return toggle
}

/** One marker is present in the document's \`:root\` rule. */
const marked = (h) => /--dsh-myskin-compat:\s*1/.test(h.doc().css.map((r) => r.rule).join(' '))

test('「实时预览」按钮与它的文案都已移除', async () => {
  const h = await mountSection(DOC)
  assert.equal(Object.prototype.hasOwnProperty.call(zh, 'preview'), false, 'the copy is gone too, not just the button')
  const labels = [...h.mount.querySelectorAll('button')].map((b) => (b.textContent ?? '').trim())
  assert.equal(labels.includes('实时预览'), false)
  assert.equal(labels.includes('Live preview'), false)
  // …and the row it lived in is intact: the remaining doors still work.
  for (const key of ['edit', 'apply', 'reset', 'saveSkin', 'exportSkin', 'importSkin']) {
    assert.ok(labels.includes(t(key)), 'missing ' + key + ' in ' + JSON.stringify(labels))
  }
  await h.close()
})

test('兼容模式：背景让给别人，其余照常；关掉即全部恢复', async () => {
  const h = await mountSection(DOC)
  assert.equal(h.announced(), 'dsh-myskin', 'baseline: the skin is on stage')
  assert.match(h.committedTag().textContent, /background-image: url\(/)
  assert.equal(h.window.document.body.style.getPropertyValue('--dsw-alias-bg-base'), '#0c1322')

  await h.click(switchFor(h, t('compat')))
  assert.equal(marked(h), true, 'the mode is stored in the document (a marker in css, no Host restart needed)')
  assert.equal(h.doc().enabled, true, 'the skin itself stays enabled')
  assert.equal(h.announced(), null, 'the wallpaper plugin is NOT asked to step aside')
  const css = h.committedTag().textContent
  assert.doesNotMatch(css, /background-image: url\(/, 'no wallpaper layer')
  assert.doesNotMatch(css, /--dsw-alias-bg-base/, 'no surface colour that would cover theirs')
  assert.equal(h.window.document.body.style.getPropertyValue('--dsw-alias-bg-base'), '')
  assert.equal(h.window.document.body.style.getPropertyValue('--dsw-alias-label-primary'), '#e8eefb', 'foreground stays')
  assert.match(css, /#hero \{ color: red \}/, 'rules stay')
  assert.equal(h.pageColor(), 'rgb(255, 0, 0)')
  assert.equal(h.pageText(), '你好', 'text overrides stay')

  await h.click(switchFor(h, t('compat')))
  assert.equal(marked(h), false)
  assert.equal(h.announced(), 'dsh-myskin', 'off again: the skin takes the stage back')
  assert.match(h.committedTag().textContent, /background-image: url\(/)
  assert.equal(h.window.document.body.style.getPropertyValue('--dsw-alias-bg-base'), '#0c1322')
  await h.close()
})

test('装上壁纸插件后，没表过态的文档自动进入兼容模式；关一下就明确退出', async () => {
  // `data-we-glass-page` is what the wallpaper plugin keeps mounted for as long as it is loaded —
  // there is no wallpaper selected in this scenario, which is exactly the case the user cannot
  // describe for us, so the plugin's presence IS the signal.
  const h = await mountSection(DOC, { bodyAttributes: { 'data-we-glass-page': 'on' } })
  const toggle = switchFor(h, t('compat'))
  assert.equal(toggle.getAttribute('aria-checked'), 'true', 'the switch shows the mode that is really in effect')
  assert.match(h.mount.textContent, new RegExp(t('compatAutoHint').slice(0, 12)), 'and says why')
  assert.equal(marked(h), false, 'nothing was written into the document — the mode is resolved, not stored')
  assert.equal(h.announced(), null, 'so the wallpaper plugin is not asked to step aside')
  assert.doesNotMatch(h.committedTag().textContent, /background-image: url\(/)

  // One click is an explicit decision, and it wins over the detection.
  await h.click(toggle)
  assert.equal(marked(h), false, 'an explicit OFF is a value, not an absent marker')
  assert.match(h.doc().css.map((rule) => rule.rule).join(' '), /--dsh-myskin-compat:\s*0/)
  assert.equal(h.announced(), 'dsh-myskin')
  assert.match(h.committedTag().textContent, /background-image: url\(/)
  await h.close()
})

test('绘制模式的预览也遵守兼容模式，令牌面板点名不写的条目', async () => {
  const compatDoc = { ...DOC, css: [...DOC.css, { selector: ':root', rule: '--dsh-myskin-compat: 1;' }] }
  const h = await mountSection(compatDoc)
  await h.clickLabel(t('edit'), h.mount)
  const live = h.liveTag()?.textContent ?? ''
  assert.doesNotMatch(live, /background-image: url\(/, 'the preview must not promise a wallpaper that saving will not paint')
  assert.match(live, /#send \{ display: none !important \}/, 'the css layer is still previewed')

  // The palette lives in the 画面 tab (the panel opens on the inspector), so switch tabs first.
  await h.clickLabel(t('tabLook'), h.window.document)
  await h.clickLabel(t('tokenPanel'), h.window.document)
  const rows = [...h.window.document.querySelectorAll('.dsh-myskin-field')]
  const surface = rows.find((row) => (row.textContent ?? '').includes('--dsw-alias-bg-base'))
  const foreground = rows.find((row) => (row.textContent ?? '').includes('--dsw-alias-label-primary'))
  assert.notEqual(surface, undefined, 'the token palette is open')
  assert.notEqual(foreground, undefined)
  assert.match(surface.textContent, new RegExp(t('compatTokenTag')), 'a skipped entry says so')
  assert.doesNotMatch(foreground.textContent, new RegExp(t('compatTokenTag')), 'a foreground entry does not')
  await h.close()
})
