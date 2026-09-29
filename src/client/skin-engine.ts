/**
 * Skin apply engine. Everything here is additive + reversible: `applySkin`
 * returns a `dispose` that removes exactly what it added, so enabling/editing
 * a skin never leaves residue and never touches DSH source or the DSH process.
 *
 * Layers applied:
 *   1. tokens  -> the official `ctx.theme.overrideTokens` registry
 *   2. css     -> one plugin-owned <style data-plugin="dsh-myskin">
 *   3. canvas.background -> a body background-image rule
 *   4. canvas.background -> a body background rule
 *   5. text    -> text-node swap + MutationObserver re-apply (React-safe)
 */

import type { ThemeRuntime } from '@deepseek-ai/dsh-client-ui-theme/client'
import type { CssRule, EmbeddedImage, InjectedLayer, SkinSettings, TextOverride, TokenModes } from '../skin-schema.ts'
import { readDesktopShell } from './desktop.ts'

export const PLUGIN_ID = 'dsh-myskin'
const STYLE_ID = 'dsh-myskin-rule'

/** Handle returned by `applySkin`; call `dispose` to revert. */
export interface SkinOverride {
  dispose: () => void
}

/** One modified text node we must restore on dispose. */
interface TextPatch {
  node: Text
  original: string
  applied: string
}

/** One parsed CSS colour: 0..255 channels plus the existing alpha. */
interface CssColor { r: number; g: number; b: number; a: number }

/**
 * Parse an rgb()/rgba()/#rgb/#rrggbb/#rrggbbaa colour.
 * @param color - a computed or authored colour string.
 * @returns the parsed channels, or undefined when the syntax is not recognised.
 */
function parseCssColor(color: string): CssColor | undefined {
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/)
  if (m !== null) {
    const raw = m[4]
    const alpha = raw === undefined ? 1 : (raw.endsWith('%') ? Number(raw.slice(0, -1)) / 100 : Number(raw))
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: Number.isFinite(alpha) ? alpha : 1 }
  }
  const h = color.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)
  if (h === null) return undefined
  const hex = h[1].length === 3 ? h[1].split('').map((c) => c + c).join('') : h[1]
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
    a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
  }
}

/** Direct text node of an element (ignores nested element text for matching). */
function directTextNode(el: Element): Text | undefined {
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) return node as Text
  }
  return undefined
}

/**
 * Whether one text node can carry an override.
 *
 * The editor stores the text it read from the node (trimmed), while the DOM data
 * usually carries surrounding whitespace, so an exact compare silently matches
 * nothing — the single most common "text editing does not work" report. `before: ''`
 * means "the first editable text in this element", which is what the editor stores
 * when the user edits text they did not type out first.
 * @param data - the text node's current data.
 * @param before - the entry's recorded original.
 * @returns true when this node is the entry's target.
 */
function textMatches(data: string, before: string): boolean {
  const raw = data.trim()
  return before === '' ? raw !== '' : raw === before.trim()
}

/** Find the element(s) a text entry targets: by selector, else by matching text. */
function findTargets(entry: TextOverride): Element[] {
  if (typeof document === 'undefined') return []
  const seen = new Set<Element>()
  const result: Element[] = []
  const add = (el: Element | null): void => {
    if (el !== null && !seen.has(el)) { seen.add(el); result.push(el) }
  }
  if (entry.selector !== '') {
    try { document.querySelectorAll(entry.selector).forEach(add) } catch { /* invalid selector: ignore */ }
  }
  if (result.length === 0) {
    for (const el of Array.from(document.body?.querySelectorAll('*') ?? [])) {
      const text = directTextNode(el)
      if (text !== undefined && textMatches(text.data, entry.before)) { add(el); continue }
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if ((el as HTMLInputElement).placeholder === entry.before) add(el)
      }
    }
  }
  return result
}

/** Empty (identity) skin used when the persisted document is absent. */
function defaultSkin(): SkinSettings {
  return { enabled: false, tokens: {}, css: [], text: [], canvas: { background: undefined, images: [] }, layers: [], library: [] }
}

/**
 * Best-effort identifier of the settings page currently open in `doc`.
 *
 * The settings dialog marks the active section nav cell with aria-current=true
 * (see ui-settings-general's SettingsRoot). We derive a stable key from that
 * cell's label + its position among sibling nav buttons, so an image embedded on
 * \"通用设置\" stays on that page and never leaks onto \"模型\" (or vice versa). When
 * no settings dialog is open (or no cell is marked), it returns '' = no page scope.
 */
export function currentSettingsPageKey(doc: Document): string {
  const cell = doc.querySelector('button[aria-current=\"true\"]')
  if (cell === null) return ''
  const label = (cell.textContent ?? '').replace(/\s+/g, ' ').trim()
  if (label === '') return ''
  let pos = 0
  const parent = cell.parentElement
  if (parent !== null) {
    let i = 0
    for (const c of Array.from(parent.children)) {
      if (c === cell) { pos = i; break }
      if (c.tagName === 'BUTTON') i++
    }
  }
  return label + '@' + pos
}

/** Surface strength used when the document does not name one. */
export const DEFAULT_BACKGROUND_OPACITY = 0.75

/** Selector of the marker rule that mirrors the background strength into `css`. */
export const BG_OPACITY_SELECTOR = ':root'
/** Custom property carried by the marker rule. */
export const BG_OPACITY_PROPERTY = '--dsh-myskin-bg-opacity'

/**
 * Effective background strength of a skin document.
 *
 * `canvas.backgroundOpacity` is the real field, but a Host whose Config schema
 * predates it does not project the field back to the browser (DSH describes only
 * schema-declared paths), so the editor also mirrors the value into a marker CSS
 * rule — `css` has been schema-declared since the first release. Reading prefers
 * the field and falls back to the marker, so the value round-trips either way.
 * @param skin - the skin document.
 * @returns the strength, clamped by the caller, or the default when absent.
 */
export function readBackgroundOpacity(skin: SkinSettings): number {
  const explicit = skin.canvas.backgroundOpacity
  if (typeof explicit === 'number' && Number.isFinite(explicit)) return explicit
  for (const rule of skin.css ?? []) {
    if (rule.selector !== BG_OPACITY_SELECTOR) continue
    const match = rule.rule.match(/--dsh-myskin-bg-opacity:\s*([\d.]+)/)
    if (match !== null) {
      const value = Number(match[1])
      if (Number.isFinite(value)) return value
    }
  }
  return DEFAULT_BACKGROUND_OPACITY
}

/**
 * Mirror the strength into the marker rule (idempotent: the previous marker is dropped).
 * @param css - the document's CSS rules.
 * @param opacity - the strength to store.
 * @returns a new rule list ending with the marker.
 */
export function withBackgroundOpacity(css: readonly CssRule[], opacity: number): CssRule[] {
  const value = String(Math.round(opacity * 100) / 100)
  const rest = (css ?? []).filter((rule) => !(rule.selector === BG_OPACITY_SELECTOR && rule.rule.includes(BG_OPACITY_PROPERTY)))
  return [...rest.map((rule) => ({ selector: rule.selector, rule: rule.rule })), { selector: BG_OPACITY_SELECTOR, rule: BG_OPACITY_PROPERTY + ': ' + value + ';' }]
}

/**
 * Selector for the app frame.
 *
 * Client plugin bundles carry CSS-module names as `_frame_<hash>` in some builds and
 * as the plain `frame` in others, so match both.
 */
const FRAME_SELECTOR = '[class*="_frame"], [class~="frame"]'
/**
 * Selectors for the conversation column (same naming caveat as {@link FRAME_SELECTOR}).
 *
 * Kept as a list, not a joined string: rules that scope something *inside* the column
 * must expand every combination, and prefixing a joined `a, b` list would silently
 * apply the descendant part to the last selector only.
 */
const COLUMN_SELECTORS = ['[class*="_centerCol"]', '[class~="centerCol"]'] as const
/** The column as one selector list. */
const CENTER_COLUMN_SELECTOR = COLUMN_SELECTORS.join(', ')
/**
 * Selectors for the composer seat: the sticky bottom bar that carries the send card.
 *
 * `data-composer-seat` / `data-conversation-region="composer"` are the stable markers
 * (ui-conversation stamps them); the CSS-module name is the fallback for builds that
 * emit plain class names.
 */
