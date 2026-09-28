/**
 * Type probe for every service this plugin injects.
 *
 * `export const inject = [...]` in src/client/index.ts is a list of SERVICE NAME
 * STRINGS: nothing in the build notices when one of those names stops existing,
 * and cordis would simply leave the client fiber pending — the settings page would
 * silently never appear. This file gives each name a type so
 * `npm run check:types` fails loudly when the latest DSH drops or renames one.
 *
 * Each import is type-only and exists purely to pull that package's
 * `declare module '@deepseek-ai/cordis'` merge (the idiom upstream client plugins
 * use); it is never compiled into the bundle.
 *
 * Deliberately NOT probed: `connection` (provided at runtime, but upstream declares
 * only its Events merge, and this plugin never reads it) and `remote` — both were
 * dropped from `inject` for exactly that reason.
 */
import type { Context } from '@deepseek-ai/cordis'
// ctx.configForms
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// ctx.slots
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
// ctx.locale
import type {} from '@deepseek-ai/dsh-client-locale/client'
// ctx.theme
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'

declare const ctx: Context

/** One entry per name in src/client/index.ts's `inject` array. */
export const injectedServices = {
  slots: ctx.slots,
  locale: ctx.locale,
  configForms: ctx.configForms,
  theme: ctx.theme,
}
