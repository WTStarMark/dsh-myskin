/**
 * Which side the drawing chrome docks to — and how the page gives it room.
 *
 * The editor has always taken its space on the right (body margin + a 340px panel). That is
 * fine until the user wants to restyle a component that positions ITSELF against the right
 * edge of the window: `position: fixed; right: 0` does not move when the page is inset, so
 * such a component ends up exactly underneath the panel — unreachable for the picker and
 * invisible while it is being edited. The fix is not to chase those elements with CSS (that
 * would mean rewriting a stranger's layout); it is to let the whole chrome change sides.
 *
 * The side lives in ONE place: an attribute on `<html>`. The frame stylesheet is written once
 * when the editor mounts and carries the rules for both layouts, so switching sides is a single
 * attribute write — no second stylesheet, no rewrite of the frame, and removing the attribute
 * (what the editor does on unmount) takes the whole frame with it.
 *
 * The preference is remembered in browser storage: it is a property of the user's page, not of
 * the skin (it never enters the skin document, so it cannot travel inside a `.dshskin` or need
 * a schema the running Host might not know yet).
 */

/** The side the editor panel — and the page inset that follows it — docks to. */
export type DockSide = 'left' | 'right'

/**
 * Root attribute the frame rules hang off.
 *
 * Both layouts are present in the stylesheet at all times and every one of them is gated on
 * this attribute, so there is exactly one writer and no rule can fire in the wrong layout.
 */
export const DOCK_ATTRIBUTE = 'data-dsh-myskin-dock'

/** Browser-storage key that remembers the side between editor sessions. */
export const DOCK_STORAGE_KEY = 'dsh-myskin.dock'

/** Default side. The editor has always docked right, so an absent preference keeps behaving. */
export const DEFAULT_DOCK: DockSide = 'right'

/**
 * The other side.
 * @param side - the current side.
 * @returns the side the panel is not on.
 */
export function otherDock(side: DockSide): DockSide {
  return side === 'left' ? 'right' : 'left'
}

/**
 * Whether a stored value is a side this build understands.
 * @param value - the raw value (storage is user-writable and survives upgrades).
 * @returns true for exactly 'left' and 'right'.
 */
export function isDockSide(value: unknown): value is DockSide {
  return value === 'left' || value === 'right'
}

/**
 * The browser's storage, when it is reachable.
 *
 * Reading it can THROW (Safari private mode, a sandboxed frame, a blocked third-party
 * context), and the editor must not care: the dock side is a preference, not state.
 * @returns localStorage, or undefined when it cannot be used.
 */
export function browserStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

/**
 * The remembered side.
 * @param storage - storage seam (tests pass a stub); anything unreadable falls back to default.
 * @returns the side to open the editor with.
 */
export function readDockSide(storage: Storage | undefined): DockSide {
  try {
    const raw = storage?.getItem(DOCK_STORAGE_KEY)
    return isDockSide(raw) ? raw : DEFAULT_DOCK
  } catch {
    return DEFAULT_DOCK
  }
}

/**
 * Remember the side. A storage that refuses to write is not an error: the session still works.
 * @param storage - storage seam.
 * @param side - the side to remember.
 */
export function writeDockSide(storage: Storage | undefined, side: DockSide): void {
  try {
    storage?.setItem(DOCK_STORAGE_KEY, side)
  } catch {
    // Preference only — never let a storage quota/private-mode error break the editor.
  }
}

/**
 * Put the current side on `<html>`, where the frame rules read it.
 * @param doc - the live document.
 * @param side - the side to publish.
 */
export function applyDockAttribute(doc: Document, side: DockSide): void {
  doc.documentElement.setAttribute(DOCK_ATTRIBUTE, side)
}

/**
 * Take the side back off `<html>` (editor unmount) so the frame rules stop matching.
 * @param doc - the live document.
 */
export function clearDockAttribute(doc: Document): void {
  doc.documentElement.removeAttribute(DOCK_ATTRIBUTE)
}
