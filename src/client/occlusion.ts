/**
 * What is painted UNDER the editor panel?
 *
 * The chrome takes its space by insetting the page (body margin + `--dsh-myskin-inset-*`), so the
 * app's own layout never ends up beneath the panel. An element that positions itself against the
 * viewport instead — `position: fixed; right: 0`, which is exactly how a plugin that "binds to a
 * side" is written — does not move with the body, so it lands underneath the panel: the picker
 * cannot reach it and any edit to it happens out of sight. Switching the dock to the other side
 * is the fix (see dock.ts); this module is how the editor knows when to say so.
 *
 * The answer comes from the browser's own hit test: for a few points inside the panel's box, the
 * topmost element that is neither our UI nor one of the document roots is, by construction, a
 * floating element that the page inset did not move. Nothing here guesses at class names or
 * z-indexes, and nothing is written to the page.
 *
 * Pure core + thin DOM wrapper, so the decision is testable without a layout engine (jsdom has no
 * `elementsFromPoint`).
 */

/** A box in viewport coordinates (the shape of a `DOMRect` we need). */
export interface SampleRect {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

/** One hit-test point, in viewport coordinates. */
export interface SamplePoint {
  readonly x: number
  readonly y: number
}

/** How a panel is sampled: a grid inside its box, away from the edges. */
export interface SampleGrid {
  /** Points across the panel (default 2). */
  readonly columns?: number
  /** Points down the panel (default 4). */
  readonly rows?: number
  /** Distance kept from the panel's edges, in px (default 10). */
  readonly margin?: number
}

/** Default sampling grid: wide enough to catch a small floating panel, cheap enough to run on a timer. */
export const SAMPLE_COLUMNS = 2
/** Default sampling grid: see {@link SAMPLE_COLUMNS}. */
export const SAMPLE_ROWS = 4
/** Default edge clearance for the sampling grid. */
export const SAMPLE_MARGIN = 10

/**
 * The element an `elementsFromPoint` stack paints beneath the editor's own layer.
 *
 * The stack arrives topmost-first and starts with our chrome (the open panel owns the pointer
 * there), so the first element that is neither ours nor a document root is the thing standing
 * under it — and the deepest hit is also the most recognizable one to name in the toolbar
 * (it is what the picker itself would have selected at that point).
 *
 * @param stack - `document.elementsFromPoint` output, topmost first.
 * @param isOwn - predicate marking the editor's own UI AND the document roots (html/body/#root);
 *   without those the stack would always end in the page itself and every point would "hit".
 * @returns the occluded element, or undefined when the point only reaches our chrome and the page.
 */
export function occludingElement(stack: readonly Element[], isOwn: (el: Element) => boolean): Element | undefined {
  return stack.find((el) => !isOwn(el))
}

/**
 * Whether two scan results describe the same occlusion.
 *
 * The editor re-scans on a timer; without this comparison every scan would hand React a fresh
 * array and re-render the toolbar forever.
 * @param a - previous result.
 * @param b - fresh result.
 * @returns true when both lists hold the same elements in the same order.
 */
export function sameElements(a: readonly Element[], b: readonly Element[]): boolean {
  return a.length === b.length && a.every((el, index) => el === b[index])
}

/**
 * The points to hit-test inside a panel box.
 *
 * The grid is inset by `margin` so a rounded corner or a 1px border never decides the answer,
 * and it spans the middle of the panel by column so a floating bar parked in the middle of the
 * side is caught as well as one that hugs an edge.
 * @param rect - the panel's viewport box.
 * @param grid - grid shape; defaults to {@link SAMPLE_COLUMNS} × {@link SAMPLE_ROWS}.
 * @returns the sample points (empty for a panel too small to hold them).
 */
export function panelSamplePoints(rect: SampleRect, grid: SampleGrid = {}): SamplePoint[] {
  const columns = Math.max(1, Math.round(grid.columns ?? SAMPLE_COLUMNS))
  const rows = Math.max(1, Math.round(grid.rows ?? SAMPLE_ROWS))
  const margin = grid.margin ?? SAMPLE_MARGIN
  if (rect.width <= margin * 2 || rect.height <= margin * 2) return []
  const left = rect.left + margin
  const right = rect.left + rect.width - margin
  const top = rect.top + margin
  const bottom = rect.top + rect.height - margin
  const points: SamplePoint[] = []
  for (let column = 0; column < columns; column += 1) {
    const x = columns === 1 ? (left + right) / 2 : left + ((right - left) * column) / (columns - 1)
    for (let row = 0; row < rows; row += 1) {
      const y = rows === 1 ? (top + bottom) / 2 : top + ((bottom - top) * row) / (rows - 1)
      points.push({ x: Math.round(x), y: Math.round(y) })
    }
  }
  return points
}

/**
 * The elements the panel is currently covering.
 *
 * Never throws and never returns duplicates: a layout engine that cannot hit-test (jsdom, an
 * exotic embedder) simply answers "nothing is covered", which is also the safe answer — the dock
 * switch stays available in the toolbar either way.
 * @param rect - the panel's viewport box.
 * @param doc - the live document.
 * @param isOwn - predicate marking the editor's own UI and the document roots.
 * @param grid - sampling grid; defaults to {@link SAMPLE_COLUMNS} × {@link SAMPLE_ROWS}.
 * @returns the distinct occluded elements, topmost sample first.
 */
export function occludedBehindPanel(
  rect: SampleRect,
  doc: Document,
  isOwn: (el: Element) => boolean,
  grid: SampleGrid = {},
): Element[] {
  const points = panelSamplePoints(rect, grid)
  if (points.length === 0) return []
  const from = doc.elementsFromPoint
  if (typeof from !== 'function') return []
  const seen = new Set<Element>()
  const found: Element[] = []
  for (const point of points) {
    let hit: Element | undefined
    try {
      hit = occludingElement(Array.from(from.call(doc, point.x, point.y)), isOwn)
    } catch {
      hit = undefined
    }
    if (hit !== undefined && !seen.has(hit)) {
      seen.add(hit)
      found.push(hit)
    }
  }
  return found
}
