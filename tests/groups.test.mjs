/**
 * Block ("组块") editing: one selector for a whole kind of element.
 *
 * The distinction the user asked for is the one the app itself guarantees: the sidebar tree is
 * `[role="tree"]`, a workspace row expands (`aria-expanded`) and a session row does not. These
 * tests build both lists side by side — with the SAME component classes, which is exactly the
 * trap — and pin that a group never straddles them, that a row's "…" and "+" stay apart (same
 * class, different accessible name), that the group covers a member created later, and that an
 * honest "no group" answer comes back when there is nothing to group.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { loadTs } from './helpers/load-ts.mjs'

const groups = await loadTs('src/client/groups.ts')

/** A sidebar tree (two workspaces, one expanded with two sessions) plus two unrelated cards. */
const SIDEBAR = [
  '<div id="root"><div class="sidebar_hash">',
  '  <div class="tree_hash" role="tree">',
  '    <div class="row_hash" role="treeitem" aria-expanded="true" data-id="w1">',
  '      <span class="name_hash">cy-nav</span>',
  '      <button class="icon_hash" aria-label="更多" data-act="more">…</button>',
  '      <button class="icon_hash" aria-label="新建工作区" data-act="add">+</button>',
  '      <div class="children_hash" role="group">',
  '        <div class="row_hash" role="treeitem" aria-selected="true" data-id="s1"><span class="name_hash">s1</span><button class="icon_hash" aria-label="更多对话" data-act="more">…</button></div>',
  '        <div class="row_hash" role="treeitem" aria-selected="false" data-id="s2"><span class="name_hash">s2</span><button class="icon_hash" aria-label="更多对话" data-act="more">…</button></div>',
  '      </div>',
  '    </div>',
  '    <div class="row_hash" role="treeitem" aria-expanded="false" data-id="w2">',
  '      <span class="name_hash">dsh-betterI</span>',
  '      <button class="icon_hash" aria-label="更多" data-act="more">…</button>',
  '      <button class="icon_hash" aria-label="新建工作区" data-act="add">+</button>',
  '    </div>',
  '  </div>',
  '  <div class="card_hash" data-kind="panel"><button class="icon_hash" aria-label="固定" data-act="pin">pin</button></div>',
  '  <div class="card_hash" data-kind="other"><button class="icon_hash" aria-label="固定" data-act="pin">pin</button></div>',
  '</div></div>',
].join('\n')

/**
 * Install the fixture as the global DOM.
 * @returns the jsdom document.
 */
function setup() {
  const dom = new JSDOM('<!doctype html><html><head></head><body>' + SIDEBAR + '</body></html>', { pretendToBeVisual: true })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.Node = dom.window.Node
  return dom.window.document
}

/**
 * The element a fixture selector points at.
 * @param doc - the document.
 * @param selector - the fixture selector.
 * @returns the element.
 */
function at(doc, selector) {
  const el = doc.querySelector(selector)
  assert.notEqual(el, null, 'fixture is missing ' + selector)
  return el
}

/**
 * The ids a selector matches, in document order.
 * @param doc - the document.
 * @param selector - the selector.
 * @returns the ids (or the action attribute when a node has no id).
 */
function idsOf(doc, selector) {
  return Array.from(doc.querySelectorAll(selector)).map((el) => el.dataset.id ?? el.dataset.act)
}

test('a workspace row groups with the other workspace rows only', () => {
  const doc = setup()
  const group = groups.elementGroupFor(at(doc, '[data-id="w1"]'), doc)
  assert.equal(group.kind, 'workspace')
  assert.equal(group.selector, groups.WORKSPACE_ROW_SELECTOR)
  assert.equal(group.count, 2, 'both workspaces, and NOT the two sessions')
  // The sessions live inside the expanded workspace row, so the group must not swallow them.
  assert.deepEqual(idsOf(doc, group.selector), ['w1', 'w2'])
})

test('a session row groups with the other sessions only', () => {
  const doc = setup()
  const group = groups.elementGroupFor(at(doc, '[data-id="s1"]'), doc)
  assert.equal(group.kind, 'session')
  assert.equal(group.selector, groups.SESSION_ROW_SELECTOR)
  assert.deepEqual(idsOf(doc, group.selector), ['s1', 's2'])
})

