/**
 * Host-only settings schema for the `myskin` namespace.
 *
 * Deliberately schemastery-free: DSH's `settings.resolve()` only *calls* the
 * schema (and `toJSON()` for describe), so a minimal callable schema satisfies
 * it. This keeps the Host half fully self-contained (no `@deepseek-ai`
 * runtime import, no schemastery bundling), so it loads as a path/name entry.
 */
import type { SkinSettings } from './skin-schema.ts'

function defaultSkin(): SkinSettings {
  return { enabled: false, tokens: {}, css: [], text: [], canvas: { images: [] }, library: [] }
}

function normalize(value: unknown): SkinSettings {
  const section = (value ?? {}) as Partial<SkinSettings>
  return {
    enabled: section.enabled === true,
    tokens: section.tokens ?? {},
    css: section.css ?? [],
    text: section.text ?? [],
    canvas: section.canvas ?? { images: [] },
    layers: section.layers ?? [],
    content: section.content,
    library: section.library ?? [],
  }
}

/** Minimal callable validator satisfying settings.register(schema). */
export const SkinSettingsSchema = Object.assign(
  (value: unknown): SkinSettings => normalize(value),
  {
    toJSON(): unknown {
      return {
        type: 'object',
        fields: ['enabled', 'tokens', 'css', 'text', 'canvas', 'layers', 'library'],
      }
    },
  },
)

/** Re-export the identity/default shape for the Host half. */
export const DEFAULT_SKIN = defaultSkin()
