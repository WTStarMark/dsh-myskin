/**
 * 「变体」: pick a look by CHOOSING, not by writing CSS.
 *
 * The rest of this plugin exposes knobs — a radius here, a colour there. That is the right tool for
 * refining, and the wrong one for "I want it to look like THIS": a look is a handful of decisions that
 * have to agree with each other.
 *
 * Two things make the card usable rather than clever:
 *
 *   · **SPLIT axes.** A surface is made of a frame (blur, border, shadow) and a fill (the background
 *     colour), and they answer different questions: "how does it feel" vs "does it cover what is
 *     behind it". Bundled together, a glass look could only ever be taken whole — which is exactly
 *     what makes a skin fight a wallpaper. `frame` and `fill` are separate axes now, so
 *     frame=玻璃 + fill=透明 is a real answer.
 *   · **A SCOPE.** Every click applies to one place — 全部区域 or a single region — so "只改输入框"
 *     no longer means leaving the card for the region tab. The scope is recorded with the choice
 *     (`axis=option@scope`), so the card can show what is in effect for the place being edited.
 *
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

/** Custom property carrying the chosen options, as `axis=option[@scope],axis=option[@scope]`. */
export const VARIANT_PROPERTY = '--dsh-myskin-variant'

/** Scope meaning "every region" (the default, and what an old marker without a scope means). */
export const ALL_REGIONS = '*'

/** Where one choice applies: {@link ALL_REGIONS} or one region id. */
export type VariantScope = string

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
  /**
   * Axis this one belongs UNDER in the panel (`radius` for the four corners).
   *
   * The corner axes are ordinary axes — same marker, same scope, same clearing — but they are four
   * extra rows of five buttons, so the card folds them into one block behind a summary instead of
   * five rows nobody scrolls past. They apply on their own: a corner writes ONLY its longhand, which
   * is what leaves the uniform value governing the other three.
   */
  readonly subOf?: string
}

/** Region field index: the option definitions name a property by its field id. */
const REGION_FIELD_INDEX: ReadonlyMap<string, RegionField> = new Map(REGION_FIELDS.map((field) => [field.id, field]))

/** A border, typed once and used by every frame option. */
const border = (color: string, width: string): Record<string, string> => ({ borderStyle: 'solid', borderWidth: width, borderColor: color })

/**
 * A glass frame: blur, hairline light border, soft shadow — no fill (that is the other axis).
 *
 * The blur is a BARE NUMBER on purpose: the region field wraps values in `blur({value})` (see
 * `RegionField.template`), so passing `blur(18px)` here produced `blur(blur(18px))` — invalid CSS,
 * i.e. no blur at all, for every document that ever picked 玻璃.
 * @param blur - px value for the backdrop blur.
 * @param shadow - the shadow declaration.
 */
const glassFrame = (blur: string, shadow: string): Record<string, string> => ({ blur, shadow, ...border('rgba(255, 255, 255, 0.5)', '1px') })
/** 描边: one border, nothing else. `''` CLEARS the blur declaration (there is no `blur(none)`). */
const outlineFrame = (): Record<string, string> => ({ blur: '', shadow: 'none', ...border('var(--dsw-alias-border-l2)', '1px') })
/** 无: every property the frame axis owns, switched off explicitly. */
const noFrame = (): Record<string, string> => ({ blur: '', shadow: 'none', ...border('transparent', '0px') })

/** The five radius sizes, shared by the uniform axis and the four corner axes. */
const RADIUS_SIZES: readonly { id: string; labelKey: string; hintKey: string; value: string }[] = [
  { id: 'square', labelKey: 'variantRadiusSquare', hintKey: 'variantRadiusSquareHint', value: '0px' },
  { id: 's', labelKey: 'variantRadiusS', hintKey: 'variantRadiusSHint', value: '8px' },
  { id: 'm', labelKey: 'variantRadiusM', hintKey: 'variantRadiusMHint', value: '14px' },
  { id: 'l', labelKey: 'variantRadiusL', hintKey: 'variantRadiusLHint', value: '20px' },
  { id: 'pill', labelKey: 'variantRadiusPill', hintKey: 'variantRadiusPillHint', value: '28px' },
]

