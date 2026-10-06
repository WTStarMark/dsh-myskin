/**
 * Interop with the wallpaper plugin (`dsh-plugin-wallpaper-engine`, source at
 * /root/dsh-wallpaper-engine) — two DOM markers and nothing else.
 *
 * Both plugins paint the same pixels, and neither may import the other: the other side can be
 * absent, older or newer, and it is not this package's business which. The published contract
 * (their `src/client.js` §"皮肤中心互操作", their docs/CHANGELOG for 1.3.0-r2) is:
 *
 *   html[data-dsh-skin]     — OURS. "A skin is on stage / asks to be on stage." Their client
 *                             observes it on `documentElement` and YIELDS: it clears its
 *                             wallpaper layer and steps its whole glass family out, remembering
 *                             the user's wallpaper so it can put it back afterwards. Hysteresis
 *                             is theirs: 450 ms of sustained presence to enter, 2.6 s of
 *                             sustained absence to restore — so the marker must STAY UP for as
 *                             long as we paint, and re-writing it (same value, still a mutation
 *                             record) is how an explicit 试穿 / 应用 asks them to re-read it.
 *   body[data-we-wallpaper] — THEIRS. "Their wallpaper layer is on stage." We read it and stand
 *                             our own wallpaper down: two wallpapers at once is never what the
 *                             user asked for, and whoever was picked last should win.
 *
 * Both directions are read-only outside our own attribute: we never write or remove a marker we
 * did not write, so a marker owned by another skin plugin survives us byte-exactly.
 */

/** `<html>` marker meaning "a skin is on stage" (ours, read by the wallpaper plugin). */
export const SKIN_MARKER_ATTRIBUTE = 'data-dsh-skin'

/** `<body>` marker meaning "a wallpaper layer is on stage" (the wallpaper plugin's). */
export const WALLPAPER_ENGINE_ATTRIBUTE = 'data-we-wallpaper'

/**
 * `<body>` attributes the wallpaper plugin mounts for as long as it is LOADED (not merely painting).
 *
 * Read off its own client half (1.3.0-r2) rather than guessed: `applyGlass()` sets
 * `data-we-glass-page` at its top and its comments call the glass gate "always mounted" since
 * §10.20; `applyEffects()` writes `data-we-adapter` on every pass; `data-we-wallpaper` rides along
 * while a wallpaper is on stage. Any one of them means the plugin is installed and running — which
 * is exactly what "自动打开兼容模式" has to key off, because a user who installed a wallpaper engine
 * has an owner for the background whether or not a wallpaper is selected
 * (see `resolveCompatMode` in ./skin-engine.ts).
 */
export const WALLPAPER_ENGINE_MARKERS: readonly string[] = [
  'data-we-glass-page',
  'data-we-adapter',
  WALLPAPER_ENGINE_ATTRIBUTE,
]

/**
 * Whether the wallpaper plugin is loaded right now.
 * @param doc - the document to read.
 * @returns true when one of its always-on markers is present.
 */
export function wallpaperEngineInstalled(doc: Document): boolean {
  const body = doc?.body
  if (body === undefined || body === null) return false
  return WALLPAPER_ENGINE_MARKERS.some((marker) => body.hasAttribute(marker))
}

/** What {@link SKIN_MARKER_ATTRIBUTE} carries while this plugin is the one on stage. */
export const SKIN_MARKER_VALUE = 'dsh-myskin'

/**
 * Publish or withdraw this plugin's "skin on stage" marker.
 *
 * Only ever touches a marker carrying {@link SKIN_MARKER_VALUE}: another skin plugin's marker is
 * left exactly as found (their presence already moves the wallpaper aside, and clearing it on the
 * way out would break THEIR teardown).
 * @param doc - the document to mark.
 * @param active - true while this plugin is painting, false when it stops.
 */
export function publishSkinMarker(doc: Document, active: boolean): void {
  const root = doc?.documentElement
  if (root === undefined || root === null) return
  const current = root.getAttribute(SKIN_MARKER_ATTRIBUTE)
  if (active) {
    // Re-setting the same value is deliberate: a same-value setAttribute still produces a
    // mutation record, which is the only way to ask the other side to re-read the marker.
    if (current === null || current === SKIN_MARKER_VALUE) root.setAttribute(SKIN_MARKER_ATTRIBUTE, SKIN_MARKER_VALUE)
    return
  }
  if (current === SKIN_MARKER_VALUE) root.removeAttribute(SKIN_MARKER_ATTRIBUTE)
}

/**
 * Whether the wallpaper plugin has a wallpaper layer on stage right now.
 * @param doc - the document to read.
 * @returns true when their marker is present.
 */
export function wallpaperEngineOnStage(doc: Document): boolean {
  const body = doc?.body
  return body !== undefined && body !== null && body.hasAttribute(WALLPAPER_ENGINE_ATTRIBUTE)
}

/**
 * Watch the wallpaper plugin's marker, so a skin can re-decide as it comes and goes.
 * @param doc - the document to observe.
 * @param onChange - called after every change of the marker.
 * @returns the disposer.
 */
export function observeWallpaperEngine(doc: Document, onChange: () => void): () => void {
  const body = doc?.body
  if (body === undefined || body === null || typeof MutationObserver === 'undefined') return () => {}
  const observer = new MutationObserver(() => { onChange() })
  // The whole marker set: the wallpaper coming and going changes what we may paint, and the plugin
  // being installed mid-session (or removed) changes whether 兼容模式 applies at all.
  observer.observe(body, { attributes: true, attributeFilter: [...WALLPAPER_ENGINE_MARKERS] })
  return () => { observer.disconnect() }
}