test('a row button groups with its peer in other rows — never across workspaces and sessions', () => {
  const doc = setup()
  const add = groups.elementGroupFor(at(doc, '[data-id="w1"] [data-act="add"]'), doc)
  assert.equal(add.kind, 'workspace')
  assert.equal(add.count, 2, 'the + of w1 and of w2')
  assert.deepEqual(idsOf(doc, add.selector), ['add', 'add'])

  // "…" and "+" share a component class; the accessible name is what keeps them apart.
  const more = groups.elementGroupFor(at(doc, '[data-id="w1"] [data-act="more"]'), doc)
  assert.equal(more.count, 2)
  assert.match(more.selector, /aria-label="更多"/)

  // The same component inside SESSION rows is a different block: scoping keeps it there.
  const sessionMore = groups.elementGroupFor(at(doc, '[data-id="s1"] [data-act="more"]'), doc)
  assert.equal(sessionMore.kind, 'session')
  assert.equal(sessionMore.count, 2)
  assert.match(sessionMore.selector, /aria-label="更多对话"/)
  assert.equal(doc.querySelectorAll(sessionMore.selector + '[data-id]').length, 0)
})

test('without an accessible name the group widens to the class — and says so with its count', () => {
  const doc = setup()
  for (const button of Array.from(doc.querySelectorAll('[data-act="more"]'))) button.removeAttribute('aria-label')
  const group = groups.elementGroupFor(at(doc, '[data-id="w1"] [data-act="more"]'), doc)
  // Same class, no way to tell "…" from "+": the honest answer is the four workspace-row icons.
  assert.equal(group.count, 4)
  // The session rows are nested INSIDE the expanded workspace row, so a plain descendant
  // selector would have swallowed their buttons as well; the row-relative path keeps them out.
  for (const button of Array.from(doc.querySelectorAll('[role="treeitem"]:not([aria-expanded]) button'))) {
    assert.equal(button.matches(group.selector), false, 'no session button may match a workspace block')
  }
})

test('the group covers members that do not exist yet', () => {
  const doc = setup()
  const group = groups.elementGroupFor(at(doc, '[data-id="w1"]'), doc)
  // A workspace created later: plain DOM, exactly what React would render.
  const later = doc.createElement('div')
  later.className = 'row_hash'
  later.setAttribute('role', 'treeitem')
  later.setAttribute('aria-expanded', 'false')
  later.dataset.id = 'w3'
  at(doc, '.tree_hash').appendChild(later)
  assert.deepEqual(idsOf(doc, group.selector), ['w1', 'w2', 'w3'])
})

test('outside the tree the group is scoped to the list it repeats in', () => {
  const doc = setup()
  const group = groups.elementGroupFor(at(doc, '[data-kind="panel"] [data-act="pin"]'), doc)
  assert.equal(group.kind, 'peers')
  assert.equal(group.count, 2, 'the same button of both cards')
  assert.equal(group.selector, 'div.card_hash button.icon_hash[aria-label="固定"]')
  // Nothing from the sidebar tree — same class, different list — sneaks in.
  assert.deepEqual(idsOf(doc, group.selector), ['pin', 'pin'])
})

test('an instance that repeats under one parent is grouped', () => {
  const doc = setup()
  const host = doc.createElement('div')
  host.className = 'list_hash'
  host.innerHTML = '<button class="chip_hash">a</button><button class="chip_hash">b</button><button class="chip_hash">c</button>'
  at(doc, '#root').appendChild(host)
  const group = groups.elementGroupFor(at(doc, '.chip_hash'), doc)
  assert.equal(group.kind, 'peers')
  assert.equal(group.count, 3)
  assert.equal(group.selector, 'div.list_hash button.chip_hash')
})

test('a class scattered across unrelated parents is not a block', () => {
  const doc = setup()
  const loose = doc.createElement('div')
  loose.className = 'somewhere_hash'
  loose.innerHTML = '<button class="icon_hash" aria-label="固定" data-act="pin">x</button>'
  at(doc, '#root').appendChild(loose)
  // Now the pin button exists under a THIRD parent class: grouping it would have restyled
  // parts of the sidebar too, so the answer is "no block" instead.
  assert.equal(groups.elementGroupFor(at(doc, '.somewhere_hash [data-act="pin"]'), doc), undefined)
})

