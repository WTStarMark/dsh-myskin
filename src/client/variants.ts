/**
 * 「变体」: pick a look by CHOOSING, not by writing CSS.
 *
 * The rest of this plugin exposes knobs — a radius here, a colour there. That is the right tool for
 * refining, and the wrong one for "I want it to look like THIS": a look is a handful of decisions that
 * have to agree with each other (a glass card needs a blur, a border and a shadow that belong
 * together; a flat one needs none of them).
 *
 * So a variant is a small set of AXES (material / radius / density / accent) whose options each carry
 * the concrete declarations they mean, plus whole-look presets that simply choose an option per axis.
 * Choosing is idempotent: every option writes the FULL set of properties it owns — including `none`
 * and `0` — so the result never depends on what was chosen before, and nothing is left over.
 *
 * What it writes: the region rules (see `regions.ts`), a few markdown typography tokens (see
 * `markdown.ts`) and the brand token. What it records: ONE marker in `:root`, so the card can show
 * the current choices without keeping a second copy of anything.
 */

import type { CssRule, SkinSettings } from '../skin-schema.ts'
import { REGION_FIELDS, REGIONS, writeRegionStyle } from './regions.ts'
import type { RegionField } from './regions.ts'
import { MARKDOWN_TOKENS, writeMarkdownToken } from './markdown.ts'
import { withRootMarker } from './skin-engine.ts'

/** Custom property carrying the chosen options, as `axis=option;axis=option;`. */
export const VARIANT_PROPERTY = '--dsh-myskin-variant'

/** One option of one axis. */
export interface VariantOption {
  /** Stable id (also what the marker stores). */
  readonly id: string
  /** Copy key of the button. */
  readonly labelKey: string
  /** Copy key of the one-line explanation. */
  readonly hintKey: string
  /** Region property writes, per region id (`*` = every region). */
  readonly regions?: Readonly<Record<string, Readonly<Record<string, string>>>>
  /** Markdown token writes, by token field id. */
  readonly tokens?: Readonly<Record<string, string>>
  /** Brand-token writes (`--dsw-alias-brand-primary` light+dark). */
  readonly brand?: { readonly light: string; readonly dark: string }
}

/** One decision the user makes. */
export interface VariantAxis {
  /** Stable id. */
  readonly id: string
  /** Copy key of the axis name. */
  readonly labelKey: string
  /** Options, in panel order. */
  readonly options: readonly VariantOption[]
}

/** Region field index: the option definitions name a property by its field id. */
const REGION_FIELD_INDEX: ReadonlyMap<string, RegionField> = new Map(REGION_FIELDS.map((field) => [field.id, field]))

/** A border, typed once and used by every material option. */
const border = (color: string, width: string): Record<string, string> => ({ borderStyle: 'solid', borderWidth: width, borderColor: color })

/**
 * The axes.
 *
 * Four is deliberate: fewer and the looks converge, more and the user is back to fiddling. Every
 * option writes its property set in full, which is what makes switching safe.
 */
