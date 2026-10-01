/**
 * Block ("组块") editing: edit ONE member, style the whole kind.
 *
 * The canvas writes structural selectors (`#root > div > … > button:nth-child(3)`), which is
 * exactly what makes today's editing single-element: restyle a workspace row and the other
 * workspaces — and every workspace created later — keep the stock look.
 *
 * This module answers a different question: "which selector matches THIS KIND of element?".
 * It prefers the semantics the app already guarantees over generated class hashes:
 *
 *   - the sidebar tree is `[role="tree"]`, a workspace row is `[role="treeitem"][aria-expanded]`
 *     and a session row is a `[role="treeitem"]` without one (the rule the engine's tree
 *     decorator uses, and the contract `check:compat` verifies). Workspace buttons and session
 *     buttons are therefore told apart WITHOUT depending on a build's class names;
 *   - the block is anchored to the element's OWN row and reached by a relative path
 *     (`[role="treeitem"][aria-expanded] > button.icon_hash[aria-label="…"]`). A session row
 *     nests INSIDE an expanded workspace row, so a plain descendant selector would drag the
 *     session buttons into the workspace block — the exact confusion this must not create;
 *   - icon-only buttons of one row usually share a component class, so their accessible name is
 *     used to keep "…" and "+" apart;
 *   - anything else falls back to the element's classes, grouped only when they repeat under ONE
 *     kind of parent (every row, every card).
 *
 * Whatever comes out is an ordinary CSS selector: it matches members that do not exist yet, so a
 * new workspace picks the style up for free — and it is stored as a normal `css` entry, so it
 * stays visible in geek mode and individually removable.
 */

import type { CssRule } from '../skin-schema.ts'
import { mergeDeclaration, withoutDeclaration } from './skin-engine.ts'
import type { MySkinKey } from './locales.ts'

/** The kind of block a group represents (drives the label and nothing else). */
export type GroupKind = 'workspace' | 'session' | 'tree' | 'peers' | 'site'

/**
 * What the Inspector edits.
 *
 *   - \`single\`: the element the user picked, addressed by its structural selector;
 *   - \`group\`: its block — the same kind of element, reachable from here, including members
 *     created later (this module);
 *   - \`site\`: the same IDENTITY anywhere in the document, with no ancestor path at all — the
 *     scope for a component a plugin renders in every view (site-scope.ts).
 */
export type EditScope = 'single' | 'group' | 'site'

/** One block of look-alike elements the editor can edit together. */
export interface ElementGroup {
  /** Selector matching every member — including members created later. */
  selector: string
  /** How many members exist right now. */
  count: number
  /** What the block is, when the DOM says so. */
  kind: GroupKind
}

/** A workspace row of the sidebar tree (expands to show its sessions). */
export const WORKSPACE_ROW_SELECTOR = '[role="treeitem"][aria-expanded]'
/** Any other tree row: a session (or a flattened-list row). */
export const SESSION_ROW_SELECTOR = '[role="treeitem"]:not([aria-expanded])'
/** The sidebar tree itself. */
export const TREE_SELECTOR = '[role="tree"]'

/** Copy key for one block kind's label. */
const KIND_KEYS: Record<GroupKind, MySkinKey> = {
  workspace: 'groupWorkspace',
  session: 'groupSession',
  tree: 'groupTree',
  peers: 'groupPeers',
  site: 'scopeSite',
}

/**
 * The label key for a block kind.
 * @param kind - the block kind.
 * @returns the locale key.
 */
export function groupLabelKey(kind: GroupKind): MySkinKey {
  return KIND_KEYS[kind]
}

/**
 * The generated-class shapes DSH has shipped, which are instance-independent by construction.
 *
 *   0.1.x  \`_row_1abc2_34\`          — name, then a hash, then an optional index
 *   0.2.x  \`bhn1Oq_projectRow\`      — hash, then the readable name
 *   0.2.x  \`pI_x6G_centerCol\`       — TWO hash segments, then the readable name (current build:
 *                                      `.pI_x6G_frame\`, \`.pI_x6G_sidebarCol\`, …)
 *
 * The two-segment form is listed separately because it is the one in use today and it is NOT
 * matched by the \`hash_name\` pattern above.
 */
