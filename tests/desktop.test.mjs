/**
 * Desktop-shell behaviour.
 *
 * DSH Desktop renders the same Web document as the browser, so this plugin has
 * no second bundle: what changes is where the native window chrome is. These
 * tests pin the three things that differ — the markers the Electron preloads
 * publish, the editor geometry derived from them, and the window-drag recall
 * pulse the editor owes the shell after it moves the page — plus the tint
 * fallback for a transparent (macOS vibrancy) window.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { loadTs } from './helpers/load-ts.mjs'

const desktop = await loadTs('src/client/desktop.ts')
const engine = await loadTs('src/client/skin-engine.ts')

const PLAIN = '<div id="root"></div>'
const WITH_FRAME = '<div id="root"><div class="app_frame_hash"></div></div>'

/**
 * Install a fresh jsdom document as the global DOM.
 * @param htmlAttrs - attributes for the <html> element.
 * @param bodyHtml - body content.
 * @returns the jsdom window.
 */
function setup(htmlAttrs = '', bodyHtml = PLAIN) {
  const dom = new JSDOM('<!doctype html><html ' + htmlAttrs + '><head></head><body>' + bodyHtml + '</body></html>', { pretendToBeVisual: true })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.Node = dom.window.Node
  globalThis.MutationObserver = dom.window.MutationObserver
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)
  return dom.window
}

