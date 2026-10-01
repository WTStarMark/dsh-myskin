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
  // Upstream modals lay out inside the app area on every shell: the settings dialog portals
  // to <body> far below the chrome's z-index and used to open *behind* it. Hiding the chrome
  // would take the toolbar and panel away from a user who is still drawing, so the modal
  // layer is inset by exactly the space they occupy instead.
  // Both dock layouts live in the SAME stylesheet and are gated on one <html> attribute, so a
  // flip is an attribute write — the tag is written once at mount and never rewritten.
  assert.match(rules, /^html\[data-dsh-myskin-dock='right'\] body > :not\(#root\):not\(\[data-dsh-myskin-ui\]\):has\(\[data-shortcut-modal\]\) \{$/m)
  assert.match(rules, /^ {2}top: calc\(var\(--dsh-myskin-chrome-top, 0px\) \+ var\(--dsh-myskin-inset-top, 48px\)\) !important;$/m)
  assert.match(rules, /^ {2}right: var\(--dsh-myskin-inset-x, 340px\) !important;$/m)
  assert.match(rules, /^html\[data-dsh-myskin-dock='left'\] body > :not\(#root\):not\(\[data-dsh-myskin-ui\]\):has\(\[data-shortcut-modal\]\) \{$/m)
  assert.match(rules, /^ {2}left: var\(--dsh-myskin-inset-x, 340px\) !important;$/m)
  // `--dsh-myskin-inset-x` is the width the panel occupies on the side it is docked to; the
  // side-independent rules (the dialog's height and cap) read that one name.
  assert.match(rules, /^html\[data-dsh-myskin-dock='right'\] \{ --dsh-myskin-inset-x: var\(--dsh-myskin-inset-right, 340px\); \}$/m)
  assert.match(rules, /^html\[data-dsh-myskin-dock='left'\] \{ --dsh-myskin-inset-x: var\(--dsh-myskin-inset-left, 340px\); \}$/m)
  assert.match(rules, /max-width: calc\(100vw - var\(--dsh-myskin-inset-x, 340px\) - 48px\)/)
  assert.doesNotMatch(rules, /data-dsh-myskin-canvas\] \{ display: none/)
  assert.match(rules, /margin-top: var\(--dsh-myskin-inset-top, 48px\)/)
  // The page gives up exactly the panel's strip, on whichever side it is docked to.
  assert.match(rules, /^html\[data-dsh-myskin-dock='right'\] body \{ margin-right: var\(--dsh-myskin-inset-x, 340px\) !important; \}$/m)
  assert.match(rules, /^html\[data-dsh-myskin-dock='left'\] body \{ margin-left: var\(--dsh-myskin-inset-x, 340px\) !important; \}$/m)
  assert.doesNotMatch(rules, /margin-(left|right): var\(--dsh-myskin-inset-(left|right), 340px\)/, 'the side is never hard-wired to one variable')
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
  assert.match(rules, /^html\[data-dsh-myskin-dock='right'\] body \{ margin-right: var\(--dsh-myskin-inset-x, 340px\) !important; \}$/m)
  assert.match(rules, /^html\[data-dsh-myskin-dock='left'\] body \{ margin-left: var\(--dsh-myskin-inset-x, 340px\) !important; \}$/m)
  assert.doesNotMatch(rules, /margin-top/)
})

test('both dock layouts are present, and neither hard-wires a side', () => {
  // The frame stylesheet is written ONCE when the editor mounts (see dock.ts). If a rule existed
  // for only one side, flipping the dock would silently half-apply: page margin on the new side,
  // stale geometry on the old one.
  const window = setup()
  const shell = desktop.readDesktopShell(window.document)
  const rules = desktop.editorFrameRules(shell).join('\n')
  for (const side of ['left', 'right']) {
    // Inset variable, modal layer and page margin: three rules per side, all gated.
    assert.equal((rules.match(new RegExp("html\\[data-dsh-myskin-dock='" + side + "'\\]", 'g')) ?? []).length, 3, side + ': inset variable + modal layer + page margin')
  }
  // The rules that MOVE something are all gated, so removing the attribute (editor unmount) undoes
  // the whole layout — nothing can survive the editor and leave the page short of an edge.
  const movers = rules.split('\n').filter((line) => /margin-(left|right):/.test(line) || /body > :not\(#root\)/.test(line))
  assert.equal(movers.length, 4)
  for (const line of movers) assert.match(line, /^html\[data-dsh-myskin-dock='(left|right)'\]/, 'ungated layout rule: ' + line)
  // The dialog's own cap is side-independent on purpose: it reads the single inset width.
  assert.match(rules, /\[data-shortcut-modal="settings"\] \{/)
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
  // Dialogs and menus never move, on either shell; the conversation column is left with
  // exactly ONE canvas surface, so its chrome may not paint the token a second time
  // (that stacking is what gave the top bar, the transcript and the send bar three
  // different transparencies for one slider value).
  assert.equal(rules.length, 5)
  assert.match(rules[2], /^\[class\*="_centerCol"\], \[class~="centerCol"\] \{ --dsw-alias-bg-base: transparent !important; \}$/)
  assert.match(rules[3], /\[class\*="_centerCol"\] \[data-slot="conversation\.session"\], \[class\*="_centerCol"\] \[data-slot\^="conversation\.view"\], \[class~="centerCol"\] \[data-slot="conversation\.session"\], \[class~="centerCol"\] \[data-slot\^="conversation\.view"\] \{ --dsw-alias-bg-base: rgba\(16, 16, 16, 0\.8\) !important; \}$/)
  assert.match(rules[4], /\[class\*="_centerCol"\] \[data-composer-seat\], \[class\*="_centerCol"\] \[class\*="_composerSeat"\], \[class\*="_centerCol"\] \[class~="composerSeat"\], \[class~="centerCol"\] \[data-composer-seat\], \[class~="centerCol"\] \[class\*="_composerSeat"\], \[class~="centerCol"\] \[class~="composerSeat"\] \{ background: none !important; --dsw-alias-bg-base: rgba\(16, 16, 16, 0\.8\) !important; \}$/)
})

test('the windows wallpaper is painted on the column that owns the rounded corner', () => {
  const window = setup('data-windows-titlebar=""', WITH_FRAME)
  window.document.querySelector('[class*="_frame"]').style.backgroundColor = '#ffffff'
  const rules = engine.wallpaperRules(window.document, 'data:image/gif;base64,AAA')
  // Page canvas + the conversation column. The column is the element DSH rounds and
  // clips, so the wallpaper is cut by that corner instead of running across the notch,
  // and the column gives up its own colour in the same rule.
  assert.equal(rules.length, 2)
  assert.match(rules[0], /^body \{ background-image: url\("data:image\/gif;base64,AAA"\)/)
  assert.match(rules[1], /^\[class\*="_centerCol"\], \[class~="centerCol"\] \{ background-image: url\("data:image\/gif;base64,AAA"\)/)
  assert.match(rules[1], /background-color: transparent !important; \}$/)
  // The frame keeps DSH's own opaque surface: THAT is what fills the 16px notch now
  // (a wallpapered frame filled it with the image and erased the rounding, a
  // transparent one exposed Electron's window colour as a black notch).
  const tinted = engine.wallpaperRules(window.document, 'data:image/gif;base64,AAA', { rgb: '255, 255, 255', base: 0.75, panel: 0.9, target: 'token' })
  assert.equal(tinted.length, 2)
  assert.equal(tinted.some((rule) => /_frame/.test(rule)), false)
  assert.match(tinted[1], /^\[class\*="_centerCol"\], \[class~="centerCol"\] \{ background-image: linear-gradient\(rgba\(255, 255, 255, 0\.75\), rgba\(255, 255, 255, 0\.75\)\), url\("data:image\/gif;base64,AAA"\) !important;/)
  // One tint, painted once, so the slider moves the visible wallpaper instead of
  // stacking a second veil on top of it.
  assert.equal((tinted.join(String.fromCharCode(10)).match(/linear-gradient\(rgba\(/g) ?? []).length, 1)
  // The frame is never forced transparent on this shell: that was the black notch.
  const surface = engine.backgroundSurfaceRules(window.document, 0.8)
  assert.equal(surface.some((rule) => rule.startsWith('[class*="_frame"]')), false)
  // macOS keeps the frame copy: its frame is transparent on purpose (native vibrancy),
  // its sidebar reads the wallpaper through it, and the column has no radius.
  const mac = setup('data-platform="darwin"', WITH_FRAME)
  const macRules = engine.wallpaperRules(mac.document, 'data:image/gif;base64,AAA', { rgb: '255, 255, 255', base: 0.75, panel: 0.9, target: 'frame' })
  assert.equal(macRules.length, 3)
  assert.match(macRules[1], /^\[class\*="_frame"\], \[class~="frame"\] \{ background-image: linear-gradient\(/)
  assert.match(macRules[2], /^\[class\*="_centerCol"\], \[class~="centerCol"\] \{ background-color: transparent !important; \}$/)
  // A plain browser keeps the single page rule: no window rounding to cut.
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