const MODULE_CLASS = /^_[A-Za-z][\w-]*_[a-z0-9]{4,}(_\d+)?$/
/** See {@link MODULE_CLASS}. */
const MODULE_CLASS_HASHED = /^[A-Za-z0-9]{4,}_[A-Za-z][\w-]*$|^[A-Za-z0-9]{2,}_[A-Za-z0-9]{2,}_[A-Za-z][\w-]*$/

/**
 * Classes a component flips per instance — never an identity.
 *
 * Both spellings occur: bare words (\`active\`) and prefixed ones (\`is-active\`, \`has-error\`).
 */
const STATE_CLASS = /^(is|has)[-_]|^(active|selected|disabled|open|closed|hover|focus|hidden|expanded|collapsed|current|dragging|loading|pressed)$/i

/**
 * The classes that identify an element across instances.
 *
 * DSH ships CSS-module names (`_row_1abc2_34`); a plain build ships readable ones. Utility and
 * state classes are dropped: they are applied per instance, so a selector built from them would
 * match one element and defeat the whole point.
 * @param el - the element.
 * @returns the stable class names, most specific first.
 */
export function stableClasses(el: Element): string[] {
  const all = Array.from(el.classList)
  const moduleish = all.filter((name) => (MODULE_CLASS.test(name) || MODULE_CLASS_HASHED.test(name)) && !STATE_CLASS.test(name))
  if (moduleish.length > 0) return moduleish.slice(0, 3)
  return all.filter((name) => !STATE_CLASS.test(name)).slice(0, 3)
}

/**
 * One selector for an element and its stable classes.
 * @param el - the element.
 * @returns the selector, or undefined when the element carries nothing stable.
 */
function classSelectorFor(el: Element): string | undefined {
  const classes = stableClasses(el)
  if (classes.length === 0) return undefined
  return el.tagName.toLowerCase() + classes.map((name) => '.' + name).join('')
}

/**
 * A stable identifying attribute of one element, when it has one.
 *
 * Icon-only buttons in the same row often share a component class (the "…" and "+" of one
 * workspace row do), and their accessible name is what tells them apart. The value is used as
 * written: when a label turns out to be per-instance the group shrinks to one member, that
 * candidate is rejected, and the class-only step wins — the honest fallback.
 * @param el - the element.
 * @returns an attribute selector, or undefined.
 */
