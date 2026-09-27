/**
 * Skin apply engine. Everything here is additive + reversible: `applySkin`
 * returns a `dispose` that removes exactly what it added, so enabling/editing
 * a skin never leaves residue and never touches DSH source or the DSH process.
 *
 * Layers applied:
 *   1. tokens  -> the official `ctx.theme.overrideTokens` registry
 *   2. css     -> one plugin-owned <style data-plugin="dsh-myskin">
 *   3. canvas.background -> a body background-image rule
 *   4. canvas.background -> a body background rule
 *   5. text    -> text-node swap + MutationObserver re-apply (React-safe)
 */

import type { ThemeRuntime } from '@deepseek-ai/dsh-client-ui-theme/client'
import type { InjectedLayer, SkinSettings, TextOverride, TokenModes } from '../skin-schema.ts'

export const PLUGIN_ID = 'dsh-myskin'
const STYLE_ID = 'dsh-myskin-rule'

/** Handle returned by `applySkin`; call `dispose` to revert. */
export interface SkinOverride {
  dispose: () => void
}

/** One modified text node we must restore on dispose. */
interface TextPatch {
  node: Text
  original: string
  applied: string
}

/** Convert a CSS color (rgb/rgba/#hex) to an rgba() string with the given alpha. */
function toRgba(color: string, alpha: number): string {
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/)
  if (m !== null) return 'rgba(' + m[1] + ', ' + m[2] + ', ' + m[3] + ', ' + alpha + ')'
  const h = color.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  if (h !== null) {
    const hex = h[1].length === 3 ? h[1].split('').map((c) => c + c).join('') : h[1]
    const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16)
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')'
  }
  return ''
}

/** Direct text node of an element (ignores nested element text for matching). */
function directTextNode(el: Element): Text | undefined {
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) return node as Text
  }
  return undefined
}

/** Find the element(s) a text entry targets: by selector, else by exact text. */
function findTargets(entry: TextOverride): Element[] {
  if (typeof document === 'undefined') return []
  const seen = new Set<Element>()
  const result: Element[] = []
  const add = (el: Element | null): void => {
    if (el !== null && !seen.has(el)) { seen.add(el); result.push(el) }
  }
  if (entry.selector !== '') {
    try { document.querySelectorAll(entry.selector).forEach(add) } catch { /* invalid selector: ignore */ }
  }
  if (result.length === 0) {
    for (const el of Array.from(document.body?.querySelectorAll('*') ?? [])) {
      const text = directTextNode(el)
      if (text !== undefined && text.data === entry.before) { add(el); continue }
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if ((el as HTMLInputElement).placeholder === entry.before) add(el)
      }
    }
  }
  return result
}

/** Empty (identity) skin used when the persisted document is absent. */
function defaultSkin(): SkinSettings {
  return { enabled: false, tokens: {}, css: [], text: [], canvas: { background: undefined, images: [] }, library: [] }
}

/**
 * Best-effort identifier of the settings page currently open in `doc`.
 *
 * The settings dialog marks the active section nav cell with aria-current=true
 * (see ui-settings-general's SettingsRoot). We derive a stable key from that
 * cell's label + its position among sibling nav buttons, so an image embedded on
 * \"通用设置\" stays on that page and never leaks onto \"模型\" (or vice versa). When
 * no settings dialog is open (or no cell is marked), it returns '' = no page scope.
 */
export function currentSettingsPageKey(doc: Document): string {
  const cell = doc.querySelector('button[aria-current=\"true\"]')
  if (cell === null) return ''
  const label = (cell.textContent ?? '').replace(/\s+/g, ' ').trim()
  if (label === '') return ''
  let pos = 0
  const parent = cell.parentElement
  if (parent !== null) {
    let i = 0
    for (const c of Array.from(parent.children)) {
      if (c === cell) { pos = i; break }
      if (c.tagName === 'BUTTON') i++
    }
  }
  return label + '@' + pos
}

