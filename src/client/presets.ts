/**
 * Built-in token skin presets. Each preset is a broad `--dsw-*` palette applied
 * through the skin engine (official `ctx.theme.overrideTokens` + a direct body
 * var bind). Every token carries a { light, dark } pair.
 *
 * Two rules these palettes are built on, because both are invisible failure modes:
 *
 *   1. **Text must stay readable.** Every text tier is chosen against the surfaces it
 *      actually sits on (base / layer-1..3 / overlay / sidebar / module platform / button
 *      fills / bubbles), and the primary button's label — `button-primary-fill` IS
 *      `brand-primary` in DSH, and its text is `label-primary-foreground` — is checked
 *      against the brand. `tests/preset-contrast.test.mjs` enforces the floors.
 *   2. **A preset has to cover the mode it builds.** All three presets follow the app's
 *      palette mode (light column = light UI, dark column = dark UI), so the surfaces DSH
 *      resolves for that mode stay coherent. A preset that forced one mode in both columns
 *      would ALSO have to override everything DSH resolves from the other palette
 *      (document preview, chat bubble, file-diff and menu surfaces, the dimmed label…) —
 *      skipping them leaves near-white patches with near-white text, the "看不清" report.
 *      `tests/preset-contrast.test.mjs` fails the build if any preset drifts that way.
 */
import type { TokenOverrides } from '../skin-schema.ts'
import type { MySkinKey } from './locales.ts'

export interface SkinPreset {
  id: string
  labelKey: MySkinKey
  tokens: TokenOverrides
}

type Modes = { light: string; dark: string }

/** Button-surface tokens: elevated (New Session), floating, contrast. */
function surfaces(elevated: Modes, floating: Modes, floatHover: Modes, contrast: Modes): TokenOverrides {
  return {
    '--dsw-alias-button-elevated-fill': elevated,
    '--dsw-alias-button-floating-fill': floating,
    '--dsw-alias-button-floating-hover': floatHover,
    '--dsw-alias-button-contrast-fill': contrast,
  }
}

/** Primary + interactive tokens. `fg` is the label ON the primary fill (and on contrast). */
function primary(brand: Modes, dimmed: Modes, hover: Modes, fg: Modes): TokenOverrides {
  return {
    '--dsw-alias-button-primary-fill': brand,
    '--dsw-alias-button-primary-dimmed': dimmed,
    '--dsw-alias-button-primary-hover': hover,
    '--dsw-alias-label-primary-foreground': fg,
  }
}

function interactive(hover: Modes, active: Modes): TokenOverrides {
  return {
    '--dsw-alias-interactive-bg-hover': hover,
    '--dsw-alias-interactive-bg-active': active,
  }
}

function toolbar(fill: Modes, hover: Modes): TokenOverrides {
  return { '--dsw-alias-button-tool-bar-fill': fill, '--dsw-alias-button-tool-bar-hover': hover }
}

/** Label tiers + selector-pill surface. */
function labels(tertiary: Modes, caption: Modes, dimmed: Modes, modulePlatform: Modes): TokenOverrides {
  return {
    '--dsw-alias-label-tertiary': tertiary,
    '--dsw-alias-label-caption': caption,
    '--dsw-alias-label-dimmed': dimmed,
    '--dsw-alias-bg-module-platform': modulePlatform,
  }
}

/**
 * The surfaces and labels DSH tints with ITS blue brand.
 *
 * The user's own chat bubble, the bubble highlight, the selected navigation accent and the
 * brand-ish label are all derived from DSH's blue in the stock theme — a preset that recolours
 * the app but leaves them alone ends up with a light-blue bubble in a terracotta or rose UI.
 * Every preset tints them to its own hue.
 */
function brandTinted(bubble: Modes, bubbleHighlight: Modes, navAccent: Modes, labelBluish: Modes): TokenOverrides {
  return {
    '--dsw-specific-bubble': bubble,
    '--dsw-specific-bubble-highlight': bubbleHighlight,
    '--dsw-specific-sidebar-nav-item-active-accent': navAccent,
    '--dsw-alias-label-primary-bluish': labelBluish,
  }
}

