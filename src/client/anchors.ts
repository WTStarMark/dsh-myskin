/**
 * Anchors for embedded images — WHAT a picture follows.
 *
 * Three kinds, one meaning: resolve to a real element, let the engine tag it, and re-resolve
 * it whenever React rebuilds the page.
 *
 *   - `element`   a structural selector (what the canvas produces when you embed an image);
 *   - `text`      the copy the app renders — a button whose label changes keeps its ornament,
 *                  and the user picks it by READING the page instead of by walking a path;
 *   - `component` a named landmark of the DSH UI, so "stick it in the composer" does not
 *                  require hunting for the element first.
 *
 * The component catalog only lists markers this package already depends on elsewhere
 * (`data-composer-*`, `data-slot`, `role="tree"`, the CSS-module names the compat check
 * verifies) — a landmark that moves between DSH generations would silently drop the image.
 */

import type { EmbeddedImage, ImageAnchor } from '../skin-schema.ts'
import type { MySkinKey } from './locales.ts'

/** One named landmark an image can be glued to. */
export interface AnchorComponent {
  /** Stable id stored in {@link ImageAnchor.value}. */
  id: string
  /** Copy key for the picker (both dictionaries must carry it). */
  labelKey: MySkinKey
  /** Selector that finds the landmark in the real app. */
  selector: string
}

/**
 * The landmarks offered by the 内置组件 anchor.
 *
 * Ordered from the outermost surface inwards, which is also roughly the order a user thinks
 * in ("the whole app", "the column", "the composer").
 */
export const ANCHOR_COMPONENTS: readonly AnchorComponent[] = [
  { id: 'app', labelKey: 'compApp', selector: '#root' },
  { id: 'frame', labelKey: 'compFrame', selector: '[class*="_frame"], [class~="frame"]' },
  { id: 'column', labelKey: 'compColumn', selector: '[class*="_centerCol"], [class~="centerCol"]' },
  { id: 'session', labelKey: 'compSession', selector: '[data-slot="conversation.session"]' },
  { id: 'view', labelKey: 'compView', selector: '[data-slot^="conversation.view"]' },
  { id: 'composer', labelKey: 'compComposer', selector: '[data-composer-seat]' },
  { id: 'composerInput', labelKey: 'compComposerInput', selector: '[data-composer-input]' },
  { id: 'placeholder', labelKey: 'compPlaceholder', selector: '[data-composer-placeholder]' },
  { id: 'tree', labelKey: 'compTree', selector: '[role="tree"]' },
]

/**
 * Look one catalog entry up.
 * @param id - the anchor's stored value.
 * @returns the entry, or undefined when the document names an id this build does not know.
 */
export function componentById(id: string): AnchorComponent | undefined {
  return ANCHOR_COMPONENTS.find((entry) => entry.id === id)
}

/**
 * The anchor of one embedded image, including legacy documents.
 *
 * An image written before anchors existed carries only `fallbackSelector`, and that IS its
 * anchor — normalizing here keeps every caller (engine, editor, tests) free of the special
 * case, and keeps old `.dshskin` packages working.
 * @param img - the embedded image.
 * @returns the effective anchor (never undefined).
 */
export function anchorOf(img: EmbeddedImage): ImageAnchor {
  if (img.anchor !== undefined) {
    const value = img.anchor.kind === 'element' && img.anchor.value === ''
      ? (img.fallbackSelector ?? '')
      : img.anchor.value
    return { ...img.anchor, value }
  }
  return { kind: 'element', value: img.fallbackSelector ?? '' }
}

/**
 * A stable string for one anchor, for effect dependencies and identity checks.
 * @param anchor - the anchor.
 * @returns `kind:value`.
 */
export function anchorKey(anchor: ImageAnchor): string {
  return anchor.kind + ':' + anchor.value
}

/**
 * Human label for an anchor, as shown in the image list.
 * @param anchor - the anchor.
 * @param t - copy lookup.
 * @returns the frozen label, the component's name, or the raw value.
 */
export function anchorLabel(anchor: ImageAnchor, t: (key: MySkinKey) => string): string {
  if (anchor.kind === 'component') {
    const component = componentById(anchor.value)
    if (component !== undefined) return t(component.labelKey)
  }
  if (anchor.label !== undefined && anchor.label !== '') return anchor.label
  return anchor.value
}
