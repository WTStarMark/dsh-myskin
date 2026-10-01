/**
 * Per-surface visibility: show a component in one place, hide it in another.
 *
 * A plugin that renders its UI globally (a floating widget, a status bar) is visible on EVERY
 * surface. Editing it document-wide is not what the user wants there: they want "keep it in the
 * conversation, drop it on the plugins page" — or any other combination.
 *
 * WHAT A SURFACE IS (and why the first version of this file got it wrong)
 *
 * The first version offered two buckets: "the settings dialog is open" and "it is not". That is
 * wrong, and the report was exact: hiding worked in Settings and did nothing on the Plugins page.
 * Upstream's plugin page is NOT a settings tab — it is a MAIN PANEL (`PANEL_ID = "plugins"` is
 * registered on the `main` slot, next to the conversation), so the settings dialog is not even
 * mounted while it is on screen and a rule keyed on `[data-shortcut-modal]` never fires there.
 *
 * So a surface is derived from what is actually on screen, with two kinds of markers:
 *
 *   1. the settings surface — upstream's own `data-shortcut-modal` (the settings dialog and the
 *      shortcut editor, portalled to `<body>`);
 *   2. the CURRENT PAGE — the active entry of the main slot (`[data-slot="main"]`, the outlet
 *      the shell renders every main panel into: the conversation, the plugins page, …), described
 *      by the first semantic marker found on the path down its own subtree: a `data-slot` value,
 *      or any other `data-*` attribute — the plugin manager's page root carries
 *      `data-plugin-panel`, the conversation carries `data-conversation-region` and friends.
 *
 * A rule is then `body:has(<marker>) <identity> { display: none !important }`: the identity comes
 * from site-scope.ts (the component anywhere in the document), the surface from here. The subject
 * of the rule is the component itself, so it covers both shapes a plugin can have — one instance
 * rendered inside each surface, and one global node painted over everything.
 *
 * Only semantic markers are accepted. A `data-*` attribute or a `data-slot` value is a contract
 * upstream keeps; a generated class hash, or the position of a nav cell, would silently hide the
 * wrong thing after the next DSH upgrade — and a surface that cannot be described honestly is not
 * offered at all (the panel says so instead of writing a selector that quietly does nothing).
 */

import type { CssRule } from '../skin-schema.ts'
import { REMOVE_DECLARATION, isRemovedRule, mergeDeclaration, withoutDeclaration } from './skin-engine.ts'

/** One place a component can be shown or hidden in. */
export interface Surface {
  /** Stable id: the marker itself, plus a `settings:` prefix for the built-in one. */
  readonly id: string
  /** Human-readable name for the panel row (already localized by the caller). */
  readonly label: string
  /**
   * Selector that is present in the document exactly while this surface is on screen.
   *
   * Used as `body:has(<marker>)`, so it must match the surface's own content — never `body`,
   * `#root` or another anchor that is always there.
   */
  readonly marker: string
  /**
   * True for a surface that is painted OVER the page instead of replacing it.
   *
   * The settings dialog is one: the conversation (or the plugins page) stays MOUNTED behind it, so
   * "hidden wherever this page is not" would not hide anything while the dialog is up. Overlay
   * surfaces therefore need their own rule, which is exactly what {@link withOnlySurface} adds.
   */
  readonly overlay: boolean
}

/** Upstream's marker for the settings surface (settings dialog + shortcut editor). */
export const SETTINGS_SURFACE_ATTRIBUTE = 'data-shortcut-modal'

/** The outlet every main panel (conversation, plugins, …) renders into. */
export const MAIN_SLOT_SELECTOR = '[data-slot="main"]'

/**
 * `data-*` attributes that describe the shell or the editor, never a page.
 *
 * `data-slot` is handled separately (and only when its value names something narrower than the
 * outlet itself); `data-window-drag` marks Electron drag regions and sits on many pages.
 */
const INFRASTRUCTURE_ATTRIBUTES = new Set(['data-slot', 'data-window-drag', 'data-dragging'])

/** How deep the walk looks for a page marker: the outlet's child and its first descendants. */
const MARKER_DEPTH = 5

/**
 * The settings surface, as the panel shows it.
 * @param label - localized name.
 * @returns the surface.
 */
export function settingsSurface(label: string): Surface {
  const marker = '[' + SETTINGS_SURFACE_ATTRIBUTE + ']'
  return { id: 'settings:' + marker, label, marker, overlay: true }
}

/**
 * Whether the settings surface is on screen.
 * @param doc - the live document.
 * @returns true while the settings dialog (or the shortcut editor) is mounted.
 */
export function settingsOpen(doc: Document): boolean {
  return doc.querySelector('[' + SETTINGS_SURFACE_ATTRIBUTE + ']') !== null
}

