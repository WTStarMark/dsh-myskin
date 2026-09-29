/**
 * `.dshskin` — the skin package format.
 *
 * A skin is a document PLUS the bytes it references: wallpapers, embedded images,
 * embedded font files. Kept as plain JSON those bytes ride along as base64 data URLs —
 * ~33 % bigger, unreadable, and impossible to swap for a different picture without
 * touching the document. A `.dshskin` is a normal ZIP that keeps them apart:
 *
 *     manifest.json            the whole skin document, each payload replaced by
 *                              `dshskin:assets/<file>`
 *     assets/image-1.webp      the payloads, as real files with their real bytes
 *     assets/font-1.woff2
 *     README.txt               what this file is, for whoever opens it in 7-Zip
 *
 * Written with STORE (method 0): every payload is already a compressed format
 * (webp/png/jpeg/woff2), so deflating would cost CPU for ~0 % and drag a codec into the
 * browser half. Reading accepts STORE **and** DEFLATE, so a package repacked by a normal
 * zip tool still imports. No dependency, no schema change: the asset references only ever
 * exist inside the file, the live document always carries data URLs.
 */
import { parseSkin, type SkinSettings } from '../skin-schema.ts'

/** Value of the manifest's `format` field. */
export const DSHSKIN_FORMAT = 'dshskin'
/** File extension (with dot). */
export const DSHSKIN_EXTENSION = '.dshskin'
/** Version of the container/manifest layout this build writes and understands. */
export const DSHSKIN_VERSION = 1
/** Prefix that marks an asset reference inside the packed document. */
export const ASSET_REF_PREFIX = 'dshskin:'
/** Path of the document inside the package. */
export const MANIFEST_PATH = 'manifest.json'
/** Path of the human-readable note inside the package. */
export const README_PATH = 'README.txt'
/** Directory holding the payloads. */
export const ASSET_DIR = 'assets'

/** One payload carried by a package. */
export interface DshSkinAsset {
  /** Package-relative path, e.g. `assets/image-1.webp`. */
  path: string
  /** What it is used for (derived from the MIME type). */
  kind: 'image' | 'font' | 'file'
  /** MIME type of the payload. */
  mime: string
  /** Uncompressed size in bytes. */
  bytes: number
}

/** `manifest.json` of a package. */
export interface DshSkinManifest {
  format: typeof DSHSKIN_FORMAT
  /** Container layout version. */
  formatVersion: number
  /** What wrote the file, e.g. `dsh-myskin 0.3.8`. */
  generator: string
  /** Skin name (free text). */
  name: string
  /** ISO timestamp of packing. */
  createdAt: string
  /** Every payload, with its type and size. */
  assets: DshSkinAsset[]
  /** Counts of the document's own parts, so a reader can see what is inside. */
  stats: Record<string, number>
  /** The skin document, with data URLs replaced by {@link ASSET_REF_PREFIX} references. */
  skin: SkinSettings
}

/** Result of {@link packSkin}. */
export interface DshSkinPackage {
  bytes: Uint8Array
  manifest: DshSkinManifest
}

/** Result of {@link unpackSkin}. */
export interface DshSkinContents {
  skin: SkinSettings
  manifest: DshSkinManifest
}

/**
 * Copy bytes into a plain ArrayBuffer.
 *
 * `Blob` and the stream APIs want an `ArrayBuffer`-backed view, while a subarray's buffer
 * carries bytes outside the slice — copying keeps both the types and the payload honest
 * (a few hundred KB, once, on export).
 * @param bytes - the view to copy.
 * @returns an ArrayBuffer holding exactly these bytes.
 */
export function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(out).set(bytes)
  return out
}

/** MIME type of a data URL (with a sane fallback). */
const DATA_URL = /data:([A-Za-z0-9.+-]+\/[A-Za-z0-9.+-]+)?(;base64)?,([A-Za-z0-9+/=%\s]*)/g

/** Encoding helpers that work in both the browser and node. */
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

/**
 * Bytes of one base64 blob.
 * @param base64 - base64 text (whitespace tolerated).
 * @returns the decoded bytes.
 */
function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/\s+/g, '')
  const binary = atob(clean)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i)
  return out
}

/**
 * Base64 text of some bytes.
 * @param bytes - the bytes to encode.
 * @returns base64 text.
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

/**
 * MIME type of a data URL.
 * @param url - the data URL.
 * @returns the MIME type, or `application/octet-stream` when it declares none.
 */
