/**
 * 「对话排版」: the skin's handle on DSH's MARKDOWN output.
 *
 * Everything else in this plugin styles elements the user picks on the page. Markdown is different:
 * it is *generated* markup (h1/p/ul/pre/table/…) whose container class carries a build hash.
 *
 * The anchor comes from the renderer itself (`dsh-client-ui-primitives`, `MarkdownText`):
 *
 *   jsx("div", { className: clsx(markdownCss.markdown, variant === "compact" && markdownCss.compact),
 *                 "data-markdown-variant": variant === "compact" ? variant : void 0 })
 *
 * so the body of EVERY markdown surface is `[class*="_markdown"]` — the semantic half of the CSS-module
 * class, matched as a substring, never the hash — and the compact variant (tool previews, thinking)
 * is the same element plus a class, marked with `data-markdown-variant="compact"`. An earlier version
 * of this module anchored on `_markdownPayload`, which is the TRAJECTORY TABLE's wrapper: it matches
 * tool output and nothing in the conversation body, so the card silently did nothing (reported).
 *
 * Two kinds of knob live here, and they are not interchangeable:
 *
 *   - **tokens** (`--dsw-font-markdown-*-font-size` / `-line-height`, `--dsw-alias-markdown-*`): DSH's own
 *     sheet builds `font: var(--dsw-font-markdown-base)` out of these components, so writing the component
 *     changes the real type scale — including the parts we could not reach with a longhand;
 *   - **rules** (`css`): the gaps and geometry no token covers (margins, padding, radii, borders).
 *
 * Settings live in the document's `tokens` / `css` fields (both schema-declared since the first release)
 * and the panel reads its values straight back out, so there is no second copy of the state to drift.
 */

import type { CssRule, SkinSettings } from '../skin-schema.ts'
import { declarationValue, mergeDeclaration, withRootMarker, withoutDeclaration } from './skin-engine.ts'

/**
 * The body of every markdown surface.
 *
 * `:not([data-markdown-variant="compact"])` is what keeps compact payloads (a tool call's one-line
 * preview, collapsed thinking) out of the user's typography: they share the class and are rendered at a
 * deliberately different scale.
 */
export const MD_BODY = '[class*="_markdown"]:not([data-markdown-variant="compact"])'
/** Same, restricted to the conversation transcript. */
export const MD_CONVERSATION = '[data-conversation-content] ' + MD_BODY

/** Where the typography applies. */
export type MarkdownScope = 'all' | 'conversation'

/** Custom property that mirrors the scope into `css` (`all` = the absence of the marker). */
export const MD_SCOPE_PROPERTY = '--dsh-myskin-md-scope'

/**
 * Effective scope of a skin document.
 * @param skin - the skin document.
 * @returns the scope, defaulting to every markdown surface.
 */
export function readMarkdownScope(skin: SkinSettings): MarkdownScope {
  for (const rule of skin.css ?? []) {
    const match = rule.rule.match(/--dsh-myskin-md-scope:\s*([a-z-]+)/)
    // `assistant` was the value before the anchor was fixed to the real transcript container.
    if (match !== null) return match[1] === 'conversation' || match[1] === 'assistant' ? 'conversation' : 'all'
  }
  return 'all'
}

/**
 * Store the scope as a marker declaration (idempotent, merged into the single `:root` rule).
 * @param css - the document's CSS rules.
 * @param scope - the scope to store.
 * @returns a new rule list.
 */
export function withMarkdownScope(css: readonly CssRule[], scope: MarkdownScope): CssRule[] {
  return withRootMarker(css, MD_SCOPE_PROPERTY, scope === 'conversation' ? 'conversation' : undefined)
}

/**
 * The selector one scope means.
 * @param scope - which markdown surfaces are in play.
 * @returns the selector.
 */
export function markdownContainers(scope: MarkdownScope): string {
  return scope === 'conversation' ? MD_CONVERSATION : MD_BODY
}

/**
 * The element the type applies to (kept as a named function: every field selector is derived from it).
 * @param scope - which markdown surfaces are in play.
 * @returns the body selector.
 */
