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

test('a background image softens the shell and slightly the panels, never dialogs or menus', () => {
  const window = setup()
  window.document.body.style.backgroundColor = '#ffffff'
  const before = window.document.body.outerHTML
  const theme = fakeTheme()
  const skin = {
    enabled: true,
    tokens: {},
    css: [],
    text: [],
    canvas: { background: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', backgroundOpacity: 0.8, images: [] },
    layers: [],
    library: [],
  }
  const override = engine.applySkin(theme, skin)
  const css = window.document.getElementById('dsh-myskin-rule').textContent
  assert.match(css, /--dsw-alias-bg-base: rgba\(255, 255, 255, 0\.8\)/)
  assert.match(css, /--dsw-alias-bg-layer-1: rgba\(255, 255, 255, 0\.95\)/)
  assert.doesNotMatch(css, /--dsw-alias-bg-layer-2/)
  assert.doesNotMatch(css, /--dsw-alias-bg-overlay/)
  override.dispose()
  assert.equal(window.document.body.outerHTML, before)
})

test('a low background strength keeps the wallpaper readable without losing contrast on cards', () => {
  const window = setup()
  window.document.body.style.backgroundColor = '#ffffff'
  const theme = fakeTheme()
  const skin = {
    enabled: true,
    tokens: {},
    css: [],
    text: [],
    canvas: { background: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', backgroundOpacity: 0.6, images: [] },
    layers: [],
    library: [],
  }
  const override = engine.applySkin(theme, skin)
  const css = window.document.getElementById('dsh-myskin-rule').textContent
  assert.match(css, /--dsw-alias-bg-base: rgba\(255, 255, 255, 0\.6\)/)
  assert.match(css, /--dsw-alias-bg-layer-1: rgba\(255, 255, 255, 0\.75\)/)
  override.dispose()
})

test('background strength 100% leaves every app surface untouched', () => {
  const window = setup()
  window.document.body.style.backgroundColor = '#ffffff'
  const theme = fakeTheme()
  const skin = {
    enabled: true,
    tokens: {},
    css: [],
    text: [],
    canvas: { background: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', backgroundOpacity: 1, images: [] },
    layers: [],
    library: [],
  }
  const override = engine.applySkin(theme, skin)
  const css = window.document.getElementById('dsh-myskin-rule').textContent
  assert.doesNotMatch(css, /--dsw-alias-bg-base:/)
  override.dispose()
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
