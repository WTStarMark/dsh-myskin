/**
 * Local font discovery.
 *
 * Two sources: the Local Font Access API (Chromium, needs a permission grant) and a
 * metric probe against a candidate list (every browser, but only knows its candidates).
 * Neither may throw at the UI: a missing canvas or a refused permission has to degrade
 * to a list the panel can honestly label.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'

const fonts = await loadTs('src/client/fonts.ts')

/**
 * A document-shaped stand-in whose canvas measures `wanted` wider than the fallback —
 * the same signal the real probe reads.
 * @param installed - families the fake browser "has".
 */
function fakeDoc(installed = []) {
  const context = {
    font: '',
    measureText(text) {
      const match = /^72px "([^"]+)", monospace$/.exec(context.font)
      const present = match !== null && installed.includes(match[1])
      return { width: present ? 100 : 50 + text.length }
    },
  }
  return { createElement: () => ({ getContext: () => context }) }
}

test('family lists are trimmed, case-insensitively de-duplicated and naturally sorted', () => {
  assert.deepEqual(fonts.normalizeFamilies([' Inter ', 'inter', '', '  ', 'Noto Sans 10', 'Noto Sans 2']),
    ['Inter', 'Noto Sans 2', 'Noto Sans 10'])
  assert.deepEqual(fonts.normalizeFamilies([]), [])
})

test('the search box filters on every word, keeps the list order and respects its limit', () => {
  const list = ['Noto Sans CJK SC', 'Noto Serif CJK SC', 'JetBrains Mono', 'Inter']
  assert.deepEqual(fonts.filterFamilies(list, ''), list)
  assert.deepEqual(fonts.filterFamilies(list, 'noto'), ['Noto Sans CJK SC', 'Noto Serif CJK SC'])
  assert.deepEqual(fonts.filterFamilies(list, 'NOTO sc'), ['Noto Sans CJK SC', 'Noto Serif CJK SC'])
  assert.deepEqual(fonts.filterFamilies(list, 'mono'), ['JetBrains Mono'])
  assert.deepEqual(fonts.filterFamilies(list, 'zzz'), [])
  assert.equal(fonts.filterFamilies(list, '', 2).length, 2)
})

test('a family is quoted only when CSS needs it', () => {
  assert.equal(fonts.quoteFamily('Inter'), 'Inter')
  assert.equal(fonts.quoteFamily('Noto Sans CJK SC'), '"Noto Sans CJK SC"')
  assert.equal(fonts.quoteFamily('  Source Han Sans SC '), '"Source Han Sans SC"')
  // A quote inside the name would break out of the stack.
  assert.equal(fonts.quoteFamily('Ev"il'), '"Evil"')
  assert.equal(fonts.quoteFamily('\u5b8b\u4f53'), '"\u5b8b\u4f53"')
})

test('the metric probe reports a family only when it changes the measurement', () => {
  const doc = fakeDoc(['Noto Sans CJK SC'])
  assert.equal(fonts.isFamilyAvailable(doc, 'Noto Sans CJK SC'), true)
  assert.equal(fonts.isFamilyAvailable(doc, 'Definitely Not Installed'), false)
  assert.deepEqual(fonts.detectFamilies(doc, ['Noto Sans CJK SC', 'Definitely Not Installed']), ['Noto Sans CJK SC'])
  // A document without a 2D context (jsdom) cannot answer: it must not throw.
  const bare = { createElement: () => ({ getContext: () => null }) }
  assert.equal(fonts.isFamilyAvailable(bare, 'Inter'), false)
  assert.deepEqual(fonts.detectFamilies(bare, ['Inter']), [])
})

test('scanFonts prefers the real list and never throws', async () => {
  const doc = fakeDoc(['WenQuanYi Micro Hei'])
  // No Local Font Access API: the probe answers, and the panel is told which source it is.
  const probed = await fonts.scanFonts(doc, {})
  assert.equal(probed.source, 'detected')
  assert.deepEqual(probed.families, ['WenQuanYi Micro Hei'])
  assert.equal(fonts.localFontsSupported({}), false)

  // The API answers: its families win, normalized.
  const win = { queryLocalFonts: async () => [{ family: 'Beta' }, { family: 'beta' }, { family: 'alpha' }] }
  assert.equal(fonts.localFontsSupported(win), true)
  const local = await fonts.scanFonts(doc, win)
  assert.equal(local.source, 'local')
  assert.deepEqual(local.families, ['alpha', 'Beta'])

  // The user refuses: the probe still fills the list, and `denied` says why it is short.
  const deniedWin = { queryLocalFonts: async () => { const error = new Error('denied'); error.name = 'NotAllowedError'; throw error } }
  const denied = await fonts.scanFonts(doc, deniedWin)
  assert.equal(denied.source, 'detected')
  assert.equal(denied.denied, true)
  assert.deepEqual(denied.families, ['WenQuanYi Micro Hei'])

  // Refused AND nothing detectable: an empty, still-honest result.
  const empty = await fonts.scanFonts(fakeDoc([]), deniedWin)
  assert.deepEqual(empty.families, [])
  assert.equal(empty.denied, true)

  // A broken API is not a crash, and it is not reported as a refusal either.
  const broken = await fonts.scanFonts(fakeDoc([]), { queryLocalFonts: async () => { throw new Error('boom') } })
  assert.equal(broken.denied, false)
  assert.deepEqual(broken.families, [])

  // The candidate list has to be big enough to be worth probing.
  assert.ok(fonts.FONT_CANDIDATES.length >= 80)
  assert.equal(new Set(fonts.FONT_CANDIDATES.map((f) => f.toLowerCase())).size, fonts.FONT_CANDIDATES.length)
})
