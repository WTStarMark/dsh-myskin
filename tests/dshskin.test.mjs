/**
 * The `.dshskin` package: document + real asset files inside a zip.
 *
 * Round-trip is the whole promise (pack → unpack must give the document back byte for
 * byte), and the container has to stay a REAL zip that other tools can open — that is
 * verified here with a deflated archive built by node's zlib, which is exactly what a
 * third-party re-pack looks like to our reader.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { deflateRawSync } from 'node:zlib'
import { loadTs } from './helpers/load-ts.mjs'

const pack = await loadTs('src/client/dshskin.ts')

/** A 1x1 transparent webp-ish payload (bytes only; the format never parses them). */
const IMAGE_BYTES = new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4])
const FONT_BYTES = new Uint8Array([119, 79, 70, 50, 9, 9, 9])
const imageUrl = pack.bytesToDataUrl(IMAGE_BYTES, 'image/webp')
const fontUrl = pack.bytesToDataUrl(FONT_BYTES, 'font/woff2')

/** A document that uses every place a payload can hide. */
function document() {
  return {
    enabled: true,
    tokens: { '--dsw-alias-bg-base': { light: '#fff', dark: '#111' } },
    css: [
      { selector: '@font-face', rule: "font-family: 'myskin-font-1'; src: url('" + fontUrl + "') format('woff2'); font-display: swap;" },
      { selector: '#hero', rule: 'color: red' },
    ],
    text: [{ selector: '#hero', before: 'Hello', after: '你好' }],
    canvas: {
      background: imageUrl,
      backgroundOpacity: 0.7,
      images: [{ id: 'e1', selector: '#hero', url: imageUrl, x: 0, y: 0, w: 10, h: 10 }],
    },
    layers: [{ id: 'l1', kind: 'img', url: imageUrl, selector: 'body', attach: 'append' }],
    library: [],
  }
}

