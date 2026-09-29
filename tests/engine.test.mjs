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

test('a desktop wallpaper tints the shell exactly once, on the surface that owns the corner', () => {
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
  // The conversation column carries the wallpaper and the only tint (gradient above the
  // image), and gives up its own colour in the same rule; the frame keeps DSH's own
  // surface, which fills the rounded notch.
  assert.equal((css.match(/linear-gradient\(rgba\(/g) ?? []).length, 1)
  assert.match(css, /\[class\*="_centerCol"\], \[class~="centerCol"\] \{ background-image: linear-gradient\(rgba\(255, 255, 255, 0\.6\), rgba\(255, 255, 255, 0\.6\)\), url\("data:image\/gif;base64,R0lGODlhAQABAAAAACw="\) !important; background-size: cover !important; background-position: center !important; background-attachment: fixed !important; background-color: transparent !important; \}/)
  assert.doesNotMatch(css, /\[class\*="_frame"\][^{]*\{ background-image/)
  assert.match(css, /--dsw-alias-bg-base: rgba\(255, 255, 255, 0\.6\)/)
  // ONE canvas surface per pixel inside the column: its chrome is denied the token…
  assert.match(css, /\[class\*="_centerCol"\], \[class~="centerCol"\] \{ --dsw-alias-bg-base: transparent !important; \}/)
  // …the content a conversation slot renders gets it back, so its cards stay crisp…
  // (not anchored at the end: the seat rule is emitted after this one)
  assert.match(css, /\[class\*="_centerCol"\] \[data-slot="conversation\.session"\], \[class\*="_centerCol"\] \[data-slot\^="conversation\.view"\], \[class~="centerCol"\] \[data-slot="conversation\.session"\], \[class~="centerCol"\] \[data-slot\^="conversation\.view"\] \{ --dsw-alias-bg-base: rgba\(255, 255, 255, 0\.6\) !important; \}/)
  // …and the composer seat stops painting the fade that stacked a third veil there.
  assert.match(css, /\[class\*="_centerCol"\] \[data-composer-seat\], \[class\*="_centerCol"\] \[class\*="_composerSeat"\], \[class\*="_centerCol"\] \[class~="composerSeat"\], \[class~="centerCol"\] \[data-composer-seat\], \[class~="centerCol"\] \[class\*="_composerSeat"\], \[class~="centerCol"\] \[class~="composerSeat"\] \{ background: none !important; --dsw-alias-bg-base: rgba\(255, 255, 255, 0\.6\) !important; \}$/)
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

test('the conversation chrome inside the column never paints a second canvas surface', () => {
  const window = setup()
  window.document.documentElement.setAttribute('data-windows-titlebar', '')
  window.document.body.style.backgroundColor = '#ffffff'
  // The real upstream surface rules, so the token each element consumes is the token
  // upstream would paint. jsdom resolves the custom-property cascade (but not var()
  // inside shorthand values), and that cascade IS the mechanism under test: one slider
  // value must leave exactly ONE canvas surface per pixel.
  window.document.head.insertAdjacentHTML('beforeend', [
    '<style>',
    '[data-windows-titlebar] .pI_x6G_frame{background:var(--dsw-specific-sidebar-fill)}',
    '[data-windows-titlebar] .pI_x6G_centerCol{background:var(--dsw-alias-bg-base);border-radius:var(--dsh-windows-content-radius) 0 0 0}',
    '.wSkVaW_root{background:var(--dsw-alias-bg-base)}',
    '.wSkVaW_root[data-phase=active] .wSkVaW_composerSeat{background:linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-bg-base) 0%, transparent) 0px, var(--dsw-alias-bg-base) 36px)}',
    '</style>',
  ].join(''))
  window.document.body.innerHTML = [
    '<div id="root"><div class="pI_x6G_frame"><div class="pI_x6G_centerCol">',
    '<div class="wSkVaW_root" data-phase="active">',
    // The header is rendered THROUGH a slot (conversation.session.header): handing the
    // token back to every "conversation." slot would give the top bar its canvas surface
    // back and quietly undo the whole fix.
    '<div data-slot="conversation.session.header"><header class="wSkVaW_header"></header></div>',
    '<div class="wSkVaW_scrollBody">',
    '<div data-slot="conversation.session"><div data-slot="conversation.view">',
    '<div class="fsXYAq_card" style="background: var(--dsw-alias-bg-base)"></div>',
    '</div></div>',
    // The seat carries its own stable marker, so it is neutralized by selector while its
    // cards keep the surface.
    '<div class="wSkVaW_composerSeat" data-composer-seat="" data-conversation-region="composer">',
    '<div class="lXshSW_root" style="background: var(--dsw-alias-bg-base)"></div>',
    '</div>',
    '</div>',
    '</div>',
    '</div></div>',
  ].join('')
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
  const doc = window.document
  const token = (selector) => window.getComputedStyle(doc.querySelector(selector)).getPropertyValue('--dsw-alias-bg-base').trim()
  const canvas = 'rgba(255, 255, 255, 0.6)'
  // jsdom resolves the custom-property cascade but does NOT inherit custom properties, so
  // these assertions read what each element *declares* — which is the part that can
  // silently break (specificity against the body rule, and the slot allow-list). The
  // inherited half (the conversation root and the header element see the column's
  // `transparent`) is pinned by the CSS-text assertions in the wallpaper test above.
  assert.equal(token('.pI_x6G_centerCol'), 'transparent')
  // The content a view renders gets the surface back for its cards…
  assert.equal(token('[data-slot="conversation.session"]'), canvas)
  // …the composer seat hands it to its cards too…
  assert.equal(token('[data-composer-seat]'), canvas)
  // …and the header's slot must NOT: it is a conversation slot as well, and handing the
  // token back there is exactly how the top bar would regain its second canvas surface.
  assert.equal(token('[data-slot="conversation.session.header"]'), '')
  // The seat's own fade is neutralized by the `background: none !important` rule pinned in
  // the CSS-text assertions above (jsdom cannot compute background-image through the
  // `color-mix()` shorthand upstream uses, so reading it here would prove nothing).
  override.dispose()
  assert.equal(doc.querySelector('style[data-plugin-css="dsh-myskin-rule"]'), null)
})

test('the structural fallback re-tags, but never paints directly', () => {
  const window = setup()
  window.document.body.innerHTML = '<div id="root"><div class="sidebar_hash"><div class="workspace_hash"><div class="panel_hash" id="target"></div></div></div></div>'
  const doc = window.document
  const fallback = '#root > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1)'
  const escaped = fallback.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const theme = fakeTheme()
  const skin = {
    enabled: true,
    tokens: {},
    css: [],
    text: [],
    layers: [],
    library: [],
    canvas: {
      background: undefined,
      images: [{
        id: 'e1',
        selector: '[data-dsh-myskin-embed="e1"]',
        fallbackSelector: fallback,
        url: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
        x: 0,
        y: 0,
        w: 40,
        h: 20,
      }],
    },
  }
  const override = engine.applySkin(theme, skin)
  const css = doc.getElementById('dsh-myskin-rule').textContent
  // A positional path points at a look-alike the moment React shifts a sibling, so the
  // stylesheet only ever paints the transient tag; identity is re-established by the
  // engine (see the two re-tag tests below), never by the fallback path itself.
  assert.doesNotMatch(css, new RegExp(escaped + ' \\{ position: relative; \\}'))
  assert.match(css, /\[data-dsh-myskin-embed="e1"\] \{ position: relative; \}/)
  assert.match(css, /\[data-dsh-myskin-embed="e1"\]::after \{ content: ''/)
  assert.equal(doc.getElementById('target').getAttribute('data-dsh-myskin-embed'), 'e1')
  override.dispose()
})

test('an embedded image is re-tagged after React rebuilds the node somewhere else', async () => {
  const window = setup()
  window.document.body.innerHTML = '<div id="root"><div class="sidebar_hash"><div class="workspace_hash"><div class="panel_hash" id="target"></div></div></div></div>'
  const doc = window.document
  const theme = fakeTheme()
  const skin = {
    enabled: true,
    tokens: {},
    css: [],
    text: [],
    layers: [],
    library: [],
    canvas: {
      background: undefined,
      images: [{
        id: 'e1',
        selector: '[data-dsh-myskin-embed="e1"]',
        fallbackSelector: '#root > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1)',
        url: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
        x: 0,
        y: 0,
        w: 40,
        h: 20,
      }],
    },
  }
  const override = engine.applySkin(theme, skin)
  assert.equal(doc.getElementById('target').getAttribute('data-dsh-myskin-embed'), 'e1')

  // A sidebar collapse/expand remounts the virtualized panel: the old node is gone and the
  // new one sits at a different sibling index, so the stored path matches nothing. The
  // engine must recognise the rebuilt element by what it looked like, not by the path.
  const rebuilt = doc.createElement('div')
  rebuilt.className = 'panel_hash'
  doc.getElementById('target').remove()
  doc.querySelector('.workspace_hash').appendChild(rebuilt)
  await new Promise((resolve) => { setTimeout(resolve, 0) })
  assert.equal(rebuilt.getAttribute('data-dsh-myskin-embed'), 'e1')
  override.dispose()
})

test('an embedded image still tags when its selector matches several nodes', async () => {
  const window = setup()
  window.document.body.innerHTML = '<div id="root"><div class="workspace_hash"><div class="panel_hash" id="first"></div><div class="panel_hash" id="second" style="display: none"></div></div></div>'
  const doc = window.document
  const theme = fakeTheme()
  const skin = {
    enabled: true,
    tokens: {},
    css: [],
    text: [],
    layers: [],
    library: [],
    canvas: {
      background: undefined,
      images: [{
        id: 'e1',
        selector: '[data-dsh-myskin-embed="e1"]',
        fallbackSelector: '.panel_hash',
        url: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
        x: 0,
        y: 0,
        w: 40,
        h: 20,
      }],
    },
  }
  const override = engine.applySkin(theme, skin)
  await new Promise((resolve) => { setTimeout(resolve, 0) })
  // Two matches used to mean "give up and tag nothing" — exactly what a collapsing sidebar
  // produced (rail + panel mounted at once). One of them must be tagged.
  const tagged = doc.querySelectorAll('[data-dsh-myskin-embed="e1"]')
  assert.equal(tagged.length, 1)
  assert.equal(tagged[0].id, 'first')
  override.dispose()
})
