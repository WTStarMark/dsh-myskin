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
import { imageModeOf } from '../skin-schema.ts'
import { anchorOf, componentById } from './anchors.ts'
import { readDesktopShell } from './desktop.ts'

export const PLUGIN_ID = 'dsh-myskin'
const STYLE_ID = 'dsh-myskin-rule'
/** Id of the canvas editor's draft stylesheet — the layer that must win while it is open. */
export const DRAFT_STYLE_ID = 'dsh-myskin-live'

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
  // Inside the settings dialog first: a segmented control in the page CONTENT can also carry
  // `aria-current`, and taking that one would name a page after a toggle (unstable keys are what made
  // scoped images disappear in the first place).
  const cell = doc.querySelector('[data-shortcut-modal] button[aria-current=\"true\"]')
    ?? doc.querySelector('button[aria-current=\"true\"]')
  if (cell === null) return ''
  return (cell.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/**
 * Whether a recorded settings-page key still names the page that is open now.
 *
 * Keys used to be `label@position`, where the position counted sibling buttons — and that count is
 * NOT stable: the settings nav renders a different set of entries depending on installed plugins and
 * on how far the dialog has mounted, so the very same page could produce a different key between
 * embedding an image and looking at it again. The image was then stripped and disappeared (reported
 * twice). Only the label is compared now, and keys written by the older format still match on their
 * label part.
 * @param recorded - the key stored with the image.
 * @param current - the key of the page that is open now.
 * @returns true when the image belongs to this page.
 */
export function sameSettingsPage(recorded: string, current: string): boolean {
  if (recorded === '' || current === '') return false
  const label = (key: string): string => key.split('@')[0].trim()
  return label(recorded) === label(current)
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
  return withRootMarker(css, BG_OPACITY_PROPERTY, String(Math.round(opacity * 100) / 100))
}

/**
 * Where a wallpaper is anchored.
 *
 *   - `viewport` (the default): the page carries it with `background-attachment: fixed`, so it is
 *     positioned against the WINDOW — folding the sidebar slides the conversation area under a
 *     background that did not move;
 *   - `conversation`: the conversation column paints the same wallpaper anchored to ITS OWN box,
 *     so a sidebar fold re-centers it with no script at all.
 */
export type BackgroundAnchor = 'viewport' | 'conversation'

/** Custom property that mirrors the wallpaper anchor into `css` (no schema field needed). */
export const BG_ANCHOR_PROPERTY = '--dsh-myskin-bg-anchor'

/**
 * Effective wallpaper anchor of a skin document.
 *
 * Stored as a marker declaration in `css` rather than a `canvas` field on purpose: `css` has been
 * schema-declared since the first release, while a new `canvas` field would need a Host restart
 * before it survives a save (an older Host drops what it does not know).
 * @param skin - the skin document.
 * @returns the anchor, defaulting to `viewport`.
 */
export function readBackgroundAnchor(skin: SkinSettings): BackgroundAnchor {
  for (const rule of skin.css ?? []) {
    const match = rule.rule.match(/--dsh-myskin-bg-anchor:\s*([a-z-]+)/)
    if (match !== null) return match[1] === 'conversation' ? 'conversation' : 'viewport'
  }
  return 'viewport'
}

/**
 * Mirror the anchor into the marker rule (`viewport` = the absence of the marker).
 * @param css - the document's CSS rules.
 * @param anchor - the anchor to store.
 * @returns a new rule list.
 */
export function withBackgroundAnchor(css: readonly CssRule[], anchor: BackgroundAnchor): CssRule[] {
  return withRootMarker(css, BG_ANCHOR_PROPERTY, anchor === 'conversation' ? 'conversation' : undefined)
}

/**
 * Write (or clear) one marker declaration on the single `:root` rule.
 *
 * Everything that lives on `:root` shares that ONE entry: the background strength, the wallpaper
 * anchor, and the two whole-app font roles. A writer that replaced the rule would silently drop the
 * others, so this merges — and it keeps exactly one `:root` entry in the document (`css.find` is how
 * every reader finds them, and a second entry would shadow the first).
 * @param css - the document's CSS rules.
 * @param property - the custom property to write.
 * @param value - the value, or undefined to drop the declaration.
 * @returns a new rule list.
 */
export function withRootMarker(css: readonly CssRule[], property: string, value: string | undefined): CssRule[] {
  const rules = css ?? []
  const existing = rules.find((rule) => rule.selector === BG_OPACITY_SELECTOR)?.rule
  const rule = value === undefined
    ? withoutDeclaration(existing, property)
    : mergeDeclaration(existing, property + ': ' + value + ';')
  const rest = rules.filter((entry) => entry.selector !== BG_OPACITY_SELECTOR).map((entry) => ({ selector: entry.selector, rule: entry.rule }))
  return rule === '' ? rest : [...rest, { selector: BG_OPACITY_SELECTOR, rule }]
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

/**
 * One declaration pair exactly as stored (the value keeps its `!important`).
 *
 * Used by the canvas editor when it has to re-emit somebody else's declaration
 * unchanged instead of reformatting it (a hand-written `transform: rotate(3deg)`
 * must survive a preview that only owns the X/Y offsets).
 * @param rule - the declaration block, or undefined.
 * @param property - the property to read.
 * @returns `property: value`, or undefined when the block does not declare it.
 */
export function declarationOf(rule: string | undefined, property: string): string | undefined {
  const found = declarationPairs(rule ?? '').find(([prop]) => prop === property)
  return found === undefined ? undefined : found[0] + ': ' + found[1]
}

/** One control the document currently removes — a recycle-bin entry. */
export interface RemovedControl {
  /** The selector the removal is stored under. */
  selector: string
  /** The element's whole declaration block. */
  rule: string
}

/**
 * Whether a rule takes its element out of the layout.
 *
 * `display: none` is what 「移除控件（不占位）」 writes. The test is on the parsed
 * property/value pair rather than a regex over the block, so a hand-written rule that
 * merely mentions the words is not mistaken for a removal, and so `!important` (which
 * {@link declarationPairs} keeps inside the value) still counts.
 * @param rule - the declaration block, or undefined.
 * @returns true when the element is removed.
 */
export function isRemovedRule(rule: string | undefined): boolean {
  return declarationPairs(rule ?? '').some(([property, value]) =>
    property === 'display' && value.replace(/\s*!important\s*$/i, '').trim().toLowerCase() === 'none')
}

/**
 * Everything the skin currently removes — the recycle bin's contents.
 *
 * Removal is one CSS declaration, so the bin is DERIVED from the document instead of
 * being a second list that can drift out of sync with it (and it survives a reload for
 * free). The element is still in the DOM — `display: none` only stops it being
 * painted and hit-tested — which is what lets the UI resolve a readable label for an
 * entry that the canvas itself can no longer select.
 * @param css - the skin's rule list.
 * @returns one entry per removed selector, in document order.
 */
export function removedControls(css: readonly CssRule[]): RemovedControl[] {
  return css
    .filter((r) => r.selector !== '' && isRemovedRule(r.rule))
    .map((r) => ({ selector: r.selector, rule: r.rule }))
}

/**
 * Restore one removed control: drop its `display` declaration, and the rule itself
 * when that was the only thing customised on the element.
 * @param css - the skin's rule list.
 * @param selector - the entry to restore.
 * @returns a new rule list.
 */
export function withControlRestored(css: readonly CssRule[], selector: string): CssRule[] {
  return css.flatMap((r) => {
    if (r.selector !== selector) return [r]
    const rest = withoutDeclaration(r.rule, 'display')
    return rest === '' ? [] : [{ selector: r.selector, rule: rest }]
  })
}

/**
 * Restore every removed control at once (the bin's 「全部恢复」).
 * @param css - the skin's rule list.
 * @returns a new rule list.
 */
export function withAllControlsRestored(css: readonly CssRule[]): CssRule[] {
  return removedControls(css).reduce((list, entry) => withControlRestored(list, entry.selector), [...css])
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
  'box-shadow', 'opacity', 'transform', 'z-index',
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
 * Write an X/Y/scale edit into one element's rule.
 *
 * Only `transform` is touched: every other declaration the element carries — the
 * Inspector's managed ones included — stays exactly as it was. This is the fix for the
 * drag "twitch": the canvas gesture used to merge through
 * {@link withManagedDeclarations}, which DROPS every managed property and re-adds only
 * the transform, so a moved element lost — and the Inspector's preview restored — its
 * width, padding or font-size once per frame.
 *
 * The declaration is also written with the same `!important` the Inspector's own
 * preview uses: a rule that alternates between `transform: …` and
 * `transform: … !important` changes which stylesheet wins, which is what made the
 * element jump between the draft position and the committed one.
 * @param existing - the element's current declaration block.
 * @param x - horizontal offset in px.
 * @param y - vertical offset in px.
 * @param scale - uniform scale (1 = untouched).
 * @returns the new declaration block (`''` when the rule is now empty).
 */
export function transformEdit(existing: string | undefined, x: number, y: number, scale: number): string {
  const value = transformValue(x, y, scale)
  return value === ''
    ? withoutDeclaration(existing, 'transform')
    : mergeDeclaration(existing, 'transform: ' + value + ' !important')
}

/**
 * The `transform` declaration the Inspector should preview (and therefore write).
 *
 * The panel's X/Y/scale fields are a MIRROR of the element's rule whenever a canvas grip is
 * the writer, and a mirror is one render behind by construction. Echoing it back is what made
 * a dragged element alternate between the coordinates the user had just reached and the ones
 * before them — the "twitch". So the fields are the source only while the panel authored them
 * (`authored`); otherwise the rule's own declaration is re-emitted verbatim, which also stops
 * the preview — it replaces every managed property — from silently DROPPING a move that is
 * already in the rule.
 * @param rule - the element's current declaration block.
 * @param fields - the numbers the panel currently shows.
 * @param authored - true when the user just edited one of those fields.
 * @returns the declaration to include (`''` = no transform of ours).
 */
export function transformPreview(
  rule: string | undefined,
  fields: { x: number; y: number; scale: number },
  authored: boolean,
): string {
  if (!authored) return declarationOf(rule, 'transform') ?? ''
  const value = transformValue(fields.x, fields.y, fields.scale)
  return value === '' ? '' : 'transform: ' + value + ' !important'
}

/**
 * The `display` an element has once no skin stylesheet removes it.
 *
 * Restoring a control from the recycle bin has to be visible IMMEDIATELY, but the
 * committed document is a second stylesheet carrying the same selector: until the next
 * 保存 it still declares `display: none !important`, so simply dropping the declaration
 * from the draft changes nothing on screen. Winning that fight needs a concrete value,
 * and the only value that is right for every element is the application's own answer —
 * so both skin stylesheets are taken out of the document for the two synchronous statements
 * it takes to read it (nothing can paint in between) and put back exactly where they were.
 * Detaching rather than `sheet.disabled = true`: the IDL flag is not implemented everywhere
 * (jsdom, for one), and a sheet that stays in the document keeps winning regardless of it.
 * @param el - the element that has to become visible again.
 * @returns the natural display value, or undefined when it cannot be read.
 */
export function naturalDisplayOf(el: Element): string | undefined {
  const doc = el.ownerDocument
  const head = doc.head
  if (head === null) return undefined
  const sheets = [doc.getElementById(STYLE_ID), doc.getElementById(DRAFT_STYLE_ID)]
    .filter((node): node is HTMLStyleElement => node !== null && node.tagName === 'STYLE')
  const placed = sheets.map((sheet) => ({ sheet, next: sheet.nextSibling }))
  try {
    for (const sheet of sheets) sheet.remove()
    const value = doc.defaultView?.getComputedStyle(el).display ?? ''
    const display = value.trim()
    return display === '' || display === 'none' ? undefined : display
  } catch {
    return undefined
  } finally {
    // Same position, same order: the editor's draft tag has to stay the LAST stylesheet.
    // Falling back to append keeps a sheet that lost its anchor in the document (the
    // editor's observer re-appends the draft behind it anyway).
    for (const { sheet, next } of placed) {
      if (sheet.parentNode !== null) continue
      if (next !== null && next.parentNode === head) head.insertBefore(sheet, next)
      else head.appendChild(sheet)
    }
  }
}

/**
 * Keep one stylesheet LAST inside `<head>`.
 *
 * The canvas editor previews the DRAFT through its own `<style id="dsh-myskin-live">`,
 * while the committed document is what {@link applySkin} writes. DSH re-applies the
 * skin on every accepted settings change and `applySkin` appends a NEW tag each time,
 * so after the first 保存 the committed (old) rule sits AFTER the draft's one.
 * Identical selectors are resolved by document order: the element snapped back to the
 * committed coordinates on every drag frame — the "new coordinates / old coordinates"
 * flicker.
 *
 * The draft layer has to win while the editor is open (its tag is removed on unmount,
 * and the committed skin takes over again), so it is re-appended whenever anything
 * lands behind it.
 * @param tag - the editor's stylesheet, or null when it is not mounted.
 */
export function keepStylesheetLast(tag: Element | null): void {
  if (tag === null || typeof document === 'undefined') return
  const head = tag.parentNode
  if (head === null || head !== document.head) return
  if (head.lastElementChild !== tag) head.appendChild(tag)
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

/**
 * Resolve one selector to the single element a skin should attach to.
 *
 * Several matches are normal (the workspace tree and the session list are both
 * `[role="tree"]`; a collapsing sidebar keeps two copies mounted for a frame). A VISIBLE
 * match wins — browsers can answer that, jsdom cannot and falls back to the first, which
 * keeps this testable — and the first match always beats giving up.
 * @param selector - the selector to resolve.
 * @returns the element, or undefined when nothing matches.
 */
function pickOne(selector: string): Element | undefined {
  if (typeof document === 'undefined' || selector === '') return undefined
  let elements: Element[]
  try { elements = Array.from(document.querySelectorAll(selector)) } catch { return undefined }
  if (elements.length === 0) return undefined
  if (elements.length === 1) return elements[0]
  return elements.find((el) => el.getClientRects().length > 0) ?? elements[0]
}

/**
 * The innermost element of a candidate set: the one that actually owns the text.
 * @param candidates - elements in document order.
 * @returns the deepest candidate, or undefined for an empty set.
 */
function innermost(candidates: readonly Element[]): Element | undefined {
  return candidates.find((el) => !candidates.some((other) => other !== el && el.contains(other))) ?? candidates[0]
}

/**
 * Find the element whose own text (or field placeholder) is `wanted`.
 *
 * Exact matches win over "contains", and the innermost match wins over its ancestors: the
 * user anchors to the line they can read, not to the wrapper around it.
 * @param doc - the document to search.
 * @param wanted - the trimmed copy to look for.
 * @returns the element, or undefined when the copy is not on the page right now.
 */
function findByText(doc: Document, wanted: string): Element | undefined {
  if (wanted === '') return undefined
  const exact: Element[] = []
  const loose: Element[] = []
  for (const el of Array.from(doc.body?.querySelectorAll('*') ?? [])) {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const placeholder = (el as HTMLInputElement).placeholder.trim()
      if (placeholder === wanted) exact.push(el)
      else if (placeholder.includes(wanted)) loose.push(el)
      continue
    }
    const node = directTextNode(el)
    if (node === undefined) continue
    const data = node.data.trim()
    if (data === '') continue
    if (data === wanted) exact.push(el)
    else if (data.includes(wanted)) loose.push(el)
  }
  return innermost(exact) ?? innermost(loose)
}

/**
 * The copy one element carries — what a text anchor freezes.
 *
 * Resolved through {@link textHostOf} so the result is the same string the Inspector shows in
 * "编辑文字": the anchor follows the text the user sees, not the wrapper they happened to
 * click.
 * @param el - the element to read.
 * @returns the trimmed copy, or undefined when there is none to anchor to.
 */
export function anchorTextOf(el: Element): string | undefined {
  const host = textHostOf(el)
  if (host === undefined) return undefined
  if (host.tagName === 'INPUT' || host.tagName === 'TEXTAREA') {
    const placeholder = (host as HTMLInputElement).placeholder.trim()
    return placeholder === '' ? undefined : placeholder
  }
  const node = directTextNode(host)
  const text = node?.data.trim() ?? ''
  return text === '' ? undefined : text
}

/**
 * Resolve the element one embedded image is anchored to.
 *
 * The anchor decides first (selector / copy / catalog landmark); the image's frozen
 * structural selector is the identity of last resort, so a text anchor whose copy was edited
 * away still paints where it used to instead of vanishing. `undefined` means "nothing to
 * paint into right now" — the re-tag loop keeps the image alive and retries on the next DOM
 * change, which is what makes an image survive a page that mounts its target late.
 * @param img - the embedded image.
 * @param doc - the document to resolve in.
 * @returns the target element, or undefined.
 */
export function resolveImageAnchor(img: EmbeddedImage, doc: Document): Element | undefined {
  const anchor = anchorOf(img)
  const fallback = img.fallbackSelector ?? ''
  if (anchor.kind === 'group') return pickOne(anchor.value) ?? pickOne(fallback)
  if (anchor.kind === 'text') {
    return findByText(doc, anchor.value.trim()) ?? pickOne(fallback)
  }
  if (anchor.kind === 'component') {
    const component = componentById(anchor.value)
    if (component === undefined) return pickOne(fallback)
    return pickOne(component.selector) ?? pickOne(fallback)
  }
  return pickOne(anchor.value) ?? pickOne(fallback)
}

/**
 * Every element one embedded image is anchored to.
 *
 * Almost every anchor resolves to ONE element; a 整组 anchor (`kind: 'group'`) resolves to the
 * whole block, which is what lets one embedded image appear on every workspace row — and, because
 * the block is a selector rather than a list of nodes, on the ones created later too.
 * @param img - the embedded image.
 * @param doc - the document to resolve in.
 * @returns the targets (empty when nothing can be found right now).
 */
export function resolveImageTargets(img: EmbeddedImage, doc: Document): Element[] {
  const anchor = anchorOf(img)
  if (anchor.kind === 'group') {
    const matches = allOf(doc, anchor.value)
    if (matches.length > 0) return matches
    const fallback = img.fallbackSelector ?? ''
    return fallback === '' ? [] : allOf(doc, fallback).slice(0, 1)
  }
  const one = resolveImageAnchor(img, doc)
  return one === undefined ? [] : [one]
}

/**
 * All matches of a selector, never throwing on a malformed one.
 * @param doc - the document.
 * @param selector - the selector.
 * @returns the matching elements, in document order.
 */
function allOf(doc: Document, selector: string): Element[] {
  if (selector === '') return []
  try { return Array.from(doc.querySelectorAll(selector)) } catch { return [] }
}

/**
 * Whether an image can be attached at all: at least one way to find its element. Legacy
 * documents carry only `fallbackSelector`; an anchored image may carry a catalog id or a
 * piece of copy instead.
 * @param img - the embedded image.
 * @returns true when the image is worth resolving.
 */
function hasIdentity(img: EmbeddedImage): boolean {
  const anchor = anchorOf(img)
  return anchor.value !== '' || (img.fallbackSelector ?? '') !== ''
}

/** Marker on the skin-owned layer that carries 组件锚定 images. */
export const OVERLAY_ATTR = 'data-dsh-myskin-overlay'
/** Marker on one 组件锚定 image node (its value is the image id). */
export const ANCHOR_IMAGE_ATTR = 'data-dsh-myskin-anchor-image'
/**
 * Stacking of the 组件锚定 layer: above the app's own surfaces, below its dialogs and menus
 * (and far below the canvas editor's chrome). The layer ignores pointer events entirely, so
 * a decoration can overlap a control without ever stealing a click.
 */
const OVERLAY_Z_INDEX = 900

/** The 组件锚定 layer: what `mountImageOverlay` hands back. */
export interface ImageOverlay {
  /** Re-read every anchor's box and move the nodes (coalesced; safe to call per render). */
  sync: () => void
  /** Remove the layer, its nodes and every listener. */
  dispose: () => void
}

/**
 * Mount the layer that paints 组件锚定 (image anchored to a component, displayed OUTSIDE it).
 *
 * Why a tracked overlay instead of the `::after` 组件嵌入 uses: an `::after` lives inside the
 * component's box, so it is clipped by whatever `overflow` the app put on the way down, and
 * letting it escape would mean rewriting the host element's `overflow`/`position` — a real
 * change to the app's own layout. A skin-owned, pointer-transparent layer positioned from the
 * anchor's rectangle is never clipped, needs no host styling at all, and can sit anywhere
 * (including outside and over the component).
 *
 * The rectangle is re-read on scroll (capture: any scroller), on resize and on DOM mutations,
 * coalesced to ONE update per animation frame — the same budget the canvas editor works in.
 * @param getImages - supplies the images to paint (re-read on every sync, so a caller may hand
 *   in a live view of its own state instead of re-mounting).
 * @param doc - the document to paint into.
 * @returns the layer handle.
 */
/**
 * @param getImages - the images to paint (re-read on every sync).
 * @param doc - the document to mount into.
 * @param getFeather - an image's edge treatment (defaults to none: the overlay also serves callers
 *   that have no skin document at hand, e.g. tests).
 * @returns the overlay handle.
 */
export function mountImageOverlay(
  getImages: () => readonly EmbeddedImage[],
  doc: Document = document,
  getFeather: (id: string) => ImageFeather = () => ({ width: 0, soft: 0 }),
  /** Whether an image may paint on the settings page that is open now (default: yes). */
  getAllowed: (img: EmbeddedImage, pageKey: string) => boolean = () => true,
): ImageOverlay {
  const view = doc.defaultView
  const host = doc.createElement('div')
  host.setAttribute(OVERLAY_ATTR, '1')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = 'position: fixed; inset: 0; overflow: visible; pointer-events: none; z-index: ' + String(OVERLAY_Z_INDEX) + ';'
  doc.body.appendChild(host)
  /** One node per painted element, keyed `<image id>#<index>` (a 整组 image paints several). */
  const nodes = new Map<string, HTMLElement>()
  /**
   * One image node, created on demand and kept across syncs.
   * @param img - the image to paint.
   * @param index - which member of the block this node belongs to.
   * @returns the node.
   */
  const nodeFor = (img: EmbeddedImage, index: number): HTMLElement => {
    const key = img.id + '#' + String(index)
    const known = nodes.get(key)
    if (known !== undefined) return known
    const node = doc.createElement('div')
    node.setAttribute(ANCHOR_IMAGE_ATTR, img.id)
    if (index > 0) node.setAttribute('data-dsh-myskin-anchor-index', String(index))
    node.setAttribute('data-dsh-myskin-owner', PLUGIN_ID)
    node.style.cssText = 'position: absolute; pointer-events: none; display: none; background-repeat: no-repeat; background-size: 100% 100%; background-position: center;'
    host.appendChild(node)
    nodes.set(key, node)
    return node
  }
  /**
   * Write one style property only when it actually changes.
   *
   * Two reasons: a per-frame sync during a scroll would otherwise touch the DOM (and the
   * mutation observer) for values that did not move, and writing the same value is what makes
   * a self-feeding loop possible.
   */
  const setStyle = (node: HTMLElement, property: string, value: string): void => {
    if (node.style.getPropertyValue(property) !== value) node.style.setProperty(property, value)
  }
  const sync = (): void => {
    const images = getImages()
    const live = new Set<string>()
    const pageKey = currentSettingsPageKey(doc)
    for (const img of images) {
      // Page scoping is OPT-IN (`--dsh-myskin-page-scope`): by default an image lives wherever its
      // anchor resolves. Stripping by default is what made embedded pictures vanish without a word.
      const scoped = !getAllowed(img, pageKey)
      const targets = scoped || img.url === '' ? [] : resolveImageTargets(img, doc)
      // A 整组 image paints the same picture on EVERY block member, so it owns one node per
      // target — and a hidden placeholder while the block is momentarily empty.
      const slots = Math.max(targets.length, 1)
      for (let index = 0; index < slots; index += 1) {
        const key = img.id + '#' + String(index)
        live.add(key)
        const node = nodeFor(img, index)
        const target = targets[index]
        if (target === undefined) { setStyle(node, 'display', 'none'); continue }
        const rect = target.getBoundingClientRect()
        const feather = getFeather(img.id)
        const spread = feather.width
        const style = featherStyle(feather)
        setStyle(node, 'display', 'block')
        // The node is the picture GROWN by the feather width, so the falloff happens outside the
        // user's box (and the picture keeps its own proportions: the node scales with it).
        setStyle(node, 'left', rect.left + (img.x || 0) - spread + 'px')
        setStyle(node, 'top', rect.top + (img.y || 0) - spread + 'px')
        setStyle(node, 'width', Math.max(1, img.w + spread * 2) + 'px')
        setStyle(node, 'height', Math.max(1, img.h + spread * 2) + 'px')
        setStyle(node, 'opacity', String(img.opacity ?? 1))
        setStyle(node, 'mix-blend-mode', img.blend ?? 'normal')
        setStyle(node, 'background-image', 'url("' + img.url + '")')
        // Always written (empty = removed), so switching the feather off cleans up after itself.
        for (const property of ['mask-image', 'mask-composite', '-webkit-mask-composite', 'mask-repeat', 'filter']) {
          setStyle(node, property, style[property] ?? '')
        }
      }
    }
    // Nodes whose member (or image) is gone are ours to remove.
    for (const [key, node] of nodes) {
      if (!live.has(key)) { node.remove(); nodes.delete(key) }
    }
  }
  let frame = 0
  const raf = (fn: () => void): number => view !== null && typeof view.requestAnimationFrame === 'function'
    ? view.requestAnimationFrame(fn)
    : (setTimeout(fn, 16) as unknown as number)
  const cancelRaf = (id: number): void => {
    if (view !== null && typeof view.cancelAnimationFrame === 'function') view.cancelAnimationFrame(id)
    else clearTimeout(id as unknown as ReturnType<typeof setTimeout>)
  }
  const schedule = (): void => {
    if (frame !== 0) return
    frame = raf(() => { frame = 0; sync() })
  }
  const onScroll = (): void => { schedule() }
  view?.addEventListener('scroll', onScroll, true)
  view?.addEventListener('resize', onScroll)
  const observer = typeof MutationObserver === 'undefined' ? undefined : new MutationObserver((records) => {
    // Our own nodes write styles on every sync; observing those would be a self-feeding loop.
    for (const record of records) {
      const target = record.target
      if (target instanceof Element && target.closest('[' + OVERLAY_ATTR + ']') !== null) continue
      schedule()
      return
    }
  })
  observer?.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'style', 'aria-current'] })
  sync()
  return {
    sync,
    dispose: (): void => {
      if (frame !== 0) { cancelRaf(frame); frame = 0 }
      view?.removeEventListener('scroll', onScroll, true)
      view?.removeEventListener('resize', onScroll)
      observer?.disconnect()
      host.remove()
      nodes.clear()
    },
  }
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
 * `anchor: 'conversation'` adds one more rule: the conversation column paints the same wallpaper
 * anchored to its own box (`background-attachment: scroll`, NOT `fixed`), which is what keeps it
 * centered in the conversation area while the sidebar folds and unfolds. The page keeps its own
 * copy for everything outside the column, so the two are separate crops — that is the price of
 * "centered on the conversation", and it is why this is an option rather than the default.
 * @param doc - the document being styled.
 * @param url - the wallpaper data URL.
 * @param tint - optional surface tint layered under the image.
 * @param anchor - where the wallpaper is anchored (default `viewport`).
 * @returns the CSS rules to write.
 */
export function wallpaperRules(doc: Document, url: string, tint?: SurfaceTint, anchor: BackgroundAnchor = 'viewport'): string[] {
  const geometry = 'background-size: cover !important; background-position: center !important; background-attachment: fixed !important;'
  const body = 'background-image: url("' + url + '") !important; ' + geometry
  const rules = ['body { ' + body + ' }']
  const fmt = (value: number): string => String(Math.round(value * 100) / 100)
  const layers = tint === undefined
    ? 'url("' + url + '")'
    : 'linear-gradient(rgba(' + tint.rgb + ', ' + fmt(tint.base) + '), rgba(' + tint.rgb + ', ' + fmt(tint.base) + ')), url("' + url + '")'
  const shell = readDesktopShell(doc)
  // The conversation-anchored copy, when asked for: `scroll` keeps the image inside the column's
  // own box, so the column simply having a new box re-centers it (no resize listener, no script).
  const conversation = anchor === 'conversation'
    ? CENTER_COLUMN_SELECTOR + ' { background-image: ' + layers + ' !important; background-size: cover !important; background-position: center !important; background-attachment: scroll !important; }'
    : undefined
  if (shell.windowsTitlebar) {
    // The column paints the image AND gives up its own colour in one rule, so neither
    // the token layer (below) nor a stale `background` shorthand can stack a second
    // surface under the wallpaper. `overflow: hidden` + `border-radius` already clip
    // it to the rounded corner.
    rules.push(CENTER_COLUMN_SELECTOR + ' { background-image: ' + layers + ' !important; ' + geometry + ' background-color: transparent !important; }')
    if (conversation !== undefined) rules.push(conversation)
    return rules
  }
  if (!shell.desktop) {
    if (conversation !== undefined) rules.push(conversation)
    return rules
  }
  // macOS: the frame is the surface the vibrancy sidebar reads, so the wallpaper and
  // its single tint stay there, and the column keeps showing it instead of painting
  // its own copy (two copies double the dimming and the slider barely moves anything).
  rules.push(FRAME_SELECTOR + ' { background-image: ' + layers + ' !important; ' + geometry + ' }')
  if (tint !== undefined) rules.push(CENTER_COLUMN_SELECTOR + ' { background-color: transparent !important; }')
  if (conversation !== undefined) rules.push(conversation)
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
 *
 * WHICH LAYER it lands on depends on the blend mode, and that is not a detail:
 *
 *   - **`normal` → below the content** (`z-index: -1`). The workspace rows, labels and buttons stay
 *     on top, which is what the picture is for. A negative z-index only stays inside the container
 *     when the container is a stacking context of its own, so the host rule pairs it with
 *     `isolation: isolate` — otherwise the layer slips behind the container's own background and
 *     the image disappears.
 *   - **any real blend mode → above the content** (`z-index: 1`, no isolation). `mix-blend-mode`
 *     blends with its BACKDROP, and `isolation: isolate` cuts that backdrop down to the container's
 *     own background — so under isolation `multiply`/`screen`/`overlay` all blend against nothing
 *     and look identical (reported: "the four modes feel the same"). Blending needs the page
 *     behind it, and a layer that blends with the page is by definition painted over the content.
 *
 * The two cannot both hold for one element; the blend mode is what decides which one the user is
 * asking for, and the panel says so next to the field.
 * @param img - the embedded image.
 * @param above - whether this image paints above the container's content (see the rule above).
 * @returns the `::after` declaration block (selector omitted, so it can be appended to
 *   both the transient attribute selector and the structural fallback).
 */
/**
 * Mask (and blur) declarations for a feathered picture.
 *
 * The falloff is expressed in PX of the element being masked, and the element is the picture GROWN by
 * the feather width on every side — so `S px` in from each border is exactly the picture's original
 * edge. That is the whole point of the feature: a falloff that stops at the hard edge still shows the
 * hard edge.
 *
 * Returned as a map, not a string, because two renderers consume it: the stylesheet (below) and the
 * anchored layer's inline styles (`mountImageOverlay`), and they must not drift.
 * @param feather - the edge treatment.
 * @returns CSS property -> value (empty when there is no feather).
 */
export function featherStyle(feather: ImageFeather): Record<string, string> {
  if (feather.width <= 0) return {}
  const out: Record<string, string> = {}
  // The ramp runs from the masked element's own border (the halo) to full opacity, which with
  // FEATHER_BLEED lands exactly `width` px INSIDE the picture's box.
  const bleed = Math.round(feather.width * FEATHER_BLEED)
  const ramp = Math.round(feather.width) + bleed
  /**
   * Alpha at `t` (0 = element border, 1 = full opacity).
   *
   * `soft` blends a linear ramp into a smoothstep: same width, but the transition starts and ends
   * more gently and spends its middle further from both ends — which is what reads as "softer"
   * without blurring a single pixel of the artwork.
   */
  const alpha = (t: number): string => {
    const eased = (1 - feather.soft) * t + feather.soft * (t * t * (3 - 2 * t))
    return String(Math.round(eased * 100) / 100)
  }
  const rise: string[] = []
  for (let step = 1; step <= FEATHER_SAMPLES; step += 1) {
    const t = step / FEATHER_SAMPLES
    const at = Math.round(t * ramp)
    rise.push('rgba(0, 0, 0, ' + alpha(t) + ') ' + (step === FEATHER_SAMPLES ? ramp + 'px' : at + 'px'))
  }
  const fall = [...rise].reverse().map((stop) => {
    const [colour, position] = stop.split(') ')
    const px = position.replace('px', '')
    return colour + ') calc(100% - ' + px + 'px)'
  })
  const axis = (direction: 'right' | 'bottom'): string => 'linear-gradient(to ' + direction + ', rgba(0, 0, 0, 0) 0px, '
    + rise.join(', ') + ', #000 calc(100% - ' + ramp + 'px), ' + fall.join(', ') + ', rgba(0, 0, 0, 0) 100%)'
  // Two axes intersected: the standard `mask-composite`, plus the older Chromium spelling.
  out['mask-image'] = axis('right') + ', ' + axis('bottom')
  out['mask-composite'] = 'intersect'
  out['-webkit-mask-composite'] = 'source-in'
  out['mask-repeat'] = 'no-repeat'
  return out
}

/**
 * The `::after` rule that paints one embedded image.
 *
 * Exported because the editor's live preview must produce the SAME declaration block the engine
 * writes: a second copy of this string in the editor is how the preview twice told a different story
 * than saving did.
 * @param img - the embedded image.
 * @param above - whether it paints above the container's content.
 * @param feather - its edge treatment.
 * @returns the declaration block (selector omitted).
 */
export function embedAfterRule(img: EmbeddedImage, above: boolean, feather: ImageFeather): string {
  const blend = img.blend !== undefined && img.blend !== 'normal' ? ' mix-blend-mode: ' + img.blend + ';' : ''
  const layer = above ? 'z-index: 1;' : 'z-index: -1;'
  // The halo: the pseudo-element grows by this much on every side, and the picture is enlarged by
  // the same amount around the SAME centre. Its background offset therefore stays exactly the user's
  // x/y — the pseudo already moved, and shifting the background again (as this did) displaced every
  // feathered picture towards the top-left and left the falloff on the wrong edges.
  const bleed = feather.width > 0 ? Math.round(feather.width * FEATHER_BLEED) : 0
  const inset = bleed > 0 ? -bleed + 'px' : '0'
  const extra = Object.entries(featherStyle(feather)).map(([property, value]) => ' ' + property + ': ' + value + ';').join('')
  return '::after { content: \'\'; position: absolute; inset: ' + inset + '; background-image: url("' + img.url + '"); background-repeat: no-repeat; background-position: '
    + img.x + 'px ' + img.y + 'px; background-size: ' + (img.w + bleed * 2) + 'px ' + (img.h + bleed * 2) + 'px; opacity: '
    + (img.opacity ?? 1) + '; pointer-events: none; ' + layer + blend + extra + ' }'
}

/**
 * Read one declaration out of a rule text.
 *
 * Deliberately tiny: it only ever looks at what this plugin writes (a single property, possibly with
 * `!important`), so it does not try to be a CSS parser — but it does strip the `!important`, because
 * callers compare values, not priorities.
 * @param rule - the declaration block text.
 * @param property - the property to find.
 * @returns the value without `!important`, or undefined.
 */
export function declarationValue(rule: string, property: string): string | undefined {
  const escaped = property.replace(/[-[\]{}()*+?.\\^$|]/g, '\\$&')
  const match = rule.match(new RegExp('(?:^|;)\\s*' + escaped + '\\s*:\\s*([^;]+)'))
  if (match === null) return undefined
  return match[1].replace(/!important/i, '').trim()
}

/** Layer choice of one embedded image. */
export type ImageLayer = 'auto' | 'below' | 'above'

/**
 * Marker property that carries an image's layer choice, written on the image's OWN selector.
 *
 * `[data-dsh-myskin-embed="<id>"]` is the marker the editor stamps, so one declaration there is
 * readable from `css` alone — no document field, no Host restart (the same trick the background
 * strength, the wallpaper anchor and the markdown scope use).
 */
export const IMAGE_LAYER_PROPERTY = '--dsh-myskin-layer'

/**
 * Effective layer of one embedded image.
 *
 * `auto` is what the blend mode decides (see {@link embedAfter}); `above`/`below` are the user
 * overriding that. The override exists because "below the content" is right for a container whose
 * children are transparent (a sidebar list) and WRONG for one whose children are opaque cards —
 * there the picture is painted between the container's background and its content, i.e. hidden
 * (reported: an image embedded in a settings page could not be seen at all).
 * @param skin - the skin document.
 * @param id - the image id.
 * @returns the layer.
 */
export function readImageLayer(skin: SkinSettings, id: string): ImageLayer {
  const marker = (skin.css ?? []).find((rule) => rule.selector === '[data-dsh-myskin-embed="' + id + '"]')
  const value = marker === undefined ? undefined : declarationValue(marker.rule, IMAGE_LAYER_PROPERTY)
  return value === 'above' || value === 'below' ? value : 'auto'
}

/**
 * Write (or clear) one image's layer override.
 * @param css - the document's CSS rules.
 * @param id - the image id.
 * @param layer - the layer, `auto` to drop the override.
 * @returns a new rule list.
 */
export function withImageLayer(css: readonly CssRule[], id: string, layer: ImageLayer): CssRule[] {
  return withImageMarker(css, id, IMAGE_LAYER_PROPERTY, layer === 'auto' ? undefined : layer)
}

/** Property carrying an image's edge-feather width (px; absent = no feathering). */
export const IMAGE_FEATHER_PROPERTY = '--dsh-myskin-feather'
/**
 * Property overriding an image's settings-page scope: `any` = show it on every settings page.
 *
 * The DEFAULT is the opposite: an image embedded while a settings page was open belongs to that page
 * and is stripped everywhere else — otherwise it leaks onto unrelated settings pages (reported). The
 * marker only exists to opt OUT of that. An image with no recorded page (embedded outside the
 * settings dialog) is never scoped.
 */
export const IMAGE_PAGE_SCOPE_PROPERTY = '--dsh-myskin-page-scope'

/**
 * Whether an image is limited to the settings page it was embedded on (the default when it has one).
 * @param skin - the skin document.
 * @param id - the image id.
 * @returns true unless the image opted out with `any`.
 */
export function readImagePageScope(skin: SkinSettings, id: string): boolean {
  return imageMarker(skin.css, id, IMAGE_PAGE_SCOPE_PROPERTY) !== 'any'
}

/**
 * Whether an image may be painted on the settings page that is open now.
 * @param skin - the skin document.
 * @param img - the image record.
 * @param currentKey - the key of the page that is open ('' when no settings page is).
 * @returns true when the image belongs here.
 */
export function imagePageMatches(skin: SkinSettings, img: EmbeddedImage, currentKey: string): boolean {
  if (imageMarker(skin.css, img.id, IMAGE_PAGE_SCOPE_PROPERTY) === 'any') return true
  const recorded = img.pageKey ?? ''
  if (recorded === '') return true
  return sameSettingsPage(recorded, currentKey)
}

/** Property carrying the smoothness of an image's edge falloff (0..100). */
export const IMAGE_FEATHER_SOFT_PROPERTY = '--dsh-myskin-feather-soft'
/**
 * How far the picture grows OUTSIDE its box, as a fraction of the fade width.
 *
 * Deliberately small: the fade has to reach full opacity INSIDE the picture, because a picture's own
 * hard edge is its outermost pixels. With the halo at a quarter of the fade, that edge sits at ~15%
 * opacity (a smoothstep) instead of being drawn at full strength — which is what "feathered" means.
 */
export const FEATHER_BLEED = 0.25
/** Samples used to build one side of the falloff ramp (more = smoother curve, longer CSS). */
const FEATHER_SAMPLES = 5

/** One image's edge treatment. */
export interface ImageFeather {
  /** Fade distance in px (0 = off): how far the edge dissolves, measured from the picture's box. */
  readonly width: number
  /** Falloff curve: 0 = linear, 1 = smoothstep (soft in the middle, gentle at both ends). */
  readonly soft: number
}

/**
 * Read (or write) one marker declaration on an image's own selector.
 *
 * Per-image settings ride the SAME marker rule: `[data-dsh-myskin-embed="<id>"]` is the selector the
 * engine already paints through, so a custom property there needs no document field — which matters,
 * because a new `canvas` field would need a Host restart before it survives a save.
 * @param css - the document's CSS rules.
 * @param id - the image id.
 * @param property - the custom property.
 * @param value - the value to write, or undefined to read the current one.
 * @returns for a read, the value; for a write, the new rule list.
 */
function imageMarker(css: readonly CssRule[], id: string, property: string): string | undefined {
  const marker = (css ?? []).find((rule) => rule.selector === '[data-dsh-myskin-embed="' + id + '"]')
  return marker === undefined ? undefined : declarationValue(marker.rule, property)
}

/**
 * Write (or clear) one per-image marker declaration.
 * @param css - the document's CSS rules.
 * @param id - the image id.
 * @param property - the custom property.
 * @param value - the value, or undefined to drop the declaration.
 * @returns a new rule list.
 */
export function withImageMarker(css: readonly CssRule[], id: string, property: string, value: string | undefined): CssRule[] {
  const selector = '[data-dsh-myskin-embed="' + id + '"]'
  const rules = css ?? []
  const existing = rules.find((rule) => rule.selector === selector)?.rule
  const rule = value === undefined || value === ''
    ? withoutDeclaration(existing, property)
    : mergeDeclaration(existing, property + ': ' + value + ';')
  const rest = rules.filter((entry) => entry.selector !== selector).map((entry) => ({ selector: entry.selector, rule: entry.rule }))
  return rule === '' ? rest : [...rest, { selector, rule }]
}

/**
 * Effective edge treatment of one embedded image.
 *
 * Feathered edges are what make a sticker with hard borders sit on a wallpaper instead of looking
 * pasted on. The width is deliberately allowed to reach BEYOND the picture's box (the pseudo-element
 * grows by it and the background is re-laid around the same centre), because a falloff that stops at
 * the hard edge still leaves that edge visible.
 * @param skin - the skin document.
 * @param id - the image id.
 * @returns the feather settings (width 0 = off).
 */
export function readImageFeather(skin: SkinSettings, id: string): ImageFeather {
  const width = Number.parseFloat(imageMarker(skin.css, id, IMAGE_FEATHER_PROPERTY) ?? '')
  const soft = Number.parseFloat(imageMarker(skin.css, id, IMAGE_FEATHER_SOFT_PROPERTY) ?? '')
  return {
    width: Number.isFinite(width) && width > 0 ? Math.min(400, width) : 0,
    soft: Number.isFinite(soft) ? Math.min(1, Math.max(0, soft / 100)) : 0,
  }
}

/**
 * Write (or clear) one image's edge treatment.
 * @param css - the document's CSS rules.
 * @param id - the image id.
 * @param feather - the settings to store (width 0 clears the feather entirely).
 * @returns a new rule list.
 */
export function withImageFeather(css: readonly CssRule[], id: string, feather: ImageFeather): CssRule[] {
  let next = withImageMarker(css, id, IMAGE_FEATHER_PROPERTY, feather.width > 0 ? String(Math.round(feather.width)) + 'px' : undefined)
  next = withImageMarker(next, id, IMAGE_FEATHER_SOFT_PROPERTY, feather.width > 0 && feather.soft > 0 ? String(Math.round(feather.soft * 100)) : undefined)
  // Markers written by the previous version (a blur, a shape) are cleaned up on any write, so an
  // existing document does not keep settings nothing reads any more.
  next = withImageMarker(next, id, '--dsh-myskin-feather-blur', undefined)
  return withImageMarker(next, id, '--dsh-myskin-feather-shape', undefined)
}

/**
 * Whether an embedded image is painted above its container's content.
 *
 * True exactly when the image carries a real blend mode — see {@link embedAfter} for why the two
 * cannot both hold, and why the blend mode is the field that decides.
 * @param img - the embedded image.
 * @returns true when the image paints over the content (and can therefore blend with the page).
 */
export function embedPaintsAbove(img: EmbeddedImage, layer: ImageLayer = 'auto'): boolean {
  if (layer === 'above') return true
  if (layer === 'below') return false
  return img.blend !== undefined && img.blend !== 'normal'
}

/**
 * The host rule that puts an embedded image in the right layer.
 *
 * `isolation: isolate` (only for the below-content layer) turns the container into a stacking
 * context WITHOUT touching its z-index or its layout, which is what confines the `::after`'s
 * negative z-index to this container instead of letting it fall behind the container's own
 * background. It is deliberately NOT applied when the image blends: isolation would also cut the
 * blend's backdrop down to the container itself.
 * @param selector - the tagged attribute selector (or the structural fallback).
 * @param above - whether the image paints above the content.
 * @returns the declaration block.
 */
export function embedHostRule(selector: string, above: boolean): string {
  return above
    ? selector + ' { position: relative; }'
    : selector + ' { position: relative; isolation: isolate; }'
}

/**
 * The injected-layer mount: real nodes the skin adds, one per layer.
 *
 * Shared by the engine (committed skin) and the editor (draft), so a decoration looks the same while
 * it is being edited and after it is saved — the second copy of this logic is how the two would drift.
 */
export interface LayerMount {
  /** Inject what is missing, update what changed, and drop what is gone. */
  sync(): void
  /** Remove every node this mount created and stop watching. */
  dispose(): void
  /** The node one layer currently owns (the editor draws its selection box from this). */
  nodeFor(id: string): HTMLElement | undefined
}

/**
 * Write one layer's geometry and look onto its node.
 *
 * Runs on create AND on every sync, because the editor drags these nodes: re-creating them on each
 * pointer move would flicker (and lose the image's decoded state).
 * @param node - the node.
 * @param layer - the layer definition.
 */
/**
 * Parse a `property: value;` list (`InjectedLayer.css`).
 *
 * Exported because it replaces `style.cssText += …`, which is lossy: jsdom drops the appended
 * declaration outright, and a browser re-serialises the whole style — neither is acceptable for a field
 * the user typed by hand. Unknown properties are the caller's business (they are simply skipped).
 * @param text - the declaration text, or undefined.
 * @returns the pairs, in order.
 */
export function parseDeclarations(text: string | undefined): [string, string][] {
  if (text === undefined || text === '') return []
  const out: [string, string][] = []
  for (const chunk of text.split(';')) {
    const at = chunk.indexOf(':')
    if (at <= 0) continue
    const property = chunk.slice(0, at).trim()
    const value = chunk.slice(at + 1).trim()
    if (property === '' || value === '') continue
    out.push([property, value])
  }
  return out
}

/**
 * Write one layer's geometry and look onto its node.
 *
 * Runs on create AND on every sync, because the editor drags these nodes: re-creating them on each
 * pointer move would flicker (and lose the image's decoded state).
 * @param node - the node.
 * @param layer - the layer definition.
 * @param applied - the custom properties written last time, so removing them from `css` removes them.
 * @returns the pairs now applied.
 */
function applyLayerStyle(node: HTMLElement, layer: InjectedLayer, applied: readonly string[] = []): [string, string][] {
  const st = node.style
  // Decorations are placed in VIEWPORT coordinates by default: `fixed` needs no cooperation from the
  // container (no `position: relative` we would have to impose on someone else's element), and an
  // ornament that does not scroll away is what most decorations want.
  st.position = layer.attach === 'prepend' || layer.attach === 'append' ? 'fixed' : 'fixed'
  st.left = (layer.x ?? 0) + 'px'
  st.top = (layer.y ?? 0) + 'px'
  st.width = (layer.w ?? 48) + 'px'
  st.height = (layer.h ?? 48) + 'px'
  st.opacity = String(layer.opacity ?? 1)
  st.mixBlendMode = layer.blend !== undefined && layer.blend !== 'normal' ? layer.blend : 'normal'
  st.pointerEvents = 'none'
  if (layer.kind === 'img') {
    const img = node as HTMLImageElement
    img.alt = ''
    if (img.src !== (layer.url ?? '')) img.src = layer.url ?? ''
    st.objectFit = 'contain'
    st.backgroundImage = ''
  } else {
    st.backgroundImage = layer.url !== undefined && layer.url !== '' ? 'url("' + layer.url + '")' : ''
    st.backgroundSize = 'contain'
    st.backgroundRepeat = 'no-repeat'
  }
  const pairs = parseDeclarations(layer.css)
  for (const [property, value] of pairs) st.setProperty(property, value)
  // A property that was in `css` and no longer is must go: otherwise editing a patch's radius would
  // leave the old one in place forever.
  for (const property of applied) {
    if (!pairs.some(([next]) => next === property)) st.removeProperty(property)
  }
  return pairs
}

/**
 * Mount a set of injected layers into a document.
 *
 * Reversibility is the point: every node is created by us, carries `data-dsh-myskin-layer`, is
 * `aria-hidden`, and is removed by {@link LayerMount.dispose} — the app's own nodes are never moved,
 * removed or wrapped, only appended to (or prepended into) a container the skin named.
 * @param getLayers - the layers to keep mounted (re-read on every sync).
 * @param doc - the document to mount into.
 * @param getPageKey - the settings-page key of the page that is open ('' when none).
 * @returns the mount handle.
 */
export function mountInjectedLayers(
  getLayers: () => readonly InjectedLayer[],
  doc: Document = document,
  getPageKey: () => string = () => '',
): LayerMount {
  const nodes = new Map<string, HTMLElement>()
  /** Custom properties written per node, so a removed one can be taken back. */
  const applied = new Map<HTMLElement, [string, string][]>()
  let frame = 0
  const sync = (): void => {
    const layers = getLayers()
    const pageKey = getPageKey()
    const live = new Set<string>()
    for (const layer of layers) {
      // Page scoping: a decoration made inside a settings page belongs to that page (same rule and
      // same label-based comparison as the embedded images).
      const recorded = layer.pageKey ?? ''
      if (recorded !== '' && !sameSettingsPage(recorded, pageKey)) continue
      const container = doc.querySelector(layer.selector)
      if (container === null) continue
      live.add(layer.id)
      const known = nodes.get(layer.id)
      if (known !== undefined && known.isConnected) {
        applied.set(known, applyLayerStyle(known, layer, (applied.get(known) ?? []).map(([property]) => property)))
        continue
      }
      if (known !== undefined) { known.remove(); nodes.delete(layer.id); applied.delete(known) }
      const node = doc.createElement(layer.kind)
      node.setAttribute('data-dsh-myskin-layer', layer.id)
      node.setAttribute('data-dsh-myskin-owner', PLUGIN_ID)
      node.setAttribute('aria-hidden', 'true')
      applied.set(node, applyLayerStyle(node, layer))
      if (layer.attach === 'prepend') container.prepend(node)
      else container.append(node)
      nodes.set(layer.id, node)
    }
    // Layers that were deleted (or scoped away) must take their nodes with them.
    for (const [id, node] of nodes) {
      if (!live.has(id)) { node.remove(); nodes.delete(id); applied.delete(node) }
    }
  }
  const schedule = (): void => {
    if (frame !== 0) return
    frame = raf(() => { frame = 0; sync() })
  }
  /** rAF where the document has one (a browser), a timeout otherwise (jsdom). */
  const raf = (fn: () => void): number => {
    const view = doc.defaultView
    return view !== null && typeof view.requestAnimationFrame === 'function' ? view.requestAnimationFrame(fn) : (setTimeout(fn, 16) as unknown as number)
  }
  const cancel = (id: number): void => {
    const view = doc.defaultView
    if (view !== null && typeof view.cancelAnimationFrame === 'function') view.cancelAnimationFrame(id)
    else clearTimeout(id as unknown as ReturnType<typeof setTimeout>)
  }
  sync()
  // React rebuilds containers and wipes our nodes; re-injecting is idempotent because `sync` checks
  // what it already owns (and removes only what it owns).
  const observer = typeof MutationObserver === 'undefined' ? undefined : new MutationObserver(() => { schedule() })
  observer?.observe(doc.body, { childList: true, subtree: true })
  return {
    sync,
    nodeFor: (id) => nodes.get(id),
    dispose: () => {
      observer?.disconnect()
      if (frame !== 0) { cancel(frame); frame = 0 }
      for (const node of nodes.values()) node.remove()
      nodes.clear()
      applied.clear()
    },
  }
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
  // 「组件嵌入」: painted INSIDE the anchored component — a ::after on the element the anchor
  // resolves to, above its background and below its content, clipped by the container.
  const embedTargets = skin.canvas.images.filter((img) =>
    imageModeOf(img) === 'embed' && img.selector !== '' && img.url !== '' && hasIdentity(img),
  )
  // 「组件锚定」: painted OUTSIDE it, on the skin's own tracked layer, so nothing about the
  // host element's position/overflow has to change (see {@link mountImageOverlay}).
  const anchoredImages = skin.canvas.images.filter((img) =>
    imageModeOf(img) === 'anchor' && img.url !== '' && hasIdentity(img),
  )
  for (const img of embedTargets) {
    const above = embedPaintsAbove(img, readImageLayer(skin, img.id))
    rules.push(embedHostRule(img.selector, above))
    rules.push(img.selector + embedAfterRule(img, above, readImageFeather(skin, img.id)))
    // The structural fallback is deliberately NOT painted directly, even when it matches
    // exactly one element right now: it is a positional path, so the moment React shifts a
    // sibling the same selector matches a look-alike and the image would be painted on the
    // wrong node. Identity is the engine's job (see the re-tag loop below), not the
    // stylesheet's.
  }
  // Cross-page recovery: the image's own selector is the `[data-dsh-myskin-embed=...]`
  // attribute the editor stamps on the element it resolved, which the freshly loaded page
  // does not carry yet. The engine re-resolves the image's ANCHOR (structural selector, a
  // piece of copy, or a catalog landmark) and re-stamps it. The attribute is transient —
  // React may rebuild the node (wiping it) or mount it after this apply runs — so a single
  // shared MutationObserver retries across re-renders and late mounts until dispose.
  if (embedTargets.length > 0 && typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') {
    /** Every element each image is currently tagged on (a 整组 image has one per block member). */
    const taggedElements = new Map<string, Element[]>()
    /** Its ancestor fingerprint, for when the element itself was re-created. */
    const taggedChains = new Map<string, string[]>()
    // The picker itself is module-level ({@link pickOne}) so the editor can resolve the very
    // same anchors for its live preview: "exactly one match" was the old rule, and it is why
    // an embedded image vanished after the sidebar collapsed and expanded again (for a frame
    // React keeps both the rail and the panel mounted).
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
      // While the canvas editor is open IT owns the embed tags: it previews the DRAFT, which
      // may have moved, re-anchored or deleted an image, and re-tagging from the committed
      // document here would silently undo that preview one DOM mutation later (the app
      // mutates constantly, so this is not a rare race). The editor re-tags the committed
      // images itself when it closes.
      if (document.querySelector('[data-dsh-myskin-canvas="1"]') !== null) return
      const curKey = currentSettingsPageKey(document)
      for (const img of embedTargets) {
        // Page scoping: opt-in, and the key is compared by label (see `sameSettingsPage`). On a
        // mismatch the stale tag is stripped so its rule matches nothing.
        // Scoped by default to the settings page it was embedded on; `--dsh-myskin-page-scope: any`
        // opts out. The key is compared by label, so a re-rendered nav cannot fake a mismatch.
        const scoped = !imagePageMatches(skin, img, curKey)
        if (scoped) {
          for (const stale of document.querySelectorAll('[data-dsh-myskin-embed="' + img.id + '"]')) stale.removeAttribute('data-dsh-myskin-embed')
          taggedElements.delete(img.id)
          taggedChains.delete(img.id)
          continue
        }
        const previous = taggedElements.get(img.id) ?? []
        // The anchor decides (element / copy / catalog landmark / the whole block); the image's
        // frozen structural selector and the last known node are the recovery tiers below.
        let targets = resolveImageTargets(img, document)
        // Our element survived (possibly only hidden while the sidebar was collapsed).
        if (targets.length === 0 && previous.length === 1 && previous[0].isConnected) targets = previous
        // It was re-created: a sidebar collapse/expand remounts the virtualized workspace
        // panel, which shifts sibling indices until the stored positional path matches
        // nothing. Re-find it by fingerprint instead — and only when that fingerprint is
        // unique, so the image can never land on a look-alike.
        if (targets.length === 0) {
          const chain = taggedChains.get(img.id)
          const recovered = chain === undefined ? undefined : findByChain(chain)
          if (recovered !== undefined) targets = [recovered]
        }
        // Take back what this image no longer owns: a row that left the block, or the anchor
        // having moved. Without it a 整组 image keeps painting on a stale row.
        for (const el of previous) if (!targets.includes(el)) el.removeAttribute('data-dsh-myskin-embed')
        if (targets.length === 0) continue
        for (const el of targets) {
          if (el.getAttribute('data-dsh-myskin-embed') !== img.id) el.setAttribute('data-dsh-myskin-embed', img.id)
        }
        taggedElements.set(img.id, targets)
        // One ancestor fingerprint identifies ONE node; a block needs none (its selector IS the
        // identity), so the chain is kept for the single-target case alone.
        if (targets.length === 1) taggedChains.set(img.id, chainOf(targets[0]))
        else taggedChains.delete(img.id)
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
    // aria-expanded / aria-selected are in the filter because a 整组 image follows the sidebar's
    // own kind markers: collapsing a workspace (aria-expanded toggles) changes block membership,
    // and the tag has to follow or the picture stays on a row that is no longer a member.
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-current', 'aria-expanded', 'aria-selected', 'class', 'hidden'] })
    cleanups.push(() => {
      mo.disconnect()
      // The tag is how the stylesheet finds the element, so it has to go with the skin: a
      // leftover `data-dsh-myskin-embed` keeps a disabled skin's anchor on the page and makes
      // the NEXT apply fight a stale id (the attribute is ours, and only ours).
      for (const img of embedTargets) {
        for (const node of taggedElements.get(img.id) ?? []) node.removeAttribute('data-dsh-myskin-embed')
        // Belt and braces: a node tagged before the last sync is still ours to take back.
        for (const node of document.querySelectorAll('[data-dsh-myskin-embed="' + img.id + '"]')) node.removeAttribute('data-dsh-myskin-embed')
      }
    })
  }

  // 组件锚定 images: one skin-owned, pointer-transparent layer tracked to their components.
  if (anchoredImages.length > 0 && typeof document !== 'undefined') {
    const overlay = mountImageOverlay(() => anchoredImages, document, (id) => readImageFeather(skin, id), (img, key) => imagePageMatches(skin, img, key))
    cleanups.push(overlay.dispose)
  }

  // DSH paints opaque surfaces over <body>, so the wallpaper goes on <body> AND (on a
  // desktop shell) on the frame; the base surfaces then become semi-transparent.
  // Everything stays INSIDE the skin-owned <style>, removed on dispose, so <body>'s
  // inline style is never touched and the skin stays byte-reversible.
  if (skin.canvas.background !== undefined && skin.canvas.background !== '' && typeof document !== 'undefined') {
    const opacity = readBackgroundOpacity(skin)
    // The anchor has to be passed HERE, not only in the editor's preview: in 交互模式 (and after a
    // reload) the committed document is the only thing that paints the page, which is exactly where
    // the sidebar fold is watched — a preview-only option would look like it does nothing.
    rules.push(...wallpaperRules(document, skin.canvas.background, surfaceTint(document, opacity, desktopFrameTint(document)), readBackgroundAnchor(skin)))
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
  // Only layers that can actually be mounted are handed over: a selector is required, and an `img`
  // needs a URL. Keeping the filter here (not inside the mount) means the editor can mount the very
  // same list without repeating the rule.
  const layerList = (skin.layers ?? []).filter((l) =>
    l.selector !== '' && (l.kind === 'div' || (l.url !== undefined && l.url !== '')))
  if (layerList.length > 0 && typeof document !== 'undefined') {
    // One implementation for the engine and the editor: the mount knows how to create, update and
    // remove its own nodes, and it is the only thing that ever touches the app's children.
    const mount = mountInjectedLayers(() => layerList, document, () => currentSettingsPageKey(document))
    cleanups.push(mount.dispose)
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