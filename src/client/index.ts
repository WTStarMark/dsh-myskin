/**
 * dsh-myskin browser half. Registers the "皮肤管理" settings section and owns
 * the live skin lifecycle: whenever the persisted skin changes (including page
 * load), it re-applies the skin through the reversible engine, so the skin is
 * present on every session without the user opening settings.
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import type { ThemeRuntime } from '@deepseek-ai/dsh-client-ui-theme/client'
import { MySkinSection, type MySkinSectionInjected } from './MySkinSection.tsx'
import { zh, en, type MySkinKey } from './locales.ts'
import { SKIN_SETTINGS_NAMESPACE, type SkinSettings } from '../skin-schema.ts'
import { applySkin, currentSkin, type SkinOverride } from './skin-engine.ts'

/** Dictionary namespace owned by this plugin. */
export const SETTINGS_NS = 'settings.myskin'

/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale', 'connection', 'remote', 'configForms', 'theme']

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The "皮肤管理" settings-page copy. */
    'settings.myskin': MySkinKey
  }
}

/**
 * Register the "皮肤管理" section and run the live skin lifecycle.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), 'dsh-myskin: copy dictionaries')

  const scope = ctx.configForms.get<SkinSettings>(SKIN_SETTINGS_NAMESPACE)
  const theme = ctx.theme as ThemeRuntime
  const t = ctx.locale.bind(SETTINGS_NS) as MySkinSectionInjected['t']

  // Global apply (single owner): re-applies the skin on page load and on every
  // accepted settings change, so the skin persists beyond the dialog and any
  // other UI. Skipped while the scope is still loading; the subscribe fires on
  // the loading→ready transition.
  let override: SkinOverride | undefined
  const apply = (): void => {
    const snap = scope.getSnapshot()
    if (snap.status !== 'ready') return
    const value = currentSkin(snap.value)
    override?.dispose()
    override = value.enabled ? applySkin(theme, value) : undefined
  }
  ctx.effect(() => scope.subscribe(apply), 'dsh-myskin: skin observer')
  ctx.effect(() => {
    apply()
    return () => { override?.dispose(); override = undefined }
  }, 'dsh-myskin: initial apply')

  const injected = (): MySkinSectionInjected => ({ scope, theme, t })

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'myskin',
    order: 20,
    label: () => t('nav'),
    locale: SETTINGS_NS,
    inject: injected,
  }, MySkinSection))
}
