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
  assert.match(css, /\[data-dsh-myskin-embed="e1"\] \{ position: relative; isolation: isolate; \}/)
  assert.match(css, /\[data-dsh-myskin-embed="e1"\]::after \{ content: ''/)
  // The picture goes BELOW the container's content: a positive z-index painted it over the very
  // rows it was embedded into (reported from a screenshot), and the negative one only stays inside
  // the container because the host rule isolates it as a stacking context.
  assert.match(css, /\[data-dsh-myskin-embed="e1"\]::after \{[^}]*z-index: -1;/)
  assert.doesNotMatch(css, /\[data-dsh-myskin-embed="e1"\]::after \{[^}]*z-index: 1;/)
  assert.equal(doc.getElementById('target').getAttribute('data-dsh-myskin-embed'), 'e1')
  override.dispose()
})

test('a blend mode moves the image above the content — isolation would kill the blend', () => {
  // `mix-blend-mode` blends with its BACKDROP, and `isolation: isolate` cuts that backdrop down to
  // the container's own background: under isolation every mode blends against nothing, which is
  // exactly the report ("the four modes feel the same"). So a real blend mode paints the image
  // ABOVE the content, with no isolation — and `normal` keeps the picture below the rows.
  const window = setup()
  window.document.body.innerHTML = '<div id="root"><div id="target"></div></div>'
  const doc = window.document
  const base = {
    id: 'e2',
    selector: '[data-dsh-myskin-embed="e2"]',
    fallbackSelector: '',
    anchor: { kind: 'element', value: '#target' },
    url: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
    x: 0, y: 0, w: 40, h: 20,
  }
  const override = engine.applySkin(fakeTheme(), {
    enabled: true, tokens: {}, css: [], text: [], layers: [], library: [],
    canvas: { background: undefined, images: [{ ...base, blend: 'multiply' }] },
  })
  const css = doc.getElementById('dsh-myskin-rule').textContent
  assert.match(css, /\[data-dsh-myskin-embed="e2"\] \{ position: relative; \}/)
  assert.doesNotMatch(css, /\[data-dsh-myskin-embed="e2"\] \{ position: relative; isolation: isolate; \}/)
  assert.match(css, /\[data-dsh-myskin-embed="e2"\]::after \{[^}]*z-index: 1;[^}]*mix-blend-mode: multiply;/)
  assert.equal(engine.embedPaintsAbove({ ...base, blend: 'multiply' }), true)
  assert.equal(engine.embedPaintsAbove({ ...base, blend: 'normal' }), false)
  assert.equal(engine.embedPaintsAbove(base), false, 'no blend mode = the below-content default')
  override.dispose()
})

test('the wallpaper can anchor to the conversation instead of the viewport', () => {
  // Default (viewport): the page carries the wallpaper with `background-attachment: fixed`, i.e.
  // positioned against the WINDOW — folding the sidebar slides the conversation area under a
  // background that did not move.
  const window = setup()
  const plain = engine.wallpaperRules(window.document, 'data:image/gif;base64,AAA')
  assert.equal(plain.length, 1)
  assert.match(plain[0], /^body \{/)
  assert.match(plain[0], /background-attachment: fixed !important/)
  // Opt-in: the conversation column paints the same image anchored to ITS OWN box (`scroll`, not
  // `fixed`), so a sidebar fold re-centers it with no script and no resize listener.
  const anchored = engine.wallpaperRules(window.document, 'data:image/gif;base64,AAA', undefined, 'conversation')
  assert.equal(anchored.length, 2)
  assert.match(anchored[1], /\[class\*="_centerCol"\], \[class~="centerCol"\] \{ background-image: url\("data:image\/gif;base64,AAA"\) !important; background-size: cover !important; background-position: center !important; background-attachment: scroll !important; \}/)
  assert.doesNotMatch(anchored[1], /fixed/)
  // The choice rides in `css` as a marker — no new `canvas` field, so an older Host cannot drop it.
  const css = engine.withBackgroundAnchor(engine.withBackgroundOpacity([{ selector: '#a', rule: 'color: red' }], 0.6), 'conversation')
  assert.equal(css.filter((rule) => rule.selector === ':root').length, 1, 'one :root entry carries both markers')
  assert.equal(css.find((rule) => rule.selector === '#a').rule, 'color: red', 'other rules survive')
  const skin = { canvas: { images: [] }, css }
  assert.equal(engine.readBackgroundAnchor(skin), 'conversation')
  assert.equal(engine.readBackgroundOpacity(skin), 0.6, 'the strength marker survives the anchor write')
  // …and turning it off drops only that declaration.
  const off = engine.withBackgroundAnchor(css, 'viewport')
  assert.equal(engine.readBackgroundAnchor({ canvas: { images: [] }, css: off }), 'viewport')
  assert.equal(off.filter((rule) => rule.selector === ':root').length, 1)
  assert.match(off.find((rule) => rule.selector === ':root').rule, /--dsh-myskin-bg-opacity: 0.6/)
  assert.doesNotMatch(off.find((rule) => rule.selector === ':root').rule, /--dsh-myskin-bg-anchor/)
  assert.equal(engine.readBackgroundAnchor({ canvas: { images: [] }, css: [] }), 'viewport', 'default is the page')
})

test('the APPLIED skin honours the wallpaper anchor (the preview is not the only path)', () => {
  // The engine had the anchor parameter and the marker reader, but its apply path never passed the
  // anchor through: the option worked in the draw-mode preview and did NOTHING in 交互模式 — which is
  // the only place the sidebar fold can be watched, so the whole feature looked broken (reported).
  // This pins the CALL SITE, not the rule builder (that one is covered above).
  const window = setup()
  window.document.body.innerHTML = '<div class="pI_x6G_frame"><div class="pI_x6G_sidebarCol"></div><div class="pI_x6G_centerCol"></div></div>'
  const doc = window.document
  const url = 'data:image/gif;base64,AAA'
  const base = { enabled: true, tokens: {}, text: [], layers: [], library: [], canvas: { background: url, images: [] } }
  const anchored = engine.applySkin(fakeTheme(), { ...base, css: [{ selector: ':root', rule: '--dsh-myskin-bg-anchor: conversation;' }] })
  const css = doc.getElementById('dsh-myskin-rule').textContent
  assert.match(css, /_centerCol[^}]*background-attachment: scroll !important/)
  assert.match(css, /body \{[^}]*background-attachment: fixed !important/, 'the page keeps its own copy')
  anchored.dispose()
  // Without the marker the applied skin stays viewport-anchored: `scroll` must not leak in.
  const plain = engine.applySkin(fakeTheme(), { ...base, css: [] })
  assert.doesNotMatch(doc.getElementById('dsh-myskin-rule').textContent, /background-attachment: scroll/)
  plain.dispose()
})

