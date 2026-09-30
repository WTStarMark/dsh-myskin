/**
 * Preset palettes: readable text, and no half-themed mode.
 *
 * Two failure modes this pins down, because both are invisible until someone looks at the app:
 *
 *   1. **Text on a surface of nearly the same lightness.** The presets ship ~40-60 token
 *      overrides each, and every text tier has to stay legible on the surfaces it is used on —
 *      including the primary button, whose fill IS `brand-primary` and whose label is
 *      `label-primary-foreground` (that pair shipped at 2.84:1 before this test existed).
 *   2. **A preset that builds one theme from the other mode's palette.** All three presets
 *      currently follow the app's mode, so DSH's own surfaces stay coherent. A preset that
 *      forced dark in both columns would also have to override every surface DSH resolves
 *      from its LIGHT palette (document preview, chat bubble, file-diff rows, menu sheet,
 *      ghost/toolbar fills) — missing them left near-white patches with near-white text on
 *      them, which is why the built-in 极夜 preset was retired.
 *
 * The two install-dependent checks read the theme package the plugin will actually run
 * against, and skip when no install is present.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'
import { readDshTokens } from './helpers/dsh-tokens.mjs'

const presets = await loadTs('src/client/presets.ts')
const TOKENS = readDshTokens()
const skip = TOKENS === undefined ? 'no local DSH theme package to check against' : false

/**
 * Parse an opaque colour into channels.
 * @param value - a `#rgb`/`#rrggbb` string, optionally with alpha.
 * @returns the channels, or undefined for anything else (rgba(), color-mix(), …).
 */