/**
 * One radius axis: the same five sizes, written to ONE field.
 *
 * The uniform axis writes `border-radius` (the shorthand); each corner axis writes its own longhand,
 * which the region writer keeps AFTER the shorthand (see `hoistShorthand`) so a corner overrides
 * only itself.
 * @param id - axis id (`radius`, `radiusTL`, …).
 * @param fieldId - the region field the sizes land in.
 * @param labelKey - copy key of the axis name.
 * @param subOf - axis this one is folded under in the panel.
 * @returns the axis.
 */
function radiusAxis(id: string, fieldId: string, labelKey: string, subOf?: string): VariantAxis {
  return {
    id, labelKey, ...(subOf === undefined ? {} : { subOf }),
    options: RADIUS_SIZES.map((size) => ({
      id: size.id, labelKey: size.labelKey, hintKey: size.hintKey,
      regions: { '*': { [fieldId]: size.value } },
    })),
  }
}

/**
 * The axes.
 *
 * Seven, in three thoughts: the two halves of a surface (frame, fill), then what a user tunes after
 * that (radius — with the four corners folded under it — density, accent). Every option writes its
 * property set in full, which is what makes switching safe.
 */
export const VARIANT_AXES: readonly VariantAxis[] = [
  {
    id: 'frame', labelKey: 'variantFrame',
    options: [
      {
        id: 'glass', labelKey: 'variantFrameGlass', hintKey: 'variantFrameGlassHint',
        regions: {
          'sidebar': glassFrame('18px', '0 1px 2px rgba(0, 0, 0, 0.06), 0 8px 24px -18px rgba(0, 0, 0, 0.35)'),
          // The native right sidebar is a panel like the left one: a look that skipped it would
          // leave one column in the old material (see regions.ts).
          'rightSidebar': glassFrame('18px', '0 1px 2px rgba(0, 0, 0, 0.06), 0 8px 24px -18px rgba(0, 0, 0, 0.35)'),
          'composer': glassFrame('20px', '0 2px 6px rgba(0, 0, 0, 0.08), 0 18px 48px -24px rgba(0, 0, 0, 0.45)'),
          'settings': glassFrame('24px', '0 4px 12px rgba(0, 0, 0, 0.12), 0 32px 64px -28px rgba(0, 0, 0, 0.55)'),
          'conversation': noFrame(),
          'messages': noFrame(),
        },
      },
      {
        id: 'outline', labelKey: 'variantFrameOutline', hintKey: 'variantFrameOutlineHint',
        regions: {
          'sidebar': outlineFrame(), 'rightSidebar': outlineFrame(), 'composer': outlineFrame(),
          'settings': outlineFrame(), 'conversation': noFrame(), 'messages': noFrame(),
        },
      },
      {
        id: 'none', labelKey: 'variantFrameNone', hintKey: 'variantFrameNoneHint',
        regions: {
          'sidebar': noFrame(), 'rightSidebar': noFrame(), 'composer': noFrame(),
          'settings': noFrame(), 'conversation': noFrame(), 'messages': noFrame(),
        },
      },
    ],
  },
  {
    id: 'fill', labelKey: 'variantFill',
    options: [
      {
        id: 'glass', labelKey: 'variantFillGlass', hintKey: 'variantFillGlassHint',
        regions: {
          'sidebar': { bg: 'rgba(255, 255, 255, 0.42)' },
          'rightSidebar': { bg: 'rgba(255, 255, 255, 0.42)' },
          'composer': { bg: 'rgba(255, 255, 255, 0.55)' },
          'settings': { bg: 'rgba(255, 255, 255, 0.72)' },
          // The conversation and the message list ARE the canvas: giving them a fill would cover
          // whatever is behind the app, which is the opposite of what these two regions are for.
          'conversation': { bg: 'transparent' },
          'messages': { bg: 'transparent' },
        },
      },
      {
        id: 'card', labelKey: 'variantFillCard', hintKey: 'variantFillCardHint',
        regions: {
          'sidebar': { bg: 'var(--dsw-alias-bg-layer-1)' }, 'rightSidebar': { bg: 'var(--dsw-alias-bg-layer-1)' },
          'composer': { bg: 'var(--dsw-alias-bg-layer-1)' }, 'settings': { bg: 'var(--dsw-alias-bg-layer-1)' },
          'conversation': { bg: 'transparent' }, 'messages': { bg: 'transparent' },
        },
      },
      {
        id: 'none', labelKey: 'variantFillNone', hintKey: 'variantFillNoneHint',
        regions: {
          'sidebar': { bg: 'transparent' }, 'rightSidebar': { bg: 'transparent' },
          'composer': { bg: 'transparent' }, 'settings': { bg: 'transparent' },
          'conversation': { bg: 'transparent' }, 'messages': { bg: 'transparent' },
        },
      },
    ],
  },
  radiusAxis('radius', 'radius', 'variantRadius'),
  // 四角单独定义：都挂在圆角下面（subOf），点选与其它维度完全同构——留空＝跟随统一值。
  radiusAxis('radiusTL', 'radiusTL', 'regionRadiusTL', 'radius'),
  radiusAxis('radiusTR', 'radiusTR', 'regionRadiusTR', 'radius'),
  radiusAxis('radiusBR', 'radiusBR', 'regionRadiusBR', 'radius'),
  radiusAxis('radiusBL', 'radiusBL', 'regionRadiusBL', 'radius'),
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
  { id: 'glass', labelKey: 'variantLookGlass', hintKey: 'variantLookGlassHint', choices: { frame: 'glass', fill: 'glass', radius: 'l', density: 'normal', accent: 'theme' } },
  { id: 'paper', labelKey: 'variantLookPaper', hintKey: 'variantLookPaperHint', choices: { frame: 'none', fill: 'card', radius: 'm', density: 'normal', accent: 'theme' } },
  { id: 'quiet', labelKey: 'variantLookQuiet', hintKey: 'variantLookQuietHint', choices: { frame: 'none', fill: 'none', radius: 's', density: 'tight', accent: 'theme' } },
  { id: 'vivid', labelKey: 'variantLookVivid', hintKey: 'variantLookVividHint', choices: { frame: 'glass', fill: 'glass', radius: 'pill', density: 'loose', accent: 'violet' } },
]