/** Deeper layers, borders, state + scrollbars (agent-preset / plugins). */
function chrome(bgLayer3: Modes, borderL3: Modes, business: Modes, hoverDanger: Modes, sb1: Modes, sb2: Modes, sbh1: Modes, sbh2: Modes): TokenOverrides {
  return {
    '--dsw-alias-bg-layer-3': bgLayer3,
    '--dsw-alias-border-l3': borderL3,
    '--dsw-alias-state-business-primary': business,
    '--dsw-alias-interactive-bg-hover-danger': hoverDanger,
    '--dsw-alias-scrollbar-bg-l1': sb1,
    '--dsw-alias-scrollbar-bg-l2': sb2,
    '--dsw-alias-scrollbar-hover-l1': sbh1,
    '--dsw-alias-scrollbar-hover-l2': sbh2,
  }
}

/** Composer / input / selector / nav-cell tokens. */
function surfacesPlus(input: Modes, selector: Modes, infoFill: Modes, infoHover: Modes, navHover: Modes, navActive: Modes, borderThin: Modes): TokenOverrides {
  return {
    '--dsw-specific-input-major': input,
    '--dsw-specific-selector': selector,
    '--dsw-alias-button-info-fill': infoFill,
    '--dsw-alias-button-info-hover': infoHover,
    '--dsw-specific-sidebar-nav-item-hover': navHover,
    '--dsw-specific-sidebar-nav-item-active': navActive,
    '--dsw-alias-border-l2-darkmode-thin': borderThin,
  }
}

/** 深海 — cool azure on blue-slate paper. */
const deep: TokenOverrides = {
  '--dsw-alias-bg-base': { light: '#f4f7fb', dark: '#0c1322' },
  '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#121b2c' },
  '--dsw-alias-bg-layer-2': { light: '#e9eff7', dark: '#182338' },
  '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#1b2740' },
  '--dsw-specific-sidebar-fill': { light: '#eaf0f8', dark: '#0e1727' },
  '--dsw-alias-border-l1': { light: '#d6dfec', dark: '#24324a' },
  '--dsw-alias-border-l2': { light: '#c0cde0', dark: '#2f4059' },
  '--dsw-alias-brand-primary': { light: '#1d4ed8', dark: '#60a5fa' },
  '--dsw-alias-label-primary': { light: '#0b1729', dark: '#e8eefb' },
  '--dsw-alias-label-secondary': { light: '#3f5069', dark: '#b3c1d6' },
  ...primary({ light: '#1d4ed8', dark: '#60a5fa' }, { light: '#dbe4f0', dark: '#22304a' }, { light: '#1e40af', dark: '#93c5fd' }, { light: '#ffffff', dark: '#08111f' }),
  ...surfaces({ light: '#ffffff', dark: '#162033' }, { light: '#ffffff', dark: '#1b2740' }, { light: '#e9eff7', dark: '#253352' }, { light: '#0f1b2e', dark: '#f2f6ff' }),
  ...interactive({ light: 'rgba(29,78,216,0.07)', dark: 'rgba(96,165,250,0.10)' }, { light: 'rgba(29,78,216,0.13)', dark: 'rgba(96,165,250,0.16)' }),
  ...toolbar({ light: '#dfe8f4', dark: '#1b2740' }, { light: '#ccd9ea', dark: '#253352' }),
  ...surfacesPlus({ light: '#ffffff', dark: '#121b2c' }, { light: '#eef3f9', dark: '#182338' }, { light: '#1d4ed8', dark: '#60a5fa' }, { light: '#1e40af', dark: '#93c5fd' }, { light: 'rgba(29,78,216,0.06)', dark: 'rgba(96,165,250,0.08)' }, { light: '#dbe7fb', dark: '#1c2a44' }, { light: 'rgba(11,23,41,0.10)', dark: 'rgba(148,163,184,0.14)' }),
  ...labels({ light: '#5b6f8b', dark: '#93a4bd' }, { light: '#6b7f99', dark: '#7d8ea8' }, { light: '#8494a9', dark: '#5a6b85' }, { light: '#eef3f9', dark: '#162032' }),
  ...chrome({ light: '#dfe8f4', dark: '#1e2a42' }, { light: '#9dafc9', dark: '#3d5271' }, { light: '#1d4ed8', dark: '#60a5fa' }, { light: 'rgba(220,38,38,0.07)', dark: 'rgba(248,113,113,0.12)' }, { light: 'rgba(11,23,41,0.12)', dark: 'rgba(226,232,240,0.14)' }, { light: 'rgba(11,23,41,0.18)', dark: 'rgba(226,232,240,0.20)' }, { light: 'rgba(11,23,41,0.18)', dark: 'rgba(226,232,240,0.20)' }, { light: 'rgba(11,23,41,0.26)', dark: 'rgba(226,232,240,0.28)' }),
  ...brandTinted({ light: '#e8effb', dark: '#1c2c46' }, { light: '#d3e2f8', dark: '#1f3250' }, { light: '#dbe7fb', dark: '#1c2a44' }, { light: '#13336b', dark: '#a8c6f5' }),
}

