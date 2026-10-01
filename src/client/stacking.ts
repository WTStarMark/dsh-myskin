/**
 * Why a z-index did nothing — and what number WOULD do something.
 *
 * A number in a field that changes nothing on screen is the worst kind of control: the user cannot
 * tell "it worked but there was nothing to reorder" from "it is not supported here" from "it was
 * never written". Three things decide the answer, and all three are readable from the live page:
 *
 *   1. POSITION — z-index only stacks positioned elements (plus flex/grid items), so on a
 *      `position: static` element the number is inert until something positions it;
 *   2. STACKING CONTEXT — an ancestor that starts one (transform, opacity < 1, a z-index of its
 *      own, …) becomes a CEILING: inside it the element can never overtake anything outside it,
 *      however large the number;
 *   3. NEIGHBOURS — z-index only reorders what OVERLAPS. With nothing overlapping, changing the
 *      number is invisible by definition.
 *
 * The report below answers all three, and carries the two numbers that always do something: one
 * step above and one step below everything the element currently competes with.
 */

/** One element that shares space with the selection and has a say in the stacking order. */
export interface StackingNeighbour {
  readonly el: Element
  /** Computed z-index ('auto' when the element does not set one). */
  readonly zIndex: string
  /** Short human name (the caller supplies the labeller). */
  readonly label: string
}

/** Everything the panel needs to explain, and to fix, the stacking of one element. */
export interface StackingReport {
  /** Computed z-index of the element. */
  readonly zIndex: string
  /** Computed `position` of the element. */
  readonly position: string
  /** Nearest ancestor that starts a stacking context, when there is one. */
  readonly context: Element | undefined
  /** Why that ancestor starts one (e.g. `transform`, `opacity: 0.5`). */
  readonly contextReason: string | undefined
  /** Overlapping elements it competes with, closest relatives first. */
  readonly neighbours: readonly StackingNeighbour[]
  /** A z-index that puts the element above every neighbour. */
  readonly above: number
  /** A z-index that puts the element below every neighbour. */
  readonly below: number
}

/** How many neighbours the report describes (the panel shows them; it is not an audit). */
export const MAX_STACKING_NEIGHBOURS = 6

/**
 * Why an element starts a stacking context, when it does.
 *
 * The order is the order worth reporting: a z-index the element set itself first (that is the one
 * the user is fighting), then the properties that create a context BY ACCIDENT — the classic
 * "why can't this card go above that menu" answer.
 * @param style - computed style of the element (a plain object is fine: tests pass stubs).
 * @returns the reason, or undefined when this element does not start one.
 */
export function stackingContextReason(style: Partial<CSSStyleDeclaration>): string | undefined {
  const read = (name: keyof CSSStyleDeclaration): string =>
    typeof style[name] === 'string' ? String(style[name]) : ''
  const position = read('position')
  const zIndex = read('zIndex')
  if (position !== '' && position !== 'static' && zIndex !== '' && zIndex !== 'auto') return 'z-index: ' + zIndex
  if (position === 'fixed' || position === 'sticky') return 'position: ' + position
  const opacity = read('opacity')
  if (opacity !== '' && Number(opacity) < 1) return 'opacity: ' + opacity
  if (read('transform') !== '' && read('transform') !== 'none') return 'transform'
  if (read('filter') !== '' && read('filter') !== 'none') return 'filter'
  if (read('perspective') !== '' && read('perspective') !== 'none') return 'perspective'
  if (read('isolation') === 'isolate') return 'isolation: isolate'
  const blend = read('mixBlendMode')
  if (blend !== '' && blend !== 'normal') return 'mix-blend-mode: ' + blend
  const backdrop = read('backdropFilter')
  if (backdrop !== '' && backdrop !== 'none') return 'backdrop-filter'
  return undefined
}

/**
 * The nearest ancestor that starts a stacking context.
 * @param el - the element to walk up from.
 * @param style - computed-style reader (defaults to the element's own window).
 * @returns the ancestor and the reason, or undefined when the element stacks against the root.
 */
export function nearestStackingContext(
  el: Element,
  style?: (node: Element) => Partial<CSSStyleDeclaration>,
): { el: Element; reason: string } | undefined {
  const view = el.ownerDocument.defaultView
  const read = style ?? ((node: Element): Partial<CSSStyleDeclaration> =>
    (view === null ? {} : view.getComputedStyle(node)))
  let node = el.parentElement
  while (node !== null) {
    const reason = stackingContextReason(read(node))
    if (reason !== undefined) return { el: node, reason }
    node = node.parentElement
  }
  return undefined
}

/**
 * Read one computed z-index as a number ('auto' and garbage are the baseline, 0).
 * @param value - the computed value.
 * @returns the number to compare with.
 */
function zIndexOf(value: string): number {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Whether two viewport boxes share any area.
 * @param a - first box.
 * @param b - second box.
 * @returns true when they overlap.
 */
function overlaps(a: { left: number; top: number; right: number; bottom: number }, b: { left: number; top: number; right: number; bottom: number }): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
}

/**
 * The full stacking picture of one element.
 *
 * Neighbours are looked for where competition actually happens: among the element's siblings and
 * its parent's siblings (the elements that share its space), then filtered to the ones that really
 * overlap it — so "nothing overlaps" is reported as such instead of leaving the user staring at a
 * number that cannot change anything.
 * @param el - the element the user selected.
 * @param isOwn - predicate marking the editor's own UI (never a neighbour).
 * @param label - short human name for a neighbour.
 * @returns the report.
 */
export function stackingReport(
  el: Element,
  isOwn: (node: Element) => boolean = () => false,
  label: (node: Element) => string = () => '',
): StackingReport {
  const view = el.ownerDocument.defaultView
  const style = (node: Element): CSSStyleDeclaration =>
    (view === null ? ({} as CSSStyleDeclaration) : view.getComputedStyle(node))
  const own = style(el)
  const box = el.getBoundingClientRect()
  const candidates: Element[] = []
  const parent = el.parentElement
  if (parent !== null) {
    for (const child of Array.from(parent.children)) if (child !== el) candidates.push(child)
    const grand = parent.parentElement
    if (grand !== null) for (const child of Array.from(grand.children)) if (child !== parent) candidates.push(child)
  }
  const neighbours: StackingNeighbour[] = []
  for (const candidate of candidates) {
    if (neighbours.length >= MAX_STACKING_NEIGHBOURS) break
    if (isOwn(candidate) || candidate.contains(el) || el.contains(candidate)) continue
    const box2 = candidate.getBoundingClientRect()
    if (box2.width === 0 || box2.height === 0) continue
    if (!overlaps(box, box2)) continue
    const computed = style(candidate)
    neighbours.push({ el: candidate, zIndex: computed.zIndex === '' ? 'auto' : computed.zIndex, label: label(candidate) })
  }
  const values = neighbours.map((neighbour) => zIndexOf(neighbour.zIndex))
  const context = nearestStackingContext(el, style)
  return {
    zIndex: own.zIndex === '' ? 'auto' : own.zIndex,
    position: own.position === '' ? 'static' : own.position,
    context: context?.el,
    contextReason: context?.reason,
    neighbours,
    above: Math.max(0, ...values) + 1,
    below: Math.min(0, ...values) - 1,
  }
}