export function dataUrlMime(url: string): string {
  const match = /^data:([A-Za-z0-9.+-]+\/[A-Za-z0-9.+-]+)?[;,]/.exec(url)
  return match?.[1] ?? 'application/octet-stream'
}

/**
 * Payload bytes of a data URL.
 * @param url - the data URL (base64 or percent-encoded).
 * @returns the bytes, or undefined when the URL is not a data URL.
 */
export function dataUrlBytes(url: string): Uint8Array | undefined {
  if (!url.startsWith('data:')) return undefined
  const comma = url.indexOf(',')
  if (comma < 0) return undefined
  const head = url.slice(0, comma)
  const body = url.slice(comma + 1)
  if (!head.includes(';base64')) return textEncoder.encode(decodeURIComponent(body))
  return base64ToBytes(body)
}

/**
 * Rebuild a data URL from bytes.
 * @param bytes - the payload.
 * @param mime - its MIME type.
 * @returns a base64 data URL.
 */
export function bytesToDataUrl(bytes: Uint8Array, mime: string): string {
  return 'data:' + mime + ';base64,' + bytesToBase64(bytes)
}

/** File extension used for one MIME type (kept in sync with what the editor produces). */
const MIME_EXTENSIONS: Record<string, string> = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'font/woff2': 'woff2',
  'font/woff': 'woff',
  'font/ttf': 'ttf',
  'font/otf': 'otf',
  'application/font-woff2': 'woff2',
  'application/font-woff': 'woff',
}

/**
 * File extension for one MIME type.
 * @param mime - the MIME type.
 * @returns a short extension without the dot.
 */
export function extForMime(mime: string): string {
  const known = MIME_EXTENSIONS[mime.toLowerCase()]
  if (known !== undefined) return known
  const tail = mime.split('/')[1] ?? 'bin'
  return tail.replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin'
}

/**
 * MIME type implied by a package file's extension.
 * @param path - package-relative path.
 * @returns the MIME type, or undefined when the extension is unknown.
 */
export function mimeForPath(path: string): string | undefined {
  const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase()
  for (const [mime, known] of Object.entries(MIME_EXTENSIONS)) if (known === ext) return mime
  return undefined
}

/**
 * Kind of payload one MIME type is.
 * @param mime - the MIME type.
 * @returns image, font, or file.
 */
function kindForMime(mime: string): DshSkinAsset['kind'] {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('font/') || mime.includes('font-')) return 'font'
  return 'file'
}

//#region CRC + ZIP writer

/** CRC-32 lookup table (built once). */
const CRC_TABLE = ((): Uint32Array => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let c = i
    for (let bit = 0; bit < 8; bit += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c >>> 0
  }
  return table
})()

/**
 * CRC-32 of some bytes (the ZIP checksum).
 * @param bytes - the payload.
 * @returns the checksum as an unsigned 32-bit number.
 */
export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/**
 * One packed entry handed to {@link zipStore}.
 */
export interface ZipEntryInput {
  /** Package-relative path (forward slashes, no leading slash). */
  path: string
  /** Raw payload. */
  bytes: Uint8Array
}

/**
 * MS-DOS date/time pair used by ZIP headers.
 * @param date - the timestamp to encode.
 * @returns packed date and time words.
 */
function dosDateTime(date: Date): { time: number; date: number } {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  return { time: time & 0xffff, date: day & 0xffff }
}

/**
 * Build a ZIP archive with every entry stored uncompressed.
 *
 * Deliberately dependency-free and synchronous: it runs in the browser half, where a
 * compression library would be a new runtime dependency for zero gain on already
 * compressed payloads.
 * @param entries - the files to pack, in order.
 * @param now - timestamp to stamp on the entries (test seam).
 * @returns the archive bytes.
 */
