/**
 * Per-surface visibility: the same component shown on one surface and hidden on another.
 *
 * The first version of this feature shipped a fixed pair of buckets — "the settings dialog is open"
 * and "it is not" — and the report was exact: hiding worked in Settings and did nothing on the
 * Plugins page. Upstream's plugins page is not a settings tab; it is another entry of the MAIN
 * slot (`PANEL_ID = "plugins"`), so the settings dialog is not even mounted while it is on screen.
 *
 * These tests pin the corrected model: the surface is derived from what is on screen (the settings
 * marker, or the active main panel described by its own semantic markup), the rule writes
 * `body:has(<marker>) <identity>`, and the component's COMPUTED display flips only on the
 * surface it was hidden in — plus the undo for "I turned every surface off".
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { loadTs } from './helpers/load-ts.mjs'

const views = await loadTs('src/client/views.ts')
const engine = await loadTs('src/client/skin-engine.ts')
const locales = await loadTs('src/client/locales.ts')

/** The component's own identity (what site-scope.ts hands the surface rules). */
const IDENTITY = 'div.bhn1Oq_chatWidget'

/** The page markup the shell renders into `[data-slot="main"]`, as upstream writes it. */
const PAGES = {
  // The plugin manager's page root: <section class="…_page" data-plugin-panel>.
  plugins: '<section class="pI_x6G_page" data-plugin-panel="true"><h1>插件</h1></section>',
  // The conversation: a column wrapper, then the conversation region below it.
  conversation: '<div class="pI_x6G_column"><div data-conversation-region="true"><p>hi</p></div></div>',
}

/**
 * A document shaped like the real app: the frame, the main outlet with ONE page in it, and the
 * plugin's UI as a single global node (the shape that is visible on every surface).
 * @param page - which page the main outlet holds.
 * @returns the jsdom window and helpers.
 */
function setup(page = 'plugins') {
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body>'
    + '<div id="root"><div class="pI_x6G_frame"><div data-slot="main">' + PAGES[page] + '</div></div></div>'
    + '<div class="bhn1Oq_chatWidget">w</div>'
    + '</body></html>',
    { pretendToBeVisual: true },
  )
  return { dom, doc: dom.window.document, widget: dom.window.document.querySelector('.bhn1Oq_chatWidget') }
}

/**
 * Swap the page the main outlet holds (a navigation, the way the shell does it).
 * @param doc - the document.
 * @param page - the page to mount.
 */
function navigate(doc, page) {
  doc.querySelector('[data-slot="main"]').innerHTML = PAGES[page]
}

/**
 * Mount the settings surface the way upstream does (a panel portalled to <body>).
 * @param doc - the document.
 * @returns the panel element.
 */
function openSettings(doc) {
  const panel = doc.createElement('div')
  panel.setAttribute('data-shortcut-modal', 'settings')
  panel.setAttribute('role', 'dialog')
  doc.body.appendChild(panel)
  return panel
}

/**
 * Render the skin's css the way the engine does: one stylesheet, last in <head>.
 * @param doc - the document.
 * @param css - the rule list.
 * @returns the style tag (rewrite its text to repaint).
 */
function paint(doc, css) {
  const text = css.map((entry) => entry.selector + ' { ' + entry.rule + ' }').join(String.fromCharCode(10))
  const existing = doc.getElementById('skin')
  if (existing !== null) { existing.textContent = text; return existing }
  const tag = doc.createElement('style')
  tag.id = 'skin'
  tag.textContent = text
  doc.head.appendChild(tag)
  return tag
}

/** Shorthand for the label builder the editor passes in. */
const label = (el) => engine.elementLabel(el, 40)