/** One scope's choices: axis id -> option id. */
export type ScopeChoices = Readonly<Record<string, string>>
/** Every recorded choice, keyed by scope. */
export type VariantChoices = Readonly<Record<string, ScopeChoices>>

/**
 * How the retired `material` axis maps onto the two that replaced it (0.4.1).
 *
 * A document written before the split records one `material=…` entry, and the card must show the
 * truth for it instead of falling back to the first option of each new axis. The properties are the
 * same ones (the old option owned blur, border, shadow AND the fill), so nothing has to be rewritten
 * in the sheet — only read correctly.
 */
const LEGACY_MATERIAL: Readonly<Record<string, { frame: string; fill: string }>> = {
  glass: { frame: 'glass', fill: 'glass' },
  paper: { frame: 'none', fill: 'card' },
  outline: { frame: 'outline', fill: 'none' },
  bare: { frame: 'none', fill: 'none' },
}

/**
 * The choices a document currently records, per scope.
 * @param skin - the skin document.
 * @returns scope -> axis -> option id (only what the marker names, plus the legacy adoption).
 */
export function readVariantChoices(skin: SkinSettings): VariantChoices {
  const out: Record<string, Record<string, string>> = {}
  for (const rule of skin.css ?? []) {
    const match = rule.rule.match(/--dsh-myskin-variant:\s*([^;]+)/)
    if (match === null) continue
    // Comma-separated: a `;` inside the value would end the CSS declaration, which is exactly what
    // happened when this marker was first written with semicolons.
    for (const entry of match[1].split(',')) {
      const [pair, scope] = entry.split('@')
      const [axis, option] = (pair ?? '').split('=')
      if (axis === undefined || option === undefined) continue
      const axisId = axis.trim()
      const optionId = option.trim()
      if (axisId === '' || optionId === '') continue
      const scopeId = (scope ?? '').trim() === '' ? ALL_REGIONS : scope.trim()
      const perScope = out[scopeId] ?? (out[scopeId] = {})
      perScope[axisId] = optionId
    }
    break
  }
  for (const [scope, perScope] of Object.entries(out)) {
    const legacy = perScope['material']
    if (legacy === undefined) continue
    const mapped = LEGACY_MATERIAL[legacy]
    delete perScope['material']
    if (mapped !== undefined) {
      if (perScope['frame'] === undefined) perScope['frame'] = mapped.frame
      if (perScope['fill'] === undefined) perScope['fill'] = mapped.fill
    }
  }
  return out
}