export function zipStore(entries: readonly ZipEntryInput[], now: Date = new Date()): Uint8Array {
  const { time, date } = dosDateTime(now)
  const prepared = entries.map((entry) => {
    const name = textEncoder.encode(entry.path)
    return { name, bytes: entry.bytes, crc: crc32(entry.bytes) }
  })
  let size = 22
  for (const entry of prepared) size += 30 + entry.name.length + entry.bytes.length + 46 + entry.name.length
  const out = new Uint8Array(size)
  const view = new DataView(out.buffer)
  let offset = 0
  const central: number[] = []
  for (const entry of prepared) {
    const localOffset = offset
    view.setUint32(offset, 0x04034b50, true); offset += 4
    view.setUint16(offset, 20, true); offset += 2
    view.setUint16(offset, 0x0800, true); offset += 2 // UTF-8 names
    view.setUint16(offset, 0, true); offset += 2 // STORE
    view.setUint16(offset, time, true); offset += 2
    view.setUint16(offset, date, true); offset += 2
    view.setUint32(offset, entry.crc, true); offset += 4
    view.setUint32(offset, entry.bytes.length, true); offset += 4
    view.setUint32(offset, entry.bytes.length, true); offset += 4
    view.setUint16(offset, entry.name.length, true); offset += 2
    view.setUint16(offset, 0, true); offset += 2
    out.set(entry.name, offset); offset += entry.name.length
    out.set(entry.bytes, offset); offset += entry.bytes.length
    central.push(localOffset)
  }
  const centralStart = offset
  prepared.forEach((entry, index) => {
    view.setUint32(offset, 0x02014b50, true); offset += 4
    view.setUint16(offset, 20, true); offset += 2 // version made by
    view.setUint16(offset, 20, true); offset += 2 // version needed
    view.setUint16(offset, 0x0800, true); offset += 2
    view.setUint16(offset, 0, true); offset += 2
    view.setUint16(offset, time, true); offset += 2
    view.setUint16(offset, date, true); offset += 2
    view.setUint32(offset, entry.crc, true); offset += 4
    view.setUint32(offset, entry.bytes.length, true); offset += 4
    view.setUint32(offset, entry.bytes.length, true); offset += 4
    view.setUint16(offset, entry.name.length, true); offset += 2
    view.setUint16(offset, 0, true); offset += 2 // extra
    view.setUint16(offset, 0, true); offset += 2 // comment
    view.setUint16(offset, 0, true); offset += 2 // disk
    view.setUint16(offset, 0, true); offset += 2 // internal attrs
    view.setUint32(offset, 0, true); offset += 4 // external attrs
    view.setUint32(offset, central[index], true); offset += 4
    out.set(entry.name, offset); offset += entry.name.length
  })
  const centralSize = offset - centralStart
  view.setUint32(offset, 0x06054b50, true); offset += 4
  view.setUint16(offset, 0, true); offset += 2
  view.setUint16(offset, 0, true); offset += 2
  view.setUint16(offset, prepared.length, true); offset += 2
  view.setUint16(offset, prepared.length, true); offset += 2
  view.setUint32(offset, centralSize, true); offset += 4
  view.setUint32(offset, centralStart, true); offset += 4
  view.setUint16(offset, 0, true); offset += 2
  return out
}

//#endregion

//#region ZIP reader

/**
 * Whether some bytes start with a ZIP local file header.
 * @param bytes - candidate bytes.
 * @returns true for `PK\x03\x04`.
 */
export function isZip(bytes: Uint8Array): boolean {
  return bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04
}

/**
 * Inflate a raw DEFLATE stream (used for packages written by other zip tools).
 * @param bytes - the compressed payload.
 * @returns the inflated bytes.
 */
async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const codec = (globalThis as { DecompressionStream?: new (format: string) => unknown }).DecompressionStream
  if (codec === undefined) throw new Error('this environment cannot read deflated entries')
  const stream = new Blob([toArrayBuffer(bytes)]).stream().pipeThrough(new codec('deflate-raw') as ReadableWritablePair<Uint8Array, Uint8Array>)
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/**
 * Read every entry of a ZIP archive.
 *
 * Only what a skin package needs: central-directory walk, STORE and DEFLATE, CRC
 * verified per entry (a truncated or edited package must fail loudly, not half-import).
 * @param bytes - the archive bytes.
 * @returns entry path -> payload.
 * @throws Error when the file is not a readable ZIP or an entry is damaged.
 */
