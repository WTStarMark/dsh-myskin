/**
 * Animated-GIF detection.
 *
 * The editor's normal embed path re-encodes through a canvas, which keeps exactly one frame — so a
 * GIF must be recognised from its BYTES (a `.gif` name proves nothing: a still GIF is much better
 * off re-encoded) and its animation preserved. These tests build real GIF byte structures by hand
 * and pin the three answers that matter: animated, still, and "cannot tell, do not throw".
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'

const gif = await loadTs('src/client/gif.ts')

/** Little-endian 16-bit, the way the GIF format stores geometry. */
function u16(value) {
  return [value & 0xff, (value >> 8) & 0xff]
}

/**
 * Build a GIF with `frames` image descriptors, optionally with a NETSCAPE loop block.
 * @param options - frame count, loop block, signature, and whether a global colour table exists.
 * @returns the bytes.
 */
function buildGif({ frames = 1, loop = false, version = 'GIF89a', globalTable = true, trailer = true } = {}) {
  const bytes = []
  for (const ch of version) bytes.push(ch.charCodeAt(0))
  bytes.push(...u16(2), ...u16(2))
  bytes.push(globalTable ? 0x80 : 0x00, 0x00, 0x00)
  if (globalTable) bytes.push(0, 0, 0, 255, 255, 255)
  if (loop) {
    bytes.push(0x21, 0xff, 11)
    for (const ch of 'NETSCAPE2.0') bytes.push(ch.charCodeAt(0))
    bytes.push(3, 1, 0, 0, 0)
  }
  for (let index = 0; index < frames; index += 1) {
    bytes.push(0x2c, ...u16(0), ...u16(0), ...u16(2), ...u16(2), 0x00, 0x02, 0x02, 0x44, 0x01, 0x00)
  }
  if (trailer) bytes.push(0x3b)
  return new Uint8Array(bytes)
}

test('a GIF is recognised by its signature, not its name', () => {
  assert.equal(gif.isGif(buildGif()), true)
  assert.equal(gif.isGif(buildGif({ version: 'GIF87a' })), true)
  assert.equal(gif.isGif(new TextEncoder().encode('GIF89a')), false, 'a bare signature is not a file')
  assert.equal(gif.isGif(new TextEncoder().encode('not a gif at all')), false)
  assert.equal(gif.isGif(new Uint8Array(0)), false)
})

test('two frames, or a loop block, mean the animation has to survive', () => {
  assert.equal(gif.isAnimatedGif(buildGif({ frames: 1 })), false, 'a still GIF may be re-encoded')
  assert.equal(gif.isAnimatedGif(buildGif({ frames: 2 })), true)
  assert.equal(gif.isAnimatedGif(buildGif({ frames: 1, loop: true })), true, 'a declared loop is enough')
  assert.equal(gif.isAnimatedGif(buildGif({ frames: 3, version: 'GIF87a' })), true)
  // No global colour table: the walk has to start at the right offset anyway.
  assert.equal(gif.isAnimatedGif(buildGif({ frames: 2, globalTable: false })), true)
  assert.equal(gif.isAnimatedGif(buildGif({ frames: 1, globalTable: false })), false)
})

test('a truncated or foreign file answers instead of throwing', () => {
  const animated = buildGif({ frames: 2 })
  assert.equal(gif.isAnimatedGif(animated.slice(0, 14)), false, 'cut inside the first frame')
  assert.equal(gif.isAnimatedGif(animated.slice(0, 40)), true, 'one frame parsed is enough to know')
  assert.equal(gif.isAnimatedGif(buildGif({ frames: 2, trailer: false })), true, 'no trailer, still walkable')
  const junk = new Uint8Array(64)
  junk.set(new TextEncoder().encode('GIF89a'))
  assert.equal(gif.isAnimatedGif(junk), false, 'a zeroed body must not be read as animation')
})