test('an image layer override beats the blend-mode default', () => {
  // 'auto' = the blend mode decides; 'above'/'below' = the user overriding it. The override exists
  // because "below the content" is right for a container whose children are transparent (a sidebar
  // list) and WRONG for one whose children are opaque cards: there the picture is painted between the
  // container's background and its content, i.e. invisible (reported on a settings page).
  const window = setup()
  window.document.body.innerHTML = '<div id="target"></div>'
  const doc = window.document
  const base = {
    id: 'e1',
    selector: '[data-dsh-myskin-embed="e1"]',
    fallbackSelector: '',
    anchor: { kind: 'element', value: '#target' },
    url: 'data:image/gif;base64,AAA',
    x: 0, y: 0, w: 40, h: 20,
  }
  const marker = (layer) => ({ selector: '[data-dsh-myskin-embed="e1"]', rule: '--dsh-myskin-layer: ' + layer + ';' })
  const paint = (img, css) => {
    const override = engine.applySkin(fakeTheme(), { enabled: true, tokens: {}, css, text: [], layers: [], library: [], canvas: { images: [img] } })
    const text = doc.getElementById('dsh-myskin-rule').textContent
    override.dispose()
    return text
  }
  // auto: the blend mode is the only thing deciding.
  assert.match(paint(base, []), /\[data-dsh-myskin-embed="e1"\] \{ position: relative; isolation: isolate; \}/)
  assert.match(paint({ ...base, blend: 'multiply' }, []), /\[data-dsh-myskin-embed="e1"\] \{ position: relative; \}/)
  // explicit 内容之上 with no blend at all — the escape hatch for an opaque container.
  const above = paint(base, [marker('above')])
  assert.match(above, /\[data-dsh-myskin-embed="e1"\] \{ position: relative; \}/)
  assert.doesNotMatch(above, /isolation: isolate/)
  assert.match(above, /::after \{[^}]*z-index: 1;/)
  // explicit 内容之下 wins over a blend mode, and the blend stays (its backdrop is just smaller).
  const below = paint({ ...base, blend: 'screen' }, [marker('below')])
  assert.match(below, /isolation: isolate/)
  assert.match(below, /::after \{[^}]*z-index: -1;[^}]*mix-blend-mode: screen;/)
  // The choice round-trips through `css` alone (no document field, so an older Host still saves it).
  const css = engine.withImageLayer([{ selector: '#other', rule: 'color: red' }], 'e1', 'above')
  assert.equal(engine.readImageLayer({ canvas: { images: [] }, css }, 'e1'), 'above')
  assert.equal(css.find((rule) => rule.selector === '#other').rule, 'color: red', 'other rules survive')
  assert.equal(engine.readImageLayer({ canvas: { images: [] }, css: engine.withImageLayer(css, 'e1', 'auto') }, 'e1'), 'auto')
  assert.equal(engine.readImageLayer({ canvas: { images: [] }, css: [] }, 'e1'), 'auto', 'default is auto')
})