export async function unzip(bytes: Uint8Array): Promise<Map<string, Uint8Array>> {
  if (!isZip(bytes)) throw new Error('not a zip archive')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  // EOCD: scan backwards over a possible trailing comment (max 64 KB).
  let eocd = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('zip end-of-directory not found')
  const count = view.getUint16(eocd + 10, true)
  let cursor = view.getUint32(eocd + 16, true)
  const files = new Map<string, Uint8Array>()
  for (let i = 0; i < count; i += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) throw new Error('zip central directory is damaged')
    const method = view.getUint16(cursor + 10, true)
    const crc = view.getUint32(cursor + 16, true)
    const compressedSize = view.getUint32(cursor + 20, true)
    const nameLength = view.getUint16(cursor + 28, true)
    const extraLength = view.getUint16(cursor + 30, true)
    const commentLength = view.getUint16(cursor + 32, true)
    const localOffset = view.getUint32(cursor + 42, true)
    const name = textDecoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength))
    cursor += 46 + nameLength + extraLength + commentLength
    if (name.endsWith('/')) continue
    if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error('zip entry "' + name + '" is damaged')
    const localNameLength = view.getUint16(localOffset + 26, true)
    const localExtraLength = view.getUint16(localOffset + 28, true)
    const start = localOffset + 30 + localNameLength + localExtraLength
    const raw = bytes.subarray(start, start + compressedSize)
    let payload: Uint8Array
    if (method === 0) payload = raw
    else if (method === 8) payload = await inflateRaw(raw)
    else throw new Error('zip entry "' + name + '" uses an unsupported compression method (' + method + ')')
    if (crc32(payload) !== crc) throw new Error('zip entry "' + name + '" failed its checksum')
    files.set(name, payload)
  }
  return files
}

//#endregion

//#region Document <-> package

/**
 * Replace every data URL inside one string with an asset reference.
 * @param value - the source string (a field value or a whole CSS rule).
 * @param refFor - resolves one data URL to its reference.
 * @returns the packed string.
 */
function refString(value: string, refFor: (url: string) => string): string {
  if (!value.includes('data:')) return value
  return value.replace(DATA_URL, (match) => refFor(match))
}

/**
 * Walk a JSON-ish value, rewriting every data URL found (in plain fields and inside CSS
 * rules, where the URL is embedded in `url('…')`).
 * @param value - the value to walk.
 * @param map - the string rewriter.
 * @returns a deep copy with rewritten strings.
 */
function mapStrings<T>(value: T, map: (input: string) => string): T {
  if (typeof value === 'string') return map(value) as unknown as T
  if (Array.isArray(value)) return value.map((item) => mapStrings(item, map)) as unknown as T
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) out[key] = mapStrings(item, map)
    return out as unknown as T
  }
  return value
}

/**
 * Replace every `dshskin:` reference inside one string with its data URL.
 *
 * A hand-written scan rather than a built-from-a-string RegExp: references also appear
 * INSIDE CSS rules (`url('dshskin:assets/font-1.woff2')`), where the terminating character
 * is whatever the surrounding CSS uses, and an escaping bug here silently imports a
 * package with empty assets.
 * @param value - the packed string.
 * @param urlFor - resolves one asset path to its data URL.
 * @returns the rehydrated string.
 */
