/**
 * 还原默认, end to end on the real components.
 *
 * The unit tests pin the data shape (tests/reset.test.mjs); this file pins the BUTTONS, in a jsdom
 * shell with the real section, the real draw-mode editor and the real engine
 * (tests/helpers/section-harness.mjs):
 *
 *   · 皮肤管理 → 还原默认  must write the identity document, put the page back to DSH's own look,
 *     and still have the skin library afterwards;
 *   · 绘制模式 → 还原默认 → 确定还原  must reach the DURABLE document (resetting only the draft
 *     could never restore anything: the committed skin keeps painting through the engine), which
 *     is the reported "cannot restore" bug;
 *   · 极客模式 → 还原默认  must drop the rule itself, not just the text in the box;
 *   · Ctrl+Z after any of them brings the whole skin back as a draft.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { DOC, React, mountSection, t } from './helpers/section-harness.mjs'

test('皮肤管理 的「还原默认」回到原生外观，并且不删皮肤库', async () => {
  const h = await mountSection(DOC)
  assert.equal(h.committedTag() === null, false, 'the skin is on the page to begin with')
  assert.equal(h.announced(), 'dsh-myskin', 'and announced to the wallpaper plugin')
  h.writes.length = 0

  await h.clickLabel(t('reset'), h.mount)
  const stored = h.doc()
  assert.equal(stored.enabled, false)
  assert.deepEqual(Object.keys(stored.tokens), [])
  assert.deepEqual(stored.css, [])
  assert.deepEqual(stored.text, [])
  assert.equal(stored.canvas.background, undefined, 'the wallpaper goes too')
  assert.deepEqual(stored.library.map((s) => s.id), ['skin-1'], 'the saved skins are user data, not skin')
  assert.equal(h.committedTag(), null, "the page is DSH's own again")
  assert.equal(h.announced(), null, 'and the announcement is withdrawn with it')
  assert.notEqual(h.pageColor(), 'rgb(255, 0, 0)')
  assert.equal(h.pageText(), 'Hello', 'text overrides revert as well')
  await h.close()
})

test('绘制模式 的「还原默认」写回空文档，页面真的回到原生外观', async () => {
  const h = await mountSection(DOC)
  h.writes.length = 0
  await h.clickLabel(t('edit'), h.mount)
  const editorOpen = h.window.document.querySelector('[data-dsh-myskin-canvas="1"]') !== null
  assert.equal(editorOpen, true, 'draw mode is open')

  // The toolbar button carries the hint as its title (the panel and the geek card have buttons
  // with the same label; only this one is in the chrome).
  const resetButton = [...h.window.document.querySelectorAll('button')].find((b) => b.getAttribute('title') === t('resetHint'))
  await h.click(resetButton)
  // The confirm row: its button is the one that performs the restore, and is NOT labelled 保存.
  const confirmSpan = [...h.window.document.querySelectorAll('span')].find((s) => (s.textContent ?? '').trim() === t('resetConfirm'))
  assert.notEqual(confirmSpan, undefined, 'restoring asks once before it acts')
  const confirm = confirmSpan.nextElementSibling
  assert.equal((confirm.textContent ?? '').trim(), t('resetGo'), 'the confirm button says what it does')
  await h.click(confirm)

  assert.ok(h.writes.length > 0, 'the restore has to reach the durable document — a draft reset cannot restore anything')
  const stored = h.doc()
  assert.equal(stored.enabled, false)
  assert.deepEqual(stored.css, [])
  assert.deepEqual(stored.text, [])
  assert.equal(stored.canvas.background, undefined)
  assert.deepEqual(stored.library.map((s) => s.id), ['skin-1'])
  assert.equal(h.committedTag(), null, 'the old skin is off the page')
  assert.equal(h.announced(), null)
  assert.notEqual(h.pageColor(), 'rgb(255, 0, 0)')
  assert.equal(h.pageText(), 'Hello')
  // Not one byte of the old skin may survive on <body>: the editor tears its token preview down
  // around the engine's dispose, and handing the old value back there used to leave it behind.
  assert.equal(h.window.document.body.getAttribute('style'), null, 'no leftover token binding')
  await h.close()
})

test('极客模式 的「还原默认」把这个选择器的规则从草稿里去掉', async () => {
  const h = await mountSection(DOC)
  await h.clickLabel(t('edit'), h.mount)
  // Select #hero: the picker hit-tests through document.elementsFromPoint, which jsdom lacks.
  h.window.document.elementsFromPoint = () => [h.window.document.getElementById('hero')]
  await h.click(h.window.document.getElementById('hero'))
  // 极客模式 lives in the inspector, which only exists once something is selected.
  await h.clickLabel(t('geekMode'), h.window.document)
  const textarea = [...h.window.document.querySelectorAll('textarea')].find((el) => el.value.includes('color: red'))
  assert.notEqual(textarea, undefined, 'the box starts from the rule already on the element')

  // The geek card's own 还原默认 — looked up INSIDE the card that holds the code box: the
  // settings section behind the editor has a 还原默认 with the same label and no title either.
  const geekCard = textarea.closest('.dsh-myskin-card') ?? textarea.parentElement
  const geekReset = [...geekCard.querySelectorAll('button')].find((b) => (b.textContent ?? '').trim() === t('reset'))
  assert.notEqual(geekReset, undefined, 'the geek card has its own 还原默认')
  await h.click(geekReset)

  const live = h.liveTag()?.textContent ?? ''
  assert.doesNotMatch(live, /#hero/, 'clearing the box was never the whole job: the RULE has to go')
  assert.equal(h.window.document.querySelector('textarea').value, '', 'and the box does not refill itself from the rule')
  const kept = h.liveTag()?.textContent ?? ''
  assert.match(kept, /#send \{ display: none !important \}/, 'other rules of the same skin are untouched')
  await h.close()
})

test('绘制模式 的「还原默认」把整套皮肤留在撤销栈里', async () => {
  const h = await mountSection(DOC)
  await h.clickLabel(t('edit'), h.mount)
  const resetButton = [...h.window.document.querySelectorAll('button')].find((b) => b.getAttribute('title') === t('resetHint'))
  await h.click(resetButton)
  const confirmSpan = [...h.window.document.querySelectorAll('span')].find((s) => (s.textContent ?? '').trim() === t('resetConfirm'))
  await h.click(confirmSpan.nextElementSibling)
  // Ctrl+Z: the skin comes back as a DRAFT (the editor's own layer previews it again).
  h.window.document.dispatchEvent(new h.window.KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }))
  await React.act(async () => { await new Promise((resolve) => setTimeout(resolve, 25)) })
  assert.match(h.liveTag()?.textContent ?? '', /color: red/, 'undo previews the skin again')
  await h.close()
})