test('a whole document round-trips through a .dshskin', async () => {
  const skin = document()
  const { bytes, manifest } = pack.packSkin(skin, { name: '测试皮肤', generator: 'dsh-myskin test' })
  assert.equal(pack.isZip(bytes), true)
  // Payloads are stored as files, not base64: the image and the font are each deduped to
  // ONE entry even though the document references the image three times.
  // Assets are numbered in discovery order (the css list comes first in the document)…
  assert.deepEqual(manifest.assets.map((a) => [a.path, a.kind, a.bytes]), [
    ['assets/font-1.woff2', 'font', FONT_BYTES.length],
    ['assets/image-2.webp', 'image', IMAGE_BYTES.length],
  ])
  // …and the image referenced THREE times is stored once.
  assert.equal(manifest.assets.filter((a) => a.kind === 'image').length, 1)
  assert.equal(manifest.stats.images, 1)
  assert.equal(manifest.name, '测试皮肤')
  const back = await pack.unpackSkin(bytes)
  assert.equal(back.skin.canvas.background, imageUrl)
  assert.equal(back.skin.canvas.images[0].url, imageUrl)
  assert.equal(back.skin.layers[0].url, imageUrl)
  // The @font-face URL is embedded inside a CSS rule: it must come back too.
  assert.match(back.skin.css[0].rule, /url\('data:font\/woff2;base64,/)
  assert.equal(back.manifest.assets.length, 2)
})

test('packing keeps non-data URLs untouched and the zip carries a manifest + readme', async () => {
  const skin = { ...document(), canvas: { background: 'linear-gradient(#000, #fff)', images: [] } }
  const { bytes } = pack.packSkin(skin, { name: 'plain', generator: 'g' })
  const files = await pack.unzip(bytes)
  assert.ok(files.has('manifest.json'))
  assert.ok(files.has('README.txt'))
  assert.equal(files.has('assets/image-1.webp'), false)
  const readme = new TextDecoder().decode(files.get('README.txt'))
  assert.match(readme, /assets\/image-1\.webp/)
  const back = await pack.unpackSkin(bytes)
  assert.equal(back.skin.canvas.background, 'linear-gradient(#000, #fff)')
})

test('a real deflated zip (what a third-party re-pack looks like) still imports', async () => {
  const manifest = {
    format: 'dshskin',
    formatVersion: 1,
    generator: 'other tool',
    name: 'repacked',
    createdAt: '2026-01-01T00:00:00.000Z',
    assets: [{ path: 'assets/image-1.png', kind: 'image', mime: 'image/png', bytes: IMAGE_BYTES.length }],
    stats: {},
    skin: { enabled: true, tokens: {}, css: [], text: [], canvas: { background: 'dshskin:assets/image-1.png', images: [] }, layers: [], library: [] },
  }
  const archive = deflatedZip([
    { path: 'manifest.json', bytes: new TextEncoder().encode(JSON.stringify(manifest)) },
    { path: 'assets/image-1.png', bytes: IMAGE_BYTES },
  ])
  const back = await pack.unpackSkin(archive)
  assert.equal(back.skin.canvas.background, pack.bytesToDataUrl(IMAGE_BYTES, 'image/png'))
})

test('integrity and legacy files are handled honestly', async () => {
  const { bytes } = pack.packSkin(document(), { name: 'x', generator: 'g' })
  // A damaged payload must fail loudly instead of importing half a skin.
  const damaged = bytes.slice()
  const marker = new TextEncoder().encode('RIFF')
  const at = damaged.findIndex((_, i) => damaged[i] === marker[0] && damaged[i + 1] === marker[1] && damaged[i + 2] === marker[2] && damaged[i + 3] === marker[3])
  damaged[at] = 0
  await assert.rejects(() => pack.unpackSkin(damaged), /checksum/)
  // A missing asset is named, not silently dropped.
  const stripped = await pack.unzip(bytes)
  stripped.delete('assets/font-1.woff2')
  const rebuilt = pack.zipStore([...stripped].map(([path, value]) => ({ path, bytes: value })))
  await assert.rejects(() => pack.unpackSkin(rebuilt), /missing assets: assets\/font-1\.woff2/)
  // Legacy JSON exports keep importing.
  const legacy = new TextEncoder().encode(JSON.stringify({ enabled: true, tokens: {}, css: [], text: [], canvas: { images: [] }, layers: [], library: [] }))
  const back = await pack.unpackSkin(legacy)
  assert.equal(back.manifest.formatVersion, 0)
  assert.equal(back.skin.enabled, true)
  await assert.rejects(() => pack.unpackSkin(new TextEncoder().encode('not json')), SyntaxError)
})

test('helpers agree with each other', () => {
  assert.equal(pack.DSHSKIN_FORMAT, 'dshskin')
  assert.equal(pack.dataUrlMime('data:image/webp;base64,AAAA'), 'image/webp')
  assert.equal(pack.extForMime('font/woff2'), 'woff2')
  assert.equal(pack.mimeForPath('assets/font-1.woff2'), 'font/woff2')
  assert.deepEqual(pack.dataUrlBytes('data:text/plain,hello'), new TextEncoder().encode('hello'))
  assert.deepEqual(pack.dataUrlBytes('data:image/png;base64,' + Buffer.from(IMAGE_BYTES).toString('base64')), IMAGE_BYTES)
  // CRC-32 of an empty payload is 0, of "123456789" it is the standard 0xCBF43926.
  assert.equal(pack.crc32(new Uint8Array(0)), 0)
  assert.equal(pack.crc32(new TextEncoder().encode('123456789')), 0xcbf43926)
})

/**
 * Minimal DEFLATE zip writer for the test's "third-party tool" case.
 * @param entries - files to pack.
 * @returns the archive bytes.
 */
function deflatedZip(entries) {
  const chunks = []
  const central = []
  let offset = 0
  for (const entry of entries) {
    const name = new TextEncoder().encode(entry.path)
    const body = new Uint8Array(deflateRawSync(Buffer.from(entry.bytes)))
    const crc = pack.crc32(entry.bytes)
    const local = new Uint8Array(30 + name.length + body.length)
    const view = new DataView(local.buffer)
    view.setUint32(0, 0x04034b50, true)
    view.setUint16(4, 20, true)
    view.setUint16(8, 8, true)
    view.setUint32(14, crc, true)
    view.setUint32(18, body.length, true)
    view.setUint32(22, entry.bytes.length, true)
    view.setUint16(26, name.length, true)
    local.set(name, 30)
    local.set(body, 30 + name.length)
    chunks.push(local)
    central.push({ name, crc, compressed: body.length, size: entry.bytes.length, offset })
    offset += local.length
  }
  const directory = []
  for (const entry of central) {
    const head = new Uint8Array(46 + entry.name.length)
    const view = new DataView(head.buffer)
    view.setUint32(0, 0x02014b50, true)
    view.setUint16(4, 20, true)
    view.setUint16(6, 20, true)
    view.setUint16(10, 8, true)
    view.setUint32(16, entry.crc, true)
    view.setUint32(20, entry.compressed, true)
    view.setUint32(24, entry.size, true)
    view.setUint16(28, entry.name.length, true)
    view.setUint32(42, entry.offset, true)
    head.set(entry.name, 46)
    directory.push(head)
  }
  const centralSize = directory.reduce((sum, part) => sum + part.length, 0)
  const tail = new Uint8Array(22)
  const view = new DataView(tail.buffer)
  view.setUint32(0, 0x06054b50, true)
  view.setUint16(8, central.length, true)
  view.setUint16(10, central.length, true)
  view.setUint32(12, centralSize, true)
  view.setUint32(16, offset, true)
  const all = [...chunks, ...directory, tail]
  const out = new Uint8Array(all.reduce((sum, part) => sum + part.length, 0))
  let cursor = 0
  for (const part of all) { out.set(part, cursor); cursor += part.length }
  return out
}