/**
 * The choices in effect for one place: its own, or the "every region" ones when it has none.
 * @param choices - every recorded choice.
 * @param scope - the place being edited.
 * @returns axis id -> option id.
 */
export function choicesFor(choices: VariantChoices, scope: VariantScope = ALL_REGIONS): ScopeChoices {
  // Merged, not "exact or nothing": what is painted is the global choice everywhere PLUS whatever was
  // chosen for this place on top (both write the same rule, and the later write wins per property), so
  // the card has to show exactly that — otherwise a place with one scoped choice would claim the
  // global ones never happened.
  return { ...(choices[ALL_REGIONS] ?? {}), ...(choices[scope] ?? {}) }
}

/**
 * The option of one axis, falling back to the first.
 * @param axis - the axis.
 * @param choices - the choices in effect for the place being edited.
 * @returns the option.
 */
export function optionFor(axis: VariantAxis, choices: ScopeChoices): VariantOption {
  return axis.options.find((option) => option.id === choices[axis.id]) ?? axis.options[0]
}

/**
 * Serialise every scope's choices into the one marker value.
 * @param choices - the choices to store.
 * @returns the marker value.
 */
function serialize(choices: VariantChoices): string {
  const scopes = Object.keys(choices).sort((a, b) => (a === ALL_REGIONS ? -1 : b === ALL_REGIONS ? 1 : a < b ? -1 : 1))
  const parts: string[] = []
  for (const scope of scopes) {
    for (const axis of VARIANT_AXES) {
      const option = choices[scope][axis.id]
      if (option === undefined) continue
      parts.push(scope === ALL_REGIONS ? axis.id + '=' + option : axis.id + '=' + option + '@' + scope)
    }
  }
  return parts.join(',')
}

/**
 * Apply one option of one axis to one place (idempotent: it writes the option's full property set).
 *
 * The scope filters the REGION writes only. Typography tokens and the brand colour have no per-region
 * form in DSH — they are app-wide by nature — so the density and accent axes always land globally,
 * and the card says so.
 * @param skin - the skin document.
 * @param axis - the axis being chosen.
 * @param option - the option.
 * @param scope - the place it applies to ({@link ALL_REGIONS} or one region id).
 * @returns a new document.
 */
export function applyVariantOption(skin: SkinSettings, axis: VariantAxis, option: VariantOption, scope: VariantScope = ALL_REGIONS): SkinSettings {
  let next: SkinSettings = { ...skin }
  // Region writes: the option names region ids, or `*` for every region.
  for (const [regionId, properties] of Object.entries(option.regions ?? {})) {
    const named = regionId === '*' ? REGIONS : REGIONS.filter((region) => region.id === regionId)
    for (const region of named) {
      if (scope !== ALL_REGIONS && region.id !== scope) continue
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
  //
  // Only the axis that was actually applied: filling in the others with their first option — which is
  // what this did before scopes existed — would make the marker ASSERT a choice nobody made, and with
  // a scope that turns into a lie ("全部区域: 直角" while the composer is 胶囊). An axis without an
  // entry shows its first option anyway, so nothing is lost by staying quiet.
  const recorded = readVariantChoices(skin)
  const forScope: Record<string, string> = { ...(recorded[scope] ?? {}) }
  forScope[axis.id] = option.id
  const choices: Record<string, ScopeChoices> = { ...recorded, [scope]: forScope }
  return { ...next, css: withRootMarker(next.css, VARIANT_PROPERTY, serialize(choices)) }
}

/**
 * Apply a whole look to one place: every axis in one go.
 * @param skin - the skin document.
 * @param look - the look.
 * @param scope - the place it applies to.
 * @returns a new document.
 */
export function applyVariantLook(skin: SkinSettings, look: VariantLook, scope: VariantScope = ALL_REGIONS): SkinSettings {
  let next = skin
  for (const axis of VARIANT_AXES) {
    const optionId = look.choices[axis.id]
    const option = axis.options.find((entry) => entry.id === optionId)
    if (option !== undefined) next = applyVariantOption(next, axis, option, scope)
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