test('each page of the main area is described by its own semantic markup', () => {
  const plugins = setup('plugins')
  const page = views.currentPageSurface(plugins.doc, label)
  assert.notEqual(page, undefined, 'the plugins page must be describable')
  assert.equal(page.marker, '[data-slot="main"] [data-plugin-panel]')
  assert.equal(page.id, 'page:[data-slot="main"] [data-plugin-panel]')

  const chat = setup('conversation')
  const chatPage = views.currentPageSurface(chat.doc, label)
  assert.notEqual(chatPage, undefined, 'the conversation must be describable too')
  // The marker does not have to be on the outlet's first child: the walk goes down through first
  // children until it finds something semantic, which is what keeps it off a plain wrapper.
  assert.equal(chatPage.marker, '[data-slot="main"] [data-conversation-region]')
  assert.notEqual(chatPage.id, page.id)
})

test('a page with no semantic markup is refused instead of guessed', () => {
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body><div id="root"><div data-slot="main">'
    + '<div class="pI_x6G_page"><div class="pI_x6G_body">plain</div></div>'
    + '</div></div></body></html>',
    { pretendToBeVisual: true },
  )
  // A generated class hash is not a contract: it would silently stop matching after an upgrade.
  assert.equal(views.currentPageSurface(dom.window.document, label), undefined)
})

test('the settings surface stays the built-in one, and wins while it is mounted', () => {
  const { doc } = setup('plugins')
  assert.equal(views.settingsOpen(doc), false)
  assert.equal(views.currentSurface(doc, '设置弹窗', label).marker, '[data-slot="main"] [data-plugin-panel]')
  const panel = openSettings(doc)
  assert.equal(views.settingsOpen(doc), true)
  const surface = views.currentSurface(doc, '设置弹窗', label)
  assert.equal(surface.marker, '[data-shortcut-modal]')
  assert.equal(surface.label, '设置弹窗')
  assert.equal(views.surfaceRuleSelector(surface, IDENTITY), 'body:has([data-shortcut-modal]) ' + IDENTITY)
  panel.remove()
  assert.equal(views.currentSurface(doc, '设置弹窗', label).marker, '[data-slot="main"] [data-plugin-panel]')
})

test('hiding on the plugins page does NOT hide it in the conversation (the reported bug)', () => {
  const { dom, doc, widget } = setup('plugins')
  const surface = views.currentPageSurface(doc, label)
  const css = views.withSurfaceHidden([], surface, IDENTITY, true)
  assert.equal(css[0].selector, 'body:has([data-slot="main"] [data-plugin-panel]) ' + IDENTITY)
  paint(doc, css)

  // On the plugins page: gone.
  assert.equal(dom.window.getComputedStyle(widget).display, 'none')
  // Navigating to the conversation: back.
  navigate(doc, 'conversation')
  assert.equal(dom.window.getComputedStyle(widget).display, 'block')
  // …and the conversation's own surface can be hidden independently, without touching the rule.
  const chatSurface = views.currentPageSurface(doc, label)
  const both = views.withSurfaceHidden(css, chatSurface, IDENTITY, true)
  assert.equal(both.length, 2)
  paint(doc, both)
  assert.equal(dom.window.getComputedStyle(widget).display, 'none', 'hidden on the conversation now')
  navigate(doc, 'plugins')
  assert.equal(dom.window.getComputedStyle(widget).display, 'none', 'and still hidden on the plugins page')
  // Showing it again on one page leaves the other rule exactly as it was. The document is on the
  // PLUGINS page at this point, so the check has to navigate back to the conversation it was
  // unhidden for — and the plugins page must still hide it.
  const back = views.withSurfaceHidden(both, chatSurface, IDENTITY, false)
  assert.deepEqual(back, css)
  paint(doc, back)
  assert.equal(dom.window.getComputedStyle(widget).display, 'none', 'plugins page still hides it')
  navigate(doc, 'conversation')
  assert.equal(dom.window.getComputedStyle(widget).display, 'block', 'conversation shows it again')
})

