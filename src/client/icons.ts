/**
 * Themed icon aliases with a naming-generation fallback.
 *
 * DSH renamed every themed icon in 0.1.7: `IconCloseOutline16` (present up to
 * dsh-v0.1.6-alpha.2) became `IconCloseOutlineRegular` /
 * `IconCloseOutlineMedium`. The browser bundle requires the primitives table at
 * materialization, so a stale name is simply `undefined` and React throws
 * "Element type is invalid" the moment the settings section renders. Resolving
 * names at access time keeps the page alive across either naming generation and
 * turns the next rename into a one-line change.
 */
import * as primitives from '@deepseek-ai/dsh-client-ui-primitives'

/** Props every themed icon accepts (kept local so we do not depend on the icon prop type). */
export interface SkinIconProps {
  size?: number
  className?: string
  strokeWidth?: number
}

/** Icon component shape; a missing icon renders nothing instead of throwing. */
export type SkinIcon = (props: SkinIconProps) => JSX.Element | null

const table = primitives as unknown as Record<string, SkinIcon | undefined>

/**
 * First candidate the loaded primitives table actually exports.
 * @param candidates - names in preference order (current generation first).
 * @returns a renderable component, or a no-op for an unknown generation.
 */
function pick(candidates: readonly string[]): SkinIcon {
  for (const candidate of candidates) {
    const icon = table[candidate]
    if (typeof icon === 'function') return icon
  }
  return function MissingIcon(): JSX.Element | null { return null }
}

/** Personalization / skin entry icon. */
export const IconPersonalization = pick(['IconPersonalizationOutlineRegular', 'IconPersonalizationOutlineMedium', 'IconPersonalizationOutline16'])
/** Add / plus icon. */
export const IconPlus = pick(['IconPlusOutlineRegular', 'IconPlusOutlineMedium', 'IconPlusOutline16'])
/** Delete / trash icon. */
export const IconTrash = pick(['IconTrashOutlineRegular', 'IconTrashOutlineMedium', 'IconTrashOutline16'])
/** Close icon. */
export const IconClose = pick(['IconCloseOutlineRegular', 'IconCloseOutlineMedium', 'IconCloseOutline16'])
