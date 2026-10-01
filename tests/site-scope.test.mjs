/**
 * 「全站」scope: ONE selector for a component that lives in every view.
 *
 * The canvas writes structural selectors — `#root > div:nth-of-type(3) > …` for the conversation
 * view, `body > div:nth-of-type(2) > …` for anything portalled beside it. A plugin that renders the
 * same widget in every view therefore cannot be covered by one rule, and the positional path even
 * shifts when another portal appears. These tests pin the replacement: identity-only selectors, the
 * two ways one can be refused, and the fact that a later instance is covered for free.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { loadTs } from './helpers/load-ts.mjs'

const site = await loadTs('src/client/site-scope.ts')
const engine = await loadTs('src/client/skin-engine.ts')
const groups = await loadTs('src/client/groups.ts')

/**
 * A document shaped like the real one: the app under #root, a portal beside it, and the same
 * plugin widget `markup` in both.
 * @param markup - the widget markup.
 * @param extra - extra body markup appended after the portal.
 * @returns the document and helpers.
 */
function setup(markup, extra = '') {
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body>'
    + '<div id="root"><div class="_app_frame_1a2b3_7">' + markup + '</div></div>'
    + '<div data-shortcut-modal="settings">' + markup + '</div>'
    + extra
    + '</body></html>',
  )
  const doc = dom.window.document
  return { doc, widgets: () => Array.from(doc.querySelectorAll('.bhn1Oq_chatWidget')) }
}