/** 暖阳 — terracotta on sand paper. */
const warm: TokenOverrides = {
  '--dsw-alias-bg-base': { light: '#fbf7f0', dark: '#17110b' },
  '--dsw-alias-bg-layer-1': { light: '#fffdf8', dark: '#211810' },
  '--dsw-alias-bg-layer-2': { light: '#f4e9d8', dark: '#2a1f14' },
  '--dsw-alias-bg-overlay': { light: '#fffdf8', dark: '#33261a' },
  '--dsw-specific-sidebar-fill': { light: '#f7efe1', dark: '#1b140d' },
  '--dsw-alias-border-l1': { light: '#e3d5bf', dark: '#3b2c1d' },
  '--dsw-alias-border-l2': { light: '#d3c0a3', dark: '#4d3a26' },
  '--dsw-alias-brand-primary': { light: '#b45309', dark: '#fbbf24' },
  '--dsw-alias-label-primary': { light: '#2a1f14', dark: '#f7efe3' },
  '--dsw-alias-label-secondary': { light: '#5b4732', dark: '#d3bfa4' },
  ...primary({ light: '#b45309', dark: '#fbbf24' }, { light: '#e8dcc8', dark: '#3a2c1c' }, { light: '#92400e', dark: '#fcd34d' }, { light: '#ffffff', dark: '#1a1206' }),
  ...surfaces({ light: '#fffdf8', dark: '#2a1f14' }, { light: '#fffdf8', dark: '#33261a' }, { light: '#f4e9d8', dark: '#3f2f1f' }, { light: '#2a1f14', dark: '#f7efe3' }),
  ...interactive({ light: 'rgba(180,83,9,0.07)', dark: 'rgba(251,191,36,0.10)' }, { light: 'rgba(180,83,9,0.13)', dark: 'rgba(251,191,36,0.16)' }),
  ...toolbar({ light: '#efdfc8', dark: '#2a1f14' }, { light: '#e3cfb0', dark: '#3a2c1c' }),
  ...surfacesPlus({ light: '#fffdf8', dark: '#211810' }, { light: '#f6eddd', dark: '#2a1f14' }, { light: '#b45309', dark: '#fbbf24' }, { light: '#92400e', dark: '#fcd34d' }, { light: 'rgba(180,83,9,0.06)', dark: 'rgba(251,191,36,0.08)' }, { light: '#f2e0c8', dark: '#3a2c1c' }, { light: 'rgba(42,31,20,0.10)', dark: 'rgba(215,190,150,0.14)' }),
  ...labels({ light: '#77624a', dark: '#b39a78' }, { light: '#8a7458', dark: '#9a8362' }, { light: '#a08a6b', dark: '#7a6a52' }, { light: '#f6eddd', dark: '#241a12' }),
  ...chrome({ light: '#eedfc9', dark: '#33271a' }, { light: '#b89b76', dark: '#654c31' }, { light: '#b45309', dark: '#fbbf24' }, { light: 'rgba(220,38,38,0.07)', dark: 'rgba(248,113,113,0.12)' }, { light: 'rgba(42,31,20,0.12)', dark: 'rgba(235,220,200,0.14)' }, { light: 'rgba(42,31,20,0.18)', dark: 'rgba(235,220,200,0.20)' }, { light: 'rgba(42,31,20,0.18)', dark: 'rgba(235,220,200,0.20)' }, { light: 'rgba(42,31,20,0.26)', dark: 'rgba(235,220,200,0.28)' }),
  ...brandTinted({ light: '#fbeee0', dark: '#34261a' }, { light: '#f6ddc2', dark: '#453121' }, { light: '#f7e3cd', dark: '#3a2c1c' }, { light: '#6d3f12', dark: '#f0c98a' }),
}

