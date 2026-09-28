/**
 * Built-in token skin presets. Each preset is a broad `--dsw-*` palette applied
 * through the skin engine (official `ctx.theme.overrideTokens` + a direct body
 * var bind). Every token carries a { light, dark } pair, chosen so a one-tap
 * preset visibly re-themes the whole app — backgrounds, sidebar, borders,
 * labels, brand AND every button surface (elevated/floating/primary/dimmed/
 * contrast + interactive hover/active + toolbar + label-foreground).
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

/** Primary + interactive tokens. */
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

const deep: TokenOverrides = {
  '--dsw-alias-bg-base': { light: '#eef3fb', dark: '#0d1420' },
  '--dsw-alias-bg-layer-1': { light: '#f7faff', dark: '#131c2b' },
  '--dsw-alias-bg-layer-2': { light: '#eef3fb', dark: '#1a2437' },
  '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#1d2940' },
  '--dsw-specific-sidebar-fill': { light: '#e6edf9', dark: '#0f1826' },
  '--dsw-alias-border-l1': { light: '#cbd5e1', dark: '#263349' },
  '--dsw-alias-border-l2': { light: '#aab6c8', dark: '#334156' },
  '--dsw-alias-brand-primary': { light: '#2563eb', dark: '#4f8cff' },
  '--dsw-alias-label-primary': { light: '#0f172a', dark: '#e6edf7' },
  '--dsw-alias-label-secondary': { light: '#334155', dark: '#aab8cc' },
  ...primary({ light: '#2563eb', dark: '#4f8cff' }, { light: '#dbe7fb', dark: '#1e3a68' }, { light: '#1d4ed8', dark: '#7fb2ff' }, { light: '#ffffff', dark: '#eaf1ff' }),
  ...surfaces({ light: '#ffffff', dark: '#16233a' }, { light: '#ffffff', dark: '#1d2940' }, { light: '#e3ecfb', dark: '#2a3b5e' }, { light: '#dbe7fb', dark: '#1e3a68' }),
  ...interactive({ light: 'rgba(37,99,235,0.08)', dark: 'rgba(79,140,255,0.10)' }, { light: 'rgba(37,99,235,0.14)', dark: 'rgba(79,140,255,0.18)' }),
  ...toolbar({ light: '#e3ecfb', dark: '#1b2c4d' }, { light: '#cbdaf7', dark: '#24395f' }),
  ...surfacesPlus({ light: '#ffffff', dark: '#131c2b' }, { light: '#f5f6f7', dark: '#1d2940' }, { light: '#2563eb', dark: '#4f8cff' }, { light: '#1d4ed8', dark: '#7fb2ff' }, { light: 'rgba(37,99,235,0.06)', dark: 'rgba(79,140,255,0.08)' }, { light: '#dbe7fb', dark: '#1e3a68' }, { light: 'rgba(0,0,0,0.10)', dark: 'rgba(79,140,255,0.10)' }),
  ...labels({ light: '#5a6b85', dark: '#8ea0b8' }, { light: '#8a97ab', dark: '#6f8098' }, { light: '#aab6c8', dark: '#5a6b80' }, { light: '#e6edf9', dark: '#16233a' }),
  ...chrome({ light: '#e6edf9', dark: '#1a2437' }, { light: '#9fb2d0', dark: '#42598a' }, { light: '#2563eb', dark: '#4f8cff' }, { light: 'rgba(220,38,38,0.06)', dark: 'rgba(248,113,113,0.10)' }, { light: 'rgba(0,0,0,0.10)', dark: 'rgba(255,255,255,0.10)' }, { light: 'rgba(0,0,0,0.16)', dark: 'rgba(255,255,255,0.16)' }, { light: 'rgba(0,0,0,0.16)', dark: 'rgba(255,255,255,0.16)' }, { light: 'rgba(0,0,0,0.24)', dark: 'rgba(255,255,255,0.24)' }),
}