const SEAT_SELECTORS = ['[data-composer-seat]', '[class*="_composerSeat"]', '[class~="composerSeat"]'] as const
/**
 * Selectors for the slots that carry conversation CONTENT (not chrome).
 *
 * The renderer stamps every slot host with `data-slot="<key>"` (ui-renderer sets
 * `"data-slot": slotKey`), and these keys belong to the slot API. Only the content
 * slots may take the canvas token back: the header is rendered through
 * `conversation.session.header` and the composer through `conversation.composer`,
 * i.e. both live in slots too — a `^="conversation."` match would hand the chrome its
 * canvas surface back and the whole single-layer fix would silently undo itself on the
 * top bar.
 */
const CONTENT_SLOT_SELECTORS = ['[data-slot="conversation.session"]', '[data-slot^="conversation.view"]'] as const

/**
 * Expand `outer` × `inner` into one descendant selector list.
 * @param outer - ancestor selectors.
 * @param inner - descendant selectors.
 * @returns the comma-joined combinations (e.g. `a c, a d, b c, b d`).
 */
function scoped(outer: readonly string[], inner: readonly string[]): string {
  const out: string[] = []
  for (const ancestor of outer) for (const descendant of inner) out.push(ancestor + ' ' + descendant)
  return out.join(', ')
}

/** Declaration the editor writes for "hide this control" (keeps its layout slot). */
export const HIDE_DECLARATION = 'visibility: hidden !important'
/** Declaration the editor writes for "remove this control" (reclaims its slot). */
export const REMOVE_DECLARATION = 'display: none !important'

/**
 * Split a declaration block into `[property, value]` pairs, preserving order and
 * keeping `!important` as part of the value. Comments are dropped.
 * @param rule - a declaration block (no braces).
 * @returns the pairs, empty for a blank rule.
 */
function declarationPairs(rule: string): Array<[string, string]> {
  const out: Array<[string, string]> = []
  for (const part of rule.replace(/\/\*[\s\S]*?\*\//g, '').split(';')) {
    const idx = part.indexOf(':')
    if (idx < 0) continue
    const prop = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (prop !== '' && value !== '') out.push([prop, value])
  }
  return out
}

/**
 * Whether a rule already declares one property.
 * @param rule - the declaration block, or undefined.
 * @param property - CSS property name to look for.
 * @returns true when the property is present.
 */
export function hasDeclaration(rule: string | undefined, property: string): boolean {
  return declarationPairs(rule ?? '').some(([prop]) => prop === property)
}

/**
 * Merge an addition into a declaration block, overriding by property name.
 *
 * The editor must never REPLACE an element's whole rule to hide it: that silently
 * dropped every other customization the element already had.
 * @param rule - the existing declaration block, or undefined.
 * @param addition - declarations to merge in.
 * @returns the merged block.
 */
export function mergeDeclaration(rule: string | undefined, addition: string): string {
  const merged = new Map(declarationPairs(rule ?? ''))
  for (const [prop, value] of declarationPairs(addition)) merged.set(prop, value)
  return [...merged].map(([prop, value]) => prop + ': ' + value).join('; ')
}

/**
 * Drop one property from a declaration block.
 * @param rule - the existing declaration block, or undefined.
 * @param property - CSS property name to drop.
 * @returns the remaining declarations (`''` when nothing is left).
 */
export function withoutDeclaration(rule: string | undefined, property: string): string {
  return declarationPairs(rule ?? '').filter(([prop]) => prop !== property).map(([prop, value]) => prop + ': ' + value).join('; ')
}

/** First direct text node of an element that carries non-whitespace content. */
function textCarrier(el: Element): Text | undefined {
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE && (child as Text).data.trim() !== '') return child as Text
  }
  return undefined
}

/**
 * The element that actually owns editable text for one selection.
 *
 * Text overrides replace a text node's data, so the entry must point at the element
 * that directly holds the node — selecting a button whose label lives in a child
 * span (or an icon button with no text at all) is why "edit text" appeared to do
 * nothing. Fields expose their placeholder instead.
 * @param el - the element the user selected.
 * @returns the element to target, or undefined when nothing editable is inside.
 */
export function textHostOf(el: Element): Element | undefined {
  if (textCarrier(el) !== undefined) return el
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return el
  for (const child of Array.from(el.querySelectorAll('*'))) {
    if (textCarrier(child) !== undefined) return child
  }
  return undefined
}

/**
 * Interactive ancestors the canvas picker folds one click into.
 *
 * Clicking a button's inner SVG must select the button, not the icon path inside it.
 */
export const INTERACTIVE_SELECTOR = 'button, a, input, textarea, select, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="menuitemcheckbox"], [role="checkbox"], [role="switch"]'

/**
 * Upstream marker of the composer's gray default copy.
 *
 * `dsh-client-ui-conversation` renders the placeholder of an empty composer as a
 * sibling `<div data-composer-placeholder>` — the gray "描述你想要构建的内容 …" line that
 * is the only text on a fresh conversation. Its CSS is
 * `position: absolute; inset: 4px 8px auto 14px; pointer-events: none`, and that last
 * declaration is why the picker could never reach it: `elementsFromPoint` skips every
 * element that does not accept pointer events, so clicking the gray text selected the
 * empty contenteditable behind it — a node with no text to edit at all.
 */
export const COMPOSER_PLACEHOLDER_SELECTOR = '[data-composer-placeholder]'

/**
 * Whether element geometry can be trusted in this document.
 *
 * jsdom (the test DOM) reports a 0x0 rect for every element and has no layout at
 * all, while a browser always gives `body` a real box. Without the distinction a
 * `display: none` candidate in a browser is indistinguishable from "this DOM has no
 * geometry", and the picker would accept invisible overlays in one and reject every
 * candidate in the other.
 * @param doc - the document to probe.
 * @returns true when real geometry is available.
 */
function layoutAvailable(doc: Document): boolean {
  const rect = doc.body?.getBoundingClientRect()
  return rect !== undefined && (rect.width > 0 || rect.height > 0)
}

/**
 * Whether an overlay candidate is painted under the pointer.
 * @param el - the candidate.
 * @param clientX - pointer x.
 * @param clientY - pointer y.
 * @param layout - whether this document reports real geometry.
 * @returns true when the candidate covers the point (always true without layout).
 */
function underPoint(el: Element, clientX: number, clientY: number, layout: boolean): boolean {
  if (!layout) return true
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
    && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
}

/**
 * Snap distance for the canvas alignment guides, in px.
 *
 * Deliberately small ("low sensitivity"): the guides correct a drag that is already
 * almost aligned and stay out of the way otherwise — a 10px magnet makes precise
 * placement impossible, a 1px one is invisible on a trackpad.
 */
export const SNAP_THRESHOLD = 4

/** A box in viewport coordinates — what the guides align. */
export interface SnapBox { left: number; top: number; width: number; height: number }

/** Candidate alignment coordinates per axis. */
export interface SnapTargets { x: readonly number[]; y: readonly number[] }

/** One guide line to draw, in viewport coordinates. */
export interface SnapLine { axis: 'x' | 'y'; at: number }

/**
 * Best snap for ONE axis.
 *
 * Every edge of the box (start, centre, end) may align with any target, and the closest
 * candidate inside the threshold wins. The returned `delta` is what has to be added to the
 * box's position for that edge to land exactly on the line.
 * @param start - the box's left (or top).
 * @param size - the box's width (or height).
 * @param targets - candidate coordinates on this axis.
 * @param threshold - maximum distance that still snaps.
 * @returns the correction and its line, or undefined when nothing is close enough.
 */
export function snapAxis(start: number, size: number, targets: readonly number[], threshold: number = SNAP_THRESHOLD): { delta: number; line: number } | undefined {
  const edges = [start, start + size / 2, start + size]
  let best: { delta: number; line: number } | undefined
  for (const edge of edges) {
    for (const target of targets) {
      const delta = target - edge
      if (!Number.isFinite(delta) || Math.abs(delta) > threshold) continue
      if (best === undefined || Math.abs(delta) < Math.abs(best.delta)) best = { delta, line: target }
    }
  }
  return best
}

/**
 * Snap a moving box on both axes.
 * @param box - the box as it would be placed without snapping.
 * @param targets - candidate lines collected at gesture start.
 * @param threshold - maximum distance that still snaps.
 * @returns the correction per axis (0 when free) and the lines to draw.
 */