/** 粉黛 — rose paper by day, deep plum by night. */
const rose: TokenOverrides = {
  '--dsw-alias-bg-base': { light: '#fdf5f7', dark: '#180d13' },
  '--dsw-alias-bg-layer-1': { light: '#fffafc', dark: '#221219' },
  '--dsw-alias-bg-layer-2': { light: '#f9e6ec', dark: '#2c1921' },
  '--dsw-alias-bg-overlay': { light: '#fffafc', dark: '#37222c' },
  '--dsw-specific-sidebar-fill': { light: '#f8ecf1', dark: '#1c1017' },
  '--dsw-alias-border-l1': { light: '#eed4dd', dark: '#3a222c' },
  '--dsw-alias-border-l2': { light: '#e0bcc9', dark: '#4c2d3a' },
  '--dsw-alias-brand-primary': { light: '#be123c', dark: '#fb7185' },
  '--dsw-alias-label-primary': { light: '#3d1220', dark: '#fbeaf0' },
  '--dsw-alias-label-secondary': { light: '#6d3448', dark: '#d9b3c1' },
  ...primary({ light: '#be123c', dark: '#fb7185' }, { light: '#f0d6de', dark: '#40202d' }, { light: '#9f1239', dark: '#fda4af' }, { light: '#ffffff', dark: '#2a0f1b' }),
  ...surfaces({ light: '#fffafc', dark: '#2c1921' }, { light: '#fffafc', dark: '#37222c' }, { light: '#f9e6ec', dark: '#452b37' }, { light: '#3d1220', dark: '#fbeaf0' }),
  ...interactive({ light: 'rgba(190,18,60,0.06)', dark: 'rgba(251,113,133,0.10)' }, { light: 'rgba(190,18,60,0.12)', dark: 'rgba(251,113,133,0.16)' }),
  ...toolbar({ light: '#f4dbe3', dark: '#36202a' }, { light: '#eccbd6', dark: '#452b37' }),
  ...surfacesPlus({ light: '#fffafc', dark: '#221219' }, { light: '#f7e9ee', dark: '#2c1921' }, { light: '#be123c', dark: '#fb7185' }, { light: '#9f1239', dark: '#fda4af' }, { light: 'rgba(190,18,60,0.05)', dark: 'rgba(251,113,133,0.08)' }, { light: '#f7dbe4', dark: '#43222f' }, { light: 'rgba(61,18,32,0.10)', dark: 'rgba(251,228,238,0.14)' }),
  ...labels({ light: '#8d5468', dark: '#b98ba0' }, { light: '#9c6b7c', dark: '#a67b8e' }, { light: '#ab7d91', dark: '#8a6072' }, { light: '#f7e9ee', dark: '#241319' }),
  ...chrome({ light: '#f4d9e2', dark: '#36202a' }, { light: '#c794a6', dark: '#654050' }, { light: '#be123c', dark: '#fb7185' }, { light: 'rgba(220,38,38,0.07)', dark: 'rgba(248,113,113,0.12)' }, { light: 'rgba(61,18,32,0.12)', dark: 'rgba(251,228,238,0.14)' }, { light: 'rgba(61,18,32,0.18)', dark: 'rgba(251,228,238,0.20)' }, { light: 'rgba(61,18,32,0.18)', dark: 'rgba(251,228,238,0.20)' }, { light: 'rgba(61,18,32,0.26)', dark: 'rgba(251,228,238,0.28)' }),
  ...brandTinted({ light: '#fce9ef', dark: '#3a1f29' }, { light: '#f8d7e1', dark: '#4b2a36' }, { light: '#f7dbe4', dark: '#43222f' }, { light: '#7a1733', dark: '#f8b8c8' }),
}
export const PRESETS: readonly SkinPreset[] = [
  { id: 'default', labelKey: 'presetDefault', tokens: {} },
  { id: 'deep', labelKey: 'presetDeep', tokens: deep },
  { id: 'warm', labelKey: 'presetWarm', tokens: warm },
  { id: 'rose', labelKey: 'presetRose', tokens: rose },
]