export function markdownBody(scope: MarkdownScope): string {
  return markdownContainers(scope)
}
/** How a rule field is edited in the panel. */
export type MarkdownKind = 'px' | 'number' | 'color' | 'toggle'

/** One rule knob the card exposes. */
export interface MarkdownField {
  /** Stable id, also the key in `MARKDOWN_PRESETS`. */
  readonly id: string
  /** Group this row belongs to (see {@link MARKDOWN_GROUPS}). */
  readonly group: string
  /** Copy key of the row label. */
  readonly labelKey: string
  /** Suffixes appended to {@link markdownBody} (one selector per entry). */
  readonly targets: readonly string[]
  /** CSS property written (with `!important`). */
  readonly property: string
  /** Editor for the value. */
  readonly kind: MarkdownKind
  /** Unit appended to a numeric value. */
  readonly unit?: string
  /** Value written when a toggle is turned ON. */
  readonly onValue?: string
  /** Value written when a toggle is turned OFF. */
  readonly offValue?: string
  /** Wheel/typing step for numbers. */
  readonly step?: number
  /** Lowest sensible value. */
  readonly min?: number
  /** Highest sensible value. */
  readonly max?: number
  /**
   * How to read this field's EFFECTIVE value off the live page.
   *
   * Without it the card can only say "未设置" while the page in front of the user is showing *something*
   * (DSH's own typography, a variant's tokens, another tool's rules) — which reads as "it did not pick up
   * my configuration" (reported). With it, an empty field shows what is actually in effect.
   */
  readonly probe?: { readonly target: string; readonly property: string; readonly pseudo?: string }
}

/** Groups, in panel order. */
export const MARKDOWN_GROUPS: readonly { id: string; labelKey: string }[] = [
  { id: 'text', labelKey: 'mdGroupText' },
  { id: 'heading', labelKey: 'mdGroupHeading' },
  { id: 'list', labelKey: 'mdGroupList' },
  { id: 'quote', labelKey: 'mdGroupQuote' },
  { id: 'code', labelKey: 'mdGroupCode' },
  { id: 'table', labelKey: 'mdGroupTable' },
  { id: 'misc', labelKey: 'mdGroupMisc' },
]

/**
 * The rule knobs: gaps and geometry only.
 *
 * Anything DSH expresses as a TOKEN is deliberately absent here — see {@link MARKDOWN_TOKENS}. A longhand
 * rule can only override the property it names, while the token rebuilds the whole `font:` shorthand DSH
 * actually uses, so size/weight/family stay consistent with the rest of the sheet.
 */
