/**
 * Local font discovery for the canvas editor's font field.
 *
 * The field always accepted a hand-typed family; what it could not do is SHOW what this
 * machine actually has. Two sources, best first:
 *
 *   1. `window.queryLocalFonts()` — the Local Font Access API (Chromium). The real list
 *      of installed families; it needs a user gesture and a permission grant, which is
 *      why this only ever runs from a click.
 *   2. Metric probing — compare a test string's width against a fallback family for a
 *      curated candidate list. Works in every browser, but it can only ever report the
 *      candidates it was given, and the UI says so.
 *
 * Nothing here writes to the skin document, and nothing is cached across page loads: a
 * font installed while the editor is open shows up on the next scan.
 */

/** Where a family list came from — the UI has to say which one it is showing. */
export type FontSource = 'local' | 'detected'

/** One scan's result. Never throws: an unusable environment degrades to a short list. */
export interface FontScan {
  /** `local` = the browser enumerated this machine; `detected` = metric probing. */
  source: FontSource
  /** Sorted, case-insensitively de-duplicated family names. */
  families: string[]
  /** The Local Font Access API exists but the user (or the policy) refused it. */
  denied?: boolean
}

/** The slice of the Local Font Access API this module touches. */
interface LocalFontData {
  family: string
  fullName?: string
  postscriptName?: string
  style?: string
}

/** `queryLocalFonts` is not in every TypeScript DOM lib yet; reach it structurally. */
interface FontCapableWindow {
  queryLocalFonts?: () => Promise<LocalFontData[]>
}

/**
 * Candidate families for the metric probe.
 *
 * Deliberately broad across Windows / macOS / Linux and CJK, because the probe's answer
 * is only as good as its candidates: this is what a browser without the Local Font Access
 * API can still offer, and on this machine (CentOS) the DejaVu / Liberation / Noto /
 * WenQuanYi entries are the ones that actually hit.
 */
export const FONT_CANDIDATES: readonly string[] = [
  // CJK
  'PingFang SC', 'PingFang TC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Microsoft JhengHei',
  'SimHei', 'SimSun', 'NSimSun', 'KaiTi', 'FangSong', 'Noto Sans CJK SC', 'Noto Sans CJK TC',
  'Noto Sans CJK JP', 'Noto Sans CJK KR', 'Noto Serif CJK SC', 'Source Han Sans SC', 'Source Han Sans CN',
  'Source Han Serif SC', 'WenQuanYi Micro Hei', 'WenQuanYi Zen Hei', 'WenQuanYi Bitmap Song',
  'AR PL UMing CN', 'AR PL UKai CN', 'Droid Sans Fallback', 'Sarasa Gothic SC', 'HarmonyOS Sans SC',
  // Sans
  'Arial', 'Arial Black', 'Helvetica', 'Helvetica Neue', 'Verdana', 'Tahoma', 'Trebuchet MS',
  'Segoe UI', 'Calibri', 'Candara', 'Corbel', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Inter', 'Ubuntu', 'Cantarell', 'DejaVu Sans', 'Liberation Sans', 'Noto Sans', 'FreeSans',
  'Source Sans Pro', 'PT Sans', 'Fira Sans', 'IBM Plex Sans', 'Nunito', 'Poppins',
  // Serif
  'Times New Roman', 'Times', 'Georgia', 'Cambria', 'Garamond', 'Palatino', 'Book Antiqua',
  'DejaVu Serif', 'Liberation Serif', 'Noto Serif', 'FreeSerif', 'PT Serif', 'Source Serif Pro',
  // Mono
  'Consolas', 'Courier New', 'Courier', 'Menlo', 'Monaco', 'SF Mono', 'Cascadia Code',
  'Cascadia Mono', 'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'IBM Plex Mono',
  'DejaVu Sans Mono', 'Liberation Mono', 'Noto Sans Mono', 'FreeMono', 'Ubuntu Mono',
  'Roboto Mono', 'Inconsolata', 'Hack',
]

/** Text used for metric probing: wide glyphs make a substituted family obvious. */
const PROBE_TEXT = 'mmmmmmmmmmlliWW'

/**
 * Whether this browser can enumerate the machine's fonts.
 * @param win - the window to test (defaults to the global one).
 * @returns true when `queryLocalFonts` is callable.
 */
export function localFontsSupported(win: Window = window): boolean {
  return typeof (win as unknown as FontCapableWindow).queryLocalFonts === 'function'
}

/**
 * Clean up a family list: trim, drop blanks, de-duplicate case-insensitively (the first
 * spelling wins) and sort naturally so "Noto Sans 2" lands next to "Noto Sans 10".
 * @param names - raw family names.
 * @returns the normalized list.
 */
