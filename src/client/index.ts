/**
 * dsh-myskin browser half — DSH 0.1.7 model.
 *
 * The durable skin document is the Host plugin entry's own `Config`, so the
 * browser reaches it through `ctx.configForms`, and the entry id IS the
 * namespace. `configForms.whileServed` is the 0.1.7 idiom for owning a page for
 * a namespace: the "皮肤管理" section is registered — and the skin lifecycle runs
 * — only while the Host actually serves one of the candidate namespaces, so a
 * composition without the Host half shows no trace of the page.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import type { ThemeRuntime } from '@deepseek-ai/dsh-client-ui-theme/client'
import { MySkinSection, type MySkinSectionInjected } from './MySkinSection.tsx'
import { zh, en, type MySkinKey } from './locales.ts'
import { SKIN_SETTINGS_NAMESPACE, LEGACY_SETTINGS_NAMESPACE, type SkinSettings } from '../skin-schema.ts'
import { applySkin, currentSkin, type SkinOverride } from './skin-engine.ts'

/** Dictionary namespace owned by this plugin. */
export const SETTINGS_NS = 'settings.dsh-myskin'

/** Cordis plugin name. */
export const name = 'dsh-myskin'

/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale', 'connection', 'remote', 'configForms', 'theme']

/**
 * Namespaces this page follows, in priority order: the current entry id first,
 * then the id used before the 0.2 migration, so a deployment that still runs the
 * legacy row keeps working.
 */
export const NAMESPACE_CANDIDATES: readonly string[] = [SKIN_SETTINGS_NAMESPACE, LEGACY_SETTINGS_NAMESPACE]

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The "皮肤管理" settings-page copy. */
    'settings.dsh-myskin': MySkinKey
  }
}

/**
 * Register the "皮肤管理" section and run the live skin lifecycle for whichever
 * candidate namespace the Host serves.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), 'dsh-myskin: copy dictionaries')

  const theme = ctx.theme as ThemeRuntime
  const t = ctx.locale.bind(SETTINGS_NS) as MySkinSectionInjected['t']

  ctx.effect(() => ctx.configForms.whileServed(NAMESPACE_CANDIDATES, (served) => {
    const namespace = NAMESPACE_CANDIDATES.find((candidate) => served.has(candidate))
    if (namespace === undefined) return () => undefined
    const scope = ctx.configForms.get<SkinSettings>(namespace)

    // Global apply (single owner): re-applies the skin on page load and on every
    // accepted settings change, so the skin persists beyond the dialog and any
    // other UI. Skipped while the scope is still loading; the subscribe fires on
    // the loading -> ready transition.
    let override: SkinOverride | undefined
    const apply = (): void => {
      const snap = scope.getSnapshot()
      if (snap.status !== 'ready') return
      const value = currentSkin(snap.value)
      override?.dispose()
      override = value.enabled ? applySkin(theme, value) : undefined
    }
    const offSnapshot = scope.subscribe(apply)
    apply()

    const offSlot = ctx.slots.inject('settings.section', () => ctx.slots.register({
      name: 'settings.section',
      id: 'dsh-myskin',
      order: 20,
      label: () => t('nav'),
      locale: SETTINGS_NS,
      inject: () => ({ scope, theme, t }),
    }, MySkinSection))

    return () => {
      offSlot()
      offSnapshot()
      override?.dispose()
      override = undefined
    }
  }), 'dsh-myskin: settings-backed lifecycle')
}