export const MARKDOWN_FIELDS: readonly MarkdownField[] = [
  { id: 'paraGap', group: 'text', labelKey: 'mdParaGap', targets: [' p', ' ul', ' ol'], property: 'margin', kind: 'px', unit: 'px', step: 1, min: 0, max: 40, probe: { target: ' p', property: 'margin-top' } },
  { id: 'hGap', group: 'heading', labelKey: 'mdHGap', targets: [' h1', ' h2', ' h3', ' h4'], property: 'margin-top', kind: 'px', unit: 'px', step: 1, min: 0, max: 48, probe: { target: ' h1', property: 'margin-top' } },
  { id: 'hGapBottom', group: 'heading', labelKey: 'mdHGapBottom', targets: [' h1', ' h2', ' h3', ' h4'], property: 'margin-bottom', kind: 'px', unit: 'px', step: 1, min: 0, max: 48, probe: { target: ' h1', property: 'margin-bottom' } },
  { id: 'hWeight', group: 'heading', labelKey: 'mdHWeight', targets: [' h1', ' h2', ' h3', ' h4'], property: 'font-weight', kind: 'number', step: 100, min: 300, max: 900, probe: { target: ' h1', property: 'font-weight' } },
  { id: 'liGap', group: 'list', labelKey: 'mdLiGap', targets: [' li'], property: 'margin-top', kind: 'px', unit: 'px', step: 1, min: 0, max: 24, probe: { target: ' li', property: 'margin-top' } },
  { id: 'liMarker', group: 'list', labelKey: 'mdLiMarker', targets: [' li::marker'], property: 'color', kind: 'color', probe: { target: ' li', property: 'color', pseudo: '::marker' } },
  { id: 'listIndent', group: 'list', labelKey: 'mdListIndent', targets: [' ul', ' ol'], property: 'padding-left', kind: 'px', unit: 'px', step: 2, min: 0, max: 64, probe: { target: ' ul', property: 'padding-left' } },
  { id: 'quoteBorder', group: 'quote', labelKey: 'mdQuoteBorder', targets: [' blockquote'], property: 'border-left-color', kind: 'color', probe: { target: ' blockquote', property: 'border-left-color' } },
  { id: 'quoteWidth', group: 'quote', labelKey: 'mdQuoteWidth', targets: [' blockquote'], property: 'border-left-width', kind: 'px', unit: 'px', step: 1, min: 0, max: 12, probe: { target: ' blockquote', property: 'border-left-width' } },
  { id: 'quoteColor', group: 'quote', labelKey: 'mdQuoteColor', targets: [' blockquote'], property: 'color', kind: 'color', probe: { target: ' blockquote', property: 'color' } },
  { id: 'quoteBg', group: 'quote', labelKey: 'mdQuoteBg', targets: [' blockquote'], property: 'background-color', kind: 'color', probe: { target: ' blockquote', property: 'background-color' } },
  { id: 'codePad', group: 'code', labelKey: 'mdInlineCodePad', targets: [' :not(pre) > code'], property: 'padding', kind: 'px', unit: 'px', step: 1, min: 0, max: 12, probe: { target: ' :not(pre) > code', property: 'padding' } },
  { id: 'codeColor', group: 'code', labelKey: 'mdInlineCodeColor', targets: [' :not(pre) > code'], property: 'color', kind: 'color', probe: { target: ' :not(pre) > code', property: 'color' } },
  { id: 'codeRadius', group: 'code', labelKey: 'mdInlineCodeRadius', targets: [' :not(pre) > code'], property: 'border-radius', kind: 'px', unit: 'px', step: 1, min: 0, max: 16, probe: { target: ' :not(pre) > code', property: 'border-radius' } },
  { id: 'preBg', group: 'code', labelKey: 'mdPreBg', targets: [' pre'], property: 'background-color', kind: 'color', probe: { target: ' pre', property: 'background-color' } },
  { id: 'prePad', group: 'code', labelKey: 'mdPrePad', targets: [' pre'], property: 'padding', kind: 'px', unit: 'px', step: 2, min: 0, max: 40, probe: { target: ' pre', property: 'padding' } },
  { id: 'tablePad', group: 'table', labelKey: 'mdTablePad', targets: [' th', ' td'], property: 'padding', kind: 'px', unit: 'px', step: 1, min: 0, max: 24, probe: { target: ' td', property: 'padding' } },
  { id: 'tableBorder', group: 'table', labelKey: 'mdTableBorder', targets: [' th', ' td'], property: 'border-bottom-color', kind: 'color', probe: { target: ' td', property: 'border-bottom-color' } },
  { id: 'tableHeadBg', group: 'table', labelKey: 'mdTableHeadBg', targets: [' th'], property: 'background-color', kind: 'color', probe: { target: ' th', property: 'background-color' } },
  { id: 'tableZebra', group: 'table', labelKey: 'mdTableZebra', targets: [' tbody tr:nth-child(even)'], property: 'background-color', kind: 'toggle', onValue: 'rgba(127, 127, 127, 0.08)', offValue: 'transparent' },
  { id: 'linkWeight', group: 'misc', labelKey: 'mdLinkWeight', targets: [' a'], property: 'font-weight', kind: 'number', step: 100, min: 300, max: 900, probe: { target: ' a', property: 'font-weight' } },
  { id: 'hrColor', group: 'misc', labelKey: 'mdHrColor', targets: [' hr'], property: 'background', kind: 'color', probe: { target: ' hr', property: 'background-color' } },
  { id: 'hrHeight', group: 'misc', labelKey: 'mdHrHeight', targets: [' hr'], property: 'height', kind: 'px', unit: 'px', step: 1, min: 0, max: 8, probe: { target: ' hr', property: 'height' } },
  { id: 'hrGap', group: 'misc', labelKey: 'mdHrGap', targets: [' hr'], property: 'margin', kind: 'px', unit: 'px', step: 1, min: 0, max: 60, probe: { target: ' hr', property: 'margin-top' } },
  { id: 'imgRadius', group: 'misc', labelKey: 'mdImgRadius', targets: [' img'], property: 'border-radius', kind: 'px', unit: 'px', step: 1, min: 0, max: 32, probe: { target: ' img', property: 'border-radius' } },
  { id: 'imgMax', group: 'misc', labelKey: 'mdImgMax', targets: [' img'], property: 'max-width', kind: 'number', unit: '%', step: 5, min: 20, max: 100, probe: { target: ' img', property: 'max-width' } },
]