export function normalizeFamilies(names: readonly string[]): string[] {
  const seen = new Map<string, string>()
  for (const raw of names) {
    const name = raw.trim()
    if (name === '') continue
    const key = name.toLowerCase()
    if (!seen.has(key)) seen.set(key, name)
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
}

/**
 * Substring filter for the font list's search box.
 * @param families - the list to filter.
 * @param query - what the user typed (case-insensitive, spaces ignored at the edges).
 * @param limit - maximum rows to return.
 * @returns matching families in their original order.
 */
export function filterFamilies(families: readonly string[], query: string, limit = 300): string[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return families.slice(0, limit)
  const terms = needle.split(/\s+/)
  return families.filter((family) => {
    const haystack = family.toLowerCase()
    return terms.every((term) => haystack.includes(term))
  }).slice(0, limit)
}

/**
 * One family as a CSS `font-family` item: quoted when it is not a plain identifier.
 * @param family - the family name.
 * @returns a safe item for a font stack.
 */
export function quoteFamily(family: string): string {
  const name = family.trim()
  if (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(name)) return name
  return '"' + name.replace(/"/g, '') + '"'
}

/**
 * Ask the browser for this machine's fonts.
 *
 * The Local Font Access API rejects with `NotAllowedError` when the user declines the
 * permission prompt (or a policy blocks it); everything else is reported as a plain
 * failure. Both are non-fatal — the caller falls back to metric probing.
 * @param win - the window to ask (defaults to the global one).
 * @returns the family list, or the reason it is unavailable.
 */
export async function queryLocalFonts(win: Window = window): Promise<{ ok: true; families: string[] } | { ok: false; reason: 'unsupported' | 'denied' | 'failed' }> {
  const api = (win as unknown as FontCapableWindow).queryLocalFonts
  if (typeof api !== 'function') return { ok: false, reason: 'unsupported' }
  try {
    const records = await api.call(win)
    const families = normalizeFamilies(records.map((record) => record.family))
    if (families.length === 0) return { ok: false, reason: 'failed' }
    return { ok: true, families }
  } catch (error) {
    const name = error instanceof Error ? error.name : ''
    return { ok: false, reason: name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'failed' }
  }
}

/**
 * Whether one family is installed, by comparing text metrics against a fallback.
 *
 * The classic probe: measure a wide test string with `'<family>', monospace` and with
 * `monospace`. An unknown family falls back to monospace and measures identically;
 * an installed one (almost always) does not. A browser without a 2D canvas context
 * (jsdom, for one) cannot answer at all and reports false.
 * @param doc - the document to measure in.
 * @param family - the family to probe.
 * @returns true when the family changes the measurement.
 */
export function isFamilyAvailable(doc: Document, family: string): boolean {
  const context = doc.createElement('canvas').getContext?.('2d')
  if (context === null || context === undefined) return false
  const measure = (stack: string): number => {
    context.font = '72px ' + stack
    return context.measureText(PROBE_TEXT).width
  }
  const baseline = measure('monospace')
  const probe = measure('"' + family.replace(/"/g, '') + '", monospace')
  return probe !== baseline
}

/**
 * Probe the candidate list and return the families that are actually installed.
 * @param doc - the document to measure in.
 * @param candidates - families to test.
 * @returns the installed candidates, normalized.
 */
export function detectFamilies(doc: Document, candidates: readonly string[] = FONT_CANDIDATES): string[] {
  const found = candidates.filter((family) => {
    try { return isFamilyAvailable(doc, family) } catch { return false }
  })
  return normalizeFamilies(found)
}

/**
 * The one entry point the UI needs: enumerate this machine's fonts, best effort.
 *
 * Always resolves. `source` tells the panel what it is looking at, and `denied` lets it
 * explain that the full list needs a permission grant instead of silently showing a
 * short one.
 * @param doc - the document (for the metric probe).
 * @param win - the window (for the Local Font Access API).
 * @returns the scan result.
 */
export async function scanFonts(doc: Document, win: Window): Promise<FontScan> {
  if (localFontsSupported(win)) {
    const result = await queryLocalFonts(win)
    if (result.ok) return { source: 'local', families: result.families }
    // Whatever the reason, the list on screen is now the probe's — say so, even when the
    // probe found nothing: reporting an empty list as "this machine's fonts" would be a lie.
    return { source: 'detected', families: detectFamilies(doc), denied: result.reason === 'denied' }
  }
  return { source: 'detected', families: detectFamilies(doc) }
}
