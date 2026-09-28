/**
 * Desktop-shell awareness for the canvas editor and the skin engine.
 *
 * DSH Desktop is an Electron shell around the same Web document (upstream
 * `apps/desktop`), and its preloads publish the three markers this module reads:
 *   - `html[data-platform]`          = `process.platform` ('darwin' | 'win32' | 'linux'),
 *   - `html[data-fullscreen]`        = present while the native window is fullscreen,
 *   - `html[data-windows-titlebar]` + `--dsh-windows-titlebar-height` on the root
 *                                    = the Windows native caption row (40 device pixels).
 *
 * A plain browser sets none of them, which is exactly the signal the shell's own
 * code uses: the shipped Web bundle marks drag rows only under
 * `html[data-platform='darwin']` and subtracts `body > :not(#root)` overlays by
 * geometry (base.css in the Web frontend), and ui-primitives reads
 * `dataset.platform` for its Darwin layout. Desktop therefore needs no second
 * client bundle — `dsh.client.platform` stays "web" — it needs this plugin's
 * own chrome to respect the native window chrome, which is what this module
 * encodes.
 */

/** Native window chrome the document reports. */
export interface DesktopShell {
  /** True when an Electron preload marked the document (never in a plain browser). */
  readonly desktop: boolean
  /** `process.platform` as the preload published it; undefined on the Web. */
  readonly platform: string | undefined
  /** True on the Windows shell, whose native caption row sits above the frame. */
  readonly windowsTitlebar: boolean
  /** True while the native window is fullscreen (macOS / Windows). */
  readonly fullscreen: boolean
}

/** Attribute the shell's drag watcher pulses so Electron recollects drag rects. */
export const RECALL_ATTRIBUTE = 'data-window-drag-recall'
/** Marker every element of this plugin's own UI carries. */
export const PLUGIN_UI_ATTRIBUTE = 'data-dsh-myskin-ui'

/**
 * Read the desktop markers from a document.
 * @param doc - document to inspect; defaults to the live one.
 * @returns the shell description, with `desktop: false` in a plain browser.
 */
export function readDesktopShell(doc?: Document): DesktopShell {
  const target = doc ?? (typeof document === 'undefined' ? undefined : document)
  const root = target?.documentElement
  if (root === undefined || root === null) {
    return { desktop: false, platform: undefined, windowsTitlebar: false, fullscreen: false }
  }
  const platform = root.getAttribute('data-platform') ?? undefined
  const windowsTitlebar = root.hasAttribute('data-windows-titlebar')
  return {
    desktop: platform !== undefined || windowsTitlebar,
    platform,
    windowsTitlebar,
    fullscreen: root.hasAttribute('data-fullscreen'),
  }
}

/**
 * CSS for the editor's own `#dsh-myskin-frame` style tag.
 *
 * Web behaviour is unchanged: the page is inset by `body` margin and the toolbar
 * starts at the top. The desktop shells differ in where their window chrome is:
 *   - Windows keeps its native caption row (and its buttons) at the window top,
 *     so the toolbar is placed below it and only the frame's content moves down;
 *   - macOS draws traffic lights inside the leading 68px, so the toolbar keeps a
 *     leading clearance (24px in fullscreen, where the shell hides them).
 * Both platforms get an explicit `no-drag` on plugin UI: Electron composes
 * app-regions from geometry in document order, and the shell only subtracts
 * overlays on darwin (`html[data-platform='darwin'] body > :not(#root)`).
 * @param shell - the shell the document reported when the editor opened.
 * @returns the rules to write, in order.
 */
export function editorFrameRules(shell: DesktopShell): string[] {
  const rules: string[] = []
  if (shell.desktop) {
    if (shell.windowsTitlebar) {
      // Always the height the frame itself pads its caption row with, in
      // fullscreen too: the toolbar then sits exactly where the content starts.
      // (0.2.0's --dsh-frame-chrome-top goes to 0 in fullscreen, which would
      // leave a gap, so it is deliberately not used here.)
      rules.push('html[data-windows-titlebar] { --dsh-myskin-chrome-top: var(--dsh-windows-titlebar-height, 40px); }')
    }
    if (shell.platform === 'darwin') {
      rules.push("html[data-platform='darwin'] { --dsh-myskin-leading: 96px; }")
      rules.push("html[data-platform='darwin'][data-fullscreen] { --dsh-myskin-leading: 24px; }")
    }
    rules.push('[' + PLUGIN_UI_ATTRIBUTE + '] { -webkit-app-region: no-drag; app-region: no-drag; }')
  }
  if (shell.windowsTitlebar) {
    // The frame already pads its caption row; adding the toolbar height moves
    // only the content, so the native caption buttons stay over the caption.
    rules.push('[class*="_frame"] { padding-top: calc(var(--dsh-windows-titlebar-height, 40px) + var(--dsh-myskin-inset-top, 48px)) !important; }')
    rules.push('body { margin-right: var(--dsh-myskin-inset-right, 340px) !important; }')
  } else {
    rules.push('body {')
    rules.push('  margin-top: var(--dsh-myskin-inset-top, 48px) !important;')
    rules.push('  margin-right: var(--dsh-myskin-inset-right, 340px) !important;')
    rules.push('  height: calc(100vh - var(--dsh-myskin-inset-top, 48px)) !important;')
    rules.push('}')
    rules.push('#root { height: 100% !important; }')
  }
  return rules
}

/**
 * Default frame scheduler: one animation frame, or a timeout where the document
 * has no view (jsdom without `pretendToBeVisual`).
 * @param doc - the document being pulsed.
 * @returns a scheduler that runs the callback on a later frame.
 */
function defaultSchedule(doc: Document): (frame: () => void) => void {
  const view = doc.defaultView
  if (view !== null && typeof view.requestAnimationFrame === 'function') {
    return (frame) => { view.requestAnimationFrame(() => { frame() }) }
  }
  return (frame) => { setTimeout(frame, 16) }
}

/**
 * Make Electron recollect the window's drag rectangles after this plugin moved
 * the drag surface.
 *
 * Electron rebuilds `-webkit-app-region` rects only when a computed app-region
 * value changes (electron#32341), and the shell's watcher observes only `body`
 * mutations plus marked rows that resize. The canvas editor moves rows by writing
 * a `<style>` into `<head>` and CSS variables onto `<html>` — neither is observed,
 * so opening or closing it would otherwise leave the native window hit-testing
 * the previous geometry. Pulsing the shell's own recall attribute is that change,
 * and is exactly what the shell does for its own chrome.
 * @param doc - document whose window drag rects went stale; defaults to the live one.
 * @param frames - pulses to emit; the shell clears and re-sets one per frame.
 * @param schedule - frame scheduler seam; defaults to requestAnimationFrame.
 */
export function pulseWindowDragRecall(doc?: Document, frames = 3, schedule?: (frame: () => void) => void): void {
  const target = doc ?? (typeof document === 'undefined' ? undefined : document)
  if (target === undefined || readDesktopShell(target).platform !== 'darwin') return
  const body = target.body
  if (body === null) return
  const next = schedule ?? defaultSchedule(target)
  let left = frames
  const step = (): void => {
    body.removeAttribute(RECALL_ATTRIBUTE)
    if (left <= 0) return
    left -= 1
    body.setAttribute(RECALL_ATTRIBUTE, '')
    next(step)
  }
  step()
}