/**
 * Full selector one field writes to.
 * @param field - the field.
 * @param scope - which markdown surfaces are in play.
 * @returns a comma-joined selector list.
 */
export function markdownSelector(field: MarkdownField, scope: MarkdownScope): string {
  return field.targets.map((target) => markdownBody(scope) + target).join(', ')
}

/**
 * Everything the card set as RULES, keyed by field id.
 * @param css - the document's CSS rules.
 * @param scope - which markdown surfaces are in play.
 * @returns field id -> raw CSS value (only for fields that are set).
 */
export function readMarkdownStyles(css: readonly CssRule[], scope: MarkdownScope): Map<string, string> {
  const out = new Map<string, string>()
  for (const field of MARKDOWN_FIELDS) {
    const selector = markdownSelector(field, scope)
    const rule = (css ?? []).find((entry) => entry.selector === selector)
    if (rule === undefined) continue
    const value = declarationValue(rule.rule, field.property)
    if (value !== undefined) out.set(field.id, value)
  }
  return out
}

/**
 * Write (or clear) one rule field.
 * @param css - the document's CSS rules.
 * @param scope - which markdown surfaces are in play.
 * @param field - the field to write.
 * @param value - the raw CSS value, or undefined to clear it.
 * @returns a new rule list.
 */
export function writeMarkdownStyle(css: readonly CssRule[], scope: MarkdownScope, field: MarkdownField, value: string | undefined): CssRule[] {
  const selector = markdownSelector(field, scope)
  const rules = css ?? []
  const existing = rules.find((rule) => rule.selector === selector)?.rule
  const rule = value === undefined || value === ''
    ? withoutDeclaration(existing, field.property)
    : mergeDeclaration(existing, field.property + ': ' + value + ' !important;')
  const rest = rules.filter((entry) => entry.selector !== selector).map((entry) => ({ selector: entry.selector, rule: entry.rule }))
  return rule === '' ? rest : [...rest, { selector, rule }]
}

/**
 * Drop every RULE this card owns, for one scope.
 *
 * 「恢复默认」 must mean exactly that: the marks this module leaves are recognisable because their
 * selector starts with the markdown body, so nothing a user wrote by hand (or the engine wrote) is
 * touched. Token overrides are cleared by {@link clearMarkdownTokens}.
 * @param css - the document's CSS rules.
 * @param scope - which markdown surfaces are in play.
 * @returns a new rule list.
 */
export function clearMarkdownStyles(css: readonly CssRule[], scope: MarkdownScope): CssRule[] {
  const body = markdownBody(scope)
  return (css ?? [])
    .filter((rule) => !rule.selector.startsWith(body))
    .map((rule) => ({ selector: rule.selector, rule: rule.rule }))
}
/** How a TOKEN field is edited (same shapes as a rule field, minus targets). */
export interface MarkdownTokenField {
  /** Stable id. */
  readonly id: string
  /** Copy key of the row label. */
  readonly labelKey: string
  /** The `--dsw-*` token this row writes. */
  readonly token: string
  /** Editor for the value. */
  readonly kind: 'px' | 'number' | 'color'
  /** Unit appended to a numeric value. */
  readonly unit?: string
  /** Wheel/typing step. */
  readonly step?: number
  /** Lowest sensible value. */
  readonly min?: number
  /** Highest sensible value. */
  readonly max?: number
  /** @see MarkdownField.probe */
  readonly probe?: { readonly target: string; readonly property: string; readonly pseudo?: string }
}