test('one widget in two different trees gets ONE selector, and the structural one never does', () => {
  const { doc, widgets } = setup('<div class="bhn1Oq_chatWidget"><span>↗</span></div>')
  const [inApp, inPortal] = widgets()
  assert.notEqual(inApp, undefined)
  assert.notEqual(inPortal, undefined)

  // The gap this scope exists for: the editor's normal selectors are positional, so the
  // conversation instance and the settings instance can never be reached by the same rule.
  const structuralApp = engine.selectorOf(inApp)
  const structuralPortal = engine.selectorOf(inPortal)
  assert.notEqual(structuralApp, structuralPortal)
  assert.equal(doc.querySelectorAll(structuralApp).length, 1)
  assert.equal(doc.querySelectorAll(structuralPortal).length, 1)

  const outcome = site.siteScopeFor(inApp, doc)
  assert.equal(outcome.ok, true)
  assert.equal(outcome.scope.selector, 'div.bhn1Oq_chatWidget')
  assert.equal(outcome.scope.count, 2)
  assert.equal(doc.querySelectorAll(outcome.scope.selector).length, 2)
  // No ancestor path, no position: that is the whole contract.
  assert.doesNotMatch(outcome.scope.selector, /[ >]|:nth-|#root|body/)
})

test('the identity ignores state classes and per-instance attributes', () => {
  const { doc } = setup('<div class="bhn1Oq_chatWidget is-active" data-index="2"><span>↗</span></div>')
  const widget = doc.querySelector('.bhn1Oq_chatWidget')
  const outcome = site.siteScopeFor(widget, doc)
  assert.equal(outcome.ok, true)
  assert.equal(outcome.scope.selector, 'div.bhn1Oq_chatWidget')
  assert.doesNotMatch(outcome.scope.selector, /is-active|data-index/)
})

test('every generated class shape DSH has shipped counts as an identity', () => {
  // The current build emits `pI_x6G_frame` (two hash segments), 0.2.x older builds `bhn1Oq_projectRow`
  // and 0.1.x `_row_1abc2_34`. A heuristic that only knew the middle one would fall back to "all
  // classes", keep the state class, and write a selector that matches nothing in the other view —
  // the exact silent failure this scope must not have.
  for (const name of ['pI_x6G_chatWidget', 'bhn1Oq_chatWidget', '_chatWidget_1a2b3_45']) {
    const { doc } = setup('<div class="' + name + ' is-active has-error"><span>↗</span></div>')
    const el = doc.querySelector('[class*="chatWidget"]')
    const outcome = site.siteScopeFor(el, doc)
    assert.equal(outcome.ok, true, name + ' must be usable as an identity')
    assert.equal(outcome.scope.selector, 'div.' + name, name + ' keeps only the generated class')
  }
})

test('a SHARED data attribute refines the class, a per-instance one is dropped', () => {
  const shared = setup('<div class="bhn1Oq_chatWidget" data-plugin="chat-widget"><span>↗</span></div>')
  const sharedOutcome = site.siteScopeFor(shared.widgets()[0], shared.doc)
  assert.equal(sharedOutcome.ok, true)
  assert.equal(sharedOutcome.scope.selector, 'div.bhn1Oq_chatWidget[data-plugin="chat-widget"]')

  const once = setup('<div class="bhn1Oq_chatWidget" data-key="abc"><span>↗</span></div>')
  const onceOutcome = site.siteScopeFor(once.widgets()[0], once.doc)
  assert.equal(onceOutcome.ok, true)
  assert.equal(onceOutcome.scope.selector, 'div.bhn1Oq_chatWidget')
})

test('an element with no class still has an identity; a bare one gets an honest no', () => {
  const tagged = setup('<div data-plugin-x="1"><span>↗</span></div>')
  const outcome = site.siteScopeFor(tagged.doc.querySelector('[data-plugin-x]'), tagged.doc)
  assert.equal(outcome.ok, true)
  assert.equal(outcome.scope.selector, 'div[data-plugin-x="1"]')
  assert.equal(outcome.scope.count, 2)

  const role = setup('<section role="complementary"><span>↗</span></section>')
  const roleOutcome = site.siteScopeFor(role.doc.querySelector('[role="complementary"]'), role.doc)
  assert.equal(roleOutcome.ok, true)
  assert.equal(roleOutcome.scope.selector, 'section[role="complementary"]')

  const bare = setup('<div><span>↗</span></div>')
  const bareOutcome = site.siteScopeFor(bare.doc.querySelector('#root div div'), bare.doc)
  assert.deepEqual(bareOutcome, { ok: false, reason: 'no-identity', count: 0 })
})

test('a utility class is refused instead of restyling the app', () => {
  // 200 rows: "everywhere" would mean "everywhere in the app", which is not what the user asked for.
  const rows = Array.from({ length: 200 }, () => '<div class="row"><span>x</span></div>').join('')
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root">' + rows + '</div></body></html>')
  const doc = dom.window.document
  const outcome = site.siteScopeFor(doc.querySelector('.row'), doc)
  assert.equal(outcome.ok, false)
  assert.equal(outcome.reason, 'too-generic')
  assert.ok(outcome.count > site.SITE_SCOPE_MAX, 'the count is reported for the panel copy')
  assert.ok(site.SITE_SCOPE_MAX <= 64, 'the cap stays small enough to be a "component"')
})

test('the scope covers instances created later — that is the point of an identity', () => {
  const { doc, widgets } = setup('<div class="bhn1Oq_chatWidget"><span>↗</span></div>')
  const outcome = site.siteScopeFor(widgets()[0], doc)
  assert.equal(outcome.ok, true)
  assert.equal(outcome.scope.count, 2)
  // A view the user has not opened yet mounts the same component: no new rule, no re-pick.
  const later = doc.createElement('div')
  later.className = 'bhn1Oq_chatWidget'
  doc.body.appendChild(later)
  assert.equal(doc.querySelectorAll(outcome.scope.selector).length, 3)
  // …and nothing positional leaked in, so adding a portal does not shift the match either.
  const dialog = doc.createElement('div')
  dialog.setAttribute('data-shortcut-modal', 'settings')
  doc.body.insertBefore(dialog, doc.body.firstChild)
  assert.equal(doc.querySelectorAll(outcome.scope.selector).length, 3)
})

test('switching to 全站 carries the declarations already written', () => {
  const { doc, widgets } = setup('<div class="bhn1Oq_chatWidget"><span>↗</span></div>')
  const widget = widgets()[0]
  const outcome = site.siteScopeFor(widget, doc)
  assert.equal(outcome.ok, true)
  const own = engine.selectorOf(widget)
  const css = [{ selector: own, rule: 'color: red !important' }]
  const moved = groups.moveRuleToBlock(css, own, outcome.scope.selector)
  assert.deepEqual(moved, [{ selector: outcome.scope.selector, rule: 'color: red !important' }])
})