/**
 * The marker candidates of one element, strongest first.
 *
 * `data-slot` wins when it names a narrower part than the outlet (`conversation.session` is a
 * contract this plugin's anchor catalogue already depends on); other `data-*` attributes follow
 * in document order. Values are ignored on purpose: `[data-plugin-panel]` is a page marker
 * whether or not the attribute carries a value, and per-instance attributes are still
 * surface-specific by presence.
 * @param el - the element to describe.
 * @returns selectors, strongest first.
 */
export function surfaceMarkers(el: Element): string[] {
  const out: string[] = []
  const slot = el.getAttribute('data-slot')
  if (slot !== null && slot !== 'main' && slot.trim() !== '') out.push('[data-slot="' + slot + '"]')
  for (const attribute of Array.from(el.attributes)) {
    const name = attribute.name
    if (!name.startsWith('data-')) continue
    if (name.startsWith('data-dsh-myskin-')) continue
    if (INFRASTRUCTURE_ATTRIBUTES.has(name)) continue
    out.push('[' + name + ']')
  }
  return out
}

/**
 * The page currently shown in the main area, described by its own markup.
 *
 * The walk starts at the outlet's first rendered child and goes down through FIRST children only:
 * a marker close to the page root describes the page (`[data-plugin-panel]`), while one further
 * down can be conditional (a session slot disappears on an empty conversation), so the shallowest
 * marker wins.
 * @param doc - the live document.
 * @param label - builds a human name for the page root (the caller passes `elementLabel`).
 * @returns the surface, or undefined when this page carries nothing a selector could hold on to.
 */
export function currentPageSurface(doc: Document, label: (el: Element) => string): Surface | undefined {
  const main = doc.querySelector(MAIN_SLOT_SELECTOR)
  if (main === null) return undefined
  let node: Element | null = Array.from(main.children).find((child) => child.getClientRects().length > 0)
    ?? main.firstElementChild
  const root = node
  for (let depth = 0; node !== null && depth < MARKER_DEPTH; depth += 1) {
    for (const marker of surfaceMarkers(node)) {
      // A candidate that matches nothing is a typo in the markup, not a surface.
      if (doc.querySelectorAll(marker).length === 0) continue
      const anchored = MAIN_SLOT_SELECTOR + ' ' + marker
      return { id: 'page:' + anchored, label: label(root ?? node), marker: anchored, overlay: false }
    }
    node = node.firstElementChild
  }
  return undefined
}

/**
 * The surface the user is looking at right now.
 * @param doc - the live document.
 * @param settingsLabel - localized name of the settings surface.
 * @param label - builds a human name for a page root.
 * @returns the settings surface while it is mounted, else the current page (when describable).
 */
export function currentSurface(doc: Document, settingsLabel: string, label: (el: Element) => string): Surface | undefined {
  if (settingsOpen(doc)) return settingsSurface(settingsLabel)
  return currentPageSurface(doc, label)
}

/**
 * The selector that hides one component in one surface.
 * @param surface - the surface to hide it in.
 * @param identity - the component's own selector (see site-scope.ts); a structural selector would
 *   only ever match the instance it was taken from.
 * @returns the full selector, e.g. `body:has([data-slot="main"] [data-plugin-panel]) div.wgt`.
 */
export function surfaceRuleSelector(surface: Surface, identity: string): string {
  return 'body:has(' + surface.marker + ') ' + identity
}

/**
 * Whether the skin already hides a component in one surface.
 *
 * Derived from the document's own rule list — the toggles are a view of what is written, never a
 * second copy of it, so restoring from the recycle bin and flipping a toggle cannot disagree.
 * @param css - the skin's rule list.
 * @param surface - the surface.
 * @param identity - the component's own selector.
 * @returns true when a rule with that exact selector declares `display: none`.
 */
export function hiddenInSurface(css: readonly CssRule[], surface: Surface, identity: string): boolean {
  const selector = surfaceRuleSelector(surface, identity)
  return isRemovedRule(css.find((entry) => entry.selector === selector)?.rule)
}

/**
 * Hide or show one component in one surface.
 *
 * Only the `display` declaration is touched: a rule that also carries other declarations keeps
 * them, and a rule left empty disappears instead of lingering as a husk — the same contract the
 * recycle bin follows.
 * @param css - the skin's rule list.
 * @param surface - the surface.
 * @param identity - the component's own selector.
 * @param hidden - true to hide it there, false to show it again.
 * @returns a new rule list.
 */
export function withSurfaceHidden(css: readonly CssRule[], surface: Surface, identity: string, hidden: boolean): CssRule[] {
  return rewrite(css, surfaceRuleSelector(surface, identity), hidden)
}

