/**
 * What the editor can say about a refused canvas write.
 *
 * "保存失败：canvas" names a field and nothing else. The two reasons behind it — a Host schema older
 * than the client, and a payload that is simply too big — are indistinguishable from the message,
 * so the diagnosis counts what tells them apart.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'

const report = await loadTs('src/client/save-report.ts')

/** A canvas with the given images. */
const canvasWith = (images) => ({ images })

test('the canvas diagnosis counts payload, images and 整组 anchors', () => {
  const diagnosis = report.diagnoseCanvas(canvasWith([
    { id: 'a', url: 'data:image/gif;base64,AA', anchor: { kind: 'group', value: '[role="treeitem"]' } },
    { id: 'b', url: 'data:image/gif;base64,AA', anchor: { kind: 'element', value: '#x' } },
    { id: 'c', url: 'data:image/gif;base64,AA' },
  ]))
  assert.equal(diagnosis.images, 3)
  assert.equal(diagnosis.groupAnchors, 1)
  assert.ok(diagnosis.bytes > 0)
})

test('an empty canvas is small and anchor-free', () => {
  const diagnosis = report.diagnoseCanvas(canvasWith([]))
  assert.equal(diagnosis.images, 0)
  assert.equal(diagnosis.groupAnchors, 0)
  assert.equal(report.canvasLooksOversized(diagnosis), false)
})

test('a payload past the threshold is reported as oversized', () => {
  // One embedded image of roughly the size a screenshot reaches.
  const image = { id: 'big', url: 'data:image/png;base64,' + 'A'.repeat(report.CANVAS_LARGE_BYTES) }
  const diagnosis = report.diagnoseCanvas(canvasWith([image]))
  assert.equal(report.canvasLooksOversized(diagnosis), true)
  assert.equal(diagnosis.images, 1)
  assert.equal(diagnosis.groupAnchors, 0)
})

test('a canvas that cannot be serialized never throws', () => {
  const cyclic = { images: [] }
  cyclic.self = cyclic
  const diagnosis = report.diagnoseCanvas(cyclic)
  assert.equal(diagnosis.bytes, 0)
  assert.equal(diagnosis.images, 0)
})