/**
 * The TOKEN knobs — the ones that actually drive markdown type.
 *
 * `MarkdownText.module.css` writes `font: var(--dsw-font-markdown-base)` and friends, and the design
 * system derives every one of those shorthands from component tokens (`…-font-size`, `…-line-height`,
 * `…-font-weight`). Overriding the component is therefore both narrower and wider than a rule: it
 * cannot fight DSH's own cascade, and it moves size, weight and line-height together the way the sheet
 * intends. Names verified against the installed 0.2.0-rc.2 bundles.
 */
export const MARKDOWN_TOKENS: readonly MarkdownTokenField[] = [
  { id: 'tokBaseSize', labelKey: 'mdTokBaseSize', token: '--dsw-font-markdown-base-font-size', kind: 'px', unit: 'px', step: 1, min: 10, max: 24, probe: { target: '', property: 'font-size' } },
  { id: 'tokBaseLine', labelKey: 'mdTokBaseLine', token: '--dsw-font-markdown-base-line-height', kind: 'px', unit: 'px', step: 1, min: 12, max: 44, probe: { target: '', property: 'line-height' } },
  { id: 'tokH1Size', labelKey: 'mdTokH1Size', token: '--dsw-font-markdown-h1-font-size', kind: 'px', unit: 'px', step: 1, min: 12, max: 40, probe: { target: ' h1', property: 'font-size' } },
  { id: 'tokH2Size', labelKey: 'mdTokH2Size', token: '--dsw-font-markdown-h2-font-size', kind: 'px', unit: 'px', step: 1, min: 12, max: 36, probe: { target: ' h2', property: 'font-size' } },
  { id: 'tokH3Size', labelKey: 'mdTokH3Size', token: '--dsw-font-markdown-h3-font-size', kind: 'px', unit: 'px', step: 1, min: 12, max: 32, probe: { target: ' h3', property: 'font-size' } },
  { id: 'tokH4Size', labelKey: 'mdTokH4Size', token: '--dsw-font-markdown-h4-font-size', kind: 'px', unit: 'px', step: 1, min: 12, max: 28, probe: { target: ' h4', property: 'font-size' } },
  { id: 'tokCodeSize', labelKey: 'mdTokCodeSize', token: '--dsw-font-markdown-code-font-size', kind: 'px', unit: 'px', step: 1, min: 10, max: 20, probe: { target: ' :not(pre) > code', property: 'font-size' } },
  { id: 'tokCodeBlockSize', labelKey: 'mdTokCodeBlockSize', token: '--dsw-font-markdown-code-block-font-size', kind: 'px', unit: 'px', step: 1, min: 10, max: 20, probe: { target: ' pre code', property: 'font-size' } },
  { id: 'tokInlineCodeBg', labelKey: 'mdTokInlineCodeBg', token: '--dsw-alias-markdown-inline-code', kind: 'color', probe: { target: ' :not(pre) > code', property: 'background-color' } },
  { id: 'tokCodeBlockBg', labelKey: 'mdTokCodeBlockBg', token: '--dsw-alias-markdown-code-block', kind: 'color', probe: { target: ' pre', property: 'background-color' } },
  { id: 'tokCodeBannerBg', labelKey: 'mdTokCodeBannerBg', token: '--dsw-alias-markdown-code-block-banner', kind: 'color' },
  { id: 'tokLink', labelKey: 'mdTokLink', token: '--dsw-alias-link', kind: 'color', probe: { target: ' a', property: 'color' } },
]

/**
 * Token overrides the document currently carries, keyed by token field id.
 *
 * The value shown is the LIGHT one (`{ light, dark }` is the document's own shape); a row whose two
 * variants differ says so through {@link markdownTokenSplit}, because the card writes one value for
 * both and the user deserves to know when that is not what is stored.
 * @param skin - the skin document.
 * @returns token field id -> value.
 */