const warm: TokenOverrides = {
  '--dsw-alias-bg-base': { light: '#fdf8f0', dark: '#1a130e' },
  '--dsw-alias-bg-layer-1': { light: '#fffaF3', dark: '#241a12' },
  '--dsw-alias-bg-layer-2': { light: '#fdf0e0', dark: '#2a1e14' },
  '--dsw-alias-bg-overlay': { light: '#fff8ee', dark: '#33241a' },
  '--dsw-specific-sidebar-fill': { light: '#f8ead6', dark: '#1c130c' },
  '--dsw-alias-border-l1': { light: '#e4d3ba', dark: '#40301f' },
  '--dsw-alias-border-l2': { light: '#d2bd9c', dark: '#54402a' },
  '--dsw-alias-brand-primary': { light: '#ea580c', dark: '#fb923c' },
  '--dsw-alias-label-primary': { light: '#2a2118', dark: '#f7f0e8' },
  '--dsw-alias-label-secondary': { light: '#6b5843', dark: '#c9b7a2' },
  ...primary({ light: '#ea580c', dark: '#fb923c' }, { light: '#fbe0d0', dark: '#4a2c19' }, { light: '#c2410c', dark: '#ffab66' }, { light: '#ffffff', dark: '#241611' }),
  ...surfaces({ light: '#fff3e6', dark: '#3a2717' }, { light: '#fff8ee', dark: '#33241a' }, { light: '#f8ead6', dark: '#40301f' }, { light: '#fbe0d0', dark: '#4a2c19' }),
  ...interactive({ light: 'rgba(234,88,12,0.08)', dark: 'rgba(251,146,60,0.10)' }, { light: 'rgba(234,88,12,0.14)', dark: 'rgba(251,146,60,0.18)' }),
  ...toolbar({ light: '#f9e7d8', dark: '#3a2717' }, { light: '#f2d3b6', dark: '#4a311c' }),
  ...surfacesPlus({ light: '#fffdf8', dark: '#2a1e14' }, { light: '#f8ead6', dark: '#33241a' }, { light: '#ea580c', dark: '#fb923c' }, { light: '#c2410c', dark: '#ffab66' }, { light: 'rgba(234,88,12,0.06)', dark: 'rgba(251,146,60,0.08)' }, { light: '#fbe0d0', dark: '#4a2c19' }, { light: 'rgba(0,0,0,0.10)', dark: 'rgba(251,146,60,0.10)' }),
  ...labels({ light: '#8a6f52', dark: '#c9b7a2' }, { light: '#a08a70', dark: '#9a8873' }, { light: '#c0ab90', dark: '#75604a' }, { light: '#f8ead6', dark: '#2a1e14' }),
  ...chrome({ light: '#f3e2cf', dark: '#34231a' }, { light: '#c8b398', dark: '#6a4f32' }, { light: '#ea580c', dark: '#fb923c' }, { light: 'rgba(220,38,38,0.06)', dark: 'rgba(248,113,113,0.10)' }, { light: 'rgba(0,0,0,0.10)', dark: 'rgba(255,255,255,0.10)' }, { light: 'rgba(0,0,0,0.16)', dark: 'rgba(255,255,255,0.16)' }, { light: 'rgba(0,0,0,0.16)', dark: 'rgba(255,255,255,0.16)' }, { light: 'rgba(0,0,0,0.24)', dark: 'rgba(255,255,255,0.24)' }),
}

const night: TokenOverrides = {
  '--dsw-alias-bg-base': { light: '#0b0b0f', dark: '#000000' },
  '--dsw-alias-bg-layer-1': { light: '#131318', dark: '#0a0a0d' },
  '--dsw-alias-bg-layer-2': { light: '#0f0f14', dark: '#14141a' },
  '--dsw-alias-bg-overlay': { light: '#1b1b22', dark: '#1a1a22' },
  '--dsw-specific-sidebar-fill': { light: '#0d0d12', dark: '#000000' },
  '--dsw-alias-border-l1': { light: '#26262e', dark: '#26262e' },
  '--dsw-alias-border-l2': { light: '#33333c', dark: '#33333c' },
  '--dsw-alias-brand-primary': { light: '#a78bfa', dark: '#c4a7ff' },
  '--dsw-alias-label-primary': { light: '#f5f5fa', dark: '#ffffff' },
  '--dsw-alias-label-secondary': { light: '#9a9aa6', dark: '#b7b7c4' },
  ...primary({ light: '#a78bfa', dark: '#c4a7ff' }, { light: '#e9e2fb', dark: '#2e2450' }, { light: '#8b6ff5', dark: '#d3bcff' }, { light: '#1a1030', dark: '#1a1030' }),
  ...surfaces({ light: '#131318', dark: '#14141a' }, { light: '#1b1b22', dark: '#1a1a22' }, { light: '#26262e', dark: '#26262e' }, { light: '#e9e2fb', dark: '#2e2450' }),
  ...interactive({ light: 'rgba(167,139,250,0.08)', dark: 'rgba(196,167,255,0.10)' }, { light: 'rgba(167,139,250,0.14)', dark: 'rgba(196,167,255,0.18)' }),
  ...toolbar({ light: '#ded6f7', dark: '#241c40' }, { light: '#cec1f3', dark: '#2c2350' }),
  ...surfacesPlus({ light: '#131318', dark: '#0a0a0d' }, { light: '#1b1b22', dark: '#1a1a22' }, { light: '#a78bfa', dark: '#c4a7ff' }, { light: '#8b6ff5', dark: '#d3bcff' }, { light: 'rgba(167,139,250,0.06)', dark: 'rgba(196,167,255,0.08)' }, { light: '#e9e2fb', dark: '#2e2450' }, { light: 'rgba(0,0,0,0.10)', dark: 'rgba(196,167,255,0.10)' }),
  ...labels({ light: '#9a9aa6', dark: '#8a8a96' }, { light: '#7c7c88', dark: '#6f6f7b' }, { light: '#6f6f7b', dark: '#5c5c68' }, { light: '#1b1b22', dark: '#14141a' }),
  ...chrome({ light: '#0a0a0d', dark: '#0a0a0d' }, { light: '#3a3a44', dark: '#3a3a44' }, { light: '#a78bfa', dark: '#c4a7ff' }, { light: 'rgba(220,38,38,0.06)', dark: 'rgba(248,113,113,0.10)' }, { light: 'rgba(0,0,0,0.10)', dark: 'rgba(255,255,255,0.10)' }, { light: 'rgba(0,0,0,0.16)', dark: 'rgba(255,255,255,0.16)' }, { light: 'rgba(0,0,0,0.16)', dark: 'rgba(255,255,255,0.16)' }, { light: 'rgba(0,0,0,0.24)', dark: 'rgba(255,255,255,0.24)' }),
}

export const PRESETS: readonly SkinPreset[] = [
  { id: 'default', labelKey: 'presetDefault', tokens: {} },
  { id: 'deep', labelKey: 'presetDeep', tokens: deep },
  { id: 'warm', labelKey: 'presetWarm', tokens: warm },
  { id: 'night', labelKey: 'presetNight', tokens: night },
]
