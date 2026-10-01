/**
 * 「区域外观」: shape the app's big surfaces as WHOLE REGIONS.
 *
 * Everything else in this plugin works element by element — pick a node, change a property — which is
 * the wrong tool for "I want my own sidebar": the interesting surfaces are nested containers whose
 * class names carry a build hash, and the properties that make them look like something (radius,
 * shadow, glass, padding) only read as a set.
 *
 * A region is therefore a NAMED surface with version-tolerant anchors (the same `[class*="_…"]` /
 * `data-*` hooks the engine, the markdown card and the surface rules already rely on), plus a curated
 * set of properties that only make sense together. Settings live in `css` and are read back out of it,
 * so there is no second copy of the state.
 */

import type { CssRule, SkinSettings } from '../skin-schema.ts'
import { declarationValue, mergeDeclaration, withoutDeclaration } from './skin-engine.ts'

/** One surface the card can shape. */
export interface Region {
  /** Stable id (also the preset key). */
  readonly id: string
  /** Copy key of the name. */
  readonly labelKey: string
  /** Copy key of the one-line explanation. */
  readonly hintKey: string
  /**
   * The anchors, most specific first.
   *
   * Several on purpose: a build can name the same surface differently (`_sidebarCol` today, a plain
   * `sidebarCol` in another build), and the composer is addressed by a `data-*` hook rather than a
   * class because that is what the conversation package publishes.
   */
  readonly selectors: readonly string[]
}

/** The regions, in panel order. */
export const REGIONS: readonly Region[] = [
  {
    id: 'conversation', labelKey: 'regionConversation', hintKey: 'regionConversationHint',
    selectors: ['[class*="_centerCol"]', '[class~="centerCol"]'],
  },
  {
    id: 'sidebar', labelKey: 'regionSidebar', hintKey: 'regionSidebarHint',
    selectors: ['[class*="_sidebarCol"]', '[class~="sidebarCol"]'],
  },
  {
    // The composer publishes `data-composer-*` hooks (card = the whole input surface, seat = where it
    // sits), so this needs no CSS-module hash at all.
    id: 'composer', labelKey: 'regionComposer', hintKey: 'regionComposerHint',
    selectors: ['[data-composer-card]', '[data-composer-seat]'],
  },
  {
    id: 'settings', labelKey: 'regionSettings', hintKey: 'regionSettingsHint',
    selectors: ['[data-shortcut-modal]'],
  },
  {
    id: 'messages', labelKey: 'regionMessages', hintKey: 'regionMessagesHint',
    selectors: ['[data-conversation-content]'],
  },
]

/** How a region field is edited. */
export type RegionKind = 'px' | 'color' | 'number' | 'option' | 'toggle'

/** One knob of a region. */
export interface RegionField {
  /** Stable id. */
  readonly id: string
  /** Copy key of the row label. */
  readonly labelKey: string
  /** CSS property written (with `!important`). */
  readonly property: string
  /** Editor for the value. */
  readonly kind: RegionKind
  /** Unit appended to a numeric value. */
  readonly unit?: string
  /** Choices for `option` fields: value -> copy key (`''` = the untouched default). */
  readonly options?: readonly { readonly value: string; readonly labelKey: string }[]
  /** Value written when a toggle is on. */
  readonly onValue?: string
  /** Value written when a toggle is off. */
  readonly offValue?: string
  /**
   * Wrapper the value goes into, e.g. `blur({value})` for `backdrop-filter`.
   *
   * Some properties are not a bare number, and pretending they are is how `backdrop-filter: 18px` (not
   * a thing) gets written. The same template is reversed when reading the value back, so the field
   * still shows a plain number.
   */
  readonly template?: string
  /** Wheel/typing step. */
  readonly step?: number
  /** Lowest sensible value. */
  readonly min?: number
  /** Highest sensible value. */
  readonly max?: number
}

/** Shadow choices, as ready-made values (a shadow is a sentence, not a number). */
export const REGION_SHADOWS: readonly { readonly value: string; readonly labelKey: string }[] = [
  { value: '', labelKey: 'regionShadowNone' },
  { value: '0 1px 2px rgba(0, 0, 0, 0.06), 0 8px 24px -18px rgba(0, 0, 0, 0.35)', labelKey: 'regionShadowSoft' },
  { value: '0 2px 6px rgba(0, 0, 0, 0.08), 0 18px 48px -24px rgba(0, 0, 0, 0.45)', labelKey: 'regionShadowMedium' },
  { value: '0 4px 12px rgba(0, 0, 0, 0.12), 0 32px 64px -28px rgba(0, 0, 0, 0.55)', labelKey: 'regionShadowStrong' },
]