function channels(value) {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(String(value).trim())
  if (short !== null) return [short[1], short[2], short[3]].map((c) => parseInt(c + c, 16))
  const long = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(String(value).trim())
  if (long === null) return undefined
  if (long[2] !== undefined && long[2].toLowerCase() !== 'ff') return undefined
  const n = parseInt(long[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * WCAG relative luminance.
 * @param value - the colour.
 * @returns 0..1, or undefined when the colour is not opaque hex.
 */
function luminance(value) {
  const rgb = channels(value)
  if (rgb === undefined) return undefined
  const linear = (v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2])
}

/**
 * WCAG contrast ratio between two colours.
 * @param a - one colour.
 * @param b - the other.
 * @returns the ratio (1..21), or undefined when either colour is not opaque hex.
 */
function contrast(a, b) {
  const x = luminance(a)
  const y = luminance(b)
  if (x === undefined || y === undefined) return undefined
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/** Surfaces a preset paints its own text on. */
const SURFACES = [
  '--dsw-alias-bg-base', '--dsw-alias-bg-layer-1', '--dsw-alias-bg-layer-2', '--dsw-alias-bg-layer-3',
  '--dsw-alias-bg-overlay', '--dsw-specific-sidebar-fill', '--dsw-alias-bg-module-platform',
  '--dsw-specific-input-major', '--dsw-specific-selector',
  '--dsw-alias-button-elevated-fill', '--dsw-alias-button-floating-fill', '--dsw-alias-button-floating-hover',
  '--dsw-alias-button-tool-bar-fill', '--dsw-alias-button-primary-dimmed', '--dsw-alias-button-ghost-active-fill',
  '--dsw-alias-bg-document-preview', '--dsw-alias-bg-multi-select', '--dsw-specific-bubble',
  '--dsw-specific-bubble-highlight', '--dsw-specific-tip', '--dsw-specific-login-input',
]

/**
 * Text tier -> minimum contrast on those surfaces.
 *
 * 4.5 is WCAG AA for body text. The quiet tiers are deliberately lower — DSH's own palette
 * ships `label-dimmed` at 1.1-1.9 — so the floor only has to be "better than what it
 * replaces", and a hard 4.5 there would turn a hint into a headline.
 */
const TIER_FLOORS = {
  '--dsw-alias-label-primary': 4.5,
  '--dsw-alias-label-secondary': 4.5,
  '--dsw-alias-label-tertiary': 3,
  '--dsw-alias-label-caption': 2.6,
  '--dsw-alias-label-dimmed': 2.2,
  '--dsw-alias-label-primary-bluish': 4.5,
}

/** Tokens whose label is `label-primary-foreground` (the primary/contrast button and the brand). */
const FOREGROUND_SURFACES = ['--dsw-alias-button-primary-fill', '--dsw-alias-button-contrast-fill', '--dsw-alias-brand-primary']

test('every preset keeps its text above the contrast floors', () => {
  const failures = []
  for (const preset of presets.PRESETS) {
    if (preset.id === 'default') continue
    for (const mode of ['light', 'dark']) {
      const value = (name) => preset.tokens[name]?.[mode]
      for (const [tier, floor] of Object.entries(TIER_FLOORS)) {
        const text = value(tier)
        if (text === undefined) continue
        for (const surface of SURFACES) {
          const ratio = contrast(text, value(surface))
          if (ratio !== undefined && ratio < floor) {
            failures.push(preset.id + '/' + mode + ': ' + tier.replace('--dsw-alias-', '') + ' on ' + surface.replace(/^--dsw-(alias-)?/, '') + ' = ' + ratio.toFixed(2) + ' < ' + floor)
          }
        }
      }
      const onPrimary = value('--dsw-alias-label-primary-foreground')
      for (const surface of FOREGROUND_SURFACES) {
        const ratio = contrast(onPrimary, value(surface))
        if (ratio !== undefined && ratio < 4.5) {
          failures.push(preset.id + '/' + mode + ': label-primary-foreground on ' + surface.replace(/^--dsw-(alias-)?/, '') + ' = ' + ratio.toFixed(2) + ' < 4.5')
        }
      }
      const brand = value('--dsw-alias-brand-primary')
      for (const surface of ['--dsw-alias-bg-base', '--dsw-alias-bg-layer-1']) {
        const ratio = contrast(brand, value(surface))
        if (ratio !== undefined && ratio < 3) {
          failures.push(preset.id + '/' + mode + ': brand-primary on ' + surface.replace('--dsw-alias-', '') + ' = ' + ratio.toFixed(2) + ' < 3')
        }
      }
    }
  }
  assert.deepEqual(failures, [])
})

test('every preset token exists in the installed DSH theme', { skip }, () => {
  const known = new Set([...Object.keys(TOKENS.light), ...Object.keys(TOKENS.dark)])
  const unknown = []
  for (const preset of presets.PRESETS) {
    for (const name of Object.keys(preset.tokens)) if (!known.has(name)) unknown.push(preset.id + ' -> ' + name)
  }
  // A token DSH does not define is not an error the engine can report: it just becomes an
  // unused variable, and the intended surface stays whatever the palette said.
  assert.deepEqual(unknown, [])
})

test('a preset never leaves the other mode\'s surfaces or text behind', { skip }, () => {
  // Chips that are deliberately the opposite of the theme (a dark toast on a light app, an
  // inverted label on it, translucent skeletons, selection veils…) and their labels.
  const allow = /-inverted|document-selection|deep-diving|shimmer|glass|disabled|skeleton|toast-|tooltip-|scrim|mask/
  const isText = (name) => /label|foreground|icon/.test(name) && !/bg|fill/.test(name)
  const isSurface = (name) => /^--dsw-alias-bg-|-fill$|^--dsw-specific-|-bg$/.test(name)
  const problems = []
  for (const preset of presets.PRESETS) {
    if (preset.id === 'default') continue
    for (const mode of ['light', 'dark']) {
      const effective = { ...TOKENS[mode] }
      for (const [name, modes] of Object.entries(preset.tokens)) effective[name] = modes[mode]
      const base = luminance(effective['--dsw-alias-bg-base'])
      if (base === undefined) continue
      const dark = base < 0.5
      for (const [name, value] of Object.entries(effective)) {
        if (preset.tokens[name] !== undefined || allow.test(name)) continue
        const level = luminance(value)
        if (level === undefined) continue
        if (isSurface(name) && !isText(name) && ((dark && level > 0.55) || (!dark && level < 0.25))) {
          problems.push(preset.id + '/' + mode + ': surface ' + name + ' = ' + value + ' on a ' + (dark ? 'dark' : 'light') + ' theme')
        }
        if (isText(name) && ((dark && level < 0.25) || (!dark && level > 0.8))) {
          problems.push(preset.id + '/' + mode + ': text ' + name + ' = ' + value + ' on a ' + (dark ? 'dark' : 'light') + ' theme')
        }
      }
    }
  }
  assert.deepEqual(problems, [])
})
