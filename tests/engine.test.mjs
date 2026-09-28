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

test('the background strength round-trips through the schema-safe marker rule', () => {
  const css = engine.withBackgroundOpacity([{ selector: '#a', rule: 'color: red' }], 0.6)
  assert.equal(css.length, 2)
  assert.equal(css[1].selector, ':root')
  assert.match(css[1].rule, /--dsh-myskin-bg-opacity: 0\.6/)
  assert.equal(engine.readBackgroundOpacity(engine.currentSkin({ canvas: { images: [] }, css })), 0.6)
  // The dedicated field wins once the Host schema actually projects it.
  const projected = engine.currentSkin({ canvas: { images: [], backgroundOpacity: 0.9 }, css })
  assert.equal(engine.readBackgroundOpacity(projected), 0.9)
  // Mirroring is idempotent: re-dragging never stacks markers.
  assert.equal(engine.withBackgroundOpacity(css, 0.5).filter((rule) => rule.selector === ':root').length, 1)
  assert.equal(engine.readBackgroundOpacity(engine.currentSkin({ canvas: { images: [] } })), engine.DEFAULT_BACKGROUND_OPACITY)
})

test('a text override matches DOM text that carries whitespace and restores it raw', () => {
  const window = setup()
  window.document.body.innerHTML = '<div id="app"><span id="hero">  Hello  </span></div>'
  const before = window.document.body.outerHTML
  const theme = fakeTheme()
  const override = engine.applySkin(theme, { ...SKIN, css: [], layers: [], text: [{ selector: '#hero', before: 'Hello', after: '你好' }] })
  assert.equal(window.document.querySelector('#hero').textContent, '你好')
  override.dispose()
  assert.equal(window.document.body.outerHTML, before)
})

test('an empty `before` targets the first editable text of the element', () => {
  const window = setup()
  window.document.body.innerHTML = '<div id="app"><span id="hero">Old</span></div>'
  const before = window.document.body.outerHTML
  const theme = fakeTheme()
  const override = engine.applySkin(theme, { ...SKIN, css: [], layers: [], text: [{ selector: '#hero', before: '', after: 'New' }] })
  assert.equal(window.document.querySelector('#hero').textContent, 'New')
  override.dispose()
  assert.equal(window.document.body.outerHTML, before)
})

test('textHostOf picks the node that owns the text, and reports nothing for icon-only controls', () => {
  const window = setup()
  window.document.body.innerHTML = '<div id="wrapper"><span id="label">Text</span></div><button id="icon"><svg></svg></button><button id="empty"></button>'
  const wrapper = window.document.getElementById('wrapper')
  const label = window.document.getElementById('label')
  assert.equal(engine.textHostOf(wrapper), label)
  assert.equal(engine.textHostOf(label), label)
  assert.equal(engine.textHostOf(window.document.getElementById('icon')), undefined)
  assert.equal(engine.textHostOf(window.document.getElementById('empty')), undefined)
})

test('hide/remove declarations merge by property instead of replacing the rule', () => {
  assert.equal(engine.mergeDeclaration('color: red', 'visibility: hidden !important'), 'color: red; visibility: hidden !important')
  assert.equal(engine.mergeDeclaration('color: red; display: flex', 'color: blue'), 'color: blue; display: flex')
  assert.equal(engine.withoutDeclaration('color: red; visibility: hidden !important', 'visibility'), 'color: red')
  assert.equal(engine.withoutDeclaration('visibility: hidden !important', 'visibility'), '')
  assert.equal(engine.hasDeclaration(undefined, 'display'), false)
  assert.equal(engine.hasDeclaration('display: none !important', 'display'), true)
  assert.equal(engine.HIDE_DECLARATION, 'visibility: hidden !important')
  assert.equal(engine.REMOVE_DECLARATION, 'display: none !important')
})

test('selectorOf anchors portalled dialogs so per-element actions can match', () => {
  const window = setup()
  window.document.body.innerHTML = [
    '<div id="root"><div><button class="plain">A</button></div></div>',
    '<div class="overlay"><div role="dialog" data-shortcut-modal="settings">',
      '<nav><button>One</button></nav>',
      '<div class="content"><ul><li><button>Model A</button></li><li><button>Model B</button></li></ul></div>',
    '</div></div>',
  ].join('')
  const inRoot = window.document.querySelector('#root button.plain')
  const rootSelector = engine.selectorOf(inRoot)
  assert.match(rootSelector, /^#root > /)
  assert.equal(window.document.querySelector(rootSelector), inRoot)
  // An element with an id keeps the short, stable form.
  assert.equal(engine.selectorOf(window.document.getElementById('root')), '#root')

  // Settings, menus and modals portal beside #root; the old #root-anchored selector
  // for these read '#root > … > body > …' and matched nothing at all.
  const modelB = window.document.querySelectorAll('li button')[1]
  const portalSelector = engine.selectorOf(modelB)
  assert.match(portalSelector, /^\[data-shortcut-modal="settings"\] > /)
  assert.equal(window.document.querySelector(portalSelector), modelB)

  // No stable anchor available: the body-anchored path is still a valid selector.
  const loose = window.document.createElement('div')
  const button = window.document.createElement('button')
  loose.appendChild(button)
  window.document.body.appendChild(loose)
  const looseSelector = engine.selectorOf(button)
  assert.match(looseSelector, /^body > /)
  assert.equal(window.document.querySelector(looseSelector), button)
})

test('hide and remove declarations keep the element’s other customizations', () => {
  const rule = engine.mergeDeclaration('color: red', engine.HIDE_DECLARATION)
  assert.equal(rule, 'color: red; visibility: hidden !important')
  assert.equal(engine.withoutDeclaration(rule, 'visibility'), 'color: red')
})

test('a desktop wallpaper tints the shell exactly once', () => {
  const window = setup()
  window.document.documentElement.setAttribute('data-windows-titlebar', '')
  window.document.body.innerHTML = '<div class="app_frame_hash"><div class="app_centerCol_hash"></div></div>'
  window.document.body.style.backgroundColor = '#ffffff'
  const before = window.document.body.outerHTML
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
  // The frame carries the only tint (gradient above the image) and the conversation
  // column stops painting its own copy: stacking both made the strength slider
  // visibly useless.
  assert.equal((css.match(/linear-gradient\(rgba\(/g) ?? []).length, 1)
  assert.match(css, /\[class\*="_centerCol"\], \[class~="centerCol"\] \{ background-color: transparent !important; \}/)
  assert.match(css, /--dsw-alias-bg-base: rgba\(255, 255, 255, 0\.6\)/)
  override.dispose()
  assert.equal(window.document.body.outerHTML, before)
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