/** Radius choices, as ready-made values. */
export const REGION_RADII: readonly { readonly value: string; readonly labelKey: string }[] = [
  { value: '', labelKey: 'regionRadiusDefault' },
  { value: '8px', labelKey: 'regionRadiusS' },
  { value: '14px', labelKey: 'regionRadiusM' },
  { value: '20px', labelKey: 'regionRadiusL' },
  { value: '28px', labelKey: 'regionRadiusXL' },
]

/**
 * The knobs, chosen so the set describes a surface: what it is made of (background, glass), where it
 * ends (radius, border) and how it sits (shadow, inset).
 */
export const REGION_FIELDS: readonly RegionField[] = [
  { id: 'bg', labelKey: 'regionBg', property: 'background-color', kind: 'color' },
  { id: 'radius', labelKey: 'regionRadius', property: 'border-radius', kind: 'option', options: REGION_RADII },
  { id: 'shadow', labelKey: 'regionShadow', property: 'box-shadow', kind: 'option', options: REGION_SHADOWS },
  { id: 'blur', labelKey: 'regionBlur', property: 'backdrop-filter', kind: 'px', unit: 'px', step: 1, min: 0, max: 40, template: 'blur({value})' },
  { id: 'borderColor', labelKey: 'regionBorderColor', property: 'border-color', kind: 'color' },
  { id: 'borderWidth', labelKey: 'regionBorderWidth', property: 'border-width', kind: 'px', unit: 'px', step: 1, min: 0, max: 8 },
  { id: 'borderStyle', labelKey: 'regionBorderStyle', property: 'border-style', kind: 'toggle', onValue: 'solid', offValue: 'none' },
  { id: 'pad', labelKey: 'regionPad', property: 'padding', kind: 'px', unit: 'px', step: 2, min: 0, max: 64 },
  { id: 'gap', labelKey: 'regionGap', property: 'gap', kind: 'px', unit: 'px', step: 2, min: 0, max: 48 },
  { id: 'opacity', labelKey: 'regionOpacity', property: 'opacity', kind: 'number', step: 0.05, min: 0.2, max: 1 },
]

/**
 * The selector one region writes to.
 * @param region - the region.
 * @returns a comma-joined selector list.
 */
export function regionSelector(region: Region): string {
  return region.selectors.join(', ')
}

/**
 * Full selector one field writes to.
 *
 * The property is wrapped in `:where(…)`-free plain selectors on purpose: `border-radius` on a
 * comma-joined list would only apply to the last one, so every anchor is expanded.
 * @param region - the region.
 * @param field - the field.
 * @returns the selector.
 */
export function regionFieldSelector(region: Region, field: RegionField): string {
  return region.selectors.join(', ')
}

/**
 * The CSS text one field's editor value becomes.
 * @param field - the field.
 * @param value - the raw editor value (e.g. `18px`).
 * @returns the declaration value.
 */
export function formatRegionValue(field: RegionField, value: string): string {
  return field.template === undefined ? value : field.template.replace('{value}', value)
}

/**
 * The editor value one declaration text means (the inverse of {@link formatRegionValue}).
 * @param field - the field.
 * @param declaration - the declared value.
 * @returns the editor value.
 */
export function parseRegionValue(field: RegionField, declaration: string): string {
  if (field.template === undefined) return declaration
  const [head, tail] = field.template.split('{value}')
  const inner = declaration.slice(head.length, declaration.length - tail.length)
  return inner.trim() === '' ? declaration : inner
}

/**
 * Everything the card set for one region, keyed by field id.
 * @param css - the document's CSS rules.
 * @param region - the region.
 * @returns field id -> raw CSS value.
 */
export function readRegionStyle(css: readonly CssRule[], region: Region): Map<string, string> {
  const out = new Map<string, string>()
  const selector = regionSelector(region)
  const rule = (css ?? []).find((entry) => entry.selector === selector)
  if (rule === undefined) return out
  for (const field of REGION_FIELDS) {
    const value = declarationValue(rule.rule, field.property)
    if (value !== undefined) out.set(field.id, parseRegionValue(field, value))
  }
  return out
}

