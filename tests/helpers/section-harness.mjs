/**
 * jsdom harness for the real 「皮肤管理」 section + the real draw-mode editor.
 *
 * Several UI tests need the same shell: a fresh document, a ConfigForm stand-in with the documented
 * semantics (set replaces the field, subscribers fire), and the engine lifecycle src/client/index.ts
 * runs (every accepted change re-applies or disposes the skin). Bundling the real component with
 * esbuild — React/react-dom left external so there is exactly ONE React instance — is what makes
 * these tests click the same buttons a user does.
 *
 * NODE_ENV has to be development before React is loaded, hence the dynamic import below.
 */
process.env.NODE_ENV = 'development'

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { after } from 'node:test'
import { JSDOM } from 'jsdom'

const require = createRequire(import.meta.url)
const root = path.resolve(import.meta.dirname, '..', '..')
const bundle = path.join(root, '.tmp', 'section-harness-entry.mjs')

fs.mkdirSync(path.join(root, '.tmp'), { recursive: true })
require('esbuild').buildSync({
  entryPoints: [path.join(root, 'tests/helpers/ui-entry.tsx')],
  bundle: true, format: 'esm', platform: 'node', target: 'es2024',
  outfile: bundle,
  alias: { '@deepseek-ai/dsh-client-ui-primitives': path.join(root, 'tests/helpers/primitive-stub.tsx') },
  jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' }, logLevel: 'warning',
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'],
})

// The draw-mode editor updates state from timers and observers, which is exactly what it does in a
// browser; React's act() warning for that is noise here. Everything else stays visible.
const reportError = console.error
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) return
  reportError(...args)
}

export const React = (await import('react')).default
const { createRoot } = await import('react-dom/client')
const mod = await import(pathToFileURL(bundle).href)
const { applySkin, currentSkin } = mod

/** The section's own dictionary, so tests click buttons by their real labels. */
export const t = (key) => mod.zh[key] ?? key

/** The dictionary itself, for tests that assert a key is gone. */
export const zh = mod.zh

const HTML = '<!doctype html><html><head></head><body data-ds-dark-theme="">'
  + '<div id="root"><div id="app"><span id="hero">Hello</span><button id="send" class="icon_x">发送</button></div></div>'
  + '<div id="mount"></div></body></html>'

/** A document with every layer in use and one saved skin. */
export const DOC = {
  enabled: true,
  tokens: { '--dsw-alias-bg-base': { light: '#f4f7fb', dark: '#0c1322' }, '--dsw-alias-label-primary': { light: '#0b1729', dark: '#e8eefb' } },
  css: [{ selector: '#hero', rule: 'color: red' }, { selector: '#send', rule: 'display: none !important' }],
  text: [{ selector: '#hero', before: 'Hello', after: '你好' }],
  canvas: { background: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', images: [] },
  layers: [],
  content: {},
  library: [{ id: 'skin-1', name: '我的皮肤', tokens: {}, css: [], text: [], canvas: { images: [] }, layers: [] }],
}

/** Every jsdom window a test opened; a window left open keeps its timers alive and the test
 * process would never exit — including when an assertion throws before the test's own teardown. */
const openWindows = []
after(() => { for (const window of openWindows.splice(0)) { try { window.close() } catch { /* already gone */ } } })

/**
 * Mount the real section over a fresh document.
 * @param initial - the stored skin document.
 * @param options - `bodyAttributes` simulates another plugin that was already loaded when the page
 *   opened (e.g. the wallpaper engine's always-mounted gate, which turns 兼容模式 on by itself).
 * @returns the handles a test needs.
 */
export async function mountSection(initial, options = {}) {
  const dom = new JSDOM(HTML, { pretendToBeVisual: true, url: 'http://localhost/' })
  const { window } = dom
  openWindows.push(window)
  for (const [attribute, value] of Object.entries(options.bodyAttributes ?? {})) window.document.body.setAttribute(attribute, value)
  globalThis.window = window
  globalThis.document = window.document
  globalThis.Node = window.Node
  globalThis.Element = window.Element
  globalThis.HTMLElement = window.HTMLElement
  globalThis.Text = window.Text
  globalThis.MutationObserver = window.MutationObserver
  globalThis.getComputedStyle = window.getComputedStyle.bind(window)
  globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window)
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window)
  globalThis.localStorage = window.localStorage
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  class Observer { observe() {} unobserve() {} disconnect() {} }
  globalThis.ResizeObserver = Observer
  window.ResizeObserver = Observer
  // jsdom has no hit testing; the draw-mode picker asks for it on every click.
  window.document.elementsFromPoint = () => []
  window.document.elementFromPoint = () => null

  let value = JSON.parse(JSON.stringify(initial))
  const listeners = new Set()
  const writes = []
  const scope = {
    writes,
    getSnapshot: () => ({ status: 'ready', value, base: undefined, user: value, revision: 1, writable: true, mode: 'host' }),
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
    set: (field, next) => {
      writes.push(field)
      value = { ...value, [field]: next }
      for (const fn of [...listeners]) fn()
      return Promise.resolve(true)
    },
    unset: () => Promise.resolve(true),
    mutate: () => Promise.resolve(true),
  }

  const theme = { overrideTokens: () => () => {} }
  let override
  scope.subscribe(() => {
    const skin = currentSkin(scope.getSnapshot().value)
    override?.dispose()
    override = skin.enabled ? applySkin(theme, skin) : undefined
  })
  override = applySkin(theme, currentSkin(scope.getSnapshot().value))

  const mount = window.document.getElementById('mount')
  const reactRoot = createRoot(mount)
  await React.act(async () => { reactRoot.render(React.createElement(mod.MySkinSection, { scope, theme, t })) })

  const settle = () => React.act(async () => { await new Promise((resolve) => setTimeout(resolve, 25)) })
  /** Click one element and let React + the write promises settle. */
  const click = async (el) => {
    if (el === undefined || el === null) throw new Error('the element under test has to exist')
    await React.act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })) })
    await settle()
  }
  /** Click the FIRST button whose trimmed text is exactly this (searches the whole document). */
  const clickLabel = async (label, where = window.document) => {
    const el = [...where.querySelectorAll('button')].find((b) => (b.textContent ?? '').trim() === label)
    await click(el)
  }
  const doc = () => scope.getSnapshot().value
  const html = () => window.document.documentElement
  const pageColor = () => globalThis.getComputedStyle(window.document.getElementById('hero')).color
  const pageText = () => window.document.getElementById('hero').textContent
  /** The engine's committed stylesheet (absent while nothing is applied). */
  const committedTag = () => window.document.getElementById('dsh-myskin-rule')
  /** The editor's draft stylesheet (absent while the editor is closed or paints nothing). */
  const liveTag = () => window.document.getElementById('dsh-myskin-live')
  /** Whether the skin announces itself to the wallpaper plugin. */
  const announced = () => window.document.documentElement.getAttribute('data-dsh-skin')
  // Unmount, drop the engine override, then close the window: a jsdom document left open keeps
  // its own timers and animation frames alive, and the test process would never exit.
  const close = async () => {
    await React.act(async () => { reactRoot.unmount() })
    override?.dispose()
    dom.window.close()
  }
  return { window, scope, writes, mount, doc, html, pageColor, pageText, committedTag, liveTag, announced, click, clickLabel, close }
}