function stableAttribute(el: Element): string | undefined {
  for (const name of ['aria-label', 'title']) {
    const value = el.getAttribute(name)
    if (value === null) continue
    const trimmed = value.trim()
    if (trimmed === '' || trimmed.length > 60) continue
    return name + '="' + trimmed.replace(/"/g, '') + '"'
  }
  return undefined
}

/**
 * Count a selector's matches without ever throwing on a malformed one.
 * @param doc - the document.
 * @param selector - the selector.
 * @returns the match count (0 when the selector cannot be parsed).
 */
function countOf(doc: Document, selector: string): number {
  try { return doc.querySelectorAll(selector).length } catch { return 0 }
}

/**
 * All matches of a selector, without ever throwing.
 * @param doc - the document.
 * @param selector - the selector.
 * @returns the matching elements (empty when the selector cannot be parsed).
 */
function allOf(doc: Document, selector: string): Element[] {
  try { return Array.from(doc.querySelectorAll(selector)) } catch { return [] }
}

/**
 * The steps from one ancestor down to one element, as child combinators.
 *
 * `> div.actions_hash > button.icon_hash` — a path INSIDE one row, which is what keeps a nested
 * session row out of its workspace's block.
 * @param from - the ancestor (exclusive).
 * @param to - the element (inclusive).
 * @returns the combinator path, or undefined when `to` is not inside `from`.
 */
function relativePath(from: Element, to: Element): string | undefined {
  const steps: string[] = []
  let node: Element | null = to
  while (node !== null && node !== from) {
    steps.unshift('> ' + (classSelectorFor(node) ?? node.tagName.toLowerCase()))
    node = node.parentElement
  }
  if (node !== from) return undefined
  return steps.join(' ')
}

/**
 * Selector of the parent class every match shares, when they all share exactly one.
 *
 * This is what keeps a generic group honest: a class repeated under one kind of parent (every
 * row, every card) is a block; a class scattered across unrelated parents is not, and saying so
 * beats handing the user a selector that restyles half the app.
 * @param matches - the elements the bare identity selector matched.
 * @returns the parent selector, or undefined when the parents are not one kind.
 */
function sharedParentSelector(matches: readonly Element[]): string | undefined {
  const seen = new Set<string>()
  for (const match of matches) {
    const parent = match.parentElement
    const selector = parent === null ? undefined : classSelectorFor(parent)
    if (selector === undefined) return undefined
    seen.add(selector)
  }
  return seen.size === 1 ? [...seen][0] : undefined
}

/**
 * The tree row an element belongs to — the block it is a member of.
 * @param el - the element.
 * @returns the row selector, kind and element, or undefined outside the tree.
 */
function treeAnchorFor(el: Element): { selector: string; kind: GroupKind; element: Element } | undefined {
  const row = el.closest('[role="treeitem"]')
  if (row !== null) {
    const workspace = row.hasAttribute('aria-expanded')
    return { selector: workspace ? WORKSPACE_ROW_SELECTOR : SESSION_ROW_SELECTOR, kind: workspace ? 'workspace' : 'session', element: row }
  }
  const tree = el.closest(TREE_SELECTOR)
  if (tree !== null) return { selector: TREE_SELECTOR, kind: 'tree', element: tree }
  return undefined
}

/**
 * Move one element's declarations onto a wider scope (its block, or the whole site).
 *
 * Switching scope has to mean "the edit I already made now covers everything that scope names":
 * the panel writes only on the next field change, so without this the user toggles the scope and
 * watches nothing happen. The element's own rule is removed afterwards — its declarations live on
 * the wide selector now, and a leftover copy would keep that one element pinned when the scope
 * changes again.
 * @param css - the skin's rule list.
 * @param selector - the element's own selector.
 * @param blockSelector - the block selector to move the declarations to.
 * @returns a new rule list (a copy of the input when there is nothing to move).
 */
export function moveRuleToBlock(css: readonly CssRule[], selector: string, blockSelector: string): CssRule[] {
  const own = css.find((entry) => entry.selector === selector)?.rule ?? ''
  if (own.trim() === '' || selector === blockSelector) return [...css]
  const block = css.find((entry) => entry.selector === blockSelector)?.rule
  const rest = css.filter((entry) => entry.selector !== selector && entry.selector !== blockSelector)
  // The element's declarations win on conflicts: they are the newest intent.
  return [...rest, { selector: blockSelector, rule: mergeDeclaration(block, own) }]
}

/**
 * The selector that targets the SPACE BETWEEN block members, when the block is a row/column of
 * siblings.
 *
 * DSH spaces its own lists exactly this way — \`[role=treeitem]+[role=treeitem] { margin-top: 2px }\` —
 * so the gap is written as \`A + A { margin-top: … }\`: only the space BETWEEN members changes, the
 * first member keeps its distance to the container, and members created later are covered.
 *
 * Returns undefined when the members are not adjacent siblings (a session of one workspace is not
 * a sibling of a session of another): "the gap between them" is then not defined, and a field that
 * silently does nothing is worse than no field at all.
 * @param group - the block.
 * @param doc - the document to measure in.
 * @returns the gap selector, or undefined.
 */
export function gapSelectorFor(group: ElementGroup, doc: Document): string | undefined {
  const adjacent = group.selector + ' + ' + group.selector
  return countOf(doc, adjacent) > 0 ? adjacent : undefined
}

/**
 * Set (or clear) the gap between the members of a block.
 *
 * Written as \`margin-top\` on the adjacent-sibling selector above — the same property DSH uses, so the
 * skin overrides the DISTANCE instead of fighting the app over how a list is laid out.
 * @param css - the skin's rule list.
 * @param selector - the gap selector ({@link gapSelectorFor}).
 * @param value - a CSS length (e.g. \`6px\`), or \`''\` to clear the gap.
 * @returns a new rule list.
 */
export function withGapRule(css: readonly CssRule[], selector: string, value: string): CssRule[] {
  const property = 'margin-top'
  const existing = css.find((entry) => entry.selector === selector)?.rule
  const rule = value.trim() === ''
    ? withoutDeclaration(existing, property)
    : mergeDeclaration(existing, property + ': ' + value.trim() + ' !important')
  const rest = css.filter((entry) => entry.selector !== selector)
  return rule === '' ? rest : [...rest, { selector, rule }]
}

/**
 * The gap currently written for a block, as a CSS length ('' when none).
 * @param css - the skin's rule list.
 * @param selector - the gap selector.
 * @returns the length, e.g. \`6px\`.
 */
export function gapOf(css: readonly CssRule[], selector: string): string {
  const rule = css.find((entry) => entry.selector === selector)?.rule ?? ''
  const match = /(?:^|;)\s*margin-top\s*:\s*([^;!]+)/.exec(rule)
  return match === null ? '' : match[1].trim()
}

/**
 * Turn what the user typed into a CSS length.
 *
 * A bare number means pixels (the field says "px"), anything already carrying a unit — \`6px\`,
 * \`0.5rem\`, \`-4px\` — is written as typed, so the field never fights an advanced value.
 * @param raw - the field's text.
 * @returns the CSS length, or '' for an empty field.
 */
export function gapLength(raw: string): string {
  const value = raw.trim()
  if (value === '') return ''
  return /[a-z%]$/i.test(value) ? value : value + 'px'
}

/**
 * The block one element belongs to — the selector to edit instead of the element itself.
 *
 * Returns undefined when there is honestly nothing to group: no stable class, or a selector that
 * would match this element alone. A "group" of one is a lie the user would only discover after
 * saving, so the editor shows the group option as unavailable instead.
 * @param el - the element the user selected.
 * @param doc - the document to measure in (defaults to the element's own).
 * @returns the block, or undefined.
 */
export function elementGroupFor(el: Element, doc: Document = el.ownerDocument): ElementGroup | undefined {
  const anchor = treeAnchorFor(el)

  // The element IS the block (a workspace row, a session row, the tree itself).
  //
  // A recognised KIND is a block even when it has a single member right now: "edit one, the
  // others follow — including the ones created later" is the point, and refusing because this
  // moment happens to hold one workspace would disable the feature exactly when it is wanted.
  if (anchor !== undefined && el === anchor.element) {
    return { selector: anchor.selector, count: countOf(doc, anchor.selector), kind: anchor.kind }
  }

  if (anchor !== undefined) {
    // Inside the tree the scope is never widened: the block is the same RELATIVE POSITION in
    // every row of this kind. A plain descendant selector would also swallow the buttons of the
    // session rows nested inside an expanded workspace row — the one confusion to avoid.
    const path = relativePath(anchor.element, el)
    if (path === undefined) return undefined
    // The accessible name is used to separate "…" from "+" ONLY when the two really share it
    // across instances. DSH interpolates the row's own name into those labels
    // ("…cy-nav 的操作"), so a per-instance label must NOT become the block key: it would produce
    // a "block" of exactly one element, which is the worst possible answer — the panel would say
    // 整组 and not one other row would move.
    const attribute = stableAttribute(el)
    if (attribute !== undefined) {
      const withAttribute = anchor.selector + ' ' + path + '[' + attribute + ']'
      const count = countOf(doc, withAttribute)
      if (count > 1) return { selector: withAttribute, count, kind: anchor.kind }
    }
    // Fall back to the position itself: the same place in every row of this kind. It may cover
    // sibling controls that share the component class — the panel shows the count, and the
    // selector is right there to narrow by hand.
    const selector = anchor.selector + ' ' + path
    return { selector, count: countOf(doc, selector), kind: anchor.kind }
  }

  const own = classSelectorFor(el)
  if (own === undefined) return undefined

  // Outside the tree: a class repeated under ONE kind of parent (every row, every card) is a
  // block; a class scattered across unrelated parents is not, and refusing beats a selector that
  // quietly restyles half the app. The accessible name is tried first — without it, buttons that
  // merely share a class across different components would look like one block.
  const attribute = stableAttribute(el)
  const identities = attribute === undefined ? [own] : [own + '[' + attribute + ']', own]
  for (const identity of identities) {
    const matches = allOf(doc, identity)
    if (matches.length < 2 || !matches.includes(el)) continue
    const parentSelector = sharedParentSelector(matches)
    if (parentSelector === undefined) continue
    const selector = parentSelector + ' ' + identity
    const count = countOf(doc, selector)
    if (count > 1) return { selector, count, kind: 'peers' }
  }
  return undefined
}
