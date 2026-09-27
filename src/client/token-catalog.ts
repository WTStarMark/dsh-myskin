/**
 * Curated --dsw-* token catalog for the visual canvas token editor.
 * Tokens are technical by nature, so this lives in the drawing tool (not the
 * general settings page). Grouped so the panel reads as a palette.
 */

export type TokenGroup = 'background' | 'border' | 'brand' | 'label' | 'button' | 'interactive'

export interface TokenDef {
  name: string
  group: TokenGroup
}

/** Group id -> locale key for the group heading. */
export const TOKEN_GROUP_KEYS: Record<TokenGroup, string> = {
  background: 'tokenGroupBackground',
  border: 'tokenGroupBorder',
  brand: 'tokenGroupBrand',
  label: 'tokenGroupLabel',
  button: 'tokenGroupButton',
  interactive: 'tokenGroupInteractive',
}

/** Commonly-adjusted alias/specific tokens, grouped for the palette. */
export const TOKEN_CATALOG: readonly TokenDef[] = [
  { name: '--dsw-alias-bg-base', group: 'background' },
  { name: '--dsw-alias-bg-layer-1', group: 'background' },
  { name: '--dsw-alias-bg-layer-2', group: 'background' },
  { name: '--dsw-alias-bg-overlay', group: 'background' },
  { name: '--dsw-specific-sidebar-fill', group: 'background' },
  { name: '--dsw-alias-border-l1', group: 'border' },
  { name: '--dsw-alias-border-l2', group: 'border' },
  { name: '--dsw-alias-brand-primary', group: 'brand' },
  { name: '--dsw-alias-label-primary', group: 'label' },
  { name: '--dsw-alias-label-secondary', group: 'label' },
  { name: '--dsw-alias-label-tertiary', group: 'label' },
  { name: '--dsw-alias-button-primary-fill', group: 'button' },
  { name: '--dsw-alias-button-primary-hover', group: 'button' },
  { name: '--dsw-alias-button-primary-dimmed', group: 'button' },
  { name: '--dsw-alias-button-elevated-fill', group: 'button' },
  { name: '--dsw-alias-button-floating-fill', group: 'button' },
  { name: '--dsw-alias-interactive-bg-hover', group: 'interactive' },
  { name: '--dsw-alias-interactive-bg-active', group: 'interactive' },
]