export function snapMove(box: SnapBox, targets: SnapTargets, threshold: number = SNAP_THRESHOLD): { dx: number; dy: number; lines: SnapLine[] } {
  const x = snapAxis(box.left, box.width, targets.x, threshold)
  const y = snapAxis(box.top, box.height, targets.y, threshold)
  const lines: SnapLine[] = []
  if (x !== undefined) lines.push({ axis: 'x', at: x.line })
  if (y !== undefined) lines.push({ axis: 'y', at: y.line })
  return { dx: x?.delta ?? 0, dy: y?.delta ?? 0, lines }
}

/**
 * Snap a uniform scale so an edge lands on a target line, keeping the centre fixed.
 *
 * Scaling happens around the centre, so a target line at distance `half` from that centre
 * asks for a box twice as wide — the factor is that width over the current one. The
 * candidate with the smallest pixel error wins, which is what keeps the magnet feeling
 * "low sensitivity" rather than jumpy.
 * @param box - the box at the un-snapped scale (centre included).
 * @param scale - the un-snapped scale factor.
 * @param targets - candidate lines collected at gesture start.
 * @param threshold - maximum distance that still snaps.
 * @returns the snapped scale and the lines to draw (empty when free).
 */
export function snapScale(box: SnapBox, scale: number, targets: SnapTargets, threshold: number = SNAP_THRESHOLD): { scale: number; lines: SnapLine[] } {
  if (!(box.width > 0) || !(box.height > 0)) return { scale, lines: [] }
  const cx = box.left + box.width / 2
  const cy = box.top + box.height / 2
  let best: { factor: number; error: number; line: SnapLine } | undefined
  const consider = (axis: 'x' | 'y', center: number, current: number, lines: readonly number[]): void => {
    for (const target of lines) {
      // Which current edge is the candidate closest to this line?
      const from = target >= center ? center + current / 2 : center - current / 2
      const error = Math.abs(target - from)
      if (!Number.isFinite(error) || error > threshold) continue
      const wanted = Math.abs(target - center) * 2
      if (!(wanted > 0)) continue
      const factor = wanted / current
      if (best === undefined || error < best.error) best = { factor, error, line: { axis, at: target } }
    }
  }
  consider('x', cx, box.width, targets.x)
  consider('y', cy, box.height, targets.y)
  if (best === undefined) return { scale, lines: [] }
  return { scale: Math.round(scale * best.factor * 100) / 100, lines: [best.line] }
}

/**
 * Collect the alignment lines a drag inside one element should snap to.
 *
 * Deliberately narrow: the parent's box plus its visible children (the element's
 * siblings) and the viewport centre — a page-wide scan would snap to things the user
 * cannot even see. Collected ONCE per gesture: a `transform` never reflows the page, so
 * these lines cannot move while the drag is running.
 * @param el - the element being dragged.
 * @param isOwn - predicate marking the editor's own UI (never a target).
 * @param max - how many siblings to look at before giving up.
 * @returns candidate coordinates per axis.
 */
export function snapTargetsFor(el: Element, isOwn: (el: Element) => boolean = () => false, max = 40): SnapTargets {
  const x: number[] = []
  const y: number[] = []
  const push = (rect: { left: number; top: number; width: number; height: number }): void => {
    if (rect.width === 0 && rect.height === 0) return
    x.push(rect.left, rect.left + rect.width / 2, rect.left + rect.width)
    y.push(rect.top, rect.top + rect.height / 2, rect.top + rect.height)
  }
  const parent = el.parentElement
  if (parent !== null) {
    push(parent.getBoundingClientRect())
    let seen = 0
    for (const sibling of Array.from(parent.children)) {
      if (seen >= max) break
      if (sibling === el || isOwn(sibling)) continue
      seen += 1
      push(sibling.getBoundingClientRect())
    }
  }
  const view = el.ownerDocument.defaultView
  if (view !== null) {
    x.push(view.innerWidth / 2)
    y.push(view.innerHeight / 2)
  }
  return { x, y }
}

/**
 * One wheel/keyboard step on a numeric canvas control.
 *
 * Shared by the X/Y/scale fields so every nudge rounds and clamps the same way — these
 * values go straight into CSS, where `12.340000000001px` is noise and an unclamped scale
 * turns a widget into a smear.
 * @param current - the value before the step.
 * @param direction - +1 or -1.
 * @param step - size of one step.
 * @param min - lower clamp.
 * @param max - upper clamp.
 * @returns the stepped, rounded (2 decimals), clamped value.
 */
export function stepValue(current: number, direction: 1 | -1, step: number, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY): number {
  const base = Number.isFinite(current) ? current : 0
  const next = Math.min(max, Math.max(min, base + direction * step))
  return Math.round(next * 100) / 100
}

/** A text-bearing element the browser's hit test can never return. */
function isPointerlessTextOverlay(el: Element): boolean {
  if (textCarrier(el) === undefined) return false
  const view = el.ownerDocument.defaultView
  return view !== null && view.getComputedStyle(el).pointerEvents === 'none'
}

/**
 * The gray "default text" a click landed on, when the browser's own hit test cannot
 * see it.
 *
 * Two tiers: the known upstream composer marker first, then any `pointer-events: none`
 * text overlay painted under the pointer — a class of node `elementsFromPoint` never
 * returns, which is exactly the class the composer placeholder belongs to.
 *
 * @param stack - `document.elementsFromPoint` output, topmost first.
 * @param clientX - pointer x.
 * @param clientY - pointer y.
 * @param isOwn - predicate marking the editor's own UI, skipped entirely.
 * @returns the overlay element to select, or undefined when the click is not on one.
 */
export function textOverlayAt(
  stack: readonly Element[],
  clientX: number,
  clientY: number,
  isOwn: (el: Element) => boolean = () => false,
): Element | undefined {
  const usable = stack.filter((el) => !isOwn(el))
  if (usable.length === 0) return undefined
  const layout = layoutAvailable(usable[0].ownerDocument)
  // The stack holds the ANCESTORS of the hit node, so a pointer-invisible overlay is
  // one of their direct children (the placeholder sits next to the contenteditable
  // inside the composer's own wrapper). The stack element itself is included so the
  // picker still behaves when a caller hands it an element list that does contain
  // the overlay.
  const candidates = (predicate: (el: Element) => boolean): Element[] => {
    const found: Element[] = []
    for (const host of usable) {
      if (predicate(host) && underPoint(host, clientX, clientY, layout)) found.push(host)
      for (const child of Array.from(host.children)) {
        if (!isOwn(child) && predicate(child) && underPoint(child, clientX, clientY, layout)) found.push(child)
      }
    }
    return found
  }
  const marker = candidates((el) => el.matches(COMPOSER_PLACEHOLDER_SELECTOR))
  if (marker.length > 0) return marker[0]
  const overlay = candidates(isPointerlessTextOverlay)
  return overlay[0]
}

/**
 * Resolve one canvas click to the element the editor should select.
 *
 * Order matters, and each rule exists because of a real report:
 *   1. the editor's own UI always passes through (its panels stay clickable);
 *   2. the nearest interactive ancestor beats the icon inside it (clicking a button
 *      must select the button, not its SVG path);
 *   3. a pointer-invisible text overlay beats the container behind it — this is what
 *      makes the gray default text of a new conversation selectable and editable;
 *   4. otherwise the hit element itself.
 *
 * @param stack - `document.elementsFromPoint` output, topmost first.
 * @param clientX - pointer x.
 * @param clientY - pointer y.
 * @param isOwn - predicate marking elements the picker must ignore (own UI, #root, body…).
 * @returns the element to select, or undefined when nothing usable is under the point.
 */
export function pickElementAt(
  stack: readonly Element[],
  clientX: number,
  clientY: number,
  isOwn: (el: Element) => boolean = () => false,
): Element | undefined {
  const usable = stack.filter((el) => !isOwn(el))
  if (usable.length === 0) return undefined
  const hit = usable[0]
  const interactive = hit.closest(INTERACTIVE_SELECTOR)
  if (interactive !== null && !isOwn(interactive)) return interactive
  return textOverlayAt(usable, clientX, clientY, isOwn) ?? hit
}

/**
 * CSS properties the canvas Inspector writes through its live preview.
 *
 * The preview REPLACES these declarations on the element's rule and keeps every other
 * one, so hiding an element (visibility: hidden !important) or a hand-written geek rule
 * survives a font-size tweak. Replacing the whole rule is what used to make a hidden
 * element pop back the moment any style field was touched.
 */
