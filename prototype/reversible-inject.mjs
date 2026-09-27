/**

 * reversible-inject.mjs — isolated POC for dsh-myskin.
 *
 * Proves the dsh-myskin engine can reach "dsh-deep-whale depth" — inject real
 * DOM layers (character stage, sidebar corners), a nine-slice ornamental frame
 * via border-image, art backdrops, favicon + document.title — AND a state hook
 * that reads DSH *state* (data-phase / data-chat-flow / data-ds-dark-theme) but
 * writes ONLY skin-owned outputs — while staying fully REVERSIBLE and
 * NON-DESTRUCTIVE.
 *
 * Reversibility guarantee (the whole point of the POC):
 *   dispose() removes exactly the nodes the skin created, deletes every body
 *   data-attribute the skin wrote (persistent + transient motion flag), drops
 *   the skin <style>/favicon, disconnects the observer, and restores each body
 *   inline-style property it changed to its original value. After dispose, a
 *   captured DOM snapshot (body.outerHTML / title / inline style) is
 *   byte-identical to the pre-skin state.
 *
 * Zero dependencies: takes an optional { document, window } so it can run in
 * jsdom for a headless test as readily as on the live page.
 */

export const SKIN_MARKER = 'data-poc-skin'
export const BODY_ATTR = 'data-poc-atelier'
export const MOTION_ATTR = 'data-poc-composer-motion'

/** All body inline-style custom properties the skin sets (snapshot/restore set). */
const ART_VARS = [
  '--poc-palace-art',
  '--poc-palace-dark-art',
  '--poc-character-left-art',
  '--poc-character-right-art',
  '--poc-composer-frame-art',
  '--poc-sidebar-corner-art',
  '--poc-brand-tint',
]

export const SKIN_CSS = /* css */ `
body[data-poc-atelier] {
  background-image: var(--poc-palace-art);
  background-size: cover;
  background-position: center top;
  background-attachment: fixed;
  background-repeat: no-repeat;
}
body[data-poc-atelier][data-ds-dark-theme] { background-image: var(--poc-palace-dark-art); }

/* --- character stage: a REAL injected layer, not a ::after --- */
[data-poc-skin="character-stage"] {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  height: 64vh;
  pointer-events: none;
  z-index: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  transition: transform .55s cubic-bezier(.22,.61,.36,1);
}
[data-poc-skin="character-stage"] img {
  height: 100%;
  max-width: 46vw;
  object-fit: contain;
  filter: drop-shadow(0 16px 32px rgba(4,16,40,.5));
  transition: transform .55s cubic-bezier(.22,.61,.36,1), opacity .4s ease;
}
[data-poc-skin="character-left"]  { transform-origin: bottom left; }
[data-poc-skin="character-right"] { transform-origin: bottom right; }

/* state hook : dock toward bottom as the composer becomes an active chat */
body[data-poc-composer-motion="dock"] [data-poc-skin="character-stage"] {
  transform: translateY(16%) scale(.92);
}
body[data-poc-composer-motion="dock"] [data-poc-skin="character-left"]  { transform: translateX(3%); }
body[data-poc-composer-motion="dock"] [data-poc-skin="character-right"] { transform: translateX(-3%); }

/* --- sidebar corners (injected, rotated from one art tile) --- */
[data-poc-skin="sidebar-corners"] {
  position: absolute; inset: 0; pointer-events: none; z-index: 2;
}
[data-poc-skin="sidebar-corners"] span {
  position: absolute; width: 84px; height: 84px;
  background-image: var(--poc-sidebar-corner-art);
  background-size: contain; background-repeat: no-repeat;
  opacity: .9;
}
[data-poc-skin="sidebar-corners"] span[data-corner="top-left"]     { top: 4px;    left: 4px;   transform: rotate(0deg); }
[data-poc-skin="sidebar-corners"] span[data-corner="top-right"]    { top: 4px;    right: 4px;  transform: rotate(90deg); }
[data-poc-skin="sidebar-corners"] span[data-corner="bottom-right"] { bottom: 4px; right: 4px; transform: rotate(180deg); }
[data-poc-skin="sidebar-corners"] span[data-corner="bottom-left"]  { bottom: 4px; left: 4px;  transform: rotate(270deg); }

/* --- nine-slice ornamental composer frame (border-image) --- */
[data-poc-composer] {
  position: relative;
}
[data-poc-composer]::before {
  content: '';
  position: absolute;
  inset: -20px -16px -18px;
  z-index: 1;
  pointer-events: none;
  border-width: 64px 48px 50px;
  border-image-source: var(--poc-composer-frame-art);
  border-image-slice: 130 110 110 110 fill;
  border-image-width: 64px 48px 50px 48px;
  border-image-repeat: stretch;
}
[data-poc-composer] > * { position: relative; z-index: 2; }

/* --- subtle brand tint on native chrome (token-style, reversible via var) --- */
[data-poc-atelier] { --poc-brand-tint: #0b193f; }
`

