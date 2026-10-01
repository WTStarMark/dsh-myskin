/**
 * 「全站」scope: one selector from the element's OWN identity, with no ancestor path.
 *
 * The canvas writes structural selectors — `#root > div:nth-of-type(3) > …` inside the app,
 * `body > div:nth-of-type(2) > …` for anything portalled beside it. That is exactly right for
 * "this one element" and exactly wrong for a component a plugin renders in EVERY view:
 *
 *   - the conversation view mounts it inside `#root`; the plugins/settings view mounts it beside
 *     `#root` — two different trees, so no structural selector can cover both;
 *   - the `body > :nth-of-type(n)` path shifts the moment any other portal appears (a dialog, a
 *     toast), so the rule silently starts matching a different node;
 *   - and every new instance (a view not opened yet, a row created later) is missed.
 *
 * 「整组」(groups.ts) refuses this shape on purpose: a class scattered across unrelated parents is
 * not a block, and handing the user a selector that restyles half the app unasked would be worse
 * than saying no.
 *
 * This module is the deliberate version of that answer. It is its own scope, so the user asks for
 * it, and everything about it is visible before it is used: the selector itself, how many elements
 * it hits right now, and an outline on every one of them.
 *
 * Identity atoms, and nothing else:
 *   - the element's stable classes (the same CSS-module/readable-name rule `groups.ts` uses);
 *   - a `data-*` attribute, but only when it is SHARED (matches more than one element) or when
 *     there is no class to identify the element at all — a per-instance value would defeat the
 *     whole point;
 *   - `role`, when the element declares one.
 *
 * Positional and per-instance atoms (`id`, `data-index`, state classes, ancestors) are never
 * used: an id is unique by definition, and everything positional is what breaks across views.
 */

import type { ElementGroup } from './groups.ts'
import { stableClasses } from './groups.ts'

/**
 * Most matches a 全站 selector may carry before it stops being "a component".
 *
 * Beyond this the identity is not identifying anything — it is a layout or utility class, and the
 * edit would land on unrelated parts of the app. The panel reports the number instead of writing it.
 */
export const SITE_SCOPE_MAX = 64

/** Why a 全站 selector could not be built. */
export type SiteScopeMiss =
  /** The element carries nothing stable: no class, no usable `data-*`, no role. */
  | 'no-identity'
  /** Everything the element carries is too common to mean "this component". */
  | 'too-generic'

/** What the editor can do with the current selection when 全站 is on. */
export type SiteScopeOutcome =
  | { readonly ok: true; readonly scope: ElementGroup }
  | { readonly ok: false; readonly reason: SiteScopeMiss; readonly count: number }

/**
 * `data-*` names that are assigned per INSTANCE, never per component.
 *
 * The NAME has to be recognised, not the value: `data-index="3"` is obviously per-instance while
 * `data-plugin="chat-widget"` is obviously not — and guessing from the value is hopeless.
 */
const PER_INSTANCE_DATA = /^data-(index|idx|key|id|state|active|selected|open|order|pos|position|count)$/i

/**
 * One `data-*` attribute of an element, when it can serve as a component identity.
 *
 * This plugin's own markers are skipped: a skin has no business matching on the editor's own
 * bookkeeping.
 * @param el - the element.
 * @returns an attribute selector (`data-x="v"`), or undefined.
 */
function dataAtom(el: Element): string | undefined {
  for (const attribute of Array.from(el.attributes)) {
    const name = attribute.name
    if (!name.startsWith('data-') || name.startsWith('data-dsh-myskin-')) continue
    if (PER_INSTANCE_DATA.test(name)) continue
    const value = attribute.value.trim()
    if (value === '' || value.length > 60) continue
    return name + '="' + value.replace(/"/g, '') + '"'
  }
  return undefined
}

/**
 * The element's `role`, when it declares one.
 * @param el - the element.
 * @returns the role value, or undefined.
 */
function roleAtom(el: Element): string | undefined {
  const role = el.getAttribute('role')
  const trimmed = role === null ? '' : role.trim()
  return trimmed === '' ? undefined : trimmed
}

/**
 * Every match of a selector, without ever throwing on a malformed one.
 * @param doc - the document.
 * @param selector - the selector.
 * @returns the matching elements (empty when the selector cannot be parsed).
 */
function matchesOf(doc: Document, selector: string): Element[] {
  try { return Array.from(doc.querySelectorAll(selector)) } catch { return [] }
}

/**
 * The identity selectors to try, most specific first.
 *
 * Order is the whole policy: a class-based identity beats a single attribute (classes are the
 * component's own styling hook), a SHARED attribute may refine a class, and a per-instance one is
 * only ever used when there is no class to fall back to.
 * @param el - the element.
 * @param doc - the document the selector will be used in.
 * @returns candidate selectors, in preference order.
 */
export function siteCandidates(el: Element, doc: Document = el.ownerDocument): string[] {
  const tag = el.tagName.toLowerCase()
  const classes = stableClasses(el).map((name) => '.' + name).join('')
  const data = dataAtom(el)
  const role = roleAtom(el)
  // A data attribute only counts as the component's identity when it is actually shared...
  const sharedData = data !== undefined && matchesOf(doc, '[' + data + ']').length > 1 ? data : undefined
  const out: string[] = []
  if (classes !== '') {
    if (sharedData !== undefined) out.push(tag + classes + '[' + sharedData + ']')
    if (role !== undefined) out.push(tag + classes + '[role="' + role + '"]')
    out.push(tag + classes)
  }
  // ...or when there is no class at all, in which case it is the only identity the element has.
  if (data !== undefined) {
    out.push(tag + '[' + data + ']')
    out.push('[' + data + ']')
  }
  if (classes === '' && role !== undefined) {
    out.push(tag + '[role="' + role + '"]')
    out.push('[role="' + role + '"]')
  }
  return out
}

/**
 * The 全站 selector for one element: same identity, any ancestor, any view.
 *
 * The candidates are tried in order and the first one that both matches the element and stays under
 * {@link SITE_SCOPE_MAX} wins — so an element with a generic class and a usable attribute still gets
 * the attribute selector, and an element with nothing but a tag gets an honest "no".
 * @param el - the element the user selected.
 * @param doc - the document to measure in (defaults to the element's own).
 * @returns the scope (selector + how many elements it hits right now), or why there is none.
 */
export function siteScopeFor(el: Element, doc: Document = el.ownerDocument): SiteScopeOutcome {
  const tag = el.tagName.toLowerCase()
  if (tag === 'html' || tag === 'body') return { ok: false, reason: 'no-identity', count: 0 }
  let smallest = Number.POSITIVE_INFINITY
  for (const selector of siteCandidates(el, doc)) {
    const matches = matchesOf(doc, selector)
    if (!matches.includes(el)) continue
    if (matches.length <= SITE_SCOPE_MAX) {
      return { ok: true, scope: { selector, count: matches.length, kind: 'site' } }
    }
    smallest = Math.min(smallest, matches.length)
  }
  return smallest === Number.POSITIVE_INFINITY
    ? { ok: false, reason: 'no-identity', count: 0 }
    : { ok: false, reason: 'too-generic', count: smallest }
}
