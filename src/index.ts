/**
 * dsh-myskin Host (server) half.
 *
 * Registers the durable `myskin` settings namespace so the browser scope has a
 * persisted document to bind against. Everything visual is applied by the
 * client plugin AFTER the UI mounts — this half never touches DOM, never edits
 * DSH source or config, and only owns schema + persistence.
 *
 * Purposefully self-contained: schemastery (`z`) is inlined by the build, and
 * `settingsNamespace` is the identity function (no `@deepseek-ai/dsh-settings`
 * runtime import), so the host bundle loads with ZERO external `@deepseek-ai`
 * dependencies — safe to load as a path-based entry.
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import { SKIN_SETTINGS_NAMESPACE } from './skin-schema.ts'
import { SkinSettingsSchema } from './host-schema.ts'

/** Brand a raw string as a settings namespace (identity; dsh-settings does this). */
function settingsNamespace(value: string): string {
  return value
}

const SKIN_NAMESPACE = settingsNamespace(SKIN_SETTINGS_NAMESPACE)

/**
 * Register the durable skin section when the settings service is composed.
 * @param ctx - Host context that may acquire the settings service.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(SKIN_NAMESPACE, SkinSettingsSchema)
  })
}
