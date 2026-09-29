/**
 * The fixture theme (a full-size, real-world document: 43 tokens, a CSS layer and an
 * embedded wallpaper): it must apply through the real engine, carry a strength marker,
 * and revert byte-exactly. This keeps a broken palette or an unknown token from
 * shipping unnoticed.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { loadTs } from './helpers/load-ts.mjs'

const engine = await loadTs('src/client/skin-engine.ts')

const read = (name) => JSON.parse(readFileSync(new URL('./fixtures/' + name, import.meta.url), 'utf8'))
const tokensOnly = read('xingye-theme.tokens-only.json')
const full = read('xingye-theme.skin.json')

const FIXTURE = '<!doctype html><html><head></head><body data-ds-dark-theme=""><div id="app"><span id="hero">Hello</span></div></body></html>'

/** Install a fresh jsdom document as the global DOM. */
function setup() {
  const dom = new JSDOM(FIXTURE, { pretendToBeVisual: true })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.Node = dom.window.Node
  globalThis.MutationObserver = dom.window.MutationObserver
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)
  return dom.window
}

/** Minimal ctx.theme stand-in. */
function fakeTheme() {
  const calls = []
  return { calls, overrideTokens(source, tokens) { calls.push({ source, tokens }); return () => { calls.length = 0 } } }
}

test('the theme document is well formed', () => {
  assert.equal(tokensOnly.enabled, true)
  assert.ok(Object.keys(tokensOnly.tokens).length >= 40)
  for (const [name, modes] of Object.entries(tokensOnly.tokens)) {
    assert.match(name, /^--dsw-[a-z0-9-]+$/)
    assert.equal(typeof modes.light, 'string')
    assert.equal(typeof modes.dark, 'string')
  }
  assert.match(full.canvas.background, /^data:image\//)
  assert.equal(engine.readBackgroundOpacity(engine.currentSkin(full)), 0.68)
  assert.equal(engine.readBackgroundOpacity(engine.currentSkin(tokensOnly)), 0.68)
})

test('the theme applies through the engine and reverts byte-exactly', () => {
  const window = setup()
  const before = window.document.body.outerHTML
  const theme = fakeTheme()
  const override = engine.applySkin(theme, engine.currentSkin(tokensOnly))
  const css = window.document.getElementById('dsh-myskin-rule').textContent
  assert.equal(theme.calls.length, 1)
  assert.equal(Object.keys(theme.calls[0].tokens).length, Object.keys(tokensOnly.tokens).length)
  assert.match(css, /body::before/)
  assert.match(css, /::-webkit-scrollbar-thumb/)
  assert.match(css, /--dsh-myskin-bg-opacity: 0\.68/)
  override.dispose()
  assert.equal(window.document.body.outerHTML, before)
})