export const INSPECTOR_PROPERTIES: readonly string[] = [
  'font-size', 'font-family', 'font-weight', 'line-height', 'text-align', 'color',
  'width', 'height', 'padding', 'margin', 'border-radius', 'border-width', 'border-color',
  'background-color', 'background-image', 'background-size', 'background-position',
  'box-shadow', 'opacity', 'transform',
]

/**
 * Rewrite one rule's managed declarations, keeping everything else.
 * @param existing - the element's current declaration block, or undefined.
 * @param addition - the declarations the Inspector wants right now.
 * @param managed - properties the Inspector owns (dropped from the existing rule first).
 * @returns the merged declaration block ('' when nothing is left).
 */
export function withManagedDeclarations(
  existing: string | undefined,
  addition: string,
  managed: readonly string[] = INSPECTOR_PROPERTIES,
): string {
  const kept = declarationPairs(existing ?? '').filter(([property]) => !managed.includes(property))
  const next = declarationPairs(addition)
  return [...kept, ...next].map(([property, value]) => property + ': ' + value).join('; ')
}

/**
 * The `format()` keyword for an embedded font file.
 *
 * Browsers refuse a face whose format hint contradicts the bytes, so the hint is
 * derived from the extension and anything unknown is refused by the caller instead of
 * being embedded with a guess.
 * @param fileName - the picked file's name.
 * @returns the CSS format keyword, or undefined when the type is not supported.
 */
export function fontFormat(fileName: string): string | undefined {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'))
  if (ext === '.woff2') return 'woff2'
  if (ext === '.woff') return 'woff'
  if (ext === '.ttf') return 'truetype'
  if (ext === '.otf') return 'opentype'
  return undefined
}

/**
 * One `@font-face` declaration block for an embedded font.
 *
 * Stored as an ordinary entry of the skin's `css` list with the selector
 * {@link FONT_FACE_SELECTOR}: the engine emits `selector { rule }`, so the block lands
 * in the stylesheet verbatim — no new schema field, no new apply path, and removing the
 * entry un-embeds the font.
 * @param family - the generated family name.
 * @param url - the data URL of the font file.
 * @param format - the CSS format keyword (see {@link fontFormat}).
 * @returns the declaration block.
 */
export function fontFaceRule(family: string, url: string, format: string): string {
  return "font-family: '" + family + "'; src: url('" + url + "') format('" + format + "'); font-display: swap;"
}

/**
 * `transform` value for the canvas X/Y move + scale controls.
 *
 * Identity parts are omitted so an untouched axis never adds a no-op function, and an
 * all-identity transform returns '' — the caller then drops the property entirely
 * instead of pinning `transform: none` onto the element.
 * @param x - horizontal offset in px.
 * @param y - vertical offset in px.
 * @param scale - uniform scale factor (1 = untouched).
 * @returns the transform value, or '' when nothing is transformed.
 */
export function transformValue(x: number, y: number, scale: number): string {
  const round = (value: number): string => String(Math.round(value * 100) / 100)
  const parts: string[] = []
  if (Number.isFinite(x) && Number.isFinite(y) && (x !== 0 || y !== 0)) parts.push('translate(' + round(x) + 'px, ' + round(y) + 'px)')
  if (Number.isFinite(scale) && scale !== 1) parts.push('scale(' + round(scale) + ')')
  return parts.join(' ')
}

/**
 * Read back the X/Y/scale the canvas wrote into one rule.
 *
 * The panel mirrors these numbers while a canvas drag is running (the drag writes the
 * rule directly, the fields follow), so parsing has to be the exact inverse of
 * {@link transformValue} — and tolerant of anything else the element's transform might
 * carry (a hand-written geek rule), which is simply ignored.
 * @param rule - the element's declaration block, or undefined.
 * @returns the offsets and scale; 0/0/1 when the rule has no transform of ours.
 */
export function parseTransform(rule: string | undefined): { x: number; y: number; scale: number } {
  const found = declarationPairs(rule ?? '').find(([property]) => property === 'transform')?.[1] ?? ''
  const translate = found.match(/translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px\s*\)/)
  const scale = found.match(/scale\(\s*(-?[\d.]+)\s*\)/)
  return {
    x: translate === null ? 0 : Number(translate[1]),
    y: translate === null ? 0 : Number(translate[2]),
    scale: scale === null ? 1 : Number(scale[1]),
  }
}

/**
 * Whether two declaration blocks say the same thing.
 *
 * Order and the `!important` flag are ignored on purpose: the Inspector preview always
 * appends `!important` and may reorder properties, so a byte compare would report a
 * change — and mark the draft dirty, and push an undo entry — every time an element that
 * already has a saved rule is merely selected. Values are compared last-wins and
 * whitespace-normalised.
 * @param left - one declaration block.
 * @param right - the other declaration block.
 * @returns true when both carry the same properties with the same values.
 */
export function sameDeclarations(left: string | undefined, right: string | undefined): boolean {
  const parse = (rule: string | undefined): Map<string, string> => {
    const out = new Map<string, string>()
    for (const [property, value] of declarationPairs(rule ?? '')) {
      out.set(property, value.replace(/\s*!important\s*$/i, '').replace(/\s+/g, ' ').trim())
    }
    return out
  }
  const a = parse(left)
  const b = parse(right)
  if (a.size !== b.size) return false
  for (const [property, value] of a) if (b.get(property) !== value) return false
  return true
}

/**
 * Human label for one element, used by the canvas hover/selection chips.
 *
 * Users pick by what they SEE (a nav label, an avatar, a card), not by a positional
 * path, so the chip leads with tag + id + the first classes and ends with a trimmed
 * snippet of the element's own text.
 * @param el - the element to describe.
 * @param maxText - longest text snippet before it is ellipsised.
 * @returns a single-line label.
 */
export function elementLabel(el: Element, maxText = 28): string {
  const tag = el.tagName.toLowerCase()
  const id = el.id === '' ? '' : '#' + el.id
  const classes = (el.getAttribute('class') ?? '').split(/\s+/).filter((name) => name !== '').slice(0, 2)
  const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
  const snippet = text === '' ? '' : ' · ' + (text.length > maxText ? text.slice(0, maxText) + '…' : text)
  return tag + id + classes.map((name) => '.' + name).join('') + snippet
}

/**
 * The nearest selectable ancestor of one element (the panel's parent button).
 * @param el - the current selection.
 * @param isOwn - predicate marking elements the picker must ignore.
 * @returns the parent to select, or undefined at the top of the app tree.
 */
export function parentTarget(el: Element, isOwn: (el: Element) => boolean = () => false): Element | undefined {
  const parent = el.parentElement
  if (parent === null || isOwn(parent)) return undefined
  return parent
}

/**
 * The direct child of one element that sits under the pointer (the panel's child button).
 *
 * One level per press, so repeated presses walk down the real tree instead of jumping
 * straight to the deepest node the browser hit.
 * @param stack - elementsFromPoint output, topmost first.
 * @param el - the current selection.
 * @param isOwn - predicate marking elements the picker must ignore.
 * @returns the child to select, or undefined when the pointer is not inside the element.
 */
export function childTargetIn(
  stack: readonly Element[],
  el: Element,
  isOwn: (el: Element) => boolean = () => false,
): Element | undefined {
  const direct: Element[] = []
  for (const candidate of stack) {
    if (candidate === el || isOwn(candidate) || !el.contains(candidate)) continue
    let node: Element = candidate
    while (node.parentElement !== null && node.parentElement !== el) node = node.parentElement
    if (node.parentElement === el && !direct.includes(node)) direct.push(node)
  }
  return direct[0]
}

/**
 * Selector used for embedded `@font-face` blocks inside the skin's `css` list.
 *
 * The engine renders every entry as `selector { rule }`, so this selector must NOT
 * receive a trailing rule body — it IS the at-rule.
 */
export const FONT_FACE_SELECTOR = '@font-face'

/**
 * Attributes that survive portal remounting, in preference order, with the
 * attribute to echo back when the anchor is generic.
 */
const STABLE_ANCHORS: ReadonlyArray<readonly [string, string | undefined]> = [
  ['[data-shortcut-modal]', 'data-shortcut-modal'],
  ['[role="dialog"]', undefined],
  ['[role="menu"]', undefined],
  ['[role="listbox"]', undefined],
]

