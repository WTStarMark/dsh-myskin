/**
 * Package this project into /home/share as a versioned zip — the user's standing instruction
 * ("以后每次都放"), so every release/iteration lands in one place for manual testing.
 *
 * Shape of the archive (kept identical to the releases already in /home/share): one top-level
 * directory `dsh-myskin-<version>/` holding the repo as it is — prebuilt `lib/` included, so the
 * package runs without `npm install` — minus the things that must never be shipped or cannot be
 * (`node_modules/`, `.git/`, `.tmp/`, lockfiles, editor droppings).
 *
 * Name: `dsh-myskin-<version>-r<N>.zip`, N counting up per version, never overwriting an existing
 * file. Written to `.part` first and renamed, so a crash never leaves a half archive behind.
 *
 * No third-party dependency: the ZIP container is written here with node's own zlib.
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import crypto from 'node:crypto'

const root = path.resolve(import.meta.dirname, '..')
const shareDir = process.env.DSH_MYSKIN_SHARE_DIR || '/home/share'

/** Directories and files that never belong in the archive. */
const SKIP_DIRS = new Set(['node_modules', '.git', '.tmp', '.pnpm-store'])
const SKIP_FILES = new Set(['package-lock.json', '.DS_Store'])
const SKIP_SUFFIX = ['.log', '.pid', '.tmp', '.part', '.tgz', '.zip', '.dshskin']

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const name = pkg.name + '-' + pkg.version

/**
 * Every file to ship, as archive-relative paths.
 * @returns the sorted list of { absolute, relative } entries.
 */
function collect() {
  const out = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue
        walk(abs)
        continue
      }
      if (!entry.isFile()) continue
      if (SKIP_FILES.has(entry.name)) continue
      if (SKIP_SUFFIX.some((suffix) => entry.name.endsWith(suffix))) continue
      out.push({ absolute: abs, relative: path.relative(root, abs).split(path.sep).join('/') })
    }
  }
  walk(root)
  return out
}

/** CRC-32 table (the ZIP checksum), built once. */
const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let c = i
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c
  }
  return table
})()

/**
 * CRC-32 of one buffer.
 * @param buf - the bytes.
 * @returns the unsigned checksum.
 */
function crc32(buf) {
  let crc = -1
  for (let i = 0; i < buf.length; i += 1) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff]
  return (crc ^ -1) >>> 0
}

/**
 * MS-DOS date + time of one timestamp, as ZIP stores them.
 * @param date - the timestamp.
 * @returns the packed time and date words.
 */
function dosStamp(date) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  return { time: time & 0xffff, date: day & 0xffff }
}

/**
 * Build one ZIP archive in memory.
 * @param entries - the files to store ({ absolute, relative }).
 * @returns the archive bytes.
 */
function zip(entries) {
  const chunks = []
  const central = []
  let offset = 0
  for (const entry of entries) {
    const data = fs.readFileSync(entry.absolute)
    const deflated = zlib.deflateRawSync(data, { level: 9 })
    const nameBytes = Buffer.from(name + '/' + entry.relative, 'utf8')
    const stamp = dosStamp(fs.statSync(entry.absolute).mtime)
    const crc = crc32(data)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)          // version needed
    local.writeUInt16LE(0x0800, 6)      // UTF-8 names
    local.writeUInt16LE(8, 8)           // deflate
    local.writeUInt16LE(stamp.time, 10)
    local.writeUInt16LE(stamp.date, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(deflated.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(nameBytes.length, 26)
    local.writeUInt16LE(0, 28)

    chunks.push(local, nameBytes, deflated)

    const dir = Buffer.alloc(46)
    dir.writeUInt32LE(0x02014b50, 0)
    dir.writeUInt16LE(20, 4)            // version made by
    dir.writeUInt16LE(20, 6)            // version needed
    dir.writeUInt16LE(0x0800, 8)
    dir.writeUInt16LE(8, 10)
    dir.writeUInt16LE(stamp.time, 12)
    dir.writeUInt16LE(stamp.date, 14)
    dir.writeUInt32LE(crc, 16)
    dir.writeUInt32LE(deflated.length, 20)
    dir.writeUInt32LE(data.length, 24)
    dir.writeUInt16LE(nameBytes.length, 28)
    dir.writeUInt32LE((0o100644 << 16) >>> 0, 38) // unix mode: regular file (unsigned!)
    dir.writeUInt32LE(offset, 42)
    central.push(dir, nameBytes)

    offset += local.length + nameBytes.length + deflated.length
  }
  const centralBytes = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(centralBytes.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...chunks, centralBytes, end])
}

/**
 * The first free `-r<N>` for this version.
 * @returns the suffix to use.
 */
function nextRevision() {
  const used = fs.existsSync(shareDir)
    ? fs.readdirSync(shareDir)
      .map((file) => new RegExp('^' + pkg.name + '-' + pkg.version + '-r(\\d+)\\.zip$').exec(file))
      .filter((match) => match !== null)
      .map((match) => Number(match[1]))
    : []
  return (used.length === 0 ? 0 : Math.max(...used)) + 1
}

/**
 * Revision asked for on the command line (`--rev 3` / `--r3`), when the caller wants a specific
 * iteration number instead of the next free one.
 * @returns the number, or undefined for "next free".
 */
function askedRevision() {
  const args = process.argv.slice(2)
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--rev' && args[i + 1] !== undefined) {
      const value = Number(args[i + 1])
      if (Number.isInteger(value) && value > 0) return value
    }
    const inline = /^--r(\d+)$/.exec(args[i])
    if (inline !== null) return Number(inline[1])
  }
  return undefined
}

// ── run ────────────────────────────────────────────────────────────────────────────────────────
const stale = collect().filter((entry) => entry.relative.startsWith('src/')
  && fs.statSync(entry.absolute).mtimeMs > fs.statSync(path.join(root, 'lib/client.js')).mtimeMs)
if (stale.length > 0) {
  console.error('REFUSE: lib/ is older than ' + stale.length + ' source file(s) — run "node scripts/build.cjs" first')
  console.error('  e.g. ' + stale.slice(0, 3).map((e) => e.relative).join(', '))
  process.exit(3)
}

const entries = collect()
const bytes = zip(entries)
const rev = askedRevision() ?? nextRevision()
const out = path.join(shareDir, name + '-r' + rev + '.zip')
if (fs.existsSync(out)) {
  console.error('REFUSE: ' + out + ' already exists')
  process.exit(4)
}
const part = out + '.part'
fs.writeFileSync(part, bytes)
fs.renameSync(part, out)

const sha = crypto.createHash('sha256').update(bytes).digest('hex')
const rel = new Set(entries.map((entry) => entry.relative))
for (const required of ['package.json', 'cordis.patch.yml', 'lib/index.js', 'lib/client.js', 'src/client/interop.ts', 'skills/dsh-myskin/SKILL.md']) {
  if (!rel.has(required)) {
    console.error('REFUSE: ' + required + ' is missing from the archive')
    process.exit(5)
  }
}

console.log('packed  ' + out + (askedRevision() === undefined ? '  (next free revision)' : '  (asked revision)'))
console.log('entries ' + entries.length + '  bytes ' + bytes.length)
console.log('sha256  ' + sha)
console.log('content v' + pkg.version + ' · lib/ prebuilt · no node_modules/.git/.tmp')