function replaceAssetRefs(value: string, urlFor: (path: string) => string): string {
  if (!value.includes(ASSET_REF_PREFIX)) return value
  let out = ''
  let rest = value
  for (;;) {
    const at = rest.indexOf(ASSET_REF_PREFIX)
    if (at < 0) return out + rest
    out += rest.slice(0, at)
    const after = rest.slice(at + ASSET_REF_PREFIX.length)
    const end = after.search(/[\s'")]/)
    const path = end < 0 ? after : after.slice(0, end)
    out += urlFor(path)
    if (end < 0) return out
    rest = after.slice(end)
  }
}

/**
 * Count the document's own parts (shown in the manifest so a reader sees what is inside).
 * @param skin - the skin document.
 * @returns counts per part.
 */
function skinStats(skin: SkinSettings): Record<string, number> {
  return {
    tokens: Object.keys(skin.tokens ?? {}).length,
    css: (skin.css ?? []).length,
    text: (skin.text ?? []).length,
    images: (skin.canvas?.images ?? []).length,
    layers: (skin.layers ?? []).length,
    library: (skin.library ?? []).length,
  }
}

/**
 * Pack one skin document into a `.dshskin`.
 * @param skin - the document to pack (data URLs are extracted into assets).
 * @param options - package metadata.
 * @returns the archive bytes plus the manifest that was written.
 */
export function packSkin(
  skin: SkinSettings,
  options: { name: string; generator: string; createdAt?: string },
): DshSkinPackage {
  const payloads: Array<{ path: string; mime: string; bytes: Uint8Array }> = []
  const seen = new Map<string, string>()
  let counter = 0
  const refFor = (url: string): string => {
    const known = seen.get(url)
    if (known !== undefined) return ASSET_REF_PREFIX + known
    const mime = dataUrlMime(url)
    const bytes = dataUrlBytes(url) ?? new Uint8Array(0)
    counter += 1
    const path = ASSET_DIR + '/' + kindForMime(mime) + '-' + counter + '.' + extForMime(mime)
    payloads.push({ path, mime, bytes })
    seen.set(url, path)
    return ASSET_REF_PREFIX + path
  }
  const packed = mapStrings(skin, (value) => refString(value, refFor))
  const manifest: DshSkinManifest = {
    format: DSHSKIN_FORMAT,
    formatVersion: DSHSKIN_VERSION,
    generator: options.generator,
    name: options.name,
    createdAt: options.createdAt ?? new Date().toISOString(),
    assets: payloads.map((payload) => ({ path: payload.path, kind: kindForMime(payload.mime), mime: payload.mime, bytes: payload.bytes.length })),
    stats: skinStats(skin),
    skin: packed,
  }
  const readme = [
    'dshskin — DSH 皮肤包 / DSH skin package',
    '',
    '这是一个 ZIP 容器（本包用 STORE 未压缩写入，任何解压工具都能打开）：',
    '  manifest.json  皮肤文档（图片/字体等已抽成 assets/ 下的引用）',
    '  assets/*       真实字节的资源文件，可直接替换成自己的图/字体',
    '  README.txt     本说明',
    '',
    '重新打包后仍可导入：manifest.json 里的引用形如 dshskin:assets/image-1.webp，',
    '把同名文件换掉即可（扩展名保持一致的格式，例如 .webp 换 .webp）。',
    '导入口在 DSH 设置 →「皮肤管理」→ 导入皮肤。',
    '',
    'generator: ' + options.generator,
    'createdAt: ' + manifest.createdAt,
    'assets: ' + String(manifest.assets.length),
  ].join(String.fromCharCode(10))
  const bytes = zipStore([
    { path: MANIFEST_PATH, bytes: textEncoder.encode(JSON.stringify(manifest, null, 2)) },
    ...payloads.map((payload) => ({ path: payload.path, bytes: payload.bytes })),
    { path: README_PATH, bytes: textEncoder.encode(readme) },
  ])
  return { bytes, manifest }
}

/**
 * Unpack a `.dshskin` (or a legacy JSON export) into a skin document.
 *
 * Legacy files stay importable on purpose: the JSON export existed for several releases
 * and users have them on disk.
 * @param bytes - the file's bytes.
 * @returns the document and (for packages) the manifest.
 * @throws Error with a readable message when the file cannot be read.
 */
export async function unpackSkin(bytes: Uint8Array): Promise<DshSkinContents> {
  if (!isZip(bytes)) {
    // Legacy JSON export: data URLs already inside, nothing to rehydrate.
    const parsed = JSON.parse(textDecoder.decode(bytes)) as SkinSettings
    return {
      skin: parseSkin(parsed),
      manifest: {
        format: DSHSKIN_FORMAT,
        formatVersion: 0,
        generator: 'legacy json',
        name: 'dsh-myskin.json',
        createdAt: '',
        assets: [],
        stats: skinStats(parseSkin(parsed)),
        skin: parseSkin(parsed),
      },
    }
  }
  const files = await unzip(bytes)
  const manifestBytes = files.get(MANIFEST_PATH)
  if (manifestBytes === undefined) throw new Error('missing ' + MANIFEST_PATH)
  const manifest = JSON.parse(textDecoder.decode(manifestBytes)) as DshSkinManifest
  if (manifest.format !== DSHSKIN_FORMAT) throw new Error('not a ' + DSHSKIN_FORMAT + ' package')
  if (typeof manifest.formatVersion !== 'number' || manifest.formatVersion > DSHSKIN_VERSION) {
    throw new Error('package needs a newer dsh-myskin (format v' + String(manifest.formatVersion) + ')')
  }
  const mimes = new Map((manifest.assets ?? []).map((asset) => [asset.path, asset.mime]))
  const urls = new Map<string, string>()
  const missing: string[] = []
  const used = new Set<string>()
  const urlFor = (path: string): string => {
    used.add(path)
    const known = urls.get(path)
    if (known !== undefined) return known
    const payload = files.get(path)
    if (payload === undefined) { missing.push(path); return ASSET_REF_PREFIX + path }
    const mime = mimes.get(path) ?? mimeForPath(path) ?? 'application/octet-stream'
    const url = bytesToDataUrl(payload, mime)
    urls.set(path, url)
    return url
  }
  const skin = mapStrings(manifest.skin ?? ({} as SkinSettings), (value) => replaceAssetRefs(value, urlFor))
  if (missing.length > 0) throw new Error('package is missing assets: ' + [...new Set(missing)].join(', '))
  return { skin: parseSkin(skin), manifest }
}

//#endregion