/**
 * Escape one id for a `#id` selector.
 *
 * The platform's `CSS.escape` when the document's window exposes it (browsers and
 * jsdom's window both do), else a conservative fallback — reaching for the *global*
 * `CSS` is what broke this outside a browser.
 * @param id - the raw element id.
 * @param view - the element's window, when it has one.
 * @returns the escaped id.
 */
function escapeId(id: string, view: Window | null): string {
  // `lib.dom` declares CSS as a global, not as a Window member, and jsdom installs it
  // on its window only — check both, then fall back to a conservative escape.
  const carrier = globalThis as { CSS?: { escape?: (value: string) => string } }
  const fromWindow = view as unknown as { CSS?: { escape?: (value: string) => string } } | null
  const css = carrier.CSS ?? (fromWindow === null ? undefined : fromWindow.CSS)
  if (css !== undefined && typeof css.escape === 'function') return css.escape(id)
  return id.replace(/[^A-Za-z0-9_-]/g, (char) => '\\' + char)
}

/**
 * The `:nth-of-type` chain from `ancestor`'s child down to `el`.
 * @param ancestor - exclusive upper bound.
 * @param el - the target (a descendant of ancestor).
 * @returns the relative selector ('' when el is the ancestor).
 */
function pathWithin(ancestor: Element, el: Element): string {
  const parts: string[] = []
  let node: Element | null = el
  while (node !== null && node !== ancestor) {
    const current: Element = node
    const parent = current.parentElement
    if (parent === null) break
    const sameTag = Array.from(parent.children).filter((child) => child.tagName === current.tagName)
    const index = sameTag.indexOf(current) + 1
    const name = current.tagName.toLowerCase()
    parts.unshift(index > 1 ? name + ':nth-of-type(' + index + ')' : name)
    node = parent
  }
  return parts.join(' > ')
}

/**
 * Build a structural selector for a real DSH node.
 *
 * The settings surface, menus and modals are portalled **beside `#root`** (upstream
 * mounts them as `document.body` children so the shell's drag/overlay rules apply),
 * so anchoring everything at `#root` produced `#root > … > body > …` for exactly the
 * elements users pick inside Settings — a selector that matches nothing. Hide,
 * remove and text editing therefore did nothing at all inside any dialog.
 *
 * Strategy: `#root` for the app surface, a stable portal attribute when one is
 * present, and the body-anchored path as the last resort.
 * @param el - the element the user selected.
 * @returns a selector that matches `el` again.
 */
export function selectorOf(el: Element): string {
  if (el.id !== '') return '#' + escapeId(el.id, el.ownerDocument.defaultView)
  const root = el.ownerDocument.getElementById('root')
  if (root !== null && root !== el && root.contains(el)) return '#root > ' + pathWithin(root, el)
  for (const [anchor, attribute] of STABLE_ANCHORS) {
    const holder = el.closest(anchor)
    if (holder === null) continue
    const base = attribute === undefined ? anchor : '[' + attribute + '="' + (holder.getAttribute(attribute) ?? '') + '"]'
    const rest = holder === el ? '' : pathWithin(holder, el)
    return rest === '' ? base : base + ' > ' + rest
  }
  return 'body > ' + pathWithin(el.ownerDocument.body, el)
}

/** One resolved shell-surface tint: colour plus the canvas/panel alphas. */
export interface SurfaceTint {
  /** `r, g, b` of the shell surface. */
  readonly rgb: string
  /** Alpha the canvas surface uses (0..1). */
  readonly base: number
  /** Alpha the panel surface uses (0..1). */
  readonly panel: number
  /** Where the tint belongs: the token's consumers, or the frame itself. */
  readonly target: 'token' | 'frame'
}

/**
 * Resolve the shell surface the wallpaper must be seen through.
 * @param doc - the live page.
 * @param opacity - requested strength, 0..1 (>=0.999 means "leave it opaque").
 * @param frameTint - resolved `--dsw-alias-bg-base` for a shell that paints no
 *   opaque surface of its own (see {@link desktopFrameTint}).
 * @returns the tint, or undefined when nothing should change.
 */
export function surfaceTint(doc: Document, opacity: number = DEFAULT_BACKGROUND_OPACITY, frameTint?: string): SurfaceTint | undefined {
  if (!(opacity < 0.999)) return undefined
  const base = Math.min(0.98, Math.max(0.35, opacity))
  const surface = shellSurfaceColor(doc)
  const tint = surface === undefined && frameTint !== undefined ? parseCssColor(frameTint) : undefined
  const rgb = surface ?? (tint === undefined ? undefined : tint.r + ', ' + tint.g + ', ' + tint.b)
  if (rgb === undefined) return undefined
  return { rgb, base, panel: Math.min(1, base + 0.15), target: surface === undefined ? 'frame' : 'token' }
}

/**
 * Rules for one wallpaper: the page canvas, plus the surface that owns the rounded
 * content corner.
 *
 * Windows rounds the conversation column's top-left (`--dsh-windows-content-radius`)
 * and clips that column's own background with the radius, so on Windows the wallpaper
 * goes ON the column: the corner then *cuts* the image instead of letting it run
 * across the notch — the wallpaper keeps its rounded boundary and the frame keeps the
 * surface DSH already paints there (`--dsw-specific-sidebar-fill`, which is exactly
 * what fills the 16px notch and blends into the caption row and the sidebar).
 *
 * The frame is deliberately left image-free on Windows. Both earlier variants were
 * wrong: a transparent frame exposed Electron's window colour (opaque chrome fallback,
 * `#1b1b1c` in dark mode) as a black notch, and a wallpapered frame erased the
 * rounding altogether by filling the notch with the same image.
 *
 * macOS keeps the frame copy: its frame is transparent on purpose (native vibrancy),
 * its sidebar reads the wallpaper through it, and the content column has no radius.
 * @param doc - the document being styled.
 * @param url - the wallpaper data URL.
 * @returns the CSS rules to write.
 */
export function wallpaperRules(doc: Document, url: string, tint?: SurfaceTint): string[] {
  const geometry = 'background-size: cover !important; background-position: center !important; background-attachment: fixed !important;'
  const body = 'background-image: url("' + url + '") !important; ' + geometry
  const rules = ['body { ' + body + ' }']
  const fmt = (value: number): string => String(Math.round(value * 100) / 100)
  const layers = tint === undefined
    ? 'url("' + url + '")'
    : 'linear-gradient(rgba(' + tint.rgb + ', ' + fmt(tint.base) + '), rgba(' + tint.rgb + ', ' + fmt(tint.base) + ')), url("' + url + '")'
  const shell = readDesktopShell(doc)
  if (shell.windowsTitlebar) {
    // The column paints the image AND gives up its own colour in one rule, so neither
    // the token layer (below) nor a stale `background` shorthand can stack a second
    // surface under the wallpaper. `overflow: hidden` + `border-radius` already clip
    // it to the rounded corner.
    rules.push(CENTER_COLUMN_SELECTOR + ' { background-image: ' + layers + ' !important; ' + geometry + ' background-color: transparent !important; }')
    return rules
  }
  if (!shell.desktop) return rules
  // macOS: the frame is the surface the vibrancy sidebar reads, so the wallpaper and
  // its single tint stay there, and the column keeps showing it instead of painting
  // its own copy (two copies double the dimming and the slider barely moves anything).
  rules.push(FRAME_SELECTOR + ' { background-image: ' + layers + ' !important; ' + geometry + ' }')
  if (tint !== undefined) rules.push(CENTER_COLUMN_SELECTOR + ' { background-color: transparent !important; }')
  return rules
}

/**
 * Colour of the surface the shell paints its own canvas with, as `r, g, b`.
 * @param doc - document to measure (the live page).
 * @returns the first opaque shell surface colour, or undefined when every
 *   candidate is missing or fully transparent.
 */
function shellSurfaceColor(doc: Document): string | undefined {
  const frame = doc.querySelector(FRAME_SELECTOR) as HTMLElement | null
  for (const el of [frame, doc.body]) {
    if (el === null || el === undefined) continue
    const parsed = parseCssColor(getComputedStyle(el).backgroundColor)
    // A fully transparent surface would tint the whole app black: try the next one.
    if (parsed === undefined || parsed.a === 0) continue
    return parsed.r + ', ' + parsed.g + ', ' + parsed.b
  }
  return undefined
}

