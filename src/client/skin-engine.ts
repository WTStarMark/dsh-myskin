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
import type { CssRule, InjectedLayer, SkinSettings, TextOverride, TokenModes } from '../skin-schema.ts'
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
 * as the plain `frame` in others, so match both: the frame is where the wallpaper and
 * its single tint live, and a miss would put the black notch back.
 */
const FRAME_SELECTOR = '[class*="_frame"], [class~="frame"]'
/** Selector for the conversation column (same naming caveat as {@link FRAME_SELECTOR}). */
const CENTER_COLUMN_SELECTOR = '[class*="_centerCol"], [class~="centerCol"]'

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
  const direct = (node: Element): Text | undefined => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE && (child as Text).data.trim() !== '') return child as Text
    }
    return undefined
  }
  if (direct(el) !== undefined) return el
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return el
  for (const child of Array.from(el.querySelectorAll('*'))) {
    if (direct(child) !== undefined) return child
  }
  return undefined
}

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
 * Rules for one wallpaper: the page background, plus the desktop frame.
 *
 * The desktop frame owns the window's rounded corner (Windows rounds the
 * conversation column's top-left with `--dsh-windows-content-radius`). Leaving the
 * frame transparent so the page image could show through therefore exposed the
 * native window colour (Electron's opaque chrome fallback, `#1b1b1c` in dark mode)
 * as a black notch in that corner. Painting the same image on the frame fills the
 * corner with the wallpaper and still lets the tinted canvas show through.
 * @param doc - the document being styled.
 * @param url - the wallpaper data URL.
 * @returns the CSS rules to write.
 */
export function wallpaperRules(doc: Document, url: string, tint?: SurfaceTint): string[] {
  const geometry = 'background-size: cover !important; background-position: center !important; background-attachment: fixed !important;'
  const body = 'background-image: url("' + url + '") !important; ' + geometry
  const rules = ['body { ' + body + ' }']
  if (!readDesktopShell(doc).desktop) return rules
  // One tint, applied ONCE, on the frame: the frame owns the window's rounded corner
  // (Windows rounds the conversation column's top-left), so it has to carry the image
  // itself — a transparent frame exposed the native window colour as a black notch.
  // The tint rides on the frame as a gradient layer ABOVE the image and the
  // conversation column stops painting its own copy: applying it on both would
  // double the dimming and the strength slider would barely move anything.
  const fmt = (value: number): string => String(Math.round(value * 100) / 100)
  const layers = tint === undefined
    ? 'url("' + url + '")'
    : 'linear-gradient(rgba(' + tint.rgb + ', ' + fmt(tint.base) + '), rgba(' + tint.rgb + ', ' + fmt(tint.base) + ')), url("' + url + '")'
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
 * Rules that let a body background image show through the shell surface WITHOUT
 * washing the UI out.
 *
 * Only `--dsw-alias-bg-base` is overridden: that is the shell canvas the
 * conversation sits on. Card, menu and dialog surfaces (`bg-layer-1`,
 * `bg-layer-2`, `bg-overlay`) keep their own opaque colours — making those
 * translucent is what made text unreadable. `opacity` is how strongly the shell
 * surface covers the image (1 = leave the app untouched; the image simply does
 * not show through).
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
  return rules
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
    if (img.selector !== '' && img.url !== '') {
      rules.push(img.selector + ' { position: relative; }')
      const blendCss = img.blend !== undefined && img.blend !== 'normal' ? ' mix-blend-mode: ' + img.blend + ';' : ''
      rules.push(img.selector + '::after { content: \'\'; position: absolute; inset: 0; background-image: url("' + img.url + '"); background-repeat: no-repeat; background-position: ' + img.x + 'px ' + img.y + 'px; background-size: ' + img.w + 'px ' + img.h + 'px; opacity: ' + (img.opacity ?? 1) + '; pointer-events: none; z-index: 1;' + blendCss + ' }')
    }
  }
  // Cross-document recovery: the image's own selector is the editor iframe's
  // `[data-dsh-myskin-embed=...]` attribute, which the real page never carries.
  // We re-tag the real element via its structural fallback selector, only when it
  // uniquely matches (so we never tag a look-alike). The attribute is transient —
  // React may rebuild the node (wiping it) or mount it after this apply runs — so a
  // single shared MutationObserver keeps the unique fallback re-tagged across
  // re-renders and late mounts until the skin is disposed.
  if (embedTargets.length > 0 && typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') {
    const retag = (): void => {
      if (disposed) return
      const curKey = currentSettingsPageKey(document)
      for (const img of embedTargets) {
        // Page scoping: an image embedded on one settings page must not leak onto
        // another. When the image carries a pageKey, only keep it tagged while the
        // current page matches; on any mismatch strip the stale tag so its
        // [data-dsh-myskin-embed=id] rule matches nothing.
        const scoped = img.pageKey !== undefined && img.pageKey !== ''
        try {
          const els = document.querySelectorAll(img.fallbackSelector!)
          const target = els.length === 1 ? els[0] : undefined
          if (scoped && img.pageKey !== curKey) {
            const tagged = document.querySelector('[data-dsh-myskin-embed="' + img.id + '"]')
            if (tagged !== null) tagged.removeAttribute('data-dsh-myskin-embed')
            continue
          }
          if (target !== undefined && target.getAttribute('data-dsh-myskin-embed') !== img.id) {
            target.setAttribute('data-dsh-myskin-embed', img.id)
          }
        } catch { /* invalid selector: ignore */ }
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
    // We also watch aria-current so the scoping re-evaluates when the user switches
    // settings pages. Our own setAttribute (data-dsh-myskin-embed) is not observed,
    // so the observer cannot self-loop.
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-current'] })
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