/**
 * Every rule that currently hides one component, whatever surface it was written for.
 *
 * This is what makes "I hid it everywhere, now what?" a non-question: the rules are ordinary
 * entries keyed on the component's identity, so they can be listed and undone as a group — and
 * they are exactly what the recycle bin shows.
 * @param css - the skin's rule list.
 * @param identity - the component's own selector.
 * @returns the hiding rules, in document order.
 */
export function hiddenRulesFor(css: readonly CssRule[], identity: string): CssRule[] {
  if (identity === '') return []
  return css.filter((entry) => isRemovedRule(entry.rule)
    && (entry.selector === identity || entry.selector.endsWith(' ' + identity)))
}

/**
 * Show one component everywhere again — the undo for "I turned everything off".
 * @param css - the skin's rule list.
 * @param identity - the component's own selector.
 * @returns a new rule list (rules that carried something else survive without their `display`).
 */
export function withAllHiddenRestored(css: readonly CssRule[], identity: string): CssRule[] {
  let out: CssRule[] = [...css]
  for (const entry of hiddenRulesFor(css, identity)) out = rewrite(out, entry.selector, false)
  return out
}

/**
 * Set or clear the `display` declaration of one selector.
 * @param css - the skin's rule list.
 * @param selector - the rule to edit.
 * @param hidden - true to declare `display: none !important`, false to drop the declaration.
 * @returns a new rule list.
 */
function rewrite(css: readonly CssRule[], selector: string, hidden: boolean): CssRule[] {
  const existing = css.find((entry) => entry.selector === selector)?.rule
  const rule = hidden ? mergeDeclaration(existing, REMOVE_DECLARATION) : withoutDeclaration(existing, 'display')
  const rest = css.filter((entry) => entry.selector !== selector)
  return rule === '' ? rest : [...rest, { selector, rule }]
}
/**
 * The inverse rule: "hidden everywhere EXCEPT here".
 *
 * The per-surface rows can only hide a component on surfaces the editor knows about, and pages it
 * has never seen are unknowable — but "keep it only here" does not need to know them: the
 * NEGATION of one marker covers every other surface at once, including the ones that do not exist
 * yet. That is what a preset writes.
 * @param surface - the one surface the component should stay visible on.
 * @param identity - the component's own selector.
 * @returns the selector, e.g. `body:not(:has([data-slot="main"] [data-plugin-panel])) div.wgt`.
 */
export function onlySurfaceRuleSelector(surface: Surface, identity: string): string {
  return 'body:not(:has(' + surface.marker + ')) ' + identity
}

/**
 * Whether the component is hidden WHILE one surface is on screen.
 *
 * Three rules can do that, and the panel's rows have to tell the truth about all of them:
 *   - the surface's own rule (`body:has(<marker>)`) — hidden here;
 *   - a blunt rule on the identity itself — hidden everywhere;
 *   - an `only` rule for ANOTHER surface — hidden here, because "here" is not there.
 * @param css - the skin's rule list.
 * @param surface - the surface on screen.
 * @param identity - the component's own selector.
 * @param surfaces - every surface the panel knows about (for the third case).
 * @returns true when the component does not show while this surface is on screen.
 */
export function hiddenWhile(css: readonly CssRule[], surface: Surface, identity: string, surfaces: readonly Surface[]): boolean {
  const has = (selector: string): boolean => isRemovedRule(css.find((entry) => entry.selector === selector)?.rule)
  if (has(surfaceRuleSelector(surface, identity))) return true
  if (has(identity)) return true
  return surfaces.some((other) => other.id !== surface.id && has(onlySurfaceRuleSelector(other, identity)))
}

/**
 * Show the component while one surface is on screen.
 *
 * This is the row's 「显示」: it drops every rule that hides the component HERE — the surface's own
 * rule, a blunt one, and an `only` rule written for another surface — and touches nothing that
 * hides it somewhere else. Clicking 显示 on the Settings row after a 「只在本页显示」 therefore
 * means "show it in Settings too", which is exactly what the row claims.
 * @param css - the skin's rule list.
 * @param surface - the surface that should show the component.
 * @param identity - the component's own selector.
 * @param surfaces - every surface the panel knows about.
 * @returns a new rule list.
 */
export function withVisibleWhile(css: readonly CssRule[], surface: Surface, identity: string, surfaces: readonly Surface[]): CssRule[] {
  let out: CssRule[] = rewrite(css, surfaceRuleSelector(surface, identity), false)
  out = rewrite(out, identity, false)
  for (const other of surfaces) {
    if (other.id === surface.id) continue
    out = rewrite(out, onlySurfaceRuleSelector(other, identity), false)
  }
  return out
}