/**
 * Colour to tint when the desktop shell paints no opaque surface of its own.
 *
 * The macOS desktop window is transparent so the native sidebar vibrancy shows
 * through (`html[data-platform='darwin'], body { background: transparent }` in the
 * shipped Web bundle), which leaves `--dsw-alias-bg-base` painted by no element:
 * a wallpaper on `body` would show at full strength and the strength slider
 * would do nothing. Resolving the token gives the engine a colour to lay over
 * the wallpaper on the frame itself. Plain browsers and the Windows shell paint
 * the token, so they never reach this fallback.
 * @param doc - document to inspect (the live page).
 * @returns a CSS colour, or undefined on the Web / when the token is absent.
 */
export function desktopFrameTint(doc: Document): string | undefined {
  if (!readDesktopShell(doc).desktop) return undefined
  const view = doc.defaultView
  if (view === null) return undefined
  // Body first: the token layer binds the skin's overrides there, and a custom
  // bg-base should tint the frame with the colour the user actually picked.
  for (const el of [doc.body, doc.documentElement]) {
    if (el === null || el === undefined) continue
    const value = view.getComputedStyle(el).getPropertyValue('--dsw-alias-bg-base').trim()
    if (value !== '' && parseCssColor(value) !== undefined) return value
  }
  return undefined
}

/**
 * Rules that let the wallpaper show through the shell surface WITHOUT washing the UI
 * out — applied exactly ONCE per pixel.
 *
 * `--dsw-alias-bg-base` is the shell canvas: giving it an alpha is what makes the
 * wallpaper visible, and `opacity` is how strongly that surface covers the image
 * (1 = leave the app untouched; the image simply does not show through). DSH paints
 * the same token in several *nested* surfaces (frame → column → conversation root →
 * composer seat), so one slider value used to produce a different transparency in
 * every region. Measured on a real Windows session by solving
 * `observed = α·surface + (1-α)·wallpaper` per pixel against the wallpaper itself
 * (α = how much surface covers the wallpaper): transcript ≈ 0.75, conversation top
 * bar ≈ 0.94, send bar ≈ 1.0 — three values, one slider.
 *
 * Ownership, not more layers, is the fix: the column owns the only canvas surface
 * (see {@link wallpaperRules}), the chrome inside the column is denied the token, and
 * the token comes back only where a card is *meant* to sit above the canvas — the
 * content a conversation slot renders (tool cards, file chips) and the composer's own
 * cards. Card, menu and dialog surfaces elsewhere (`bg-layer-1`, `bg-layer-2`,
 * `bg-overlay`) keep their own colours; making those translucent is what made text
 * unreadable.
 *
 * @param doc - document to measure (the live page).
 * @param opacity - shell surface opacity, 0..1.
 * @param frameTint - resolved `--dsw-alias-bg-base` for a shell that paints no
 *   opaque surface (see {@link desktopFrameTint}); undefined on the Web.
 * @returns CSS rules, or an empty array when nothing should be overridden.
 */
export function backgroundSurfaceRules(doc: Document, opacity: number = DEFAULT_BACKGROUND_OPACITY, frameTint?: string): string[] {
  const tint = surfaceTint(doc, opacity, frameTint)
  if (tint === undefined) return []
  // Round to two decimals so 0.8 + 0.15 does not leak float noise into the CSS.
  const fmt = (value: number): string => String(Math.round(value * 100) / 100)
  // A transparent desktop shell paints the token nowhere, so the tint goes on the
  // frame itself: above the wallpaper, below every panel.
  const rules: string[] = [tint.target === 'token'
    ? 'body { --dsw-alias-bg-base: rgba(' + tint.rgb + ', ' + fmt(tint.base) + ') !important; }'
    : FRAME_SELECTOR + ' { background-color: rgba(' + tint.rgb + ', ' + fmt(tint.base) + ') !important; }']
  // Panels keep more body than the canvas: text on cards stays crisp while the
  // wallpaper still reads as texture. Dialogs/menus (layer-2/overlay) never move.
  if (tint.panel < 0.999) rules.push('body { --dsw-alias-bg-layer-1: rgba(' + tint.rgb + ', ' + fmt(tint.panel) + ') !important; }')
  // ONE canvas surface per pixel inside the conversation column. Two tiers nested over
  // each other (the column's own colour over the root's, the seat's gradient over
  // both) are what made the three regions disagree; the column already carries the
  // wallpaper and its tint, so everything inside it must stop painting that surface.
  const canvas = 'rgba(' + tint.rgb + ', ' + fmt(tint.base) + ')'
  rules.push(CENTER_COLUMN_SELECTOR + ' { --dsw-alias-bg-base: transparent !important; }')
  // …give it back to the content the view renders, where cards must sit above the
  // canvas so their text stays crisp (tool cards, file chips, sticky rows). Content
  // slots only: the header and the composer are slots as well.
  rules.push(scoped(COLUMN_SELECTORS, CONTENT_SLOT_SELECTORS) + ' { --dsw-alias-bg-base: ' + canvas + ' !important; }')
  // …and to the composer seat's own cards, while the seat itself stops painting the
  // bottom fade that stacked a third veil under the send bar.
  rules.push(scoped(COLUMN_SELECTORS, SEAT_SELECTORS) + ' { background: none !important; --dsw-alias-bg-base: ' + canvas + ' !important; }')
  return rules
}

/**
 * `::after` layer that paints one embedded image inside its container.
 *
 * Above the container's own background, below its content, sized from the editor's
 * position/size and following the container's collapse.
 * @param img - the embedded image.
 * @returns the `::after` declaration block (selector omitted, so it can be appended to
 *   both the transient attribute selector and the structural fallback).
 */
function embedAfter(img: EmbeddedImage): string {
  const blend = img.blend !== undefined && img.blend !== 'normal' ? ' mix-blend-mode: ' + img.blend + ';' : ''
  return '::after { content: \'\'; position: absolute; inset: 0; background-image: url("' + img.url + '"); background-repeat: no-repeat; background-position: ' + img.x + 'px ' + img.y + 'px; background-size: ' + img.w + 'px ' + img.h + 'px; opacity: ' + (img.opacity ?? 1) + '; pointer-events: none; z-index: 1;' + blend + ' }'
}

/**
 * Apply the skin to the live document.
 * @param theme - the DSH theme registry service (`ctx.theme`).
 * @param skin - the skin definition to apply.
 * @returns a `SkinOverride` whose `dispose` reverts every byte this call changed.
 */
