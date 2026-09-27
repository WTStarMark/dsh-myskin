/**
 * Reversible-apply engine under jsdom.
 *
 * The core promise of this plugin is byte-exact reversibility: enabling a skin
 * must leave no trace once disposed. These tests pin that on a DOM shaped like
 * the DSH shell (dark scheme attribute, a settings nav cell, a text target).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { loadTs } from './helpers/load-ts.mjs'

const engine = await loadTs('src/client/skin-engine.ts')

const FIXTURE = '<!doctype html><html><head></head><body data-ds-dark-theme=""><div id="app"><span id="hero">Hello</span></div></body></html>'

/**
 * Install a fresh jsdom document as the global DOM.
 * @returns the jsdom window.
 */
function setup() {
  const dom = new JSDOM(FIXTURE, { pretendToBeVisual: true })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.Node = dom.window.Node
  globalThis.MutationObserver = dom.window.MutationObserver
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)
  return dom.window
}

/**
 * Minimal stand-in for ctx.theme.
 * @returns the fake registry plus its recorded calls.
 */
function fakeTheme() {
  const calls = []
  return {
    calls,
    overrideTokens(source, tokens) {
      calls.push({ source, tokens })
      return () => { calls.length = 0 }
    },
  }
}

const SKIN = {
  enabled: true,
  tokens: { '--dsw-alias-bg-base': { light: '#101010', dark: '#202020' } },
  css: [{ selector: '#hero', rule: 'color: red' }],
  text: [{ selector: '#hero', before: 'Hello', after: '你好' }],
  canvas: { images: [] },
  layers: [{ id: 'char', kind: 'div', selector: '#app', attach: 'append', css: 'width: 4px; height: 4px' }],
  library: [],
}

/** Let queued MutationObserver microtasks run. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

test('applySkin reaches every layer through the official channels', () => {
  const window = setup()
  const theme = fakeTheme()
  const override = engine.applySkin(theme, SKIN)
  assert.equal(theme.calls.length, 1)
  assert.equal(theme.calls[0].source, 'dsh-myskin')
  assert.notEqual(window.document.getElementById('dsh-myskin-rule'), null)
  assert.notEqual(window.document.querySelector('[data-dsh-myskin-layer="char"]'), null)
  assert.equal(window.document.querySelector('#hero').textContent, '你好')
  assert.equal(window.document.body.style.getPropertyValue('--dsw-alias-bg-base'), '#202020')
  override.dispose()
})

test('dispose restores body.outerHTML byte-exactly and leaves no residue', async () => {
  const window = setup()
  const before = window.document.body.outerHTML
  const theme = fakeTheme()
  const override = engine.applySkin(theme, SKIN)
  assert.notEqual(window.document.body.outerHTML, before)
  override.dispose()
  await flush()
  assert.equal(window.document.body.outerHTML, before)
  assert.equal(window.document.getElementById('dsh-myskin-rule'), null)
  assert.equal(window.document.querySelector('[data-dsh-myskin-layer="char"]'), null)
  assert.equal(window.document.querySelector('#hero').textContent, 'Hello')
})

test('an empty skin is inert', () => {
  const window = setup()
  const before = window.document.body.outerHTML
  const theme = fakeTheme()
  const override = engine.applySkin(theme, engine.currentSkin(undefined))
  assert.equal(theme.calls.length, 0)
  assert.equal(window.document.body.outerHTML, before)
  override.dispose()
  assert.equal(window.document.body.outerHTML, before)
})
