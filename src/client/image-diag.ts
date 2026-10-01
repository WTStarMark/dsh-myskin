/**
 * Why an embedded image cannot be seen.
 *
 * An embedded picture lives in a `::after` on its host, which makes three failures possible and
 * indistinguishable to the user (「我嵌了图，应用之后看不见」):
 *
 *   1. **the anchor resolves to nothing** — the tag is gone (the page was rebuilt and the recovery
 *      tiers found no unique match), so the CSS rule matches no element at all;
 *   2. **the page scope hides it** — an image embedded while a settings page was open carries that
 *      page's key and is deliberately stripped everywhere else (`currentSettingsPageKey`);
 *   3. **the layer puts it under something opaque** — it paints above the host's background but
 *      BELOW its content, so a host whose children are opaque cards shows nothing. (In a sidebar the
 *      children are transparent rows and the same layer is exactly what keeps them readable.)
 *
 * This module answers with which one it is — plus whether the host is simply too small for the
 * picture (`clipped`) — so the panel can say something true instead of leaving the user guessing.
 */

import type { EmbeddedImage } from '../skin-schema.ts'
import { currentSettingsPageKey, resolveImageTargets, sameSettingsPage } from './skin-engine.ts'

/** What the diagnosis concluded. */
export type ImageVerdict = 'ok' | 'unresolved' | 'page-scope' | 'covered' | 'clipped'

/** The verdict plus whatever the panel needs to explain it. */
export interface ImageDiagnosis {
  /** The conclusion. */
  readonly verdict: ImageVerdict
  /** The container the image resolved to (absent only when it did not resolve). */
  readonly host?: Element
  /** The descendant painting over the picture (`covered`). */
  readonly cover?: Element
  /** The picture's box in the host's coordinates. */
  readonly box?: { readonly x: number; readonly y: number; readonly w: number; readonly h: number }
  /** The host's own size, when it was measurable. */
  readonly hostSize?: { readonly w: number; readonly h: number }
  /** Feather width in px (the picture reaches that far outside its box). */
  readonly feather: number
}

/**
 * The first element at a point that would paint OVER the picture.
 *
 * With `z-index: -1` the picture sits above the host's own background and below its content, so the
 * only thing that hides it at a point is a DESCENDANT of the host being hit there. Hitting the host
 * itself (a padding area with no child) or an ancestor means the picture shows through.
 * @param doc - the document to hit-test.
 * @param x - viewport x.
 * @param y - viewport y.
 * @param host - the element carrying the picture.
 * @returns the covering descendant, or undefined.
 */
function coveringDescendant(doc: Document, x: number, y: number, host: Element): Element | undefined {
  if (typeof doc.elementsFromPoint !== 'function') return undefined
  const stack = typeof doc.elementsFromPoint === 'function' ? Array.from(doc.elementsFromPoint(x, y)) : []
  for (const el of stack) {
    if (el === host) return undefined
    if (host.contains(el)) return el
  }
  return undefined
}

/**
 * Explain an embedded image's visibility.
 * @param img - the image record.
 * @param doc - the live document.
 * @param above - whether the picture is configured to paint above the host's content.
 * @param samples - grid resolution used to look for a covering descendant.
 * @param feather - the picture's edge-feather width, which grows it outwards on every side.
 * @param pageScope - whether the user opted this image into per-settings-page scoping; without it the
 *   page key is only recorded information and never hides anything.
 * @returns the diagnosis.
 */
export function diagnoseEmbeddedImage(img: EmbeddedImage, doc: Document, above: boolean, samples = 3, feather = 0, pageScope = false): ImageDiagnosis {
  const host = resolveImageTargets(img, doc)[0]
  if (host === undefined) return { verdict: 'unresolved', feather }
  const box = { x: img.x, y: img.y, w: img.w, h: img.h }
  // 2. page scope, when the user asked for it: the engine strips the tag on any other page.
  const pageKey = img.pageKey ?? ''
  if (pageScope && pageKey !== '' && !sameSettingsPage(pageKey, currentSettingsPageKey(doc))) return { verdict: 'page-scope', host, box, feather }
  const rect = host.getBoundingClientRect()
  const hostSize = { w: rect.width, h: rect.height }
  if (rect.width <= 0 || rect.height <= 0) return { verdict: 'ok', host, box, hostSize, feather }
  // 3. layer: only a hit inside the part of the picture the host shows can cover it.
  if (!above) {
    const left = Math.max(0, box.x - feather)
    const top = Math.max(0, box.y - feather)
    const right = Math.min(rect.width, box.x + box.w + feather)
    const bottom = Math.min(rect.height, box.y + box.h + feather)
    if (right > left && bottom > top) {
      for (let column = 1; column <= samples; column += 1) {
        for (let row = 1; row <= samples; row += 1) {
          const x = rect.left + left + ((right - left) * column) / (samples + 1)
          const y = rect.top + top + ((bottom - top) * row) / (samples + 1)
          const cover = coveringDescendant(doc, x, y, host)
          if (cover !== undefined) return { verdict: 'covered', host, cover, box, hostSize, feather }
        }
      }
    }
  }
  // 4. geometry: a picture larger than its host is cropped by it (the `::after` is inset: 0).
  // A feather reaches outside the box, so it can be what pushes a picture past its container.
  const clipped = box.x - feather < 0 || box.y - feather < 0
    || box.x + box.w + feather > rect.width + 0.5 || box.y + box.h + feather > rect.height + 0.5
  if (clipped) return { verdict: 'clipped', host, box, hostSize, feather }
  return { verdict: 'ok', host, box, hostSize, feather }
}
