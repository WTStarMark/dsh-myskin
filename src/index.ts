/**
 * dsh-myskin Host (server) half — DSH 0.1.7 model.
 *
 * The durable skin document is this plugin entry's own `Config` (see
 * ./host-schema.ts): DSH resolves, stores and broadcasts it, and the profile
 * patch file is where edits land. That makes this half deliberately empty —
 * no service, no DOM, no imperative settings registration, no `@deepseek-ai`
 * imports beyond the schema — which is also what keeps it loadable from a
 * profile bundle on both the Web and the Desktop profiles.
 */
import type { Context } from '@deepseek-ai/cordis'
import { Config } from './host-schema.ts'
import { SKIN_SETTINGS_NAMESPACE } from './skin-schema.ts'
import { registerDesignCommand, type CommandRegistryLike } from './command-brief.ts'

export { Config }

/** Cordis plugin name; identical to the settings namespace and the entry id. */
export const name = SKIN_SETTINGS_NAMESPACE

/**
 * Host plugin body.
 *
 * DSH owns the schema, the persistence and the change broadcast, and the browser half applies
 * the skin after the UI mounts — so the only thing this half contributes is the entry point
 * users actually type: the `/dsh-myskin` command (see ./command-brief.ts).
 *
 * The command layer is OPTIONAL on purpose: `commands` may be absent (older DSH, a headless
 * profile), and a registration failure must never take the skin plugin down with it — a broken
 * optional feature is annoying, a plugin that fails to load is a broken install.
 * @param ctx - the Host plugin context.
 */
export function apply(ctx: Context): void {
  ctx.inject(['commands'], (scope) => {
    try {
      const commands = (scope as unknown as { commands?: CommandRegistryLike }).commands
      if (commands === undefined || typeof commands.register !== 'function') return
      registerDesignCommand(commands)
    } catch {
      // Never let the optional command break the skin itself.
    }
  })
}