export const VARIANT_AXES: readonly VariantAxis[] = [
  {
    id: 'material', labelKey: 'variantMaterial',
    options: [
      {
        id: 'glass', labelKey: 'variantMaterialGlass', hintKey: 'variantMaterialGlassHint',
        regions: {
          'sidebar': { bg: 'rgba(255, 255, 255, 0.42)', blur: 'blur(18px)', shadow: '0 1px 2px rgba(0, 0, 0, 0.06), 0 8px 24px -18px rgba(0, 0, 0, 0.35)', ...border('rgba(255, 255, 255, 0.5)', '1px') },
          'composer': { bg: 'rgba(255, 255, 255, 0.55)', blur: 'blur(20px)', shadow: '0 2px 6px rgba(0, 0, 0, 0.08), 0 18px 48px -24px rgba(0, 0, 0, 0.45)', ...border('rgba(255, 255, 255, 0.6)', '1px') },
          'settings': { bg: 'rgba(255, 255, 255, 0.72)', blur: 'blur(24px)', shadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 32px 64px -28px rgba(0, 0, 0, 0.55)', ...border('rgba(255, 255, 255, 0.55)', '1px') },
          'conversation': { bg: 'transparent', blur: 'none', shadow: 'none', ...border('transparent', '0px') },
          'messages': { bg: 'transparent', blur: 'none', shadow: 'none', ...border('transparent', '0px') },
        },
      },
      {
        id: 'paper', labelKey: 'variantMaterialPaper', hintKey: 'variantMaterialPaperHint',
        regions: {
          'sidebar': { bg: 'var(--dsw-alias-bg-layer-1)', blur: 'none', shadow: '0 2px 6px rgba(0, 0, 0, 0.08), 0 18px 48px -24px rgba(0, 0, 0, 0.45)', ...border('transparent', '0px') },
          'composer': { bg: 'var(--dsw-alias-bg-layer-1)', blur: 'none', shadow: '0 2px 6px rgba(0, 0, 0, 0.08), 0 18px 48px -24px rgba(0, 0, 0, 0.45)', ...border('transparent', '0px') },
          'settings': { bg: 'var(--dsw-alias-bg-layer-1)', blur: 'none', shadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 32px 64px -28px rgba(0, 0, 0, 0.55)', ...border('transparent', '0px') },
          'conversation': { bg: 'transparent', blur: 'none', shadow: 'none', ...border('transparent', '0px') },
          'messages': { bg: 'transparent', blur: 'none', shadow: 'none', ...border('transparent', '0px') },
        },
      },
      {
        id: 'outline', labelKey: 'variantMaterialOutline', hintKey: 'variantMaterialOutlineHint',
        regions: {
          'sidebar': { bg: 'transparent', blur: 'none', shadow: 'none', ...border('var(--dsw-alias-border-l2)', '1px') },
          'composer': { bg: 'transparent', blur: 'none', shadow: 'none', ...border('var(--dsw-alias-border-l2)', '1px') },
          'settings': { bg: 'transparent', blur: 'none', shadow: 'none', ...border('var(--dsw-alias-border-l2)', '1px') },
          'conversation': { bg: 'transparent', blur: 'none', shadow: 'none', ...border('transparent', '0px') },
          'messages': { bg: 'transparent', blur: 'none', shadow: 'none', ...border('transparent', '0px') },
        },
      },
      {
        id: 'bare', labelKey: 'variantMaterialBare', hintKey: 'variantMaterialBareHint',
        regions: {
          'sidebar': { bg: 'transparent', blur: 'none', shadow: 'none', ...border('transparent', '0px') },
          'composer': { bg: 'transparent', blur: 'none', shadow: 'none', ...border('transparent', '0px') },
          'settings': { bg: 'transparent', blur: 'none', shadow: 'none', ...border('transparent', '0px') },
          'conversation': { bg: 'transparent', blur: 'none', shadow: 'none', ...border('transparent', '0px') },
          'messages': { bg: 'transparent', blur: 'none', shadow: 'none', ...border('transparent', '0px') },
        },
      },
    ],
  },
  {
    id: 'radius', labelKey: 'variantRadius',
    options: [
      { id: 'square', labelKey: 'variantRadiusSquare', hintKey: 'variantRadiusSquareHint', regions: { '*': { radius: '0px' } } },
      { id: 's', labelKey: 'variantRadiusS', hintKey: 'variantRadiusSHint', regions: { '*': { radius: '8px' } } },
      { id: 'm', labelKey: 'variantRadiusM', hintKey: 'variantRadiusMHint', regions: { '*': { radius: '14px' } } },
      { id: 'l', labelKey: 'variantRadiusL', hintKey: 'variantRadiusLHint', regions: { '*': { radius: '20px' } } },
      { id: 'pill', labelKey: 'variantRadiusPill', hintKey: 'variantRadiusPillHint', regions: { '*': { radius: '28px' } } },
    ],
  },
  {
    id: 'density', labelKey: 'variantDensity',
    options: [
      {
        id: 'tight', labelKey: 'variantDensityTight', hintKey: 'variantDensityTightHint',
        tokens: { tokBaseSize: '13px', tokBaseLine: '20px', tokH1Size: '18px', tokH2Size: '16px', tokH3Size: '15px', tokH4Size: '14px' },
        regions: { '*': { pad: '10px' } },
      },
      {
        id: 'normal', labelKey: 'variantDensityNormal', hintKey: 'variantDensityNormalHint',
        tokens: { tokBaseSize: '14px', tokBaseLine: '22px', tokH1Size: '20px', tokH2Size: '18px', tokH3Size: '16px', tokH4Size: '15px' },
        regions: { '*': { pad: '14px' } },
      },
      {
        id: 'loose', labelKey: 'variantDensityLoose', hintKey: 'variantDensityLooseHint',
        tokens: { tokBaseSize: '15px', tokBaseLine: '26px', tokH1Size: '24px', tokH2Size: '21px', tokH3Size: '18px', tokH4Size: '16px' },
        regions: { '*': { pad: '20px' } },
      },
    ],
  },
  {
    id: 'accent', labelKey: 'variantAccent',
    options: [
      { id: 'theme', labelKey: 'variantAccentTheme', hintKey: 'variantAccentThemeHint' },
      { id: 'blue', labelKey: 'variantAccentBlue', hintKey: 'variantAccentBlueHint', brand: { light: '#2f6feb', dark: '#6ea8ff' } },
      { id: 'violet', labelKey: 'variantAccentViolet', hintKey: 'variantAccentVioletHint', brand: { light: '#7c5cff', dark: '#a78bfa' } },
      { id: 'teal', labelKey: 'variantAccentTeal', hintKey: 'variantAccentTealHint', brand: { light: '#0f9b8e', dark: '#4fd1c5' } },
      { id: 'rose', labelKey: 'variantAccentRose', hintKey: 'variantAccentRoseHint', brand: { light: '#d63f7a', dark: '#f472b6' } },
    ],
  },
]

/** Whole looks: one option per axis. */
export interface VariantLook {
  /** Stable id. */
  readonly id: string
  /** Copy key of the button. */
  readonly labelKey: string
  /** Copy key of the one-line explanation. */
  readonly hintKey: string
  /** Axis id -> option id. */
  readonly choices: Readonly<Record<string, string>>
}

/** The looks the card offers first (choosing one is the same as clicking each axis). */
export const VARIANT_LOOKS: readonly VariantLook[] = [
  { id: 'glass', labelKey: 'variantLookGlass', hintKey: 'variantLookGlassHint', choices: { material: 'glass', radius: 'l', density: 'normal', accent: 'theme' } },
  { id: 'paper', labelKey: 'variantLookPaper', hintKey: 'variantLookPaperHint', choices: { material: 'paper', radius: 'm', density: 'normal', accent: 'theme' } },
  { id: 'quiet', labelKey: 'variantLookQuiet', hintKey: 'variantLookQuietHint', choices: { material: 'bare', radius: 's', density: 'tight', accent: 'theme' } },
  { id: 'vivid', labelKey: 'variantLookVivid', hintKey: 'variantLookVividHint', choices: { material: 'glass', radius: 'pill', density: 'loose', accent: 'violet' } },
]

/** Options chosen right now, one per axis (missing axes fall back to the first option). */
export type VariantChoices = Readonly<Record<string, string>>

/**
 * The choices a document currently records.
 * @param skin - the skin document.
 * @returns axis id -> option id (only what the marker names).
 */
export function readVariantChoices(skin: SkinSettings): VariantChoices {
  const out: Record<string, string> = {}
  for (const rule of skin.css ?? []) {
    const match = rule.rule.match(/--dsh-myskin-variant:\s*([^;]+)/)
    if (match === null) continue
    // Comma-separated: a `;` inside the value would end the CSS declaration (`material=glass` would
    // be the only pair that survived — which is exactly what happened).
    for (const pair of match[1].split(',')) {
      const [axis, option] = pair.split('=')
      if (axis === undefined || option === undefined) continue
      const trimmedAxis = axis.trim()
      const trimmedOption = option.trim()
      if (trimmedAxis !== '' && trimmedOption !== '') out[trimmedAxis] = trimmedOption
    }
    break
  }
  return out
}

/**
 * The option of one axis, falling back to the first.
 * @param axis - the axis.
 * @param choices - the current choices.
 * @returns the option.
 */
export function optionFor(axis: VariantAxis, choices: VariantChoices): VariantOption {
  return axis.options.find((option) => option.id === choices[axis.id]) ?? axis.options[0]
}

/**
 * Apply one option of one axis (idempotent: it writes the option's full property set).
 * @param skin - the skin document.
 * @param axis - the axis being chosen.
 * @param option - the option.
 * @returns a new document.
 */
export function applyVariantOption(skin: SkinSettings, axis: VariantAxis, option: VariantOption): SkinSettings {
  let next: SkinSettings = { ...skin }
  // Region writes: the option names region ids, or `*` for every region.
  for (const [regionId, properties] of Object.entries(option.regions ?? {})) {
    const targets = regionId === '*' ? REGIONS : REGIONS.filter((region) => region.id === regionId)
    for (const region of targets) {
      for (const [fieldId, value] of Object.entries(properties)) {
        const field = REGION_FIELD_INDEX.get(fieldId)
        if (field === undefined) continue
        next = { ...next, css: writeRegionStyle(next.css, region, field, value === '' ? undefined : value) }
      }
    }
  }
  // Markdown typography tokens (density).
  for (const [fieldId, value] of Object.entries(option.tokens ?? {})) {
    const field = MARKDOWN_TOKENS.find((entry) => entry.id === fieldId)
    if (field === undefined) continue
    next = writeMarkdownToken(next, field, value)
  }
  // Brand token: written for both variants, or dropped so the theme's own colour comes back.
  const tokens = { ...next.tokens }
  if (option.brand === undefined) delete tokens['--dsw-alias-brand-primary']
  else tokens['--dsw-alias-brand-primary'] = { light: option.brand.light, dark: option.brand.dark }
  next = { ...next, tokens }
  // Record the choice (one marker, no second copy of anything).
  const chosen = { ...readVariantChoices(skin), [axis.id]: option.id }
  // Every axis is recorded, with the first option standing in for one that was never chosen: the
  // marker then states the whole state, so reading it back never has to guess.
  const marker = VARIANT_AXES.map((entry) => entry.id + '=' + (chosen[entry.id] ?? entry.options[0].id)).join(',')
  return { ...next, css: withRootMarker(next.css, VARIANT_PROPERTY, marker) }
}

/**
 * Apply a whole look: every axis in one go.
 * @param skin - the skin document.
 * @param look - the look.
 * @returns a new document.
 */
export function applyVariantLook(skin: SkinSettings, look: VariantLook): SkinSettings {
  let next = skin
  for (const axis of VARIANT_AXES) {
    const optionId = look.choices[axis.id]
    const option = axis.options.find((entry) => entry.id === optionId)
    if (option !== undefined) next = applyVariantOption(next, axis, option)
  }
  return next
}

/**
 * Forget the variant: the marker goes, and the properties the options own are cleared again.
 *
 * Region rules this card wrote are removed outright (they belong to the variant); typography tokens and
 * the brand token are deleted, so the theme's own values come back.
 * @param skin - the skin document.
 * @returns a new document.
 */
export function clearVariant(skin: SkinSettings): SkinSettings {
  let next: SkinSettings = { ...skin, css: withRootMarker(skin.css, VARIANT_PROPERTY, undefined) }
  for (const axis of VARIANT_AXES) {
    for (const option of axis.options) {
      for (const [regionId, properties] of Object.entries(option.regions ?? {})) {
        const targets = regionId === '*' ? REGIONS : REGIONS.filter((region) => region.id === regionId)
        for (const region of targets) {
          for (const fieldId of Object.keys(properties)) {
            const field = REGION_FIELD_INDEX.get(fieldId)
            if (field === undefined) continue
            next = { ...next, css: writeRegionStyle(next.css, region, field, undefined) }
          }
        }
      }
      for (const fieldId of Object.keys(option.tokens ?? {})) {
        const field = MARKDOWN_TOKENS.find((entry) => entry.id === fieldId)
        if (field !== undefined) next = writeMarkdownToken(next, field, undefined)
      }
    }
  }
  const tokens = { ...next.tokens }
  delete tokens['--dsw-alias-brand-primary']
  return { ...next, tokens }
}