test('a recognised kind is a block even when only one exists today', () => {
  // "Edit one, the others follow — including the ones created later" cannot depend on how many
  // happen to exist right now: a single workspace must still offer 整组 scope.
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="sidebar_hash"><div class="tree_hash" role="tree"><div class="row_hash" role="treeitem" aria-expanded="false" data-id="only"><span class="name_hash">cy-nav</span><button class="icon_hash" aria-label="新建会话">+</button></div></div></div></body></html>', { pretendToBeVisual: true })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.Node = dom.window.Node
  const doc = dom.window.document
  const row = groups.elementGroupFor(doc.querySelector('[data-id="only"]'), doc)
  assert.deepEqual(row, { selector: groups.WORKSPACE_ROW_SELECTOR, count: 1, kind: 'workspace' })
  const button = groups.elementGroupFor(doc.querySelector('button'), doc)
  assert.equal(button.kind, 'workspace')
  assert.equal(button.count, 1)
  // With a single row the accessible name is not SHARED yet, so the position carries the block:
  // same place in every workspace row, which is what a row created later will render.
  assert.equal(button.selector, groups.WORKSPACE_ROW_SELECTOR + ' > button.icon_hash')
})

test('a per-instance accessible name never becomes the block key', () => {
  // DSH builds those labels from the row's own name ("…cy-nav 的操作"), so the refined
  // candidate matches exactly ONE element. Accepting it produced a "block" of one — the panel
  // said 整组 and no other row moved. It must fall back to the position, whose count is real.
  const dom = new JSDOM([
    '<!doctype html><html><head></head><body><div class="sidebar_hash"><div class="tree_hash" role="tree">',
    '<div class="row_hash" role="treeitem" aria-expanded="false" data-id="w1"><span class="actions_hash"><button class="icon_hash" aria-label="…cy-nav 的操作">…</button><button class="icon_hash" aria-label="在 cy-nav 中新建会话">+</button></span></div>',
    '<div class="row_hash" role="treeitem" aria-expanded="false" data-id="w2"><span class="actions_hash"><button class="icon_hash" aria-label="…dsh-betterI 的操作">…</button><button class="icon_hash" aria-label="在 dsh-betterI 中新建会话">+</button></span></div>',
    '</div></div></body></html>',
  ].join(""), { pretendToBeVisual: true })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.Node = dom.window.Node
  const doc = dom.window.document
  const group = groups.elementGroupFor(doc.querySelector('[data-id="w1"] button'), doc)
  assert.equal(group.kind, "workspace")
  assert.equal(group.count, 4, "both row controls of both workspaces — and the count says so")
  assert.doesNotMatch(group.selector, /aria-label/)
  assert.equal(group.selector, groups.WORKSPACE_ROW_SELECTOR + " > span.actions_hash > button.icon_hash")
})

test('switching to 整组 moves the element\'s declarations onto the block', () => {
  const css = [
    { selector: "#root > div > div:nth-of-type(1)", rule: "background-color: #123456 !important" },
    { selector: groups.WORKSPACE_ROW_SELECTOR, rule: "font-size: 15px !important" },
  ]
  const moved = groups.moveRuleToBlock(css, css[0].selector, groups.WORKSPACE_ROW_SELECTOR)
  assert.deepEqual(moved, [{ selector: groups.WORKSPACE_ROW_SELECTOR, rule: "font-size: 15px !important; background-color: #123456 !important" }])
  // Nothing styled on the element: the list is copied, never rewritten.
  const untouched = groups.moveRuleToBlock([{ selector: "#x", rule: "color: red" }], "#missing", groups.WORKSPACE_ROW_SELECTOR)
  assert.deepEqual(untouched, [{ selector: "#x", rule: "color: red" }])
  assert.deepEqual(groups.moveRuleToBlock([], "#x", "#y"), [])
  // Already the same selector (the selected element IS the block): no self-merge.
  assert.deepEqual(groups.moveRuleToBlock(css, groups.WORKSPACE_ROW_SELECTOR, groups.WORKSPACE_ROW_SELECTOR), css)
})
test('nothing stable to group means no group, not a group of one', () => {
  const doc = setup()
  const plain = doc.createElement('div')
  plain.id = 'lone'
  at(doc, '#root').appendChild(plain)
  assert.equal(groups.elementGroupFor(plain, doc), undefined)
  const single = doc.createElement('span')
  single.className = 'only_hash'
  at(doc, '#root').appendChild(single)
  assert.equal(groups.elementGroupFor(single, doc), undefined)
})