/**
 * Install the demo skin and return a disposer.
 * @returns {{ dispose: () => void, sync: () => void }}
 */
export function installDemoSkin({
  document: doc = globalThis.document,
  window: win = globalThis.window,
  art = {},
  title,
  onState,
} = {}) {
  const body = doc.body
  const owned = new Set()          // nodes the skin created
  const addedBodyAttrs = new Set() // body data-attrs the skin wrote (persistent + transient)
  const originalTitle = doc.title

  const isOwn = (n) => n instanceof Element && n.getAttribute(SKIN_MARKER) !== null

  // 1) The skin <style> carries EVERY art custom property, scoped to
  //    body[data-poc-atelier]. We never touch body's inline style, so there is
  //    nothing inline to restore — dispose() only deletes the owned <style> and
  //    the owned nodes. This is what keeps the skin byte-exact reversible.
  const varsCss = [
    'body[data-poc-atelier]{',
    '--poc-palace-art:url("' + (art.palaceLight || '') + '");',
    '--poc-palace-dark-art:url("' + (art.palaceDark || '') + '");',
    '--poc-character-left-art:url("' + (art.characterLeft || '') + '");',
    '--poc-character-right-art:url("' + (art.characterRight || '') + '");',
    '--poc-composer-frame-art:url("' + (art.composerFrame || '') + '");',
    '--poc-sidebar-corner-art:url("' + (art.sidebarCorner || '') + '");',
    '}',
  ].join('\n')

  // 2) skin <style>
  const css = doc.createElement('style')
  css.id = 'poc-skin-css'
  css.setAttribute(SKIN_MARKER, 'style')
  css.textContent = SKIN_CSS + '\n' + varsCss
  doc.head.append(css)
  owned.add(css)

  // 3) character stage (real nodes)
  const stage = doc.createElement('div')
  stage.setAttribute(SKIN_MARKER, 'character-stage')
  stage.setAttribute('aria-hidden', 'true')
  const left = doc.createElement('img')
  left.setAttribute(SKIN_MARKER, 'character-left'); left.alt = ''; left.src = art.characterLeft
  const right = doc.createElement('img')
  right.setAttribute(SKIN_MARKER, 'character-right'); right.alt = ''; right.src = art.characterRight
  stage.append(left, right)
  owned.add(stage)
  body.prepend(stage)

  // 4) sidebar corners
  const sidebar = body.querySelector("[data-pane='sidebar']")
  const cornersRoot = sidebar?.querySelector(':scope > div') ?? sidebar
  const corners = doc.createElement('div')
  corners.setAttribute(SKIN_MARKER, 'sidebar-corners')
  corners.setAttribute('aria-hidden', 'true')
  for (const p of ['top-left', 'top-right', 'bottom-right', 'bottom-left']) {
    const s = doc.createElement('span'); s.setAttribute(SKIN_MARKER, 'corner'); s.dataset.corner = p; corners.append(s)
  }
  owned.add(corners)
  if (cornersRoot) cornersRoot.prepend(corners)

  // 5) body marker (switches background theme). Set/remove precisely.
  if (!body.hasAttribute(BODY_ATTR)) { body.setAttribute(BODY_ATTR, ''); addedBodyAttrs.add(BODY_ATTR) }

  // 6) favicon
  if (art.favicon) {
    const link = doc.createElement('link'); link.rel = 'icon'; link.type = 'image/png'
    link.href = art.favicon; link.setAttribute(SKIN_MARKER, 'favicon')
    doc.head.append(link); owned.add(link)
  }
  if (title) doc.title = title

  // 7) STATE HOOK: read DSH state, write skin-owned outputs only.
  const stateRoot = body.querySelector('[data-phase]')
  let layout = undefined
  let motionTimer = undefined
  const setMotion = (next) => {
    if (motionTimer) { clearTimeout(motionTimer); motionTimer = undefined }
    body.dataset.pocComposerMotion = next
    addedBodyAttrs.add(MOTION_ATTR)
    if (onState) onState({ layout, next, motion: next })
    motionTimer = setTimeout(() => { delete body.dataset.pocComposerMotion; addedBodyAttrs.delete(MOTION_ATTR); motionTimer = undefined }, 660)
  }
  const sync = () => {
    const phase = stateRoot?.dataset.phase
    const flow = stateRoot?.hasAttribute('data-chat-flow')
    const next = phase === 'active' ? (flow ? 'dock' : 'other') : 'hero'
    if (layout !== undefined && layout !== next) setMotion(next)
    layout = next
  }
  sync()

  let observer
  if (typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver((records) => {
      let stateChanged = false
      for (const r of records) {
        if (r.type === 'attributes') {
          if (r.target === stateRoot) stateChanged = true
          else if (r.target === body && r.attributeName === 'data-ds-dark-theme') stateChanged = true
          continue
        }
        // Ignore skin-owned insertions (self-loop guard). React/dynamics on the
        // app root aren't in scope for the POC, so only the state root matters.
        const appNodes = [...r.addedNodes, ...r.removedNodes].filter((n) => n instanceof Element && !isOwn(n))
        const t = r.target instanceof Element ? r.target : undefined
        if (appNodes.some((n) => n === stateRoot || n.contains?.(stateRoot)) || t?.contains?.(stateRoot)) stateChanged = true
      }
      if (stateChanged) sync()
    })
    observer.observe(body, {
      attributes: true,
      attributeFilter: ['data-phase', 'data-chat-flow', 'data-ds-dark-theme'],
      childList: true,
      subtree: true,
    })
  }

  // 8) disposer — remove exactly what was added, restore exactly what was touched.
  function dispose() {
    observer?.disconnect()
    if (motionTimer) { clearTimeout(motionTimer); motionTimer = undefined }
    for (const name of addedBodyAttrs) body.removeAttribute(name)
    addedBodyAttrs.clear()
    owned.forEach((n) => n.remove()); owned.clear()
    if (doc.title === title) doc.title = originalTitle
  }

  return { dispose, sync }
}

