/**
 * Skin data model — browser-safe (NO schemastery import). The schemastery
 * schemastery schema DSH 0.1.7 derives the settings form from lives in
 * `./host-schema.ts` (exported as `Config`; the entry id is the namespace).
 *
 * A skin is an additive, reversible overlay over native DSH styling:
 *   - tokens: semantic --dsw-* values via the official ctx.theme registry.
 *   - css: per-element rules captured from the real DOM at edit time.
 *   - text: content replacement (e.g. the hero headline).
 *   - canvas: editor-only layout (background image and image layers).
 *   - library: named saved skins for one-tap switching.
 */

/** Settings namespace owned by the skin plugin (equals the profile entry id). */
export const SKIN_SETTINGS_NAMESPACE = 'dsh-myskin'

/** Namespace used by builds before the 0.2 migration; still followed when the Host serves it. */
export const LEGACY_SETTINGS_NAMESPACE = 'myskin'

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

/**
 * How an embedded image is painted.
 *
 *   - `embed`  (组件嵌入): painted INSIDE the anchored component, as its `::after` — clipped by
 *               the container, above its background and below its content (0.3.8 behaviour);
 *   - `anchor` (组件锚定): painted OUTSIDE it, on a skin-owned overlay tracked to the
 *               component's box — never clipped, offsets may be negative, and the host
 *               element's own `position` / `overflow` are left completely alone.
 */
export type ImageMode = 'embed' | 'anchor'

/** What an embedded image is glued to. */
export type AnchorKind = 'element' | 'text' | 'component' | 'group'

/**
 * The anchor of an embedded image: WHAT the picture follows.
 *
 * A structural selector alone breaks the moment React reshuffles a sibling — and a user
 * who changes a button's copy should not lose the ornament glued to it. So an image may be
 * anchored to one element (the selector), to a piece of copy (the text — resolved by what
 * the app actually renders), or to a named landmark of the DSH UI (the component catalog in
 * `src/client/anchors.ts`). All three end up as one real element; the engine tags that
 * element with `data-dsh-myskin-embed="<image id>"` and re-resolves the anchor across
 * React rebuilds.
 */
export interface ImageAnchor {
  kind: AnchorKind
  /**
   * element → a structural selector; text → the copy to follow; component → catalog id;
   * group → a block selector, in which case EVERY match is painted (the image lands on each
   * workspace row, including the ones created later).
   */
  value: string
  /** Human label frozen when the anchor was authored, so the list still reads well later. */
  label?: string
}

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
  /**
   * Structural selector of the element the image was embedded on.
   *
   * Kept as the identity of last resort: it is what a legacy document (written before
   * anchors existed) carries, and what a text/component anchor falls back to when the
   * anchor itself cannot be resolved right now.
   */
  fallbackSelector?: string
  /** What the image follows. Absent = the legacy behaviour (the selector IS the anchor). */
  anchor?: ImageAnchor
  /** How it is painted. Absent = `embed` (组件嵌入), which is what 0.3.8 wrote. */
  mode?: ImageMode
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
export interface SkinCanvas {
  background?: string
  /**
   * How strongly the shell surface covers the background image (0..1). 1 leaves
   * the app untouched; lower values show more of the image. Cards, menus and
   * dialogs stay opaque either way. Absent means DEFAULT_BACKGROUND_OPACITY.
   */
  backgroundOpacity?: number
  images: EmbeddedImage[]
}
/**
 * The identity document to RESTORE TO — the native look, with the user's skin library kept.
 *
 * 「还原默认」 means "back to DSH's own look", not "delete the skins I saved": the library is user
 * data (named skins, each with its own canvas and images), not part of the current look, so a
 * one-click reset must not destroy it. {@link EMPTY_SKIN} stays the truly empty document — what a
 * missing or unreadable document falls back to.
 * @param current - the document being reset; its library is carried over.
 * @returns a fresh identity document, safe to store.
 */
export function resetSkin(current?: SkinSettings): SkinSettings {
  const identity = cloneSkin(EMPTY_SKIN)
  if (current === undefined) return identity
  // cloneSkin does the deep copy of the entries themselves (they carry their own canvas/images).
  return cloneSkin({ ...identity, library: current.library ?? [] })
}

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

/**
 * Defensive copy of one embedded image.
 *
 * The anchor is a nested object, so a plain spread would hand two documents the same
 * reference and an edit in the editor would reach into the persisted value.
 * @param img - the image to copy.
 * @returns an independent copy.
 */
function cloneImage(img: EmbeddedImage): EmbeddedImage {
  const copy: EmbeddedImage = { ...img }
  if (img.anchor === undefined) delete copy.anchor
  else copy.anchor = { ...img.anchor }
  return copy
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
      images: (skin.canvas?.images ?? []).map(cloneImage),
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
        images: (s.canvas?.images ?? []).map(cloneImage),
      },
      layers: (s.layers ?? []).map((l) => ({ ...l })),
    })),
  }
}

/**
 * The effective painting mode of one image.
 * @param img - the embedded image.
 * @returns `anchor` only when it was asked for; anything else is 组件嵌入.
 */
export function imageModeOf(img: EmbeddedImage): ImageMode {
  return img.mode === 'anchor' ? 'anchor' : 'embed'
}

/** Parse/validate a defensive copy (no schemastery; structural only). */
export function parseSkin(skin: SkinSettings | undefined): SkinSettings {
  if (skin === undefined) return cloneSkin(EMPTY_SKIN)
  return cloneSkin(skin)
}