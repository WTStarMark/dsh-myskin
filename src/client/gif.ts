/**
 * Is this an ANIMATED GIF?
 *
 * The editor embeds pictures as data URLs, and its normal path re-encodes through a canvas — which
 * is exactly right for a still picture and fatal for a GIF: a canvas has one frame, so the
 * animation IS the thing that gets thrown away. Deciding whether that path may run at all needs one
 * answer, and it has to come from the bytes rather than the file name (a `.gif` can be a still, and
 * a still is much better off re-encoded to WebP: a fraction of the size).
 *
 * The walk below is the GIF89a block structure, not a decoder: the header, the logical screen
 * descriptor, then image descriptors and extensions until the trailer. Nothing is decompressed, and
 * every step is bounds-checked — a truncated file answers "no" instead of throwing.
 */

/** The two GIF signatures, as bytes 0..5 of the file. */
const GIF87 = 'GIF87a'
const GIF89 = 'GIF89a'

/** Block introducers. */
const EXTENSION = 0x21
const IMAGE_DESCRIPTOR = 0x2c
const TRAILER = 0x3b
/** Extension labels worth reading: the loop block is what makes a "animation" explicit. */
const APPLICATION_EXTENSION = 0xff

/**
 * Whether these bytes start with a GIF signature.
 * @param bytes - the file's bytes.
 * @returns true for GIF87a/GIF89a.
 */
export function isGif(bytes: Uint8Array): boolean {
  if (bytes.length < 13) return false
  const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5])
  return header === GIF87 || header === GIF89
}

/**
 * Whether a GIF carries more than one frame (or declares a loop).
 *
 * Both signals are used on purpose: a two-frame GIF with no NETSCAPE block still animates, and a
 * GIF whose loop block survived a re-encode would animate even if only one frame were left.
 * @param bytes - the file's bytes.
 * @returns true when the animation must be preserved.
 */
export function isAnimatedGif(bytes: Uint8Array): boolean {
  if (!isGif(bytes)) return false
  // Logical screen descriptor: width, height, flags, background, aspect ratio.
  const flags = bytes[10]
  let at = 13
  if ((flags & 0x80) !== 0) at += 3 * 2 ** ((flags & 0x07) + 1) // global colour table
  let frames = 0
  let looped = false
  /** Skip a chain of sub-blocks (each is a length byte followed by that many bytes). */
  const skipSubBlocks = (): boolean => {
    while (at < bytes.length) {
      const size = bytes[at]
      at += 1
      if (size === 0) return true
      at += size
    }
    return false
  }
  while (at < bytes.length) {
    const introducer = bytes[at]
    if (introducer === TRAILER) break
    if (introducer === EXTENSION) {
      const label = bytes[at + 1]
      at += 2
      if (label === APPLICATION_EXTENSION && bytes[at] === 11) {
        const id = String.fromCharCode(...bytes.slice(at + 1, at + 12))
        if (id === 'NETSCAPE2.0' || id === 'ANIMEXTS1.0') looped = true
      }
      if (!skipSubBlocks()) break
      continue
    }
    if (introducer === IMAGE_DESCRIPTOR) {
      frames += 1
      // 9 bytes of geometry, then the local-colour-table flags.
      if (at + 10 > bytes.length) break
      const local = bytes[at + 9]
      at += 10
      if ((local & 0x80) !== 0) at += 3 * 2 ** ((local & 0x07) + 1)
      at += 1 // LZW minimum code size
      if (!skipSubBlocks()) break
      continue
    }
    // Unknown byte: the file is not the structure this walk understands. Stop reading rather than
    // guess — a wrong "animated" answer only costs bytes, but a wrong "still" answer costs the
    // animation, so callers treat the frames they DID see as the answer.
    break
  }
  return frames > 1 || looped
}
