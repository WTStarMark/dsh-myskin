/**
 * Why a canvas write was refused, in numbers the editor can show.
 *
 * "保存失败：canvas" names the field but not the reason, and the two reasons it usually has look
 * identical from the outside:
 *
 *   - the Host schema is older than this client (a new version was installed but DSH was not
 *     restarted, so a value the client just learned to write — a new anchor kind — fails
 *     validation for the WHOLE canvas field, while the free-form \`css\` field sails through);
 *   - the payload itself is the problem: embedded images ride inside the canvas as data URLs, so a
 *     large picture can hit a size limit.
 *
 * Counting the images, the anchors that need a current schema and the payload size tells the two
 * apart for the person reading the message — and costs nothing.
 */

import type { SkinCanvas } from '../skin-schema.ts'

/** What the editor knows about the canvas it just failed to store. */
export interface CanvasDiagnosis {
  /** Serialized size of the canvas payload, in bytes. */
  bytes: number
  /** How many images the payload carries. */
  images: number
  /** How many of them use the anchor kind that needs a current Host schema. */
  groupAnchors: number
}

/**
 * Measure a canvas payload.
 * @param canvas - the canvas object about to be written.
 * @returns the counts behind the message.
 */
export function diagnoseCanvas(canvas: SkinCanvas): CanvasDiagnosis {
  let json = ''
  try { json = JSON.stringify(canvas) } catch { json = '' }
  const images = Array.isArray(canvas.images) ? canvas.images : []
  return {
    // UTF-16 length is close enough for a "this is large" hint and never fails.
    bytes: json.length,
    images: images.length,
    groupAnchors: images.filter((img) => img.anchor?.kind === 'group').length,
  }
}

/**
 * The size at which a canvas payload is worth mentioning in the failure message.
 *
 * A photo pasted as a data URL is roughly 1.37× its file size, so 512 KB of payload means a
 * ~370 KB picture — small for a screenshot, large for whatever limit a settings store keeps.
 */
export const CANVAS_LARGE_BYTES = 512 * 1024

/**
 * Whether a refused canvas is best explained by its size.
 * @param diagnosis - the measurement.
 * @returns true when the payload is big enough to be the suspect.
 */
export function canvasLooksOversized(diagnosis: CanvasDiagnosis): boolean {
  return diagnosis.bytes >= CANVAS_LARGE_BYTES
}
