/**
 * The editor panel's tabs: one KIND of edit per tab.
 *
 * Everything used to share a single scrolling column — the element inspector, the embedded images, the
 * markdown typography, the wallpaper — so whatever the user came for was buried under three other kinds
 * of work. The tabs are the fix, and the set is deliberately small: a tab exists when the thing being
 * edited is a different KIND of object, not when a feature was added.
 */

/** One kind of edit. */
/**
 * One kind of edit.
 *
 * `region` is the odd one out on purpose: the others edit ONE object, this one edits a whole surface
 * (conversation / sidebar / composer / settings) — which is a different question, so it gets its own
 * tab instead of hiding inside the element inspector.
 */
export type PanelTab = 'variant' | 'component' | 'image' | 'text' | 'markdown' | 'region' | 'look'

/**
 * Tab order in the panel.
 *
 * `variant` leads on purpose: it is the one tab that needs no CSS knowledge, so it is where a user who
 * just wants a different look should land first.
 */
export const PANEL_TABS: readonly PanelTab[] = ['variant', 'component', 'image', 'text', 'markdown', 'region', 'look']

/** Copy key per tab. */
export const PANEL_TAB_LABEL: Readonly<Record<PanelTab, string>> = {
  variant: 'tabVariant',
  component: 'tabComponent',
  image: 'tabImage',
  text: 'tabText',
  markdown: 'tabMarkdown',
  region: 'tabRegion',
  look: 'tabLook',
}

/** Where the open tab is remembered (same storage the dock side uses). */
export const PANEL_TAB_STORAGE_KEY = 'dsh-myskin.panel'

/**
 * Whether a stored string is a tab this build knows.
 *
 * A skin edited by a newer build can leave a tab id this one has never heard of; falling back to the
 * first tab is better than rendering an empty panel.
 * @param value - the stored value.
 * @returns true when it is a known tab.
 */
export function isPanelTab(value: string | null | undefined): value is PanelTab {
  return value !== null && value !== undefined && (PANEL_TABS as readonly string[]).includes(value)
}

/**
 * Read the remembered tab.
 * @param storage - the storage to read (localStorage in the app, a stub in tests).
 * @returns the tab, defaulting to the component inspector.
 */
export function readPanelTab(storage: { getItem(key: string): string | null } | undefined): PanelTab {
  if (storage === undefined) return PANEL_TABS[0]
  try {
    const raw = storage.getItem(PANEL_TAB_STORAGE_KEY)
    return isPanelTab(raw) ? raw : PANEL_TABS[0]
  } catch { return PANEL_TABS[0] }
}

/**
 * Remember the tab.
 * @param storage - the storage to write.
 * @param tab - the tab that is now open.
 */
export function writePanelTab(storage: { setItem(key: string, value: string): void } | undefined, tab: PanelTab): void {
  if (storage === undefined) return
  try { storage.setItem(PANEL_TAB_STORAGE_KEY, tab) } catch { /* private mode: the tab just is not remembered */ }
}