test('the settings dialog and the page are two independent surfaces', () => {
  const { dom, doc, widget } = setup('plugins')
  const settings = views.settingsSurface('设置弹窗')
  const page = views.currentPageSurface(doc, label)
  let css = views.withSurfaceHidden([], settings, IDENTITY, true)
  paint(doc, css)
  const panel = openSettings(doc)
  assert.equal(dom.window.getComputedStyle(widget).display, 'none', 'hidden while settings is open')
  panel.remove()
  assert.equal(dom.window.getComputedStyle(widget).display, 'block', 'visible again once it closes')

  // Hidden on the plugins page as well: the two rules coexist and are read back independently.
  css = views.withSurfaceHidden(css, page, IDENTITY, true)
  assert.equal(views.hiddenInSurface(css, settings, IDENTITY), true)
  assert.equal(views.hiddenInSurface(css, page, IDENTITY), true)
  assert.equal(views.hiddenInSurface(views.withSurfaceHidden(css, page, IDENTITY, false), page, IDENTITY), false)
})

test('hiding everywhere is undoable — the rules are just css, and the bin knows them', () => {
  const { doc } = setup('plugins')
  const settings = views.settingsSurface('设置弹窗')
  const page = views.currentPageSurface(doc, label)
  let css = views.withSurfaceHidden([], settings, IDENTITY, true)
  css = views.withSurfaceHidden(css, page, IDENTITY, true)
  // A rule from the OLD build (the crude "no settings dialog" bucket) must be caught by the undo
  // too — it is exactly the kind of leftover that made "how do I get it back?" a fair question.
  css = [...css, { selector: 'body:not(:has([data-shortcut-modal])) ' + IDENTITY, rule: 'display: none !important' }]
  const hidden = views.hiddenRulesFor(css, IDENTITY)
  assert.equal(hidden.length, 3)

  const restored = views.withAllHiddenRestored(css, IDENTITY)
  assert.deepEqual(restored, [], 'nothing left hiding this component')
  assert.deepEqual(views.hiddenRulesFor(restored, IDENTITY), [])

  // Same edit through the recycle bin, one entry at a time: the two paths cannot disagree.
  let viaBin = css
  for (const entry of engine.removedControls(css)) viaBin = engine.withControlRestored(viaBin, entry.selector)
  assert.deepEqual(viaBin, restored)

  // A rule that also carried something else keeps it.
  const mixed = views.withAllHiddenRestored([{ selector: page.marker + ' ' + IDENTITY, rule: 'color: red !important; display: none !important' }], IDENTITY)
  assert.deepEqual(mixed, [{ selector: page.marker + ' ' + IDENTITY, rule: 'color: red !important' }])
})

test('both languages carry the copy the card needs', () => {
  for (const key of ['viewCard', 'viewHint', 'viewSettings', 'viewSettingsHint', 'viewThisPage', 'viewUnknown',
    'viewNoPageMarker', 'viewCurrent', 'viewShown', 'viewHidden', 'viewRules', 'viewRestoreAll', 'viewRestoreAllHint', 'viewAllHidden',
    'viewPresets', 'viewOnlyHere', 'viewOnlyHereHint', 'viewHideEverywhere', 'viewHideEverywhereHint',
    'fieldZIndex', 'zIndexAuto', 'zIndexHint', 'zIndexPresetHint', 'zIndexStaticHint', 'zIndexMakeRelative']) {
    assert.equal(typeof locales.zh[key], 'string', 'zh: ' + key)
    assert.equal(typeof locales.en[key], 'string', 'en: ' + key)
  }
})
test('presets set the whole visibility state, and the rows tell the truth about it', () => {
  const { dom, doc, widget } = setup('plugins')
  const settings = views.settingsSurface('设置弹窗')
  const page = views.currentPageSurface(doc, label)
  const surfaces = [settings, page]

  // 「只在本页显示」: one inverted rule covers every other surface, known or not.
  let css = views.withOnlySurface([], page, IDENTITY, surfaces)
  // Two rules: the inverted one for "anywhere this page is not", plus one for the settings dialog,
  // which can be up WHILE this page stays mounted behind it.
  assert.equal(css.length, 2)
  assert.deepEqual(css.map((entry) => entry.selector), [
    'body:has([data-shortcut-modal]) ' + IDENTITY,
    'body:not(:has([data-slot="main"] [data-plugin-panel])) ' + IDENTITY,
  ])
  paint(doc, css)
  assert.equal(dom.window.getComputedStyle(widget).display, 'block', 'visible on this page')
  const panel = openSettings(doc)
  assert.equal(dom.window.getComputedStyle(widget).display, 'none', 'hidden on the settings dialog')
  panel.remove()
  // …and the rows report it, including the row that has no rule of its own.
  assert.equal(views.hiddenWhile(css, page, IDENTITY, surfaces), false)
  assert.equal(views.hiddenWhile(css, settings, IDENTITY, surfaces), true)
  navigate(doc, 'conversation')
  const other = views.currentPageSurface(doc, label)
  assert.equal(views.hiddenWhile(css, other, IDENTITY, surfaces), true, 'a page the editor never saw is covered too')

  // 「显示」 on the settings row means "show it there too": the inverted rule goes away…
  const shownInSettings = views.withVisibleWhile(css, settings, IDENTITY, surfaces)
  assert.deepEqual(shownInSettings, [])
  // …while a rule that hides it on ANOTHER surface is left alone.
  const hiddenOnPage = views.withSurfaceHidden([], page, IDENTITY, true)
  const kept = views.withVisibleWhile(hiddenOnPage, settings, IDENTITY, surfaces)
  assert.deepEqual(kept, hiddenOnPage)

  // 「到处都不显示」 is a blunt rule on the identity, and it makes every row say 不显示.
  const everywhere = views.withHiddenEverywhere([], IDENTITY)
  assert.deepEqual(everywhere, [{ selector: IDENTITY, rule: 'display: none !important' }])
  for (const surface of surfaces) assert.equal(views.hiddenWhile(everywhere, surface, IDENTITY, surfaces), true)
  paint(doc, everywhere)
  assert.equal(dom.window.getComputedStyle(widget).display, 'none')
  // …and 「全部恢复显示」 clears it, as it clears anything else.
  assert.deepEqual(views.withAllHiddenRestored(everywhere, IDENTITY), [])
})