test('the edge feather dissolves the edge, grows a small halo, and never moves the picture', () => {
  // A sticker with hard borders looks pasted on; the feather is what makes it sit down. Two things
  // this pins, both of them reported: the picture must NOT move (an earlier version shifted the
  // background a second time inside the already-grown pseudo-element, so every feathered picture slid
  // towards the top-left), and the softness must be an EDGE ramp rather than a blur of the artwork.
  const window = setup()
  window.document.body.innerHTML = '<div id="target"></div>'
  const doc = window.document
  const base = {
    id: 'e1',
    selector: '[data-dsh-myskin-embed="e1"]',
    fallbackSelector: '',
    anchor: { kind: 'element', value: '#target' },
    url: 'data:image/gif;base64,AAA',
    x: 0, y: 0, w: 40, h: 20,
  }
  const paint = (img, css) => {
    const override = engine.applySkin(fakeTheme(), { enabled: true, tokens: {}, css, text: [], layers: [], library: [], canvas: { images: [img] } })
    const text = doc.getElementById('dsh-myskin-rule').textContent
    override.dispose()
    return text
  }
  // 24px fade → a 6px halo and a 30px ramp from the halo's border, so full opacity lands exactly
  // 24px inside the user's box.
  const feathered = engine.withImageFeather([], 'e1', { width: 24, soft: 0 })
  assert.deepEqual(engine.readImageFeather({ canvas: { images: [] }, css: feathered }, 'e1'), { width: 24, soft: 0 })
  const css = paint(base, feathered)
  assert.match(css, /::after \{[^}]*inset: -6px;/)
  assert.match(css, /background-position: 0px 0px;/, 'the picture does not move: the pseudo already grew')
  assert.match(css, /background-size: 52px 32px;/, 'the picture grows by the halo on every side')
  assert.match(css, /mask-image: linear-gradient\(to right, rgba\(0, 0, 0, 0\) 0px, /)
  assert.match(css, /linear-gradient\(to bottom, rgba\(0, 0, 0, 0\) 0px, /)
  assert.match(css, /#000 calc\(100% - 30px\)/)
  assert.match(css, /mask-composite: intersect/)
  assert.match(css, /-webkit-mask-composite: source-in/)
  assert.match(css, /mask-repeat: no-repeat/)
  assert.doesNotMatch(css, /filter:/, 'the artwork is never blurred — only the ramp changes')
  // An offset picture keeps its offset.
  const moved = paint({ ...base, x: 12, y: 7 }, feathered)
  assert.match(moved, /background-position: 12px 7px;/)
  // 柔化 bends the ramp from linear into a smoothstep: same width, gentler at both ends.
  assert.match(css, /rgba\(0, 0, 0, 0\.2\) 6px/, 'the linear ramp at the first sample')
  const soft = paint(base, engine.withImageFeather([], 'e1', { width: 24, soft: 1 }))
  assert.match(soft, /rgba\(0, 0, 0, 0\.1\) 6px/, 'the smoothstep starts gentler')
  assert.match(soft, /rgba\(0, 0, 0, 0\.9\) 24px/, 'and is already 0.9 near the plateau')
  assert.match(css, /rgba\(0, 0, 0, 0\.8\) 24px/, 'while the linear ramp is only 0.8 there')
  assert.equal(engine.readImageFeather({ canvas: { images: [] }, css: engine.withImageFeather([], 'e1', { width: 24, soft: 1 }) }, 'e1').soft, 1)
  // Turning it off restores the plain block, and cleans up markers older versions wrote.
  const legacy = [{ selector: '[data-dsh-myskin-embed="e1"]', rule: '--dsh-myskin-feather-blur: 4px; --dsh-myskin-feather-shape: rect;' }]
  const off = engine.withImageFeather(legacy, 'e1', { width: 0, soft: 0 })
  assert.deepEqual(off, [], 'the marker rule is pruned when nothing is left')
  const plain = paint(base, off)
  assert.match(plain, /::after \{[^}]*inset: 0;/)
  assert.match(plain, /background-size: 40px 20px;/)
  assert.doesNotMatch(plain, /mask-image/)
  // The feather rides the SAME marker rule as the layer choice: one rule per image, both settings.
  const both = engine.withImageLayer(feathered, 'e1', 'above')
  assert.equal(both.length, 1)
  assert.match(both[0].rule, /--dsh-myskin-layer: above/)
  assert.match(both[0].rule, /--dsh-myskin-feather: 24px/)
  assert.equal(engine.readImageLayer({ canvas: { images: [] }, css: both }, 'e1'), 'above')
})

test('the settings-page key prefers the dialog nav, and compares by label only', () => {
  // Two failure modes are pinned here, both reported: a key taken from a segmented control inside the
  // page content (so the "page" was named after a toggle), and a key that included the nav cell's
  // POSITION (which shifts when plugins add entries) — the second one made an image embedded on a
  // settings page disappear from that very page.
  const window = setup()
  const doc = window.document
  doc.body.innerHTML = '<button aria-current="true">夜间</button><div data-shortcut-modal><button aria-current="true">账户与余额</button></div>'
  assert.equal(engine.currentSettingsPageKey(doc), '账户与余额', 'the dialog nav wins over page content')
  window.document.body.innerHTML = '<button aria-current="true">通用设置</button>'
  assert.equal(engine.currentSettingsPageKey(doc), '通用设置', 'outside a dialog any nav cell still counts')
  window.document.body.innerHTML = '<button>没有选中项</button>'
  assert.equal(engine.currentSettingsPageKey(doc), '', 'no marked cell: no page scope')
  assert.equal(engine.sameSettingsPage('账户与余额', '账户与余额'), true)
  assert.equal(engine.sameSettingsPage('账户与余额@12', '账户与余额'), true, 'legacy key: label still matches')
  assert.equal(engine.sameSettingsPage('通用设置@3', '账户与余额'), false)
  assert.equal(engine.sameSettingsPage('', '账户与余额'), false, 'a page-less image is not scoped by this')
})

test('injected layers are created, updated, reconciled away and fully removed', () => {
  // Decorations only ever ADD nodes we own (tagged, aria-hidden) and remove them again: that is what
  // keeps a skin reversible while it still puts real elements on the page.
  const window = setup()
  const doc = window.document
  doc.body.innerHTML = '<div id="host"><span id="app-owned">x</span></div>'
  let layers = [{ id: 'deco-1', kind: 'div', selector: '#host', x: 10, y: 20, w: 30, h: 40, css: 'border-radius: 8px;' }]
  const mount = engine.mountInjectedLayers(() => layers, doc)
  const node = doc.querySelector('[data-dsh-myskin-layer="deco-1"]')
  assert.notEqual(node, null)
  assert.equal(node.getAttribute('aria-hidden'), 'true')
  assert.equal(node.style.position, 'fixed', 'viewport coordinates: no cooperation needed from the container')
  assert.equal(node.style.left, '10px')
  assert.equal(node.style.top, '20px')
  assert.equal(node.style.pointerEvents, 'none', 'a decoration must never eat a click')
  assert.match(node.style.cssText, /border-radius: 8px/)
  assert.equal(node.parentElement.id, 'host')
  assert.equal(doc.getElementById('app-owned').isConnected, true, 'the app\'s own node was not touched')
  assert.equal(doc.getElementById('app-owned').nextElementSibling, node, 'appended after, never before')
  // An edit updates the SAME node (the editor drags these; re-creating would flicker).
  layers = [{ ...layers[0], x: 99, css: 'border-radius: 2px;' }]
  mount.sync()
  assert.equal(mount.nodeFor('deco-1'), node, 'same node')
  assert.equal(node.style.left, '99px')
  assert.match(node.style.cssText, /border-radius: 2px/)
  assert.doesNotMatch(node.style.cssText, /border-radius: 8px/)
  // Deleting a decoration takes its node with it (the engine never has to, the editor does).
  layers = []
  mount.sync()
  assert.equal(doc.querySelector('[data-dsh-myskin-layer]'), null)
  assert.equal(doc.getElementById('app-owned').isConnected, true)
  // Re-adding works, and dispose removes everything it owns.
  layers = [{ id: 'deco-2', kind: 'div', selector: '#host', x: 1, y: 2, w: 3, h: 4 }]
  mount.sync()
  assert.notEqual(doc.querySelector('[data-dsh-myskin-layer="deco-2"]'), null)
  mount.dispose()
  assert.equal(doc.querySelector('[data-dsh-myskin-layer]'), null, 'no decoration survives dispose')
  assert.equal(doc.getElementById('app-owned').isConnected, true)
})

test('a decoration made inside a settings page stays on that page', () => {
  const window = setup()
  const doc = window.document
  doc.body.innerHTML = '<div id="host"></div><button aria-current="true">账户与余额</button>'
  const layers = [{ id: 'deco-1', kind: 'div', selector: '#host', x: 0, y: 0, w: 10, h: 10, pageKey: '账户与余额' }]
  const mount = engine.mountInjectedLayers(() => layers, doc, () => engine.currentSettingsPageKey(doc))
  assert.notEqual(doc.querySelector('[data-dsh-myskin-layer]'), null, 'its own page')
  doc.querySelector('button').textContent = '通用设置'
  mount.sync()
  assert.equal(doc.querySelector('[data-dsh-myskin-layer]'), null, 'another settings page: gone')
  doc.querySelector('button').textContent = '账户与余额'
  mount.sync()
  assert.notEqual(doc.querySelector('[data-dsh-myskin-layer]'), null, 'back home it returns')
  mount.dispose()
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

/**
 * An empty composer exactly as dsh-client-ui-conversation renders it: the editable
 * surface and the gray placeholder are siblings, and the placeholder is
 * `position:absolute; pointer-events:none` — so `elementsFromPoint` never returns it.
 */
const COMPOSER = [
  '<div id="root"><div class="app_frame_hash"><div class="composer_grow_hash">',
  '<div class="composer_input_hash" contenteditable="true" role="textbox" data-composer-input="true" data-placeholder="描述你想要构建的内容, / 调用指令"></div>',
  '<div aria-hidden="true" class="composer_placeholder_hash" data-composer-placeholder="true" style="pointer-events:none">描述你想要构建的内容, / 调用指令</div>',
  '</div></div></div>',
].join('')

test('the picker reaches the gray default text of an empty composer', () => {
  const window = setup()
  window.document.body.innerHTML = COMPOSER
  const doc = window.document
  const input = doc.querySelector('[data-composer-input]')
  const placeholder = doc.querySelector('[data-composer-placeholder]')
  // What a real click on that line produces: the editable first, then its ancestors.
  // The placeholder itself is missing from the list — it accepts no pointer events.
  const stack = [input, input.parentElement, doc.querySelector('.app_frame_hash'), doc.getElementById('root'), doc.body, doc.documentElement]
  const own = (el) => el === doc.body || el === doc.documentElement || el.id === 'root'
  assert.equal(engine.pickElementAt(stack, 10, 10, own), placeholder)
  // The element it resolves to must be one whose text the editor can actually replace:
  // the empty contenteditable behind it has no text node at all.
  assert.equal(engine.textHostOf(input), undefined)
  assert.equal(engine.textHostOf(placeholder), placeholder)
})

test('the picker still folds a click on a label into its button', () => {
  const window = setup()
  window.document.body.innerHTML = '<div id="root"><button id="go"><span id="label">Go</span></button></div>'
  const doc = window.document
  const stack = [doc.getElementById('label'), doc.getElementById('go'), doc.getElementById('root'), doc.body]
  assert.equal(engine.pickElementAt(stack, 5, 5), doc.getElementById('go'))
})

test('a pointer-invisible text overlay is pickable even without the composer marker', () => {
  const window = setup()
  window.document.body.innerHTML = '<div id="root"><div id="wrap"><div id="ghost" style="pointer-events:none">Gray</div></div></div>'
  const doc = window.document
  const stack = [doc.getElementById('wrap'), doc.getElementById('root'), doc.body]
  assert.equal(engine.pickElementAt(stack, 5, 5), doc.getElementById('ghost'))
})

test('own UI and pointer-invisible decoration without text are never picked', () => {
  const window = setup()
  window.document.body.innerHTML = '<div id="root"><div id="wrap"><div id="deco" style="pointer-events:none"></div></div></div>'
  const doc = window.document
  const wrap = doc.getElementById('wrap')
  assert.equal(engine.pickElementAt([wrap, doc.getElementById('root')], 5, 5), wrap)
  assert.equal(engine.pickElementAt([wrap], 5, 5, () => true), undefined)
})

test('the gray default text of a new conversation is replaceable and reverts byte-exactly', () => {
  const window = setup()
  window.document.body.innerHTML = COMPOSER
  const doc = window.document
  const placeholder = doc.querySelector('[data-composer-placeholder]')
  const before = doc.body.outerHTML
  const theme = fakeTheme()
  const override = engine.applySkin(theme, {
    ...SKIN,
    css: [],
    layers: [],
    text: [{ selector: engine.selectorOf(placeholder), before: '描述你想要构建的内容, / 调用指令', after: '你想让我做什么？' }],
  })
  assert.equal(placeholder.textContent, '你想让我做什么？')
  // React rebuilding the node rewrites the copy; the observer must re-apply the override.
  placeholder.textContent = '描述你想要构建的内容, / 调用指令'
  override.dispose()
  assert.equal(doc.body.outerHTML, before)
})

test('the Inspector preview keeps declarations it does not own', () => {
  // Hiding an element used to be undone by the next font-size tweak: the preview
  // replaced the whole rule. Only the properties the Inspector owns may be rewritten.
  const merged = engine.withManagedDeclarations('color: red; visibility: hidden !important', 'font-size: 20px')
  assert.equal(merged, 'visibility: hidden !important; font-size: 20px')
  // Re-touching a managed property replaces its old value instead of stacking it.
  assert.equal(engine.withManagedDeclarations('font-size: 12px; display: none !important', 'font-size: 20px'), 'display: none !important; font-size: 20px')
  // Clearing every field leaves the unmanaged declarations alone.
  assert.equal(engine.withManagedDeclarations('visibility: hidden !important', ''), 'visibility: hidden !important')
  assert.equal(engine.withManagedDeclarations(undefined, ''), '')
  assert.deepEqual(engine.INSPECTOR_PROPERTIES.includes('background-size'), true)
  // z-index is owned by the Inspector's 层级 field: a preview must be able to rewrite it, and an
  // empty field must be able to clear it (a rule that still says `z-index: 999` wins arguments).
  assert.ok(engine.INSPECTOR_PROPERTIES.includes('z-index'))
  assert.equal(engine.withManagedDeclarations('z-index: 999 !important; visibility: hidden !important', 'z-index: 10 !important'), 'visibility: hidden !important; z-index: 10 !important')
  assert.equal(engine.withManagedDeclarations('z-index: 999 !important; visibility: hidden !important', ''), 'visibility: hidden !important')
})

test('transformValue emits only the axes that actually move', () => {
  assert.equal(engine.transformValue(0, 0, 1), '')
  assert.equal(engine.transformValue(12, 0, 1), 'translate(12px, 0px)')
  assert.equal(engine.transformValue(0, -8, 1), 'translate(0px, -8px)')
  assert.equal(engine.transformValue(0, 0, 1.25), 'scale(1.25)')
  assert.equal(engine.transformValue(4.5, 2.25, 0.5), 'translate(4.5px, 2.25px) scale(0.5)')
  // Sub-pixel drag noise is rounded away so the stylesheet stays readable.
  assert.equal(engine.transformValue(4.126, 2, 1), 'translate(4.13px, 2px)')
  // The Inspector owns transform, so a preview that drops it must clear it.
  assert.ok(engine.INSPECTOR_PROPERTIES.includes('transform'))
  assert.ok(engine.INSPECTOR_PROPERTIES.includes('font-family'))
  assert.equal(engine.withManagedDeclarations('transform: scale(2); visibility: hidden !important', ''), 'visibility: hidden !important')
})

test('parseTransform is the inverse of transformValue', () => {
  for (const [x, y, scale] of [[0, 0, 1], [12, -4, 1], [0, 0, 1.25], [4.5, 2.25, 0.5]]) {
    const value = engine.transformValue(x, y, scale)
    const rule = value === '' ? 'color: red' : 'color: red; transform: ' + value + ' !important'
    assert.deepEqual(engine.parseTransform(rule), { x, y, scale })
  }
  // A hand-written transform is not ours: the fields must not pretend to own it.
  assert.deepEqual(engine.parseTransform('transform: translateX(-50%) rotate(3deg)'), { x: 0, y: 0, scale: 1 })
  assert.deepEqual(engine.parseTransform(undefined), { x: 0, y: 0, scale: 1 })
})

test('embedded fonts become an @font-face entry of the css list', () => {
  assert.equal(engine.FONT_FACE_SELECTOR, '@font-face')
  assert.equal(engine.fontFormat('Inter.woff2'), 'woff2')
  assert.equal(engine.fontFormat('Songti.TTF'), 'truetype')
  assert.equal(engine.fontFormat('X.otf'), 'opentype')
  assert.equal(engine.fontFormat('X.woff'), 'woff')
  assert.equal(engine.fontFormat('X.ttc'), undefined)
  assert.equal(engine.fontFormat('noext'), undefined)
  const rule = engine.fontFaceRule('myskin-font-1', 'data:font/woff2;base64,AAAA', 'woff2')
  assert.match(rule, /^font-family: 'myskin-font-1'; src: url\('data:font\/woff2;base64,AAAA'\) format\('woff2'\); font-display: swap;$/)
  // The engine renders css entries as `selector { rule }`, which is a valid at-rule here.
  // The engine renders css entries as `selector { rule }`, which is a valid at-rule here.
  const composed = [{ selector: engine.FONT_FACE_SELECTOR, rule }].map((r) => r.selector + ' { ' + r.rule + ' }').join(String.fromCharCode(10))
  assert.match(composed, /^@font-face \{ font-family: 'myskin-font-1';/)
})

test('an embedded font plus an element transform apply and revert through the real engine', () => {
  const window = setup()
  window.document.body.innerHTML = '<div id="root"><button id="go">Send</button></div>'
  const before = window.document.body.outerHTML
  const theme = fakeTheme()
  const family = 'myskin-font-t1'
  const elementRule = engine.withManagedDeclarations(undefined,
    "font-family: '" + family + "' !important; transform: " + engine.transformValue(12, -4, 1.2) + " !important")
  const override = engine.applySkin(theme, {
    ...SKIN,
    text: [],
    layers: [],
    css: [
      { selector: engine.FONT_FACE_SELECTOR, rule: engine.fontFaceRule(family, 'data:font/woff2;base64,AAAA', 'woff2') },
      { selector: '#go', rule: elementRule },
    ],
  })
  const sheet = window.document.getElementById('dsh-myskin-rule').textContent
  // The css entry with the at-rule selector lands as a real @font-face block…
  assert.match(sheet, /@font-face \{ font-family: 'myskin-font-t1'; src: url\('data:font\/woff2;base64,AAAA'\) format\('woff2'\); font-display: swap; \}/)
  // …and the element gets both the family and the move+scale in one rule.
  assert.match(sheet, /#go \{ font-family: 'myskin-font-t1' !important; transform: translate\(12px, -4px\) scale\(1\.2\) !important \}/)
  override.dispose()
  assert.equal(window.document.body.outerHTML, before)
})

test('snapMove aligns an edge only when it is already close', () => {
  const targets = { x: [152, 400], y: [300] }
  // Box 100..200: its centre (150) is 2px from the 152 line → snapped, and reported.
  const near = engine.snapMove({ left: 100, top: 500, width: 100, height: 20 }, targets, 4)
  assert.equal(near.dx, 2)
  assert.equal(near.dy, 0)
  assert.deepEqual(near.lines, [{ axis: 'x', at: 152 }])
  // 5px away is outside the 4px threshold: the magnet stays off ("low sensitivity").
  const far = engine.snapMove({ left: 100, top: 500, width: 100, height: 20 }, { x: [155 + 50], y: [] }, 4)
  assert.equal(far.dx, 0)
  assert.deepEqual(far.lines, [])
  // Both axes snap independently; the right edge (200) can be the one that lands.
  const both = engine.snapMove({ left: 100, top: 298, width: 100, height: 20 }, { x: [201], y: [310] }, 4)
  assert.equal(both.dx, 1)
  assert.equal(both.dy, 2)
  assert.deepEqual(both.lines, [{ axis: 'x', at: 201 }, { axis: 'y', at: 310 }])
  // The CLOSEST candidate wins when several are in range (149 is 1px from the centre).
  const closest = engine.snapMove({ left: 100, top: 0, width: 100, height: 10 }, { x: [103, 149], y: [] }, 4)
  assert.equal(closest.dx, -1)
  assert.deepEqual(closest.lines, [{ axis: 'x', at: 149 }])
})

test('snapScale snaps the size around a fixed centre', () => {
  // Centre 300, width 200 (200..400), scale 1.
  const box = { left: 200, top: 100, width: 200, height: 100 }
  const targets = { x: [403], y: [] }
  const snapped = engine.snapScale(box, 1, targets, 4)
  assert.equal(snapped.scale, 1.03)
  assert.deepEqual(snapped.lines, [{ axis: 'x', at: 403 }])
  // Out of range → untouched.
  assert.deepEqual(engine.snapScale(box, 1.25, { x: [410], y: [] }, 4), { scale: 1.25, lines: [] })
  // Vertical targets work the same way (box 100..200 tall, centre 150, bottom 200):
  // a line 3px above the bottom asks for height 94 → scale 2 * 0.94.
  const vertical = engine.snapScale(box, 2, { x: [], y: [197] }, 4)
  assert.equal(vertical.scale, 1.88)
  assert.deepEqual(vertical.lines, [{ axis: 'y', at: 197 }])
  // A line on the far side of the centre is not a candidate for the near edge.
  assert.deepEqual(engine.snapScale(box, 2, { x: [], y: [148] }, 4), { scale: 2, lines: [] })
  // A degenerate box never produces Infinity/NaN.
  assert.deepEqual(engine.snapScale({ left: 0, top: 0, width: 0, height: 0 }, 1, { x: [3], y: [] }, 4), { scale: 1, lines: [] })
  assert.equal(engine.SNAP_THRESHOLD, 4)
})

test('stepValue rounds, clamps and survives garbage input', () => {
  // Wheel steps on the canvas X/Y fields: whole pixels, Shift = ten.
  assert.equal(engine.stepValue(0, 1, 1), 1)
  assert.equal(engine.stepValue(4, -1, 1), 3)
  assert.equal(engine.stepValue(4, 1, 10), 14)
  // Scale steps are fractional and clamped to the usable range.
  assert.equal(engine.stepValue(1, 1, 0.05), 1.05)
  assert.equal(engine.stepValue(1, -1, 0.05), 0.95)
  assert.equal(engine.stepValue(3, 1, 0.25, 0.2, 3), 3)
  assert.equal(engine.stepValue(0.2, -1, 0.25, 0.2, 3), 0.2)
  // Sub-pixel noise never reaches the stylesheet.
  assert.equal(engine.stepValue(0.1, 1, 0.2), 0.3)
  assert.equal(engine.stepValue(Number.NaN, 1, 1), 1)
})

test('sameDeclarations ignores order and !important, but not values', () => {
  // The Inspector re-emits a saved rule with !important and its own order on selection;
  // that must read as "nothing changed" so the draft does not turn dirty for free.
  assert.equal(engine.sameDeclarations('color: red; font-size: 12px', 'font-size: 12px !important; color: red !important'), true)
  assert.equal(engine.sameDeclarations(undefined, ''), true)
  assert.equal(engine.sameDeclarations('', '   '), true)
  assert.equal(engine.sameDeclarations('color: red', 'color: blue'), false)
  assert.equal(engine.sameDeclarations('color: red', 'color: red; visibility: hidden !important'), false)
  // A real edit through the Inspector pipeline stays a change.
  assert.equal(engine.sameDeclarations('font-size: 12px', engine.withManagedDeclarations('font-size: 12px', 'font-size: 20px !important')), false)
})

test('elementLabel names an element the way a user recognises it', () => {
  const window = setup()
  window.document.body.innerHTML = [
    '<div id="root"><button id="go" class="btn primary extra">  Send   now  </button>',
    '<div class="card"></div></div>',
  ].join('')
  const doc = window.document
  assert.equal(engine.elementLabel(doc.getElementById('go')), 'button#go.btn.primary · Send now')
  assert.equal(engine.elementLabel(doc.querySelector('.card')), 'div.card')
  assert.equal(engine.elementLabel(doc.getElementById('go'), 4), 'button#go.btn.primary · Send…')
})

test('parent/child traversal walks one real level at a time', () => {
  const window = setup()
  window.document.body.innerHTML = '<div id="root"><div id="card"><div id="row"><span id="label">Hi</span></div></div></div>'
  const doc = window.document
  const card = doc.getElementById('card')
  const row = doc.getElementById('row')
  const label = doc.getElementById('label')
  const own = (el) => el === doc.body || el === doc.documentElement || el.id === 'root'
  assert.equal(engine.parentTarget(label, own), row)
  assert.equal(engine.parentTarget(card, own), undefined)
  // A click stack for the label: the deepest node first, then its ancestors.
  const stack = [label, row, card, doc.getElementById('root'), doc.body]
  assert.equal(engine.childTargetIn(stack, card, own), row)
  assert.equal(engine.childTargetIn(stack, row, own), label)
  assert.equal(engine.childTargetIn(stack, label, own), undefined)
})

test('re-applying a text override survives a React-style rebuild of the node', async () => {
  const window = setup()
  window.document.body.innerHTML = COMPOSER
  const doc = window.document
  const placeholder = doc.querySelector('[data-composer-placeholder]')
  const theme = fakeTheme()
  const override = engine.applySkin(theme, {
    ...SKIN,
    css: [],
    layers: [],
    text: [{ selector: engine.selectorOf(placeholder), before: '描述你想要构建的内容, / 调用指令', after: '你想让我做什么？' }],
  })
  placeholder.textContent = '描述你想要构建的内容, / 调用指令'
  await flush()
  assert.equal(placeholder.textContent, '你想让我做什么？')
  override.dispose()
})

test('a canvas move rewrites only the transform, never the element’s other declarations', () => {
  // The drag used to merge through withManagedDeclarations, which drops every managed
  // property and re-adds only the transform: a moved element lost — and the Inspector's
  // preview immediately restored — its width/padding/font-size on every frame.
  const existing = 'font-size: 20px !important; width: 120px; transform: translate(4px, 2px) !important; cursor: pointer'
  const moved = engine.transformEdit(existing, 10, 0, 1)
  assert.equal(moved, 'font-size: 20px !important; width: 120px; transform: translate(10px, 0px) !important; cursor: pointer')
  // The written form carries the same !important the Inspector's own preview uses:
  // a rule that alternates between the two forms changes which stylesheet wins.
  assert.match(moved, /transform: translate\(10px, 0px\) !important/)
  // Dragging back to the origin drops the property instead of pinning `transform: none`.
  assert.equal(engine.transformEdit(existing, 0, 0, 1), 'font-size: 20px !important; width: 120px; cursor: pointer')
  assert.equal(engine.transformEdit(undefined, 0, 0, 1), '')
  // Round-trip with the Inspector's own proposal (every field it mirrors, re-emitted
  // with its !important): the rule the drag just wrote reads as unchanged, so the
  // panel pushes no echo — and no undo step — per frame.
  const echoed = engine.withManagedDeclarations(moved,
    'font-size: 20px !important; width: 120px !important; transform: translate(10px, 0px) !important')
  assert.equal(engine.sameDeclarations(moved, echoed), true)
  // A hand-written transform that is not ours must survive a preview untouched.
  assert.equal(engine.declarationOf('transform: rotate(3deg); color: red', 'transform'), 'transform: rotate(3deg)')
  assert.equal(engine.declarationOf('color: red', 'transform'), undefined)
})

test('the editor’s draft stylesheet is kept after the committed one', () => {
  const window = setup()
  const head = window.document.head
  const draft = window.document.createElement('style')
  draft.id = 'dsh-myskin-live'
  head.appendChild(draft)
  // Nothing lands behind it: no re-append (that would re-evaluate the sheet for nothing).
  engine.keepStylesheetLast(draft)
  assert.equal(head.lastElementChild, draft)
  // applySkin appends a NEW tag on every accepted settings change. A committed rule
  // sitting behind the draft wins by document order, which pins the element to the old
  // coordinates on every drag frame — the "new/old coordinates" flicker.
  const committed = window.document.createElement('style')
  committed.id = 'dsh-myskin-rule'
  head.appendChild(committed)
  engine.keepStylesheetLast(draft)
  assert.equal(head.lastElementChild, draft)
  assert.equal(head.contains(committed), true, 'the committed sheet is moved in front, never dropped')
  // A tag that is not mounted is left alone.
  engine.keepStylesheetLast(null)
  const stray = window.document.createElement('style')
  engine.keepStylesheetLast(stray)
  assert.equal(stray.parentNode, null)
})


test('the panel never echoes a transform the canvas owns', () => {
  // The heart of the twitch: the grip writes the rule (T1) and the panel mirrors it back
  // one render late (its fields still hold T0). If the preview took the fields as the
  // source of truth it would write T0 straight back — and the element would alternate
  // between the two coordinates for as long as the gesture lasts.
  const rule = 'transform: translate(40px, 12px) !important'
  const staleFields = { x: 20, y: 4, scale: 1 }
  assert.equal(engine.transformPreview(rule, staleFields, false), 'transform: translate(40px, 12px) !important')
  // With nothing to mirror the preview contributes nothing at all.
  assert.equal(engine.transformPreview(undefined, staleFields, false), '')
  // A hand-written transform survives too (it is re-emitted, never reformatted away).
  assert.equal(engine.transformPreview('transform: rotate(3deg)', staleFields, false), 'transform: rotate(3deg)')
  // Once the user edits one of those fields the panel IS the writer again — including the
  // "cleared to identity" case, which has to drop the property rather than pin a value.
  assert.equal(engine.transformPreview(rule, { x: 20, y: 4, scale: 1 }, true), 'transform: translate(20px, 4px) !important')
  assert.equal(engine.transformPreview(rule, { x: 0, y: 0, scale: 1 }, true), '')
  // …and the round trip through the drag's own writer is a no-op, i.e. no echo, no undo
  // step, no repaint churn while the pointer is moving.
  const afterDrag = engine.transformEdit(rule, 20, 4, 1)
  assert.equal(engine.sameDeclarations(afterDrag, engine.withManagedDeclarations(afterDrag, engine.transformPreview(afterDrag, { x: 20, y: 4, scale: 1 }, true))), true)
})


test('a removed element can be measured while the skin still hides it', () => {
  // The recycle bin's restore has to win against the COMMITTED rule, which needs the
  // element's natural display — read while both skin stylesheets are momentarily off.
  const window = setup()
  window.document.head.innerHTML = '<style id="dsh-myskin-rule">#go { display: none !important }</style>'
  window.document.body.innerHTML = '<div id="root"><button id="go">Send</button></div>'
  const sheet = window.document.getElementById('dsh-myskin-rule')
  const el = window.document.getElementById('go')
  const before = sheet.disabled
  const display = engine.naturalDisplayOf(el)
  assert.equal(typeof display, 'string')
  assert.notEqual(display, 'none')
  // The measurement is synchronous and puts the skin back exactly as it was.
  assert.equal(sheet.disabled, before)
  assert.equal(window.document.head.contains(sheet), true, 'the skin stylesheet is re-inserted')
  assert.equal(window.document.getElementById('go'), el, 'the element is not replaced or moved')
  // An element the APP hides is not "removed by the skin": there is nothing to restore,
  // and the caller gets undefined rather than a value that would not show anything.
  window.document.getElementById('go').style.display = 'none'
  assert.equal(engine.naturalDisplayOf(el), undefined)
})


test('a save lands the committed skin in front of the draft, and it is put back behind', () => {
  // The end-to-end shape of the flicker fix. Both layers carry the SAME selector, so the
  // "new"/"old" value is decided by document order (jsdom does not model that resolution,
  // so the consequence is documented here and asserted on the browser-side invariants).
  const window = setup()
  window.document.body.innerHTML = '<div id="root"><button id="go">Send</button></div>'
  const el = window.document.getElementById('go')
  // The editor is open: its draft layer is in <head> and is what the page shows.
  const draft = window.document.createElement('style')
  draft.id = engine.DRAFT_STYLE_ID
  draft.textContent = '#go { display: block }'
  window.document.head.appendChild(draft)
  assert.equal(window.getComputedStyle(el).display, 'block')
  // 保存 re-applies the document, and applySkin APPENDS a new stylesheet: the committed
  // (older) rule now sits AFTER the draft's. Without the correction the element is pinned
  // to the committed coordinates on every drag frame — the "twitch".
  const override = engine.applySkin(fakeTheme(), {
    ...SKIN, text: [], layers: [], css: [{ selector: '#go', rule: 'display: none !important' }],
  })
  const committed = window.document.getElementById('dsh-myskin-rule')
  assert.equal(window.document.head.lastElementChild, committed, 'this is what applySkin does on every accepted change')
  engine.keepStylesheetLast(draft)
  assert.equal(window.document.head.lastElementChild, draft, 'the editor corrects the order again')
  assert.equal(window.document.head.contains(committed), true, 'the committed sheet is only moved, never dropped')
  draft.remove()
  override.dispose()
  assert.equal(window.document.head.querySelectorAll('style').length, 0, 'nothing is left behind')
})

