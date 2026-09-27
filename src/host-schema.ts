/**
 * Host-only settings schema for the `dsh-myskin` namespace (DSH 0.1.7 model).
 *
 * DSH 0.1.7 removed the imperative `settings.register(ns, schema)` API: a profile
 * plugin entry's exported `Config` IS its settings schema, and the entry id is the
 * namespace. `SettingsForms` serializes the schema (`schema.toJSON()`) to the
 * browser, which rehydrates it with `new Schema(json)` before deriving the form,
 * so this must be a real schemastery schema — a hand-rolled callable cannot cross
 * that wire.
 *
 * EVERY top-level field carries `.volatile()` (schemastery >= 3.18.4, the version
 * DSH 0.1.7 ships), matching the shipped ui-theme Config: `settings.mutate` and
 * the browser form refuse path writes outside a volatile node with `Config field
 * "..." is not volatile`, and the canvas edits this document continuously. DSH
 * unwraps volatile accessors with its own `plainConfig()` before projecting the
 * wire value, so the browser still receives a plain JSON document.
 *
 * Every field mirrors `SkinSettings` in ./skin-schema.ts. Defaults keep an older
 * or partial document loadable; the browser half still normalizes defensively
 * with `parseSkin`.
 */
import z from '@deepseek-ai/schemastery'

/** One `--dsw-*` token override: both palette modes are mandatory. */
const modes = z.object({
  light: z.string().default('#000000'),
  dark: z.string().default('#ffffff'),
})

/** One user-authored CSS rule pair. */
const cssRule = z.object({ selector: z.string().default(''), rule: z.string().default('') })

/** One text-node / placeholder replacement. */
const textRule = z.object({
  selector: z.string().default(''),
  before: z.string().default(''),
  after: z.string().default(''),
})

/** CSS mix-blend-mode shared by both image kinds. */
const blend = z.union(['normal', 'multiply', 'screen', 'overlay']).default('normal')

/** Container-embedded background image (behind the container content). */
const embeddedImage = z.object({
  id: z.string().default(''),
  selector: z.string().default(''),
  url: z.string().default(''),
  x: z.number().default(0),
  y: z.number().default(0),
  w: z.number().default(0),
  h: z.number().default(0),
  opacity: z.number().default(1),
  blend,
  fallbackSelector: z.string().default(''),
  pageKey: z.string().default(''),
})

/** A REAL DOM node the skin injects (img/div); removed byte-exactly on dispose. */
const injectedLayer = z.object({
  id: z.string().default(''),
  kind: z.union(['img', 'div']).default('img'),
  url: z.string().default(''),
  selector: z.string().default(''),
  attach: z.union(['prepend', 'append']).default('append'),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  opacity: z.number(),
  blend: z.union(['normal', 'multiply', 'screen', 'overlay']),
  css: z.string().default(''),
  pageKey: z.string().default(''),
})

/** One saved, named skin in the library. */
const namedSkin = z.object({
  id: z.string().default(''),
  name: z.string().default(''),
  tokens: z.dict(modes).default({}),
  css: z.array(cssRule).default([]),
  text: z.array(textRule).default([]),
  canvas: z.object({ background: z.string(), backgroundOpacity: z.number().min(0.35).max(1).default(0.75), images: z.array(embeddedImage).default([]) }).default({}),
  layers: z.array(injectedLayer).default([]),
})

/** The durable `dsh-myskin` document; also the browser form's wire schema. */
export const Config = z.object({
  enabled: z.boolean().default(false).volatile(),
  tokens: z.dict(modes).default({}).volatile(),
  css: z.array(cssRule).default([]).volatile(),
  text: z.array(textRule).default([]).volatile(),
  canvas: z.object({
    background: z.string(),
    backgroundOpacity: z.number().min(0.35).max(1).default(0.75),
    images: z.array(embeddedImage).default([]),
  }).default({}).volatile(),
  layers: z.array(injectedLayer).default([]).volatile(),
  content: z.object({ workspaceTree: z.boolean().default(false) }).default({}).volatile(),
  library: z.array(namedSkin).default([]).volatile(),
})