export function applySkin(theme: ThemeRuntime, skin: SkinSettings): SkinOverride {
  const cleanups: Array<() => void> = []
  // Set before the first cleanup runs: a queued MutationObserver microtask must
  // not re-apply anything after dispose (React rebuilds and late mounts can land
  // between the last observed mutation and the teardown).
  let disposed = false

  // Snapshot <body>'s raw inline style BEFORE any skin write. The restore itself is
  // pushed LAST (below), so it runs after the per-property removeProperty cleanups
  // (which would otherwise re-add a stale `style=""` and drift body.outerHTML from
  // baseline). This keeps the skin byte-exact reversible / non-destructive.
  let bodyStyleProto: string | null = null
  if (typeof document !== 'undefined') bodyStyleProto = document.body.getAttribute('style')

  // 1. Token layer: the official theme registry AND a direct var bind, so the
  // change is immediate + scheme-correct regardless of the presenter.
  if (Object.keys(skin.tokens).length > 0) {
    const disposeTokens = theme.overrideTokens(PLUGIN_ID, skin.tokens)
    cleanups.push(() => { disposeTokens() })
    if (typeof document !== 'undefined') {
      const dark = document.body.hasAttribute('data-ds-dark-theme')
        || document.documentElement.style.colorScheme === 'dark'
      const sv = ((name: string, modes: TokenModes): void => {
        document.body.style.setProperty(name, dark ? modes.dark : modes.light)
        cleanups.push(() => { document.body.style.removeProperty(name) })
      })
      for (const [name, modes] of Object.entries(skin.tokens)) sv(name, modes)
    }
  }

  // 2. CSS + background layer.
  const rules: string[] = []
  // Embedded background images: a ::after layer on each container, painted above the
  // container's background but below its content, so it's behind text and follows the
  // container's size/collapse. position/size/opacity are user-adjustable.
  const embedTargets = skin.canvas.images.filter((img) =>
    img.selector !== '' && img.url !== '' && img.fallbackSelector !== undefined && img.fallbackSelector !== '',
  )
  for (const img of skin.canvas.images) {
    if (img.selector === '' || img.url === '') continue
    rules.push(img.selector + ' { position: relative; }')
    rules.push(img.selector + embedAfter(img))
    // The structural fallback is deliberately NOT painted directly, even when it matches
    // exactly one element right now: it is a positional path, so the moment React shifts a
    // sibling the same selector matches a look-alike and the image would be painted on the
    // wrong node. Identity is the engine's job (see the re-tag loop below), not the
    // stylesheet's.
  }
  // Cross-document recovery: the image's own selector is the editor iframe's
  // `[data-dsh-myskin-embed=...]` attribute, which the real page never carries.
  // We re-tag the real element via its structural fallback selector, only when it
  // uniquely matches (so we never tag a look-alike). The attribute is transient —
  // React may rebuild the node (wiping it) or mount it after this apply runs — so a
  // single shared MutationObserver keeps the unique fallback re-tagged across
  // re-renders and late mounts until the skin is disposed.
  if (embedTargets.length > 0 && typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') {
    /** The element each image was last tagged on, used to recognise it after a rebuild. */
    const taggedElements = new Map<string, Element>()
    /** Its ancestor fingerprint, for when the element itself was re-created. */
    const taggedChains = new Map<string, string[]>()
    /**
     * Resolve a selector to the element it should target.
     *
     * "Exactly one match" was the old rule, and it is why an embedded image vanished
     * after the sidebar collapsed and expanded again: for a frame React keeps both the
     * rail and the panel mounted (two matches), and a remount can also leave the old
     * attribute behind on a detached node. Several matches therefore prefer a *visible*
     * one (browsers; jsdom has no layout and falls back to the first), and the first
     * match is always better than giving up.
     * @param selector - candidate selector.
     * @returns the element to tag, or undefined when nothing matches.
     */
    const pick = (selector: string): Element | undefined => {
      let els: Element[]
      try { els = Array.from(document.querySelectorAll(selector)) } catch { return undefined }
      if (els.length === 0) return undefined
      if (els.length === 1) return els[0]
      return els.find((el) => el.getClientRects().length > 0) ?? els[0]
    }
    /**
     * Fingerprint of an element: `TAG.class` for the element and up to 8 ancestors.
     *
     * Sibling index is deliberately left out — the index is exactly what React shuffles
     * when it rebuilds a node — while tag + CSS-module classes survive that rebuild.
     * @param el - the element to fingerprint.
     * @returns the chain, root-most first.
     */
    const chainOf = (el: Element): string[] => {
      const chain: string[] = []
      let node: Element | null = el
      while (node !== null && node !== document.body && chain.length < 8) {
        chain.unshift(node.tagName + '.' + (node.getAttribute('class') ?? ''))
        node = node.parentElement
      }
      return chain
    }
    /**
     * The one element in the document carrying exactly this ancestor chain.
     *
     * Two matches means the fingerprint is not specific enough (a list of identical rows),
     * and then this must return undefined: re-tagging the wrong row would paint the image
     * on someone else's node, which is worse than the image staying hidden until the user
     * re-embeds it.
     * @param chain - the recorded chain.
     * @returns the element, or undefined when it is absent or ambiguous.
     */
    const findByChain = (chain: readonly string[]): Element | undefined => {
      if (chain.length === 0) return undefined
      const leaf = chain[chain.length - 1]
      const dot = leaf.indexOf('.')
      const tag = leaf.slice(0, dot).toLowerCase()
      const classes = leaf.slice(dot + 1).trim().split(/\s+/).filter((name) => name !== '')
      const selector = classes.reduce((acc, name) => acc + '.' + name, tag)
      let candidates: Element[]
      try { candidates = Array.from(document.querySelectorAll(selector)) } catch { return undefined }
      const matches = candidates.filter((el) => {
        const own = chainOf(el)
        return own.length === chain.length && own.every((part, index) => part === chain[index])
      })
      return matches.length === 1 ? matches[0] : undefined
    }
    const retag = (): void => {
      if (disposed) return
      const curKey = currentSettingsPageKey(document)
      for (const img of embedTargets) {
        // Page scoping: an image embedded on one settings page must not leak onto
        // another. When the image carries a pageKey, only keep it tagged while the
        // current page matches; on any mismatch strip the stale tag so its
        // [data-dsh-myskin-embed=id] rule matches nothing.
        const scoped = img.pageKey !== undefined && img.pageKey !== ''
        if (scoped && img.pageKey !== curKey) {
          const stale = document.querySelector('[data-dsh-myskin-embed="' + img.id + '"]')
          if (stale !== null) stale.removeAttribute('data-dsh-myskin-embed')
          taggedElements.delete(img.id)
          taggedChains.delete(img.id)
          continue
        }
        const known = taggedElements.get(img.id)
        let target = pick(img.fallbackSelector!)
        // Our element survived (possibly only hidden while the sidebar was collapsed).
        if (target === undefined && known !== undefined && known.isConnected) target = known
        // It was re-created: a sidebar collapse/expand remounts the virtualized workspace
        // panel, which shifts sibling indices until the stored positional path matches
        // nothing. Re-find it by fingerprint instead — and only when that fingerprint is
        // unique, so the image can never land on a look-alike.
        if (target === undefined) {
          const chain = taggedChains.get(img.id)
          if (chain !== undefined) target = findByChain(chain)
        }
        if (target === undefined) continue
        if (target.getAttribute('data-dsh-myskin-embed') !== img.id) target.setAttribute('data-dsh-myskin-embed', img.id)
        taggedElements.set(img.id, target)
        taggedChains.set(img.id, chainOf(target))
      }
    }
    retag()
    let scheduled = false
    const schedule = (): void => {
      if (scheduled) return
      scheduled = true
      queueMicrotask(() => { scheduled = false; retag() })
    }
    const mo = new MutationObserver(schedule)
    // childList+subtree: React rebuilding a node shows up as child mutations.
    // aria-current re-evaluates the page scoping when the user switches settings pages;
    // class/hidden cover a sidebar collapse-expand, which only swaps layout classes (the
    // panel is hidden, not unmounted) and would otherwise never trigger a re-tag. Our own
    // setAttribute (data-dsh-myskin-embed) is not observed, so the observer cannot
    // self-loop.
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-current', 'class', 'hidden'] })
    cleanups.push(() => { mo.disconnect() })
  }

  // DSH paints opaque surfaces over <body>, so the wallpaper goes on <body> AND (on a
  // desktop shell) on the frame; the base surfaces then become semi-transparent.
  // Everything stays INSIDE the skin-owned <style>, removed on dispose, so <body>'s
  // inline style is never touched and the skin stays byte-reversible.
  if (skin.canvas.background !== undefined && skin.canvas.background !== '' && typeof document !== 'undefined') {
    const opacity = readBackgroundOpacity(skin)
    rules.push(...wallpaperRules(document, skin.canvas.background, surfaceTint(document, opacity, desktopFrameTint(document))))
    rules.push(...backgroundSurfaceRules(document, opacity, desktopFrameTint(document)))
  }
  for (const { selector, rule } of skin.css) {
    if (selector !== '' && rule !== '') rules.push(`${selector} { ${rule} }`)
  }
  if (rules.length > 0 && typeof document !== 'undefined') {
    const tag = document.createElement('style')
    tag.dataset.plugin = PLUGIN_ID
    tag.dataset.pluginCss = STYLE_ID
    tag.id = STYLE_ID
    tag.textContent = rules.join('\n')
    document.head.appendChild(tag)
    cleanups.push(() => { tag.remove() })
  }

  // 3. Layer injection: REAL DOM nodes (img/div), tagged data-dsh-myskin-layer.
  //    This is the capability that lets a skin reach the "dsh-deep-whale depth":
  //    instanced character art, sidebar mascots, ornamental corners/trims, frames.
  //    Reversible + non-destructive: every injected node is tracked and removed on
  //    dispose, and a shared MutationObserver re-injects across React rebuilds /
  //    late mounts. State following is AUTHORED in the `css` layer against this
  //    stable per-layer marker under DSH's real state attributes (e.g.
  //    `[data-phase='active'] [data-dsh-myskin-layer='char'] { transform: ... }`).
  //    NOTE: layers should target a safe container (body, or a plain, non-React-
  //    mapped wrapper like `:scope > div`), never the middle of a mapped list.
  const layerList = skin.layers.filter((l) =>
    l.selector !== '' && (l.kind === 'div' || (l.url !== undefined && l.url !== '')))
  if (layerList.length > 0 && typeof document !== 'undefined') {
    const injectedNodes = new Set<Element>()
    const injectLayer = (layer: InjectedLayer): void => {
      if (disposed) return
      const container = document.querySelector(layer.selector)
      if (container === null) return
      const key = '[data-dsh-myskin-layer="' + layer.id + '"]'
      if (container.querySelector(key) !== null) return // already present / re-injected
      const node = document.createElement(layer.kind)
      node.setAttribute('data-dsh-myskin-layer', layer.id)
      node.setAttribute('data-dsh-myskin-owner', PLUGIN_ID)
      node.setAttribute('aria-hidden', 'true')
      if (layer.kind === 'img') {
        const img = node as HTMLImageElement
        img.alt = ''
        img.src = layer.url || ''
      } else if (layer.url !== undefined && layer.url !== '') {
        ;(node as HTMLElement).style.backgroundImage = 'url("' + layer.url + '")'
        ;(node as HTMLElement).style.backgroundSize = 'contain'
        ;(node as HTMLElement).style.backgroundRepeat = 'no-repeat'
      }
      const st = (node as HTMLElement).style
      if (layer.x !== undefined) st.left = layer.x + 'px'
      if (layer.y !== undefined) st.top = layer.y + 'px'
      if (layer.w !== undefined) st.width = layer.w + 'px'
      if (layer.h !== undefined) st.height = layer.h + 'px'
      if (layer.opacity !== undefined) st.opacity = String(layer.opacity)
      if (layer.blend !== undefined && layer.blend !== 'normal') st.mixBlendMode = layer.blend
      if (layer.css) st.cssText += (st.cssText === '' ? '' : '; ') + layer.css
      if (layer.attach === 'prepend') container.prepend(node)
      else container.append(node)
      injectedNodes.add(node)
    }
    for (const layer of layerList) injectLayer(layer)
    let scheduled = false
    const schedule = (): void => {
      if (scheduled) return
      scheduled = true
      queueMicrotask(() => { scheduled = false; for (const layer of layerList) injectLayer(layer) })
    }
    const mo = new MutationObserver(schedule)
    // childList+subtree: React rebuilds a container and wipes an injected node, so
    // we re-inject. The self-loop is broken because injectLayer checks for an
    // existing [data-dsh-myskin-layer='id'] before inserting.
    mo.observe(document.body, { childList: true, subtree: true })
    cleanups.push(() => { mo.disconnect(); injectedNodes.forEach((n) => n.remove()); injectedNodes.clear() })
  }

  // 4. Content decorator (built-in, safe — no user JS): tag the dynamic
  //    workspace/session tree with data-maid-* row attributes so the skin's css can
  //    theme each workspace (ribbon) / folder (shield) / session (tab, connector,
  //    selected). React-safe: re-tags on attribute/child mutations; one disposer
  //    clears every tag + disconnects the observer.
  // Only run the tree decorator when the skin's own CSS targets data-maid-* rows.
  // This keeps it opt-in (no host-schema field needed) and avoids a MutationObserver
  // on every DOM mutation for skins that don't decorate the workspace tree.
  if ((skin.css ?? []).some((r2) => String(r2.selector).includes('data-maid-')) && typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') {
    const decorated = new Set<HTMLElement>()
    const decorate = (): void => {
      if (disposed) return
      document.querySelectorAll<HTMLElement>("[role='tree']").forEach((tree) => {
        const rows = Array.from(tree.querySelectorAll<HTMLElement>("[role='treeitem']"))
        if (tree.matches("[class*='flatList']") && !rows.some((r) => r.hasAttribute('aria-expanded'))) {
          rows.filter((r) => r.hasAttribute('aria-selected')).forEach((r) => { r.dataset.maidWorkspaceRow = ''; r.dataset.maidSessionRow = ''; r.dataset.maidSessionFlat = ''; decorated.add(r) })
          return
        }
        let workspaceRow: HTMLElement | undefined
        let sessionRows: HTMLElement[] = []
        const decorateGroup = (): void => {
          if (!workspaceRow) return
          workspaceRow.dataset.maidWorkspaceRow = ''; decorated.add(workspaceRow)
          if (workspaceRow.parentElement) { workspaceRow.parentElement.dataset.maidWorkspaceGroup = ''; decorated.add(workspaceRow.parentElement) }
          sessionRows.forEach((r) => { r.dataset.maidSessionRow = ''; decorated.add(r) })
          if (sessionRows[0]) sessionRows[0].dataset.maidSessionFirst = ''
          if (sessionRows.at(-1)) sessionRows.at(-1)!.dataset.maidSessionLast = ''
          const current = workspaceRow.getAttribute('aria-expanded') === 'true' && sessionRows.some((r) => r.getAttribute('aria-selected') === 'true')
          if (current) workspaceRow.dataset.maidWorkspaceActive = ''
        }
        rows.forEach((row) => {
          if (row.hasAttribute('aria-expanded')) { decorateGroup(); workspaceRow = row; sessionRows = [] }
          else if (workspaceRow && row.hasAttribute('aria-selected')) sessionRows.push(row)
        })
        decorateGroup()
      })
    }
    decorate()
    const observer = new MutationObserver(() => { decorate() })
    observer.observe(document.body, { attributes: true, attributeFilter: ['aria-expanded', 'aria-selected'], childList: true, subtree: true })
    const clear = (): void => {
      observer.disconnect()
      decorated.forEach((el) => {
        delete el.dataset.maidWorkspaceRow; delete el.dataset.maidWorkspaceGroup; delete el.dataset.maidWorkspaceActive
        delete el.dataset.maidSessionRow; delete el.dataset.maidSessionFlat; delete el.dataset.maidSessionFirst; delete el.dataset.maidSessionLast
      })
      decorated.clear()
    }
    cleanups.push(clear)
  }

  // (removed) free-floating image layers — images are now embedded as
  //     background-image CSS rules on their container (see the css layer above).

  // 4. Text overrides: ONE shared MutationObserver, coalesced to a single
  // re-apply per microtask batch (so busy React re-renders don't re-scan the
  // whole DOM per mutation), with a deduped restore on dispose.
  const textEntries = skin.text.filter((e) => e.after !== '' && e.before !== e.after)
  const patches = new Map<Text, TextPatch>()
  interface PlaceholderPatch { el: Element; original: string; applied: string }
  const placeholderPatches: PlaceholderPatch[] = []
  if (textEntries.length > 0 && typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') {
    let scheduled = false
    const applyTexts = (): void => {
      scheduled = false
      if (disposed) return
      for (const entry of textEntries) {
        for (const el of findTargets(entry)) {
          const node = directTextNode(el)
          if (node !== undefined && textMatches(node.data, entry.before)) {
            // Keep the RAW original: the DOM's whitespace must come back byte-exact.
            if (!patches.has(node)) patches.set(node, { node, original: node.data, applied: entry.after })
            node.data = entry.after
          } else if (node === undefined && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
            if ((el as HTMLInputElement).placeholder === entry.before) {
              (el as HTMLInputElement).placeholder = entry.after
              placeholderPatches.push({ el, original: entry.before, applied: entry.after })
            }
          }
        }
      }
    }
    const schedule = (): void => { if (scheduled) return; scheduled = true; queueMicrotask(applyTexts) }
    applyTexts()
    const mo = new MutationObserver(schedule)
    mo.observe(document.body, { childList: true, subtree: true, characterData: true })
    cleanups.push(() => { mo.disconnect() })
  }
  cleanups.push(() => {
    for (const p of placeholderPatches) {
      if ((p.el as HTMLInputElement).placeholder === p.applied) (p.el as HTMLInputElement).placeholder = p.original
    }
  })
  cleanups.push(() => {
    for (const patch of patches.values()) {
      if (patch.node.data === patch.applied) patch.node.data = patch.original
    }
    patches.clear()
  })

  // Restore <body>'s inline style byte-exactly, AFTER every other cleanup ran.
  cleanups.push(() => {
    if (typeof document === 'undefined') return
    if (bodyStyleProto === null) document.body.removeAttribute('style')
    else document.body.setAttribute('style', bodyStyleProto)
  })

  return {
    dispose(): void {
      disposed = true
      for (const cleanup of cleanups.splice(0)) cleanup()
    },
  }
}

/** Current skin from a persisted document (defensive). */
export function currentSkin(value: SkinSettings | undefined): SkinSettings {
  return value ?? defaultSkin()
}