export function readMarkdownTokens(skin: SkinSettings): Map<string, string> {
  const out = new Map<string, string>()
  for (const field of MARKDOWN_TOKENS) {
    const entry = skin.tokens[field.token]
    if (entry === undefined) continue
    const value = entry.light !== '' ? entry.light : entry.dark
    if (value !== '') out.set(field.id, value)
  }
  return out
}

/**
 * Token overrides whose light and dark values differ (the card shows one value for both).
 * @param skin - the skin document.
 * @returns the token names that are split.
 */
export function markdownTokenSplit(skin: SkinSettings): string[] {
  return MARKDOWN_TOKENS
    .filter((field) => {
      const entry = skin.tokens[field.token]
      return entry !== undefined && entry.light !== entry.dark
    })
    .map((field) => field.token)
}

/**
 * Write (or clear) one token override.
 *
 * Both variants get the same value: the card is one number for one idea ("body text is 15px"), and
 * splitting light/dark is what the token panel is for — the value lands in the same `tokens` field, so
 * the two editors cannot disagree.
 * @param skin - the skin document.
 * @param field - the token field.
 * @param value - the value, or undefined to drop the override.
 * @returns a new document.
 */
export function writeMarkdownToken(skin: SkinSettings, field: MarkdownTokenField, value: string | undefined): SkinSettings {
  const tokens = { ...skin.tokens }
  if (value === undefined || value === '') delete tokens[field.token]
  else tokens[field.token] = { light: value, dark: value }
  return { ...skin, tokens }
}

/**
 * Drop every markdown token override this card owns.
 * @param skin - the skin document.
 * @returns a new document.
 */
export function clearMarkdownTokens(skin: SkinSettings): SkinSettings {
  const tokens = { ...skin.tokens }
  for (const field of MARKDOWN_TOKENS) delete tokens[field.token]
  return { ...skin, tokens }
}

/** One-click density bundle (`紧凑` / `标准` / `宽松`). */
export interface MarkdownPreset {
  /** Stable id. */
  readonly id: string
  /** Copy key of the button. */
  readonly labelKey: string
  /** Token field id -> value (the type scale). */
  readonly tokens: Readonly<Record<string, string>>
  /** Rule field id -> raw CSS value (the gaps). */
  readonly values: Readonly<Record<string, string>>
}

/**
 * Three densities, in the order the panel shows them.
 *
 * They are not derived from anything: a preset is a starting point the user then edits, and every value
 * it writes stays visible in its own field afterwards (nothing is hidden inside the preset). The type
 * half rides the tokens, the spacing half rides the rules — exactly the split the card shows.
 */
export const MARKDOWN_PRESETS: readonly MarkdownPreset[] = [
  {
    id: 'tight', labelKey: 'mdPresetTight',
    tokens: { tokBaseSize: '13px', tokBaseLine: '20px', tokH1Size: '18px', tokH2Size: '16px', tokH3Size: '15px', tokH4Size: '14px' },
    values: { paraGap: '6px', hGap: '14px', hGapBottom: '6px', liGap: '2px', listIndent: '18px', hrGap: '16px' },
  },
  {
    id: 'normal', labelKey: 'mdPresetNormal',
    tokens: { tokBaseSize: '14px', tokBaseLine: '22px', tokH1Size: '20px', tokH2Size: '18px', tokH3Size: '16px', tokH4Size: '15px' },
    values: { paraGap: '12px', hGap: '24px', hGapBottom: '10px', liGap: '4px', listIndent: '20px', hrGap: '24px' },
  },
  {
    id: 'loose', labelKey: 'mdPresetLoose',
    tokens: { tokBaseSize: '15px', tokBaseLine: '26px', tokH1Size: '24px', tokH2Size: '21px', tokH3Size: '18px', tokH4Size: '16px' },
    values: { paraGap: '18px', hGap: '34px', hGapBottom: '14px', liGap: '7px', listIndent: '22px', hrGap: '32px' },
  },
]

/**
 * Apply a preset: every value it names is written; everything else is left exactly as it was.
 * @param skin - the skin document.
 * @param scope - which markdown surfaces are in play.
 * @param preset - the preset to apply.
 * @returns a new document.
 */