/**
 * Headless-agnostic reversibility self-check. Runs against a provided document,
 * asserts a byte-exact restore (body.outerHTML / title / inline style), and
 * returns { passed, details } without throwing.
 * @returns {{ passed: boolean, details: string[] }}
 */
export function runReversibilityCheck({ document: doc = globalThis.document, art = {} } = {}) {
  const details = []
  const body = doc.body
  const baselineHTML = body.outerHTML
  const baselineTitle = doc.title
  const baselineStyle = body.getAttribute('style') ?? ''

  const stateRoot = body.querySelector('[data-phase]')
  // Snapshot the app state the check is about to exercise, so we can restore it
  // and end with a byte-identical DOM even though we flipped DSH state to prove
  // the state hook works. (The skin itself must never touch DSH's owned values.)
  const origPhase = stateRoot?.getAttribute('data-phase') ?? null
  const origChat = stateRoot?.hasAttribute('data-chat-flow') ?? false

  const skin = installDemoSkin({ document: doc, art, title: art.title })
  const injected = doc.querySelectorAll('[' + SKIN_MARKER + ']').length
  details.push(`injected skin-owned nodes: ${injected}`)
  if (injected === 0) return finalize(details, 'assert: skin injected at least one node')

  // exercise the state hook: flip to an active chat, read the motion flag
  if (stateRoot) {
    stateRoot.setAttribute('data-phase', 'active')
    stateRoot.setAttribute('data-chat-flow', '')
  }
  // Synchronous path: read current state directly (observer is async; call sync too)
  skin.sync?.()

  const motionAfterState = body.hasAttribute(MOTION_ATTR) ? body.getAttribute(MOTION_ATTR) : '(none)'
  details.push(`state hook motion attr: ${motionAfterState}`)

  skin.dispose()

  // restore the app state the check itself flipped, so the DOM mirrors baseline
  if (stateRoot) {
    if (origPhase !== null) stateRoot.setAttribute('data-phase', origPhase)
    else stateRoot.removeAttribute('data-phase')
    if (origChat) stateRoot.setAttribute('data-chat-flow', '')
    else stateRoot.removeAttribute('data-chat-flow')
  }

  const afterHTML = body.outerHTML
  if (afterHTML !== baselineHTML) {
    let i = 0
    while (i < afterHTML.length && afterHTML[i] === baselineHTML[i]) i++
    details.push('byte-exact diff @' + i
      + ' | baseline[..' + baselineHTML.slice(Math.max(0, i - 36), i + 24) + '..]'
      + ' | after[..' + afterHTML.slice(Math.max(0, i - 36), i + 24) + '..]')
  }
  const afterTitle = doc.title
  const afterStyle = body.getAttribute('style') ?? ''
  const leftoverSkin = doc.querySelectorAll('[' + SKIN_MARKER + ']').length
  const leftoverBodyAttrs = Array.from(body.attributes).map((a) => a.name).filter((n) => n.startsWith('data-poc'))
  details.push(`leftover skin nodes after dispose: ${leftoverSkin}`)
  details.push(`leftover body data-poc attrs after dispose: ${leftoverBodyAttrs.join(', ') || '(none)'}`)

  const checks = [
    ['body.outerHTML byte-exact (incl. app state restored)', afterHTML === baselineHTML],
    ['title restored', afterTitle === baselineTitle],
    ['inline style restored', afterStyle === baselineStyle],
    ['no leftover skin nodes', leftoverSkin === 0],
    ['no leftover body data-poc attrs', leftoverBodyAttrs.length === 0],
  ]
  for (const [label, ok] of checks) details.push(`${ok ? 'PASS' : 'FAIL'} ${label}`)

  return finalize(details, checks.every(([, ok]) => ok))

  function finalize(d, passed) { return { passed, details: d } }
}