/**
 * Write (or clear) one region field.
 * @param css - the document's CSS rules.
 * @param region - the region.
 * @param field - the field.
 * @param value - the raw CSS value, or undefined to clear it.
 * @returns a new rule list.
 */
export function writeRegionStyle(css: readonly CssRule[], region: Region, field: RegionField, value: string | undefined): CssRule[] {
  const selector = regionSelector(region)
  const rules = css ?? []
  const existing = rules.find((rule) => rule.selector === selector)?.rule
  const rule = value === undefined || value === ''
    ? withoutDeclaration(existing, field.property)
    : mergeDeclaration(existing, field.property + ': ' + formatRegionValue(field, value) + ' !important;')
  const rest = rules.filter((entry) => entry.selector !== selector).map((entry) => ({ selector: entry.selector, rule: entry.rule }))
  return rule === '' ? rest : [...rest, { selector, rule }]
}

/**
 * Drop every rule this card owns (any region), for 「恢复默认」.
 * @param css - the document's CSS rules.
 * @returns a new rule list.
 */
export function clearRegionStyles(css: readonly CssRule[]): CssRule[] {
  const owned = new Set(REGIONS.map((region) => regionSelector(region)))
  return (css ?? [])
    .filter((rule) => !owned.has(rule.selector))
    .map((rule) => ({ selector: rule.selector, rule: rule.rule }))
}

/** One-click looks. */
export interface RegionPreset {
  /** Stable id. */
  readonly id: string
  /** Copy key of the button. */
  readonly labelKey: string
  /** Copy key of the one-line explanation. */
  readonly hintKey: string
  /** Field id -> raw CSS value. */
  readonly values: Readonly<Record<string, string>>
}

/**
 * Three looks, in panel order.
 *
 * `玻璃` is the one from the reference: a translucent surface with a real backdrop blur, a soft radius
 * and a light shadow. `纸片` keeps everything opaque and flat but rounded. `极简` strips the chrome —
 * no border, no shadow, only a radius — which is what "不拘泥于原版" usually means in practice.
 */
export const REGION_PRESETS: readonly RegionPreset[] = [
  {
    id: 'glass', labelKey: 'regionPresetGlass', hintKey: 'regionPresetGlassHint',
    values: { bg: 'rgba(255, 255, 255, 0.55)', blur: '18px', radius: '20px', shadow: REGION_SHADOWS[1].value, borderStyle: 'solid', borderWidth: '1px', borderColor: 'rgba(255, 255, 255, 0.5)' },
  },
  {
    id: 'paper', labelKey: 'regionPresetPaper', hintKey: 'regionPresetPaperHint',
    values: { radius: '14px', shadow: REGION_SHADOWS[2].value, borderStyle: 'none', blur: '' },
  },
  {
    id: 'flat', labelKey: 'regionPresetFlat', hintKey: 'regionPresetFlatHint',
    values: { radius: '14px', shadow: '', borderStyle: 'none', blur: '' },
  },
]

/**
 * Apply a preset to one region: every value it names is written, and every field it leaves out is
 * CLEARED, because a preset describes a whole look — leaving a previous border behind would make the
 * result depend on what happened before.
 * @param css - the document's CSS rules.
 * @param region - the region.
 * @param preset - the preset.
 * @returns a new rule list.
 */
export function applyRegionPreset(css: readonly CssRule[], region: Region, preset: RegionPreset): CssRule[] {
  let next: readonly CssRule[] = css ?? []
  for (const field of REGION_FIELDS) {
    const value = preset.values[field.id]
    next = writeRegionStyle(next, region, field, value === undefined || value === '' ? undefined : value)
  }
  return next.map((rule) => ({ selector: rule.selector, rule: rule.rule }))
}


/**
 * How many elements a region resolves to right now, for the card's live indicator.
 *
 * A region whose anchors match nothing (a build that renamed the column, a page without a composer)
 * must SAY so instead of looking broken.
 * @param doc - the document to measure.
 * @param region - the region.
 * @returns the element count.
 */
export function regionCount(doc: Document, region: Region): number {
  return doc.querySelectorAll(regionSelector(region)).length
}