test('a plain browser reports no desktop shell and keeps the web editor inset', () => {
  const window = setup()
  const shell = desktop.readDesktopShell(window.document)
  assert.deepEqual(shell, { desktop: false, platform: undefined, windowsTitlebar: false, fullscreen: false })
  const rules = desktop.editorFrameRules(shell).join('\n')
  assert.match(rules, /margin-top: var\(--dsh-myskin-inset-top, 48px\)/)
  assert.match(rules, /#root \{ height: 100% !important; \}/)
  assert.doesNotMatch(rules, /app-region/)
  assert.doesNotMatch(rules, /_frame/)
})

test('the macOS shell keeps the toolbar clear of the traffic lights', () => {
  const window = setup('data-platform="darwin"')
  const shell = desktop.readDesktopShell(window.document)
  assert.equal(shell.desktop, true)
  assert.equal(shell.platform, 'darwin')
  const rules = desktop.editorFrameRules(shell).join('\n')
  assert.match(rules, /html\[data-platform='darwin'\] \{ --dsh-myskin-leading: 96px; \}/)
  assert.match(rules, /-webkit-app-region: no-drag/)
  // The shell pads its own chrome: only the body moves, the toolbar owns the top.
  assert.match(rules, /margin-top: var\(--dsh-myskin-inset-top, 48px\)/)
  assert.doesNotMatch(rules, /_frame/)
})

test('fullscreen drops the macOS leading clearance', () => {
  const window = setup('data-platform="darwin" data-fullscreen=""')
  const shell = desktop.readDesktopShell(window.document)
  assert.equal(shell.fullscreen, true)
  assert.match(desktop.editorFrameRules(shell).join('\n'), /--dsh-myskin-leading: 24px;/)
})

test('the Windows shell docks below the native caption instead of moving it', () => {
  const window = setup('data-windows-titlebar=""')
  const shell = desktop.readDesktopShell(window.document)
  assert.equal(shell.desktop, true)
  assert.equal(shell.windowsTitlebar, true)
  const rules = desktop.editorFrameRules(shell).join('\n')
  // The caption's own padding grows, so body itself must not move: the native
  // buttons stay over the row the frame paints for them.
  assert.match(rules, /\[class\*="_frame"\] \{ padding-top: calc\(var\(--dsh-windows-titlebar-height, 40px\) \+ var\(--dsh-myskin-inset-top, 48px\)\) !important; \}/)
  // The toolbar starts exactly where the frame's own caption padding ends, in
  // fullscreen too (--dsh-frame-chrome-top would collapse to 0 and leave a gap).
  assert.match(rules, /--dsh-myskin-chrome-top: var\(--dsh-windows-titlebar-height, 40px\)/)
  assert.match(rules, /body \{ margin-right: var\(--dsh-myskin-inset-right, 340px\) !important; \}/)
  assert.doesNotMatch(rules, /margin-top/)
})

test('the drag recall pulse runs on macOS and nowhere else', () => {
  const window = setup('data-platform="darwin"')
  const frames = []
  desktop.pulseWindowDragRecall(window.document, 3, (frame) => frames.push(frame))
  assert.equal(window.document.body.getAttribute(desktop.RECALL_ATTRIBUTE), '')
  let pulses = 0
  while (frames.length > 0) { pulses += 1; frames.shift()() }
  assert.equal(pulses, 3)
  assert.equal(window.document.body.hasAttribute(desktop.RECALL_ATTRIBUTE), false)

  const web = setup()
  desktop.pulseWindowDragRecall(web.document, 3, (frame) => frames.push(frame))
  assert.equal(web.document.body.hasAttribute(desktop.RECALL_ATTRIBUTE), false)
  assert.equal(frames.length, 0)

  const windows = setup('data-windows-titlebar=""')
  desktop.pulseWindowDragRecall(windows.document, 3, (frame) => frames.push(frame))
  assert.equal(windows.document.body.hasAttribute(desktop.RECALL_ATTRIBUTE), false)
  assert.equal(frames.length, 0)
})

test('a transparent desktop shell tints the frame so the strength slider still works', () => {
  const window = setup('data-platform="darwin"')
  window.document.documentElement.style.setProperty('--dsw-alias-bg-base', '#101010')
  const tint = engine.desktopFrameTint(window.document)
  assert.equal(tint, '#101010')
  // A skin token bound on <body> (where the token layer writes) wins over the theme's.
  window.document.body.style.setProperty('--dsw-alias-bg-base', '#202020')
  assert.equal(engine.desktopFrameTint(window.document), '#202020')
  const rules = engine.backgroundSurfaceRules(window.document, 0.8, tint)
  assert.match(rules[0], /^\[class\*="_frame"\], \[class~="frame"\] \{ background-color: rgba\(16, 16, 16, 0\.8\) !important; \}$/)
  assert.match(rules[1], /--dsw-alias-bg-layer-1: rgba\(16, 16, 16, 0\.95\)/)
  // Dialogs and menus never move, on either shell.
  assert.equal(rules.length, 2)
})

test('the desktop wallpaper is painted on the frame that owns the rounded corner', () => {
  const window = setup('data-windows-titlebar=""', WITH_FRAME)
  window.document.querySelector('[class*="_frame"]').style.backgroundColor = '#ffffff'
  const rules = engine.wallpaperRules(window.document, 'data:image/gif;base64,AAA')
  assert.equal(rules.length, 2)
  assert.match(rules[0], /^body \{ background-image: url\("data:image\/gif;base64,AAA"\)/)
  assert.match(rules[1], /^\[class\*="_frame"\], \[class~="frame"\] \{ background-image: url\("data:image\/gif;base64,AAA"\)/)
  // Leaving the frame transparent exposed the native window colour (#1b1b1c) in the
  // conversation column's rounded top-left corner: that rule must be gone.
  const surface = engine.backgroundSurfaceRules(window.document, 0.8)
  assert.equal(surface.some((rule) => rule.includes('background-color: transparent')), false)
  // One tint, applied once, on the frame: the gradient rides above the image and the
  // conversation column stops painting its own copy, so the strength slider moves the
  // visible wallpaper instead of being stacked twice.
  const tinted = engine.wallpaperRules(window.document, 'data:image/gif;base64,AAA', { rgb: '255, 255, 255', base: 0.75, panel: 0.9, target: 'token' })
  assert.equal(tinted.length, 3)
  assert.match(tinted[1], /^\[class\*="_frame"\], \[class~="frame"\] \{ background-image: linear-gradient\(rgba\(255, 255, 255, 0\.75\), rgba\(255, 255, 255, 0\.75\)\), url\("data:image\/gif;base64,AAA"\)/)
  assert.match(tinted[2], /^\[class\*="_centerCol"\], \[class~="centerCol"\] \{ background-color: transparent !important; \}$/)
  // A plain browser keeps the single page rule: no frame rounding to fill.
  const web = setup('', WITH_FRAME)
  assert.equal(engine.wallpaperRules(web.document, 'data:image/gif;base64,AAA').length, 1)
  assert.equal(engine.wallpaperRules(web.document, 'data:image/gif;base64,AAA', { rgb: '255, 255, 255', base: 0.75, panel: 0.9, target: 'token' }).length, 1)
})

test('an opaque shell surface still wins over the desktop tint', () => {
  const window = setup('data-platform="darwin"', WITH_FRAME)
  window.document.querySelector('[class*="_frame"]').style.backgroundColor = '#ffffff'
  const rules = engine.backgroundSurfaceRules(window.document, 0.8, '#101010')
  assert.match(rules[0], /^body \{ --dsw-alias-bg-base: rgba\(255, 255, 255, 0\.8\) !important; \}$/)
})

test('the web platform never resolves a desktop tint', () => {
  const window = setup()
  window.document.documentElement.style.setProperty('--dsw-alias-bg-base', '#101010')
  assert.equal(engine.desktopFrameTint(window.document), undefined)
  // Without a surface and without a tint there is nothing to override.
  assert.deepEqual(engine.backgroundSurfaceRules(window.document, 0.8, engine.desktopFrameTint(window.document)), [])
})