test('the pages already visited are remembered, and a hostile storage cannot poison them', () => {
  const store = new Map()
  const storage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => { store.set(k, String(v)) } }
  assert.deepEqual(views.readRememberedSurfaces(storage), [])
  const page = { id: 'page:[data-slot="main"] [data-plugin-panel]', label: '插件', marker: '[data-slot="main"] [data-plugin-panel]' }
  const chat = { id: 'page:[data-slot="main"] [data-conversation-region]', label: '对话', marker: '[data-slot="main"] [data-conversation-region]' }
  let list = views.rememberSurface(storage, [], page)
  list = views.rememberSurface(storage, list, chat)
  assert.deepEqual(list.map((entry) => entry.label), ['对话', '插件'], 'newest first')
  assert.deepEqual(views.readRememberedSurfaces(storage), list, 'and it survives a reload')
  list = views.rememberSurface(storage, list, page)
  assert.equal(list.length, 2, 'revisiting a page does not duplicate it')
  // The stored value is user-writable: anything that is not a marker this build produces is dropped.
  store.set(views.SURFACES_STORAGE_KEY, JSON.stringify([
    { id: 'x', label: 'x', marker: 'body *' },
    { id: 'y', label: 'y', marker: '[data-ok]' },
    { id: 'z', label: 'z' },
    'nonsense',
  ]))
  assert.deepEqual(views.readRememberedSurfaces(storage), [{ id: 'y', label: 'y', marker: '[data-ok]', overlay: false }])
  // A storage that throws is a preference problem, never an editor problem.
  const hostile = { getItem() { throw new Error('denied') }, setItem() { throw new Error('denied') } }
  assert.deepEqual(views.readRememberedSurfaces(hostile), [])
  assert.doesNotThrow(() => views.rememberSurface(hostile, [], page))
  assert.deepEqual(views.readRememberedSurfaces(undefined), [])
  // The cap keeps the panel a tool, not a browser history.
  let many = []
  for (let i = 0; i < views.MAX_REMEMBERED_SURFACES + 4; i += 1) many = views.rememberSurface(undefined, many, { id: 'p' + String(i), label: 'p', marker: '[data-p' + String(i) + ']' })
  assert.equal(many.length, views.MAX_REMEMBERED_SURFACES)
})