/**
 * Apply the skin to the live document.
 * @param theme - the DSH theme registry service (`ctx.theme`).
 * @param skin - the skin definition to apply.
 * @returns a `SkinOverride` whose `dispose` reverts every byte this call changed.
 */
export function applySkin(theme: ThemeRuntime, skin: SkinSettings): SkinOverride {
  const cleanups: Array<() => void> = []

  // Snapshot <body>'s raw inline style BEFORE any skin write. The restore itself is
  // pushed LAST (below), so it runs after the per-property removeProperty cleanups
  // (which would otherwise re-add a stale `style=""` and drift body.outerHTML from
  // baseline). This keeps the skin byte-exact reversible / non-destructive.
  let bodyStyleProto: string | null = null
  if (typeof document !== 'undefined') bodyStyleProto = document.body.getAttribute('style')

  // 1. Token layer: the official theme registry AND a direct var bind, so the
  // change is immediate + scheme-correct regardless of the presenter.
  if (Object.keys(skin.tokens).length > 0) {
    const disposeTokens = theme.overrideTokens(PLUGIN_ID, skin.tokens)
    cleanups.push(() => { disposeTokens() })
    if (typeof document !== 'undefined') {
      const dark = document.body.hasAttribute('data-ds-dark-theme')
        || document.documentElement.style.colorScheme === 'dark'
      const sv = ((name: string, modes: TokenModes): void => {
        document.body.style.setProperty(name, dark ? modes.dark : modes.light)
        cleanups.push(() => { document.body.style.removeProperty(name) })
      })
      for (const [name, modes] of Object.entries(skin.tokens)) sv(name, modes)
    }
  }

  // 2. CSS + background layer.
  const rules: string[] = []
  // Embedded background images: a ::after layer on each container, painted above the
  // container's background but below its content, so it's behind text and follows the
  // container's size/collapse. position/size/opacity are user-adjustable.
  const embedTargets = skin.canvas.images.filter((img) =>
    img.selector !== '' && img.url !== '' && img.fallbackSelector !== undefined && img.fallbackSelector !== '',
  )
  for (const img of skin.canvas.images) {
    if (img.selector !== '' && img.url !== '') {
      rules.push(img.selector + ' { position: relative; }')
      const blendCss = img.blend !== undefined && img.blend !== 'normal' ? ' mix-blend-mode: ' + img.blend + ';' : ''
      rules.push(img.selector + '::after { content: \'\'; position: absolute; inset: 0; background-image: url("' + img.url + '"); background-repeat: no-repeat; background-position: ' + img.x + 'px ' + img.y + 'px; background-size: ' + img.w + 'px ' + img.h + 'px; opacity: ' + (img.opacity ?? 1) + '; pointer-events: none; z-index: 1;' + blendCss + ' }')
    }
  }
  // Cross-document recovery: the image's own selector is the editor iframe's
  // `[data-dsh-myskin-embed=...]` attribute, which the real page never carries.
  // We re-tag the real element via its structural fallback selector, only when it
  // uniquely matches (so we never tag a look-alike). The attribute is transient —
  // React may rebuild the node (wiping it) or mount it after this apply runs — so a
  // single shared MutationObserver keeps the unique fallback re-tagged across
  // re-renders and late mounts until the skin is disposed.
  if (embedTargets.length > 0 && typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') {
    const retag = (): void => {
      const curKey = currentSettingsPageKey(document)
      for (const img of embedTargets) {
        // Page scoping: an image embedded on one settings page must not leak onto
        // another. When the image carries a pageKey, only keep it tagged while the
        // current page matches; on any mismatch strip the stale tag so its
        // [data-dsh-myskin-embed=id] rule matches nothing.
        const scoped = img.pageKey !== undefined && img.pageKey !== ''
        try {
          const els = document.querySelectorAll(img.fallbackSelector!)
          const target = els.length === 1 ? els[0] : undefined
          if (scoped && img.pageKey !== curKey) {
            const tagged = document.querySelector('[data-dsh-myskin-embed="' + img.id + '"]')
            if (tagged !== null) tagged.removeAttribute('data-dsh-myskin-embed')
            continue
          }
          if (target !== undefined && target.getAttribute('data-dsh-myskin-embed') !== img.id) {
            target.setAttribute('data-dsh-myskin-embed', img.id)
          }
        } catch { /* invalid selector: ignore */ }
      }
    }
    retag()
    let scheduled = false
    const schedule = (): void => {
      if (scheduled) return
      scheduled = true
      queueMicrotask(() => { scheduled = false; retag() })
    }
    const mo = new MutationObserver(schedule)
    // childList+subtree: React rebuilding a node shows up as child mutations.
    // We also watch aria-current so the scoping re-evaluates when the user switches
    // settings pages. Our own setAttribute (data-dsh-myskin-embed) is not observed,
    // so the observer cannot self-loop.
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-current'] })
    cleanups.push(() => { mo.disconnect() })
  }

  if (skin.canvas.background !== undefined && skin.canvas.background !== '') {
    rules.push(`body { background-image: url("${skin.canvas.background}") !important; background-size: cover !important; background-position: center !important; background-attachment: fixed !important; }`)
    // DSH paints opaque surfaces over <body>, so also make the base surface (bg-base)
    // semi-transparent so the image shows through.
    if (typeof document !== 'undefined') {
      const frame = document.querySelector('[class*="_frame"]') as HTMLElement | null
      const base = frame !== null ? getComputedStyle(frame).backgroundColor : (getComputedStyle(document.body).backgroundColor)
      const rgba = toRgba(base, 0.55)
      if (rgba !== '') {
        // Keep the var INSIDE the skin-owned <style> (removed on dispose) so we never
        // touch <body>'s inline style. That is what keeps the skin byte-exact
        // reversible — writing body.style + removeProperty leaves a stale `style=""`.
        // Force the base surfaces semi-transparent with !important so the background
        // image shows through even when the skin's own tokens set them opaque.
        rules.push(`body { --dsw-alias-bg-base: ${rgba} !important; }`)
        rules.push(`body { --dsw-alias-bg-layer-1: ${rgba} !important; }`)
        rules.push(`body { --dsw-alias-bg-layer-2: ${rgba} !important; }`)
        rules.push(`body { --dsw-alias-bg-overlay: ${rgba} !important; }`)
      }
    }
  }
  for (const { selector, rule } of skin.css) {
    if (selector !== '' && rule !== '') rules.push(`${selector} { ${rule} }`)
  }
  if (rules.length > 0 && typeof document !== 'undefined') {
    const tag = document.createElement('style')
    tag.dataset.plugin = PLUGIN_ID
    tag.dataset.pluginCss = STYLE_ID
    tag.id = STYLE_ID
    tag.textContent = rules.join('\n')
    document.head.appendChild(tag)
    cleanups.push(() => { tag.remove() })
  }

  // 3. Layer injection: REAL DOM nodes (img/div), tagged data-dsh-myskin-layer.
  //    This is the capability that lets a skin reach the "dsh-deep-whale depth":
  //    instanced character art, sidebar mascots, ornamental corners/trims, frames.
  //    Reversible + non-destructive: every injected node is tracked and removed on
  //    dispose, and a shared MutationObserver re-injects across React rebuilds /
  //    late mounts. State following is AUTHORED in the `css` layer against this
  //    stable per-layer marker under DSH's real state attributes (e.g.
  //    `[data-phase='active'] [data-dsh-myskin-layer='char'] { transform: ... }`).
  //    NOTE: layers should target a safe container (body, or a plain, non-React-
  //    mapped wrapper like `:scope > div`), never the middle of a mapped list.
  const layerList = skin.layers.filter((l) =>
    l.selector !== '' && (l.kind === 'div' || (l.url !== undefined && l.url !== '')))
  if (layerList.length > 0 && typeof document !== 'undefined') {
    const injectedNodes = new Set<Element>()
    const injectLayer = (layer: InjectedLayer): void => {
      const container = document.querySelector(layer.selector)
      if (container === null) return
      const key = '[data-dsh-myskin-layer="' + layer.id + '"]'
      if (container.querySelector(key) !== null) return // already present / re-injected
      const node = document.createElement(layer.kind)
      node.setAttribute('data-dsh-myskin-layer', layer.id)
      node.setAttribute('data-dsh-myskin-owner', PLUGIN_ID)
      node.setAttribute('aria-hidden', 'true')
      if (layer.kind === 'img') {
        const img = node as HTMLImageElement
        img.alt = ''
        img.src = layer.url || ''
      } else if (layer.url !== undefined && layer.url !== '') {
        ;(node as HTMLElement).style.backgroundImage = 'url("' + layer.url + '")'
        ;(node as HTMLElement).style.backgroundSize = 'contain'
        ;(node as HTMLElement).style.backgroundRepeat = 'no-repeat'
      }
      const st = (node as HTMLElement).style
      if (layer.x !== undefined) st.left = layer.x + 'px'
      if (layer.y !== undefined) st.top = layer.y + 'px'
      if (layer.w !== undefined) st.width = layer.w + 'px'
      if (layer.h !== undefined) st.height = layer.h + 'px'
      if (layer.opacity !== undefined) st.opacity = String(layer.opacity)
      if (layer.blend !== undefined && layer.blend !== 'normal') st.mixBlendMode = layer.blend
      if (layer.css) st.cssText += (st.cssText === '' ? '' : '; ') + layer.css
      if (layer.attach === 'prepend') container.prepend(node)
      else container.append(node)
      injectedNodes.add(node)
    }
    for (const layer of layerList) injectLayer(layer)
    let scheduled = false
    const schedule = (): void => {
      if (scheduled) return
      scheduled = true
      queueMicrotask(() => { scheduled = false; for (const layer of layerList) injectLayer(layer) })
    }
    const mo = new MutationObserver(schedule)
    // childList+subtree: React rebuilds a container and wipes an injected node, so
    // we re-inject. The self-loop is broken because injectLayer checks for an
    // existing [data-dsh-myskin-layer='id'] before inserting.
    mo.observe(document.body, { childList: true, subtree: true })
    cleanups.push(() => { mo.disconnect(); injectedNodes.forEach((n) => n.remove()); injectedNodes.clear() })
  }

  // 4. Content decorator (built-in, safe — no user JS): tag the dynamic
  //    workspace/session tree with data-maid-* row attributes so the skin's css can
  //    theme each workspace (ribbon) / folder (shield) / session (tab, connector,
  //    selected). React-safe: re-tags on attribute/child mutations; one disposer
  //    clears every tag + disconnects the observer.
  // Only run the tree decorator when the skin's own CSS targets data-maid-* rows.
  // This keeps it opt-in (no host-schema field needed) and avoids a MutationObserver
  // on every DOM mutation for skins that don't decorate the workspace tree.
  if ((skin.css ?? []).some((r2) => String(r2.selector).includes('data-maid-')) && typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') {
    const decorated = new Set<HTMLElement>()
    const decorate = (): void => {
      document.querySelectorAll<HTMLElement>("[role='tree']").forEach((tree) => {
        const rows = Array.from(tree.querySelectorAll<HTMLElement>("[role='treeitem']"))
        if (tree.matches("[class*='flatList']") && !rows.some((r) => r.hasAttribute('aria-expanded'))) {
          rows.filter((r) => r.hasAttribute('aria-selected')).forEach((r) => { r.dataset.maidWorkspaceRow = ''; r.dataset.maidSessionRow = ''; r.dataset.maidSessionFlat = ''; decorated.add(r) })
          return
        }
        let workspaceRow: HTMLElement | undefined
        let sessionRows: HTMLElement[] = []
        const decorateGroup = (): void => {
          if (!workspaceRow) return
          workspaceRow.dataset.maidWorkspaceRow = ''; decorated.add(workspaceRow)
          if (workspaceRow.parentElement) { workspaceRow.parentElement.dataset.maidWorkspaceGroup = ''; decorated.add(workspaceRow.parentElement) }
          sessionRows.forEach((r) => { r.dataset.maidSessionRow = ''; decorated.add(r) })
          if (sessionRows[0]) sessionRows[0].dataset.maidSessionFirst = ''
          if (sessionRows.at(-1)) sessionRows.at(-1)!.dataset.maidSessionLast = ''
          const current = workspaceRow.getAttribute('aria-expanded') === 'true' && sessionRows.some((r) => r.getAttribute('aria-selected') === 'true')
          if (current) workspaceRow.dataset.maidWorkspaceActive = ''
        }
        rows.forEach((row) => {
          if (row.hasAttribute('aria-expanded')) { decorateGroup(); workspaceRow = row; sessionRows = [] }
          else if (workspaceRow && row.hasAttribute('aria-selected')) sessionRows.push(row)
        })
        decorateGroup()
      })
    }
    decorate()
    const observer = new MutationObserver(() => { decorate() })
    observer.observe(document.body, { attributes: true, attributeFilter: ['aria-expanded', 'aria-selected'], childList: true, subtree: true })
    const clear = (): void => {
      observer.disconnect()
      decorated.forEach((el) => {
        delete el.dataset.maidWorkspaceRow; delete el.dataset.maidWorkspaceGroup; delete el.dataset.maidWorkspaceActive
        delete el.dataset.maidSessionRow; delete el.dataset.maidSessionFlat; delete el.dataset.maidSessionFirst; delete el.dataset.maidSessionLast
      })
      decorated.clear()
    }
    cleanups.push(clear)
  }

  // (removed) free-floating image layers — images are now embedded as
  //     background-image CSS rules on their container (see the css layer above).

  // 4. Text overrides: ONE shared MutationObserver, coalesced to a single
  // re-apply per microtask batch (so busy React re-renders don't re-scan the
  // whole DOM per mutation), with a deduped restore on dispose.
  const textEntries = skin.text.filter((e) => e.after !== '' && e.before !== e.after)
  const patches: TextPatch[] = []
  interface PlaceholderPatch { el: Element; original: string; applied: string }
  const placeholderPatches: PlaceholderPatch[] = []
  if (textEntries.length > 0 && typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') {
    let scheduled = false
    const applyTexts = (): void => {
      scheduled = false
      for (const entry of textEntries) {
        for (const el of findTargets(entry)) {
          const node = directTextNode(el)
          if (node !== undefined && node.data === entry.before) {
            node.data = entry.after
            patches.push({ node, original: entry.before, applied: entry.after })
          } else if (node === undefined && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
            if ((el as HTMLInputElement).placeholder === entry.before) {
              (el as HTMLInputElement).placeholder = entry.after
              placeholderPatches.push({ el, original: entry.before, applied: entry.after })
            }
          }
        }
      }
    }
    const schedule = (): void => { if (scheduled) return; scheduled = true; queueMicrotask(applyTexts) }
    applyTexts()
    const mo = new MutationObserver(schedule)
    mo.observe(document.body, { childList: true, subtree: true, characterData: true })
    cleanups.push(() => { mo.disconnect() })
  }
  cleanups.push(() => {
    for (const p of placeholderPatches) {
      if ((p.el as HTMLInputElement).placeholder === p.applied) (p.el as HTMLInputElement).placeholder = p.original
    }
  })
  cleanups.push(() => {
    const seen = new Set<Text>()
    for (const patch of patches) {
      if (!seen.has(patch.node) && patch.node.data === patch.applied) {
        patch.node.data = patch.original
        seen.add(patch.node)
      }
    }
  })

  // Restore <body>'s inline style byte-exactly, AFTER every other cleanup ran.
  cleanups.push(() => {
    if (typeof document === 'undefined') return
    if (bodyStyleProto === null) document.body.removeAttribute('style')
    else document.body.setAttribute('style', bodyStyleProto)
  })

  return {
    dispose(): void {
      for (const cleanup of cleanups.splice(0)) cleanup()
    },
  }
}

/** Current skin from a persisted document (defensive). */
export function currentSkin(value: SkinSettings | undefined): SkinSettings {
  return value ?? defaultSkin()
}