test('the gap targets only the space BETWEEN sibling members', () => {
  const doc = setup()
  const group = groups.elementGroupFor(at(doc, '[data-id="w1"]'), doc)
  const gapSelector = groups.gapSelectorFor(group, doc)
  assert.equal(gapSelector, groups.WORKSPACE_ROW_SELECTOR + " + " + groups.WORKSPACE_ROW_SELECTOR)
  // Four workspaces would make three gaps: the first member keeps its distance to the container
  // (that is DSH's own way of spacing a list — `[role=treeitem]+[role=treeitem]`).
  const later = doc.createElement("div")
  later.className = "row_hash"
  later.setAttribute("role", "treeitem")
  later.setAttribute("aria-expanded", "false")
  later.dataset.id = "w3"
  at(doc, ".tree_hash").appendChild(later)
  assert.equal(doc.querySelectorAll(gapSelector).length, 2)
})

test('members that are not adjacent siblings get no gap field', () => {
  const doc = setup()
  // The two pins sit in different cards: one per card, never siblings of each other.
  const group = groups.elementGroupFor(at(doc, '[data-kind="panel"] [data-act="pin"]'), doc)
  assert.equal(group.kind, "peers")
  assert.equal(groups.gapSelectorFor(group, doc), undefined)
})

test('the gap is a normal css entry: set, merge, read back, clear', () => {
  const selector = '[role="treeitem"][aria-expanded] + [role="treeitem"][aria-expanded]'
  const withGap = groups.withGapRule([], selector, "6px")
  assert.deepEqual(withGap, [{ selector, rule: "margin-top: 6px !important" }])
  assert.equal(groups.gapOf(withGap, selector), "6px")
  // Changing it must not disturb anything else that lives on the same selector.
  const merged = groups.withGapRule([{ selector, rule: "border-radius: 4px !important; margin-top: 2px !important" }], selector, "10px")
  assert.equal(merged[0].rule, "border-radius: 4px !important; margin-top: 10px !important")
  // Clearing removes the declaration, and the entry with it when nothing is left.
  assert.deepEqual(groups.withGapRule(merged, selector, ""), [{ selector, rule: "border-radius: 4px !important" }])
  assert.deepEqual(groups.withGapRule(withGap, selector, ""), [])
  // Unrelated entries survive untouched, and the gap entry moves to the end.
  const kept = groups.withGapRule([{ selector: "#a", rule: "color: red" }, ...withGap], selector, "4px")
  assert.equal(kept.length, 2)
  assert.equal(kept[1].selector, selector)
})

test('a bare number means pixels, a unit is written as typed', () => {
  assert.equal(groups.gapLength("6"), "6px")
  assert.equal(groups.gapLength(" 6 "), "6px")
  assert.equal(groups.gapLength("6px"), "6px")
  assert.equal(groups.gapLength("0.5rem"), "0.5rem")
  assert.equal(groups.gapLength("-4"), "-4px")
  assert.equal(groups.gapLength("50%"), "50%")
  assert.equal(groups.gapLength("   "), "")
})
test('the block kinds each carry copy in both dictionaries', async () => {
  const locales = await loadTs('src/client/locales.ts')
  for (const kind of ['workspace', 'session', 'tree', 'peers']) {
    const key = groups.groupLabelKey(kind)
    assert.equal(typeof locales.zh[key], 'string', kind + ' is missing zh copy')
    assert.equal(typeof locales.en[key], 'string', kind + ' is missing en copy')
  }
})