/**
 * Keep the component visible ONLY on one surface — "clear the board, then say where it lives".
 *
 * Written as ONE inverted rule rather than one rule per known surface: pages the editor has never
 * opened are covered too, which is the whole point of a preset.
 * An OVERLAY surface (the settings dialog) can be on screen while the kept page is still mounted
 * behind it, and "hidden wherever this page is not" says nothing about that moment — so every
 * overlay gets its own hide rule as well. Without it, 「只在插件页显示」 would still show the
 * component on top of an open Settings dialog.
 * @param css - the skin's rule list.
 * @param surface - the surface to keep.
 * @param identity - the component's own selector.
 * @param surfaces - every surface the panel knows about (its overlays get covered).
 * @returns a new rule list.
 */
export function withOnlySurface(css: readonly CssRule[], surface: Surface, identity: string, surfaces: readonly Surface[] = []): CssRule[] {
  const cleared = withAllHiddenRestored(css, identity)
  const inverted: CssRule = { selector: onlySurfaceRuleSelector(surface, identity), rule: REMOVE_DECLARATION }
  const overlays: CssRule[] = surfaces
    .filter((other) => other.id !== surface.id && other.overlay)
    .map((other) => ({ selector: surfaceRuleSelector(other, identity), rule: REMOVE_DECLARATION }))
  return [...cleared, ...overlays, inverted]
}

/**
 * Hide the component on every surface at once.
 *
 * Written on the identity itself, with no surface in the selector: a blunt rule no page can escape
 * — the preset for "I do not want to see this anywhere", and the one case where the panel warns
 * that the component can no longer be clicked on the page to get it back.
 * @param css - the skin's rule list.
 * @param identity - the component's own selector.
 * @returns a new rule list.
 */
export function withHiddenEverywhere(css: readonly CssRule[], identity: string): CssRule[] {
  return [...withAllHiddenRestored(css, identity), { selector: identity, rule: REMOVE_DECLARATION }]
}

/** Browser-storage key remembering the pages the editor has seen. */
export const SURFACES_STORAGE_KEY = 'dsh-myskin.surfaces'

/** How many remembered pages the panel keeps (oldest last). */
export const MAX_REMEMBERED_SURFACES = 8

/**
 * The pages the editor has already described.
 *
 * A page marker can only be derived from a page that is actually mounted, so the catalog is built
 * by walking the app rather than by guessing at upstream's markup — and remembering it is what
 * turns "the page I am on" into the same list next time, without visiting it again.
 * @param storage - storage seam (localhost may refuse it).
 * @returns the remembered surfaces, newest first (empty when nothing usable is stored).
 */
export function readRememberedSurfaces(storage: Storage | undefined): Surface[] {
  try {
    const raw = storage?.getItem(SURFACES_STORAGE_KEY)
    if (raw === null || raw === undefined || raw === '') return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const out: Surface[] = []
    for (const entry of parsed) {
      if (typeof entry !== 'object' || entry === null) continue
      const candidate = entry as Partial<Surface>
      if (typeof candidate.id !== 'string' || typeof candidate.label !== 'string' || typeof candidate.marker !== 'string') continue
      // Only markers this build can produce: an anchored (data-*) selector. A stored value is
      // user-writable, and a hand-edited one must not become a stylesheet injection.
      if (!candidate.marker.startsWith('[data-') || candidate.marker.length > 200) continue
      if (candidate.label.length > 80 || out.some((surface) => surface.id === candidate.id)) continue
      // Pages are the only thing stored here, and a page is never an overlay.
      out.push({ id: candidate.id, label: candidate.label, marker: candidate.marker, overlay: false })
      if (out.length >= MAX_REMEMBERED_SURFACES) break
    }
    return out
  } catch {
    return []
  }
}

/**
 * Remember one page, newest first.
 * @param storage - storage seam.
 * @param surfaces - the list so far.
 * @param surface - the page to remember (its id is the marker, so repeats collapse).
 * @returns the new list; the storage write is best-effort.
 */
export function rememberSurface(storage: Storage | undefined, surfaces: readonly Surface[], surface: Surface): Surface[] {
  // Normalized, so a stored-and-reloaded list is identical to the live one (pages are never
  // overlays — an overlay is not something the walk can discover).
  const remembered: Surface = { id: surface.id, label: surface.label, marker: surface.marker, overlay: false }
  const next = [remembered, ...surfaces.filter((entry) => entry.id !== surface.id)].slice(0, MAX_REMEMBERED_SURFACES)
  try {
    storage?.setItem(SURFACES_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Preference only: a refused write must never break the editor.
  }
  return next
}
