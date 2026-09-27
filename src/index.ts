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

export { Config }

/** Cordis plugin name; identical to the settings namespace and the entry id. */
export const name = SKIN_SETTINGS_NAMESPACE

/**
 * Host plugin body: nothing to compose. DSH owns the schema, the persistence
 * and the change broadcast; the browser half applies the skin after the UI
 * mounts.
 */
export function apply(): void {}
