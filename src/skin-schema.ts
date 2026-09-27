/**
 * Skin data model — browser-safe (NO schemastery import). The schemastery
 * schema used for the Host settings register lives in `./host-schema.ts`.
 *
 * A skin is an additive, reversible overlay over native DSH styling:
 *   - tokens: semantic --dsw-* values via the official ctx.theme registry.
 *   - css: per-element rules captured from the real DOM at edit time.
 *   - text: content replacement (e.g. the hero headline).
 *   - canvas: editor-only layout (background image and image layers).
 *   - library: named saved skins for one-tap switching.
 */

/** Settings namespace owned by the skin plugin. */
export const SKIN_SETTINGS_NAMESPACE = 'myskin'

/** One token override: both palette modes are mandatory. */
export interface TokenModes { light: string; dark: string }
/** Dictionary of token-name to per-mode value pairs. */
export type TokenOverrides = Record<string, TokenModes>
/** One per-element CSS rule pair. */
export interface CssRule { selector: string; rule: string }
/** One text replacement targeted at a real DSH node. */
export interface TextOverride { selector: string; before: string; after: string }

/** CSS `mix-blend-mode` available for an embedded image layer. */
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay'

/** One background image embedded behind a container's content (not a fixed overlay). */
export interface EmbeddedImage {
  id: string
  /** Container selector the image is attached to. */
  selector: string
  url: string
  /** background-position relative to the container. */
  x: number
  y: number
  /** background-size. */
  w: number
  h: number
  opacity?: number
  /** CSS mix-blend-mode applied over the container's background (default normal). */
  blend?: BlendMode
  /** Structural fallback selector (re-applied to the real page on apply). */
  fallbackSelector?: string
  /** Settings-page scope the image was embedded on (''/undefined = global). */
  pageKey?: string
}

/** Where an injected layer is placed inside its container. */
export type LayerAttach = 'prepend' | 'append'

/**
 * One *real* DOM node (img/div) the skin injects — NOT a ::after pseudo-element.
 * This is what lets a skin express the "dsh-deep-whale depth": instanced
 * character art, sidebar mascots, ornamental corners/trims, frames. It is added
 * as an aria-hidden node, tagged with `data-dsh-myskin-layer`, and fully removed
 * on dispose (and re-injected across React rebuilds / late mounts). State
 * following is done by the skin's `css` rules targeting this stable marker under
 * DSH's real state attributes (e.g. `[data-phase='active'] [data-dsh-myskin-layer='x']`).
 */
export interface InjectedLayer {
  id: string
  /** Node kind to create. */
  kind: 'img' | 'div'
  /** img src (img kind) / background-image url (div kind). */
  url?: string
  /** Container selector the layer is injected into (must uniquely match). */
  selector: string
  /** Place the node before (prepend) or after (append) existing children. */
  attach?: LayerAttach
  /** Offsets / size in px (written as inline left/top/width/height). */
  x?: number
  y?: number
  w?: number
  h?: number
  opacity?: number
  /** CSS mix-blend-mode (default normal). */
  blend?: BlendMode
  /** Extra CSS declarations for the node (e.g. `position: fixed; bottom: 0`). */
  css?: string
  /** Settings-page scope the layer is bound to (''/undefined = global). */
  pageKey?: string
}

/** Editor-only canvas layout. */
export interface SkinCanvas { background?: string; images: EmbeddedImage[] }
/** One saved, named skin in the library. */
export interface NamedSkin {
  id: string
  name: string
  tokens: TokenOverrides
  css: CssRule[]
  text: TextOverride[]
  canvas: SkinCanvas
  layers: InjectedLayer[]
}
/** The durable skin document. */
export interface SkinSettings {
  enabled: boolean
  tokens: TokenOverrides
  css: CssRule[]
  text: TextOverride[]
  canvas: SkinCanvas
  layers: InjectedLayer[]
  /** Optional built-in decorators (e.g. tagging the dynamic workspace/session tree). */
  content?: { workspaceTree?: boolean }
  library: NamedSkin[]
}

/** Empty (identity) skin — reverting returns the UI to native DSH. */
export const EMPTY_SKIN: SkinSettings = {
  enabled: false,
  tokens: {},
  css: [],
  text: [],
  canvas: { background: undefined, images: [] },
  layers: [],
  library: [],
}

/** Defensive copy; keeps the persisted document immutable. */
export function cloneSkin(skin: SkinSettings): SkinSettings {
  return {
    enabled: skin.enabled === true,
    tokens: { ...(skin.tokens ?? {}) },
    css: (skin.css ?? []).map((r) => ({ selector: r.selector, rule: r.rule })),
    text: (skin.text ?? []).map((o) => ({ selector: o.selector, before: o.before, after: o.after })),
    canvas: {
      ...(skin.canvas ?? { images: [] }),
      images: (skin.canvas?.images ?? []).map((i) => ({ ...i })),
    },
    layers: (skin.layers ?? []).map((l) => ({ ...l })),
    library: (skin.library ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      tokens: { ...(s.tokens ?? {}) },
      css: (s.css ?? []).map((r) => ({ selector: r.selector, rule: r.rule })),
      text: (s.text ?? []).map((o) => ({ selector: o.selector, before: o.before, after: o.after })),
      canvas: {
        ...(s.canvas ?? { images: [] }),
        images: (s.canvas?.images ?? []).map((i) => ({ ...i })),
      },
      layers: (s.layers ?? []).map((l) => ({ ...l })),
    })),
  }
}

/** Parse/validate a defensive copy (no schemastery; structural only). */
export function parseSkin(skin: SkinSettings | undefined): SkinSettings {
  if (skin === undefined) return cloneSkin(EMPTY_SKIN)
  return cloneSkin(skin)
}