export function applyMarkdownPreset(skin: SkinSettings, scope: MarkdownScope, preset: MarkdownPreset): SkinSettings {
  let css: readonly CssRule[] = skin.css ?? []
  for (const field of MARKDOWN_FIELDS) {
    const value = preset.values[field.id]
    if (value !== undefined) css = writeMarkdownStyle(css, scope, field, value)
  }
  let next: SkinSettings = { ...skin, css: css.map((rule) => ({ selector: rule.selector, rule: rule.rule })) }
  for (const field of MARKDOWN_TOKENS) {
    const value = preset.tokens[field.id]
    if (value !== undefined) next = writeMarkdownToken(next, field, value)
  }
  return next
}

/**
 * What is ACTUALLY in effect on the page right now, per field.
 *
 * The card can only show what the skin overrides; everything else (DSH's own typography, a variant's
 * tokens, another tool's rules) was invisible — an empty row next to a page that clearly has a font size
 * reads as "it did not pick up my configuration" (reported). Sampling the computed style of a real
 * markdown element answers that without guessing.
 * @param doc - the live document.
 * @param scope - which markdown surfaces are in play.
 * @param tokenValue - how to read a custom property's computed value. Injected so the decision below is
 *   testable: jsdom implements no computed custom properties at all (the browser does), and a test that
 *   cannot tell "the token is empty" from "the engine cannot read tokens" would be worthless.
 * @returns field id -> the value in effect (only for fields a probe could read).
 */
export function readEffectiveMarkdown(
  doc: Document,
  scope: MarkdownScope,
  tokenValue: (name: string) => string = (name) => {
    const view = doc.defaultView
    const body = doc.querySelector(markdownBody(scope))
    if (view === null || body === null || typeof view.getComputedStyle !== 'function') return ''
    return view.getComputedStyle(body).getPropertyValue(name).trim()
  },
): Map<string, string> {
  const out = new Map<string, string>()
  const view = doc.defaultView
  if (view === null || typeof view.getComputedStyle !== 'function') return out
  const body = doc.querySelector(markdownBody(scope))
  if (body === null) return out
  const probe = (field: { id: string; probe?: { target: string; property: string; pseudo?: string } }): void => {
    if (field.probe === undefined) return
    const target = field.probe.target === '' ? body : body.querySelector(field.probe.target)
    if (target === null) return
    const style = view.getComputedStyle(target, field.probe.pseudo)
    const raw = style.getPropertyValue(field.probe.property).trim()
    if (raw === '' || raw === 'normal' || raw === 'auto') return
    // Pixel values are rounded: `16.000001px` is noise the user does not need to see.
    const px = raw.match(/^(-?[\d.]+)px$/)
    const shown = px === null ? raw : String(Math.round(Number.parseFloat(px[1]) * 10) / 10) + 'px'
    out.set(field.id, shown)
  }
  for (const field of MARKDOWN_FIELDS) probe(field)
  // Tokens are custom properties: their COMPUTED value is readable off any markdown element, so a row
  // whose element is not on the page right now (no `h1` in this conversation) still reports the real
  // number instead of 「未设置」. The element probe stays as the fallback for tokens a theme leaves empty.
  for (const field of MARKDOWN_TOKENS) {
    const raw = tokenValue(field.token)
    if (raw !== '') {
      out.set(field.id, raw)
      continue
    }
    probe(field)
  }
  return out
}

/**
 * How much markdown the page is showing right now, for the card's live indicator.
 *
 * A skin can style markdown perfectly and still look broken because the current page shows none of it
 * (an empty conversation, a settings dialog) — and the same indicator is what caught the anchor bug: it
 * counts REAL matches for the selector in use, so a wrong anchor shows up as 0 instead of silence.
 * @param doc - the document to measure.
 * @param scope - which markdown surfaces are in play.
 * @returns body count and total markdown element count (compact included).
 */
export function markdownSurfaceCount(doc: Document, scope: MarkdownScope): { bodies: number; all: number } {
  return {
    bodies: doc.querySelectorAll(markdownBody(scope)).length,
    all: doc.querySelectorAll('[class*="_markdown"]').length,
  }
}
