/**
 * "皮肤管理" (Skin Management) settings section — native DSH settings design
 * language (label rows + --dsw-* tokens + capsule Button/Pill/Input). Read model:
 *
 *   - presets: one-tap --dsw-* token palettes (ctx.theme official channel).
 *   - canvas: a transparent full-screen overlay over the LIVE DSH DOM; click a
 *     node to restyle, edit text inline, and add positioned image layers.
 *     Every edit writes a reversible skin def, and CSS/background changes are
 *     previewed live through an owned style tag.
 */

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { ChangeEvent, CSSProperties, KeyboardEvent as ReactKeyboardEvent, MutableRefObject, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { Button, Pill, Input, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { IconClose, IconPersonalization, IconPlus, IconTrash } from './icons.ts'
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { InjectFace } from '@deepseek-ai/dsh-client-ui-slots'
import type { ThemeRuntime } from '@deepseek-ai/dsh-client-ui-theme/client'
import { imageModeOf, parseSkin, EMPTY_SKIN, type AnchorKind, type BlendMode, type CssRule, type EmbeddedImage, type ImageAnchor, type ImageMode, type InjectedLayer, type NamedSkin, type SkinCanvas, type SkinSettings, type TokenOverrides } from '../skin-schema.ts'
import {
  COMPOSER_PLACEHOLDER_SELECTOR, DRAFT_STYLE_ID, FONT_FACE_SELECTOR, HIDE_DECLARATION, REMOVE_DECLARATION,
  anchorTextOf, backgroundSurfaceRules, childTargetIn, currentSettingsPageKey, declarationOf, desktopFrameTint, elementLabel,
  embedAfterRule,
  embedHostRule,
  parseDeclarations,
  embedPaintsAbove,
  featherStyle,
  readImageFeather,
  withImageFeather,
  withImageMarker,
  type BackgroundAnchor,
  type ImageFeather,
  fontFaceRule, fontFormat, keepStylesheetLast, mergeDeclaration, mountImageOverlay, naturalDisplayOf, parentTarget, parseTransform,
  PLUGIN_ID, pickElementAt, readBackgroundAnchor, readBackgroundOpacity, readImageLayer, removedControls, resolveImageAnchor, resolveImageTargets,
  IMAGE_PAGE_SCOPE_PROPERTY, imagePageMatches, readImagePageScope, sameSettingsPage, selectorOf,
  SNAP_THRESHOLD, snapMove, snapScale, snapTargetsFor, stepValue, surfaceTint, textHostOf, sameDeclarations,
  transformEdit, transformPreview, transformValue, wallpaperRules, withAllControlsRestored, withBackgroundOpacity,
  withBackgroundAnchor, withControlRestored, withImageLayer, withManagedDeclarations, withoutDeclaration,
} from './skin-engine.ts'
import { filterFamilies, quoteFamily, scanFonts, type FontScan } from './fonts.ts'
import { ANCHOR_COMPONENTS, anchorKey, anchorLabel, anchorOf } from './anchors.ts'
import { FONT_ROLES, roleFont, roleStackFor, withRoleFont, type FontRole } from './font-roles.ts'
import { elementGroupFor, gapLength, gapOf, gapSelectorFor, groupLabelKey, moveRuleToBlock, withGapRule, type EditScope, type ElementGroup } from './groups.ts'
import { siteScopeFor, type SiteScopeOutcome } from './site-scope.ts'
import { stackingReport, type StackingReport } from './stacking.ts'
import { MAX_REMEMBERED_SURFACES, currentPageSurface, hiddenInSurface, hiddenRulesFor, hiddenWhile, readRememberedSurfaces, rememberSurface, settingsOpen, settingsSurface, withAllHiddenRestored, withHiddenEverywhere, withOnlySurface, withSurfaceHidden, withVisibleWhile, type Surface } from './views.ts'
import { canvasLooksOversized, diagnoseCanvas } from './save-report.ts'
import { editorFrameRules, pulseWindowDragRecall, readDesktopShell } from './desktop.ts'
import { attachWheelNudge, mountCanvasUi, setDrawCursor } from './canvas-ui.ts'
import { DOCK_ATTRIBUTE, applyDockAttribute, browserStorage, clearDockAttribute, otherDock, readDockSide, writeDockSide, type DockSide } from './dock.ts'
import { PANEL_TABS, PANEL_TAB_LABEL, readPanelTab, writePanelTab, type PanelTab } from './panel-tabs.ts'
import { occludedBehindPanel, sameElements } from './occlusion.ts'
import type { ImageLayer, ImageOverlay, RemovedControl, SnapLine } from './skin-engine.ts'
import { DSHSKIN_EXTENSION, bytesToDataUrl, packSkin, toArrayBuffer, unpackSkin } from './dshskin.ts'
import { isAnimatedGif, isGif } from './gif.ts'
import { diagnoseEmbeddedImage } from './image-diag.ts'
import { VARIANT_AXES, VARIANT_LOOKS, applyVariantLook, applyVariantOption, clearVariant, optionFor, readVariantChoices } from './variants.ts'
import { REGIONS, REGION_FIELDS, REGION_PRESETS, applyRegionPreset, clearRegionStyles, readRegionStyle, regionCount, regionSelector, writeRegionStyle } from './regions.ts'
import type { RegionField } from './regions.ts'
import type { ImageDiagnosis } from './image-diag.ts'
import {
  MARKDOWN_FIELDS, MARKDOWN_GROUPS, MARKDOWN_PRESETS, MARKDOWN_TOKENS, applyMarkdownPreset, clearMarkdownStyles,
  clearMarkdownTokens, markdownSurfaceCount, markdownTokenSplit, readEffectiveMarkdown, readMarkdownScope, readMarkdownStyles,
  readMarkdownTokens, withMarkdownScope, writeMarkdownStyle, writeMarkdownToken,
} from './markdown.ts'
import type { MarkdownField, MarkdownScope, MarkdownTokenField } from './markdown.ts'
import type { MySkinKey } from './locales.ts'
import { PRESETS } from './presets.ts'
import { TOKEN_CATALOG, TOKEN_GROUP_KEYS, type TokenGroup } from './token-catalog.ts'

/** Native settings-panel tokens. */
const tok = {
  labelPrimary: 'var(--dsw-alias-label-primary)',
  labelSecondary: 'var(--dsw-alias-label-secondary)',
  labelTertiary: 'var(--dsw-alias-label-tertiary)',
  borderL2: 'var(--dsw-alias-border-l2)',
  borderL3: 'var(--dsw-alias-border-l3)',
  bgLayer1: 'var(--dsw-alias-bg-layer-1)',
  bgLayer2: 'var(--dsw-alias-bg-layer-2)',
  bgOverlay: 'var(--dsw-alias-bg-overlay)',
  bgBase: 'var(--dsw-alias-bg-base)',
  brand: 'var(--dsw-alias-brand-primary)',
  success: 'var(--dsw-alias-state-success-primary)',
  warn: 'var(--dsw-alias-state-warn-primary)',
  error: 'var(--dsw-alias-state-error-primary)',
}

/** Blend modes available to an embedded image layer (label key -> CSS value). */
const BLEND_OPTIONS: { value: BlendMode; labelKey: MySkinKey }[] = [
  { value: 'normal', labelKey: 'blendNormal' },
  { value: 'multiply', labelKey: 'blendMultiply' },
  { value: 'screen', labelKey: 'blendScreen' },
  { value: 'overlay', labelKey: 'blendOverlay' },
]

const sectionStyle: CSSProperties = { display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 720, color: tok.labelPrimary, gap: 8 }
const titleStyle: CSSProperties = { margin: 0, fontSize: 16, lineHeight: '24px', fontWeight: 500, color: tok.labelPrimary }
const introStyle: CSSProperties = { margin: 0, fontSize: 14, lineHeight: '22px', color: tok.labelTertiary }
const rowStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '0 0 8px 0', borderBottom: '1px solid ' + tok.borderL2 }
const lastRowStyle: CSSProperties = { ...rowStyle, borderBottom: 'none' }
const rowTitleStyle: CSSProperties = { fontSize: 14, lineHeight: '22px', color: tok.labelPrimary }
const btnBase: CSSProperties = { whiteSpace: 'nowrap', flexShrink: 0 }

/**
 * Centre of an element's box, or undefined when it reports no geometry.
 * @param el - the element to measure.
 * @returns the centre point, or undefined without layout.
 */
function centerOf(el: Element): { x: number; y: number } | undefined {
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return undefined
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

/**
 * Elements the canvas must never select: its own UI and the document roots.
 *
 * One predicate for the picker, the hover tracker, the parent/child buttons AND the occlusion
 * scan (a point that only reaches our chrome and the page itself covers nothing), so the dashed
 * outline, the click result and the traversal can never disagree.
 *
 * It reads `ownerDocument` rather than the global one so a test can hand it another document.
 * @param el - candidate element.
 * @returns true when the canvas must ignore it.
 */
function isOwnElement(el: Element): boolean {
  const doc = el.ownerDocument
  return el.getAttribute('data-dsh-myskin-ui') === '1'
    || el.closest('[data-dsh-myskin-ui="1"]') !== null
    || el === doc.body || el === doc.documentElement || el === doc.getElementById('root')
}

/** Longest element label the toolbar chip shows before clipping (a label can carry a text snippet). */
const OCCLUDED_LABEL_MAX = 30

/**
 * Clip one element label to something a toolbar chip can hold.
 * @param label - full label (tag/id/class · text).
 * @returns the label, ellipsised past {@link OCCLUDED_LABEL_MAX} characters.
 */
function shortLabel(label: string): string {
  return label.length > OCCLUDED_LABEL_MAX ? label.slice(0, OCCLUDED_LABEL_MAX - 1) + '…' : label
}

/**
 * Name one page of the main area for the 『界面显示』 card (『本页：插件』).
 *
 * The page root is a big element, so the label is the same short form the canvas uses elsewhere:
 * tag/id/class plus a snippet of its text.
 * @param el - the page root.
 * @returns a human-readable, length-capped name.
 */
function pageLabel(el: Element): string {
  return elementLabel(el, 40)
}

/**
 * Look one selector up, swallowing the SyntaxError a stale selector can raise.
 * @param selector - CSS selector.
 * @returns the first match, or null.
 */
function safeQuery(selector: string): Element | null {
  try { return document.querySelector(selector) } catch { return null }
}

/**
 * Parse an input value as a number, falling back when it is empty or not finite.
 * @param value - the raw input text.
 * @param fallback - value to use for '' / garbage (0 for offsets, 1 for scale).
 * @returns a finite number.
 */
function toNum(value: string, fallback: number): number {
  const parsed = Number(value)
  return value.trim() === '' || !Number.isFinite(parsed) ? fallback : parsed
}

/**
 * Round to one decimal.
 *
 * The numbers this editor writes are pixel offsets and sizes, and `0.1px` is already far below what
 * anyone can aim at: showing `12.340000000000001` (which a drag or a wheel nudge can produce) reads
 * as noise, and the document stores what the field shows.
 * @param value - the raw number.
 * @returns the value rounded to one decimal.
 */
function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/**
 * The same rounding, as the string an input displays (`0` stays `0`, not `0.0`).
 * @param value - the raw number.
 * @returns the display text.
 */
function formatOne(value: number): string {
  return String(round1(value))
}

/** Clamp a number to [min, max]; NaN -> min. */
function clampNum(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min
  return Math.min(max, Math.max(min, v))
}

/** Run a drag/resize gesture with pointer capture, ending cleanly on release. */
function beginPointerDrag(e: ReactPointerEvent, onMove: (ev: PointerEvent) => void): void {
  const el = e.currentTarget as HTMLElement
  const move = (ev: PointerEvent): void => onMove(ev)
  const finish = (): void => {
    try { el.releasePointerCapture(e.pointerId) } catch { /* ignore */ }
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerup', finish)
    el.removeEventListener('pointercancel', finish)
    window.removeEventListener('pointerup', finish)
    window.removeEventListener('blur', finish)
  }
  try { el.setPointerCapture(e.pointerId) } catch { /* ignore */ }
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', finish)
  el.addEventListener('pointercancel', finish)
  window.addEventListener('pointerup', finish)
  window.addEventListener('blur', finish)
}

/** Parse a `prop: value` rule into a map (strips !important). */
function parseStateRule(rule: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of rule.split(';')) {
    const idx = part.indexOf(':')
    if (idx < 0) continue
    const prop = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).replace(/\s*!important\s*$/i, '').trim()
    if (value !== '') out[prop] = value
  }
  return out
}

/**
 * Split one constant declaration into `[property, value]` for the merge helpers.
 * @param declaration - e.g. `visibility: hidden !important`.
 * @returns the property and its value.
 */
function declarationPair(declaration: string): [string, string] {
  const index = declaration.indexOf(':')
  return [declaration.slice(0, index).trim(), declaration.slice(index + 1).trim()]
}

/** "Hide this control" as a property/value pair. */
const HIDE_PAIR = declarationPair(HIDE_DECLARATION)
/** "Remove this control" as a property/value pair. */
const REMOVE_PAIR = declarationPair(REMOVE_DECLARATION)

/**
 * Copy key for one whole-app font role's label.
 * @param role - the role.
 * @returns the locale key.
 */
function roleLabelKey(role: FontRole): MySkinKey {
  return role === 'ui' ? 'roleUi' : role === 'text' ? 'roleText' : 'roleCode'
}

/**
 * An anchor that pins an image to one element, with a readable label frozen next to it.
 * @param el - the element to follow.
 * @returns the anchor.
 */
function anchorFromElement(el: Element): ImageAnchor {
  return { kind: 'element', value: selectorOf(el), label: elementLabel(el, 24) }
}

/**
 * The anchor an image gets when the user switches to another anchor KIND.
 *
 * Switching kind is not a re-target by itself, so the value is carried over whenever it still
 * makes sense — and when it does not, the default is the obvious one: the copy of the element
 * that is currently selected (「选中那行字 → 锚定为文字」).
 * @param kind - the kind the user picked.
 * @param img - the image being anchored.
 * @param target - the element selected on the canvas right now.
 * @returns the new anchor.
 */
function defaultAnchor(kind: AnchorKind, img: EmbeddedImage, target: Element, groupAnchor?: ImageAnchor): ImageAnchor {
  // 整组: the selector of the block the selection belongs to (absent when there is no block).
  if (kind === 'group') return groupAnchor ?? anchorFromElement(target)
  if (kind === 'component') {
    const current = anchorOf(img)
    const existing = current.kind === 'component' ? current.value : ''
    return { kind: 'component', value: existing !== '' ? existing : ANCHOR_COMPONENTS[0].id, label: '' }
  }
  if (kind === 'text') {
    const copy = anchorTextOf(target)
    return { kind: 'text', value: copy ?? '', label: copy ?? '' }
  }
  return anchorFromElement(target)
}

/** Try to normalize a CSS color string to a #rrggbb hex (for <input type=color>). */
function toHex(v: string): string | undefined {
  if (v === 'transparent') return undefined
  const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (m !== null) {
    if (m[4] !== undefined && Number(m[4]) < 1) return undefined
    const rgb = [m[1], m[2], m[3]].map((x) => Number(x).toString(16).padStart(2, '0')).join('')
    return '#' + rgb
  }
  if (/^#[0-9a-fA-F]{3}$/.test(v)) return '#' + v.slice(1).split('').map((c) => c + c).join('')
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v
  return undefined
}

/** Injected dependencies of {@link MySkinSection} (slot inject). */
export interface MySkinSectionInjected {
  scope: ConfigForm<SkinSettings>
  theme: ThemeRuntime
  t: (key: MySkinKey) => string
}

/** Props delivered by the slot outlet: inject face + the section-owner close. */
export type MySkinSectionProps = Partial<InjectFace<MySkinSectionInjected>> & { close?: () => void }

/** One durable write's outcome: which fields the Host refused, if any. */
export interface PersistReport {
  ok: boolean
  /** Field names the Host did not accept ('*' means the write itself failed). */
  failed: string[]
}

/**
 * Persist the whole skin document to the durable settings namespace.
 *
 * `ConfigForm.set` resolves false when the Host refuses a path (not `volatile`, a
 * schema mismatch, a rejected value) and throws when the connection drops; the
 * editor used to collapse both into one flat boolean, which is why "saving does
 * nothing" was unactionable. Naming the refused fields is what makes it fixable.
 * @param scope - the namespace form.
 * @param skin - the document to store.
 * @returns which fields were written and which the Host refused.
 */
function persist(scope: ConfigForm<SkinSettings>, skin: SkinSettings): Promise<PersistReport> {
  const writes: Array<[string, Promise<boolean>]> = [
    ['enabled', scope.set('enabled', skin.enabled)],
    ['tokens', scope.set('tokens', skin.tokens)],
    ['css', scope.set('css', skin.css)],
    ['text', scope.set('text', skin.text)],
    ['canvas', scope.set('canvas', skin.canvas)],
    ['layers', scope.set('layers', skin.layers)],
    ['content', scope.set('content', skin.content ?? {})],
    ['library', scope.set('library', skin.library)],
  ]
  return Promise.all(writes.map(([, write]) => write)).then((accepted) => {
    const failed = writes.filter((_, index) => accepted[index] !== true).map(([field]) => field)
    return { ok: failed.length === 0, failed }
  })
}

/**
 * Localized one-line description of a failed write.
 * @param report - the failed write.
 * @param t - the page's dictionary lookup.
 * @returns the message to show in the editor.
 */
function saveFailureText(report: PersistReport, t: (key: MySkinKey) => string, canvas?: SkinCanvas): string {
  if (report.failed.includes('*')) return t('applyFailed')
  const base = t('saveFailed') + report.failed.join(', ')
  if (canvas === undefined || !report.failed.includes('canvas')) return base
  // "canvas" alone is unactionable: name the two reasons it actually has. See save-report.ts —
  // a stale Host schema (a value the client just learned to write fails validation for the whole
  // field) and an oversized payload (images ride inside the canvas as data URLs) look identical
  // from the outside, so the message carries the measurements that tell them apart.
  const diagnosis = diagnoseCanvas(canvas)
  return canvasLooksOversized(diagnosis)
    ? base + ' —— ' + t('saveFailedCanvasLarge').replace('{n}', String(Math.round(diagnosis.bytes / 1024)))
    : base + ' —— ' + t('saveFailedCanvas')
}

/** Which built-in preset the current token overrides match (if any). */
function activePresetId(skin: SkinSettings): string | undefined {
  for (const p of PRESETS) {
    const pk = Object.keys(p.tokens)
    const sk = Object.keys(skin.tokens)
    if (pk.length !== sk.length) continue
    if (!pk.every((k) => skin.tokens[k]?.light === p.tokens[k].light && skin.tokens[k]?.dark === p.tokens[k].dark)) continue
    return p.id
  }
  return undefined
}

/** Standalone live-edit canvas host, decoupled from the settings dialog so it
 * survives the dialog closing. */
let editorHost: { root: ReturnType<typeof createRoot>; container: HTMLDivElement } | undefined
function closeSkinEditor(): void {
  if (editorHost === undefined) return
  editorHost.root.unmount()
  editorHost.container.remove()
  editorHost = undefined
}
function openSkinEditor(theme: ThemeRuntime, initial: SkinSettings, t: (k: MySkinKey) => string, onCommit: (next: SkinSettings) => Promise<PersistReport>, onClose: () => void, onPersistStrength: (canvas: SkinCanvas, css: CssRule[]) => Promise<PersistReport>): void {
  closeSkinEditor()
  const container = document.createElement('div')
  document.body.appendChild(container)
  editorHost = { root: createRoot(container), container }
  editorHost.root.render(
    <SkinCanvas
      theme={theme}
      initial={initial}
      t={t}
      onPersistStrength={onPersistStrength}
      onSave={onCommit}
      onCommit={async (next) => { const report = await onCommit(next); if (report.ok) closeSkinEditor(); return report }}
      onClose={() => { onClose(); closeSkinEditor() }}
    />,
  )
}

/** The section content column. */
export function MySkinSection(props: MySkinSectionProps): ReactNode {
  const { scope, theme, t, close } = props
  if (scope === undefined || theme === undefined || t === undefined) return null
  return <Loaded scope={scope} theme={theme} t={t} close={close} />
}

function Loaded({ scope, theme, t, close }: MySkinSectionInjected & { close?: () => void }): ReactNode {
  const [skin, setSkin] = useState<SkinSettings>(() => parseSkin(scope.getSnapshot().value ?? EMPTY_SKIN))
  const [notice, setNotice] = useState<string | undefined>(undefined)
  const [nameDialog, setNameDialog] = useState<{ mode: 'save' | 'rename'; id?: string } | null>(null)
  const [skinName, setSkinName] = useState('我的皮肤')

  // One-time migration: adopt a legacy localStorage library (older builds kept
  // saved skins there instead of in the durable document) into the doc, then
  // drop the storage entry so there is a single source of truth.
  const LEGACY_LIB_KEY = 'dsh-myskin.library'
  useEffect(() => {
    const sync = (): void => {
      const doc = parseSkin(scope.getSnapshot().value ?? EMPTY_SKIN)
      if (doc.library.length === 0) {
        try {
          const legacy = JSON.parse(window.localStorage.getItem(LEGACY_LIB_KEY) ?? '[]') as NamedSkin[]
          if (Array.isArray(legacy) && legacy.length > 0) {
            const merged = { ...doc, library: legacy }
            setSkin(merged)
            void persist(scope, merged).catch(() => {})
            try { window.localStorage.removeItem(LEGACY_LIB_KEY) } catch { /* ignore */ }
            return
          }
        } catch { /* ignore */ }
      }
      setSkin(doc)
    }
    sync()
    const unsub = scope.subscribe(sync)
    return () => { unsub() }
  }, [scope])

  /**
   * Persist the document and report whether the Host accepted every field.
   * @param next - the skin document to store.
   * @returns true when all fields were accepted.
   */
  const persistNow = async (next: SkinSettings): Promise<PersistReport> => {
    setSkin(parseSkin(next))
    try {
      return await persist(scope, next)
    } catch { return { ok: false, failed: ['*'] } }
  }

  /**
   * Persist only the canvas + css fields, so the strength slider saves without
   * committing unrelated draft edits.
   * @param canvas - the canvas object to store.
   * @param css - the rule list carrying the strength marker.
   * @returns true when both fields were accepted.
   */
  const persistStrength = async (canvas: SkinCanvas, css: CssRule[]): Promise<PersistReport> => {
    try {
      const accepted = await Promise.all([scope.set('canvas', canvas), scope.set('css', css)])
      const failed = ['canvas', 'css'].filter((_, index) => accepted[index] !== true)
      return { ok: failed.length === 0, failed }
    } catch { return { ok: false, failed: ['*'] } }
  }

  const update = (next: SkinSettings): void => {
    void persistNow(next).then((report) => { if (!report.ok) setNotice(saveFailureText(report, t, next.canvas)) })
  }

  const applyNow = (): void => {
    void persist(scope, skin)
    setNotice(t('saved'))
  }

  // One-click live preview: enable the current skin, then close the dialog so
  // you can see it on the app surface.
  const onPreview = (): void => {
    if (Object.keys(skin.tokens).length === 0 && skin.css.length === 0 && skin.text.length === 0) {
      setNotice(t('none'))
      return
    }
    update({ ...skin, enabled: true })
    close?.()
  }

  const reset = (): void => { update(EMPTY_SKIN); setNotice(t('reset')) }
  const applyPreset = (id: string): void => {
    const preset = PRESETS.find((p) => p.id === id)
    if (preset === undefined) return
    update({ ...skin, enabled: true, tokens: { ...preset.tokens } })
    setNotice(t('saved'))
  }

  const importRef = useRef<HTMLInputElement | null>(null)
  /**
   * Export the whole document as a `.dshskin` package.
   *
   * The package keeps the document (tokens / css / text / canvas / layers / library) in
   * `manifest.json` and every wallpaper, embedded image and embedded font as a real file
   * under `assets/` — one container, no base64 bloat, and assets can be swapped by hand.
   */
  const onExport = (): void => {
    // The name in the library field becomes the package name AND the download name, so
    // two exported skins are told apart by their filename alone.
    const name = skinName.trim() || 'dsh-myskin'
    const { bytes, manifest } = packSkin(skin, { name, generator: 'dsh-myskin' })
    const blob = new Blob([toArrayBuffer(bytes)], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name.replace(/[\\/:*?"<>|]/g, '-') + DSHSKIN_EXTENSION
    a.click()
    URL.revokeObjectURL(url)
    setNotice(t('exportedOk') + ' · ' + t('assetsLabel') + ' ' + String(manifest.assets.length))
  }
  /**
   * Import a `.dshskin` package (or a legacy JSON export — files on disk stay usable).
   * @param e - the hidden file input's change event.
   */
  const onImportFile = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file === undefined) return
    const reader = new FileReader()
    reader.onerror = () => { setNotice(t('importError')) }
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result as ArrayBuffer)
      void unpackSkin(bytes).then(({ skin: imported, manifest }) => {
        update(parseSkin(imported))
        setNotice(t('importedOk') + ' · ' + t('assetsLabel') + ' ' + String(manifest.assets.length))
      }).catch((error: unknown) => {
        setNotice(t('importError') + ' ' + (error instanceof Error ? error.message : ''))
      })
    }
    reader.readAsArrayBuffer(file)
  }

  const saveSkin = (): void => { setSkinName('我的皮肤'); setNameDialog({ mode: 'save' }) }
  const renameSkin = (entry: NamedSkin): void => { setSkinName(entry.name); setNameDialog({ mode: 'rename', id: entry.id }) }
  const confirmSkinName = (): void => {
    const name = skinName.trim() || '我的皮肤'
    if (nameDialog === null) return
    if (nameDialog.mode === 'save') {
      const entry: NamedSkin = {
        id: 'skin-' + Date.now(), name,
        tokens: skin.tokens, css: skin.css, text: skin.text, canvas: skin.canvas,
        // Required by NamedSkin: saving without it silently dropped every injected
        // layer from the library (and from any export of it).
        layers: skin.layers,
      }
      update({ ...skin, library: [...skin.library, entry] })
    } else if (nameDialog.mode === 'rename' && nameDialog.id !== undefined) {
      const id = nameDialog.id
      update({ ...skin, library: skin.library.map((s) => s.id === id ? { ...s, name } : s) })
    }
    setNameDialog(null)
    setNotice(t('saved'))
  }
  const moveSkin = (entry: NamedSkin, dir: -1 | 1): void => {
    const library = [...skin.library]
    const i = library.indexOf(entry)
    const j = i + dir
    if (i < 0 || j < 0 || j >= library.length) return
    library[i] = library[j]
    library[j] = entry
    update({ ...skin, library })
  }
  const loadSkin = (entry: NamedSkin): void => {
    update({ ...skin, enabled: true, tokens: entry.tokens, css: entry.css, text: entry.text, canvas: entry.canvas })
  }
  const deleteSkin = (id: string): void => {
    update({ ...skin, library: skin.library.filter((s) => s.id !== id) })
  }
  const duplicateSkin = (entry: NamedSkin): void => {
    const copy: NamedSkin = { ...entry, id: 'skin-' + Date.now(), name: entry.name + ' · ' + t('copySuffix') }
    update({ ...skin, library: [...skin.library, copy] })
  }

  // Token override editor state.
  const activePreset = activePresetId(skin)
  const presetOf = PRESETS.find((p) => p.id === activePreset)
  const currentLabel = presetOf !== undefined
    ? t(presetOf.labelKey)
    : (Object.keys(skin.tokens).length > 0 || skin.css.length > 0 || skin.text.length > 0)
      ? t('customSkin')
      : t('none')

  return (
    <div style={sectionStyle}>
      <h2 style={titleStyle}>{t('title')}</h2>
      <p style={introStyle}>{t('intro')}</p>

      <div style={rowStyle}>
        <span style={rowTitleStyle}>{t('skinLabel')}</span>
        <span style={{ flex: 1 }} />
        <span style={rowTitleStyle}>{currentLabel}</span>
      </div>

      <div style={rowStyle}>
        <span style={rowTitleStyle}>{t('preset')}</span>
        <span style={{ flex: 1 }} />
        {PRESETS.map((preset) => (
          <Pill style={btnBase} key={preset.id} active={activePreset === preset.id} onClick={() => { applyPreset(preset.id) }}>
            {t(preset.labelKey)}
          </Pill>
        ))}
      </div>


      <div style={rowStyle}>
        <span style={rowTitleStyle}>{t('enabled')}</span>
        <span style={{ flex: 1 }} />
        <SkinToggle checked={skin.enabled} onChange={(v) => update({ ...skin, enabled: v })} status={skin.enabled ? t('enabledOn') : t('enabledOff')} />
      </div>

      <div style={lastRowStyle}>
        <Button style={btnBase} variant="outline" icon={<IconPersonalization size={16} />} onClick={() => { close?.(); openSkinEditor(theme, skin, t, (next) => persistNow(next), () => {}, (canvas, css) => persistStrength(canvas, css)) }}>{t('edit')}</Button>
        <Button style={btnBase} variant="outline" onClick={onPreview}>{t('preview')}</Button>
        <Button style={btnBase} onClick={applyNow}>{t('apply')}</Button>
        <Button style={btnBase} variant="ghost" onClick={reset}>{t('reset')}</Button>
        <span style={{ flex: 1 }} />
        <Button style={btnBase} size="sm" variant="ghost" onClick={saveSkin}>{t('saveSkin')}</Button>
        <Button style={btnBase} size="sm" variant="ghost" onClick={onExport}>{t('exportSkin')}</Button>
        <Button style={btnBase} size="sm" variant="ghost" onClick={() => { importRef.current?.click() }}>{t('importSkin')}</Button>
        <input ref={importRef} type="file" accept={'.dshskin,.zip,application/json,.json'} style={{ display: 'none' }} onChange={onImportFile} />
      </div>

      <div style={{ ...lastRowStyle, color: tok.labelTertiary, fontSize: 12, lineHeight: '18px' }}>{t('skinPackHint')}</div>

      {skin.library.length === 0 ? null : (
        <>
          <div style={rowStyle}><span style={rowTitleStyle}>{t('skinLibrary')}</span><span style={{ flex: 1 }} /></div>
          {skin.library.map((entry, index) => (
            <div key={entry.id} style={index === skin.library.length - 1 ? lastRowStyle : rowStyle}>
              <span style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid ' + tok.borderL2, background: entry.tokens['--dsw-alias-bg-base']?.light ?? 'var(--dsw-alias-bg-base)', overflow: 'hidden', display: 'inline-flex', flex: 'none' }}>
                <span style={{ width: '100%', height: 14, background: entry.tokens['--dsw-alias-brand-primary']?.light ?? 'var(--dsw-alias-brand-primary)' }} />
              </span>
              <span style={rowTitleStyle}>{entry.name}</span>
              <span style={{ flex: 1 }} />
              <Button style={btnBase} size="sm" variant="ghost" onClick={() => { moveSkin(entry, -1) }}>{t('layerUp')}</Button>
              <Button style={btnBase} size="sm" variant="ghost" onClick={() => { moveSkin(entry, 1) }}>{t('layerDown')}</Button>
              <Button style={btnBase} size="sm" variant="ghost" icon={<IconPlus size={14} />} onClick={() => { duplicateSkin(entry) }}>{t('duplicate')}</Button>
              <Button style={btnBase} size="sm" variant="ghost" onClick={() => { renameSkin(entry) }}>{t('rename')}</Button>
              <Button style={btnBase} size="sm" variant="outline" onClick={() => { loadSkin(entry) }}>{t('load')}</Button>
              <Button style={btnBase} size="sm" variant="ghost" icon={<IconTrash size={14} />} onClick={() => { deleteSkin(entry.id) }}>{t('remove')}</Button>
            </div>
          ))}
        </>
      )}
      {notice === undefined ? null : <p style={{ margin: '6px 0 0', fontSize: 12, lineHeight: '18px', color: tok.success }}>{notice}</p>}

      <Modal
        open={nameDialog !== null}
        onClose={() => { setNameDialog(null) }}
        title={nameDialog?.mode === 'rename' ? t('renameSkin') : t('saveSkin')}
        closeLabel={t('cancel')}
        footer={(<>
          <Button style={btnBase} variant="outline" onClick={() => { setNameDialog(null) }}>{t('cancel')}</Button>
          <Button style={btnBase} onClick={confirmSkinName}>{t('confirm')}</Button>
        </>)}
      >
        <Input value={skinName} autoFocus onChange={(e: ChangeEvent<HTMLInputElement>) => { setSkinName(e.target.value) }}
          onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') confirmSkinName() }} />
      </Modal>
    </div>
  )
}
/** A switch toggle for enabling/disabling the skin, with a readable status label. */
function SkinToggle({ checked, onChange, status }: { checked: boolean; onChange: (v: boolean) => void; status: string }): ReactNode {
  return (
    <button data-dsh-myskin-ui="1" role="switch" aria-checked={checked} onClick={() => { onChange(!checked) }}
      style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: tok.labelPrimary }}>
      <span style={{ position: 'relative', flex: 'none', width: 40, height: 22, borderRadius: 11, background: checked ? tok.brand : 'var(--dsw-alias-bg-layer-2)', border: '1px solid ' + (checked ? tok.brand : tok.borderL2), transition: 'background .15s, border-color .15s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,.06)' }}>
        <span style={{ position: 'absolute', top: 2, left: checked ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.25)', transition: 'left .15s' }} />
      </span>
      <span style={{ fontSize: 14, lineHeight: '22px', color: checked ? tok.brand : tok.labelSecondary }}>{status}</span>
    </button>
  )
}

/**
 * Largest font file that may be embedded (30 MB).
 *
 * An embedded font lives in the skin document as a base64 data URL, and that document is
 * re-sent on EVERY edit — so a full CJK face is allowed but is genuinely expensive: the
 * package from {@link packSkin} keeps it as a real file, the durable document does not.
 * {@link FONT_WARN_BYTES} is where the editor starts saying so out loud instead of
 * letting the first slow save be a surprise.
 */
const MAX_FONT_BYTES = 30 * 1024 * 1024
/** Size above which embedding a font gets an explicit "this will slow every save" note. */
const FONT_WARN_BYTES = 2 * 1024 * 1024

/**
 * Families offered as suggestions in the font field.
 *
 * A datalist, not a closed list: the field takes ANY family the user types (including
 * one they just embedded), these are only the ones worth one click.
 */
const FONT_SUGGESTIONS: readonly string[] = [
  'system-ui',
  '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
  '"Microsoft YaHei", "PingFang SC", sans-serif',
  '"Noto Sans CJK SC", "Source Han Sans SC", sans-serif',
  '"HarmonyOS Sans SC", "MiSans", "Alibaba PuHuiTi", sans-serif',
  'Georgia, "Songti SC", "SimSun", serif',
  '"Kaiti SC", "KaiTi", serif',
  '"JetBrains Mono", Consolas, "SFMono-Regular", monospace',
  'cursive',
]

/**
 * Data-URL budget for an ANIMATED image.
 *
 * Bigger than {@link MAX_DATA_URL_LENGTH} on purpose: the still-image path gets its size down by
 * re-encoding, and re-encoding a GIF keeps exactly one frame — so for an animation the choice is
 * "store more bytes" or "lose the movement". Up to here the movement wins (the panel says the
 * document is heavier), past it the caller is TOLD that only the first frame survived.
 */
const MAX_ANIMATED_URL_LENGTH = 4_000_000

/** What one picked picture turned into. */
interface PickedImage {
  /** The data URL to store ('' when the file could not be read). */
  readonly url: string
  /** True when the file was an animated GIF (whether or not the animation survived). */
  readonly animated: boolean
  /** True when an animated GIF had to be flattened to its first frame. */
  readonly stilled: boolean
  /** The picture's own pixel size (0 when it could not be measured). */
  readonly width: number
  readonly height: number
}

/**
 * Read one picked picture, keeping an animated GIF alive whenever it can.
 *
 * A canvas has a single frame, so {@link readImageFile} is the right path for a still picture and
 * the wrong one for an animation: the GIF is therefore embedded byte-for-byte as its own
 * `image/gif` data URL — no downscaling, no re-encoding, animation intact (which is also why the
 * size ceiling is the only thing that can still stop it).
 * @param file - the picked file.
 * @param maxEdge - longest edge the STILL path downscales to.
 * @param quality - WebP quality the STILL path encodes with.
 * @returns the data URL plus what happened to the animation.
 */
async function readPickedImage(file: File, maxEdge = MAX_IMAGE_EDGE, quality = 0.9): Promise<PickedImage> {
  // Only the header is read for a non-GIF: pulling a 20 MB photo into memory just to look at its
  // first bytes would double the work of every ordinary embed.
  let animated = false
  let bytes = new Uint8Array(0)
  try {
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer())
    if (isGif(head)) {
      bytes = new Uint8Array(await file.arrayBuffer())
      animated = isAnimatedGif(bytes)
    }
  } catch {
    animated = false
  }
  if (animated) {
    const url = bytesToDataUrl(bytes, 'image/gif')
    // The header carries the logical screen size: no decode needed to know the shape.
    const size = { width: bytes[6] | (bytes[7] << 8), height: bytes[8] | (bytes[9] << 8) }
    if (url.length <= MAX_ANIMATED_URL_LENGTH) return { url, animated: true, stilled: false, ...size }
    const still = await readImageFile(file, maxEdge, quality)
    return { url: still.url, animated: true, stilled: true, width: still.width, height: still.height }
  }
  const still = await readImageFile(file, maxEdge, quality)
  return { url: still.url, animated: false, stilled: false, width: still.width, height: still.height }
}

/** Box a freshly embedded picture starts in (it is draggable and resizable afterwards). */
const EMBED_BOX_WIDTH = 320
/** @see EMBED_BOX_WIDTH */
const EMBED_BOX_HEIGHT = 240

/**
 * The starting display size of an embed: the picture's own shape, fitted into the embed box.
 *
 * A fixed 320×200 stretched whatever was dropped in — an animated GIF especially, where the
 * squashed movement is the first thing the user sees. Never upscales: a 64×64 sticker stays 64×64.
 * @param width - natural width in pixels (0 when unknown).
 * @param height - natural height in pixels (0 when unknown).
 * @returns the box to start from.
 */
function embedSizeFor(width: number, height: number): { w: number; h: number } {
  if (width <= 0 || height <= 0) return { w: EMBED_BOX_WIDTH, h: EMBED_BOX_HEIGHT }
  const scale = Math.min(1, EMBED_BOX_WIDTH / width, EMBED_BOX_HEIGHT / height)
  return { w: Math.max(24, Math.round(width * scale)), h: Math.max(24, Math.round(height * scale)) }
}

/**
 * The size of a data URL in MB, for the one-line report the panel shows.
 * @param url - the data URL.
 * @returns e.g. `1.4 MB`.
 */
function dataUrlSize(url: string): string {
  return (Math.round((url.length / 1024 / 1024) * 10) / 10).toFixed(1) + ' MB'
}
/** Longest edge a stored skin image is downscaled to (keeps the settings document small). */
const MAX_IMAGE_EDGE = 2048
/** Longest edge for the page wallpaper: it covers the viewport, so 2048 is waste. */
const MAX_WALLPAPER_EDGE = 1600
/** Encoded data URL budget: an oversized field is what makes a settings write fail. */
const MAX_DATA_URL_LENGTH = 1_500_000

/**
 * Encode one wallpaper so the document stays writable.
 *
 * The durable document is re-sent on every edit, so a multi-megabyte data URL is
 * what turns "apply" into a silent failure on a slow link or a size-limited host.
 * Each step is a real re-encode; when even the smallest still overflows, the
 * caller refuses the image instead of storing something that cannot be saved.
 * @param file - the picked image.
 * @returns the data URL (empty when it cannot be made to fit) and whether it needed shrinking.
 */
async function readBoundedImage(file: File): Promise<{ url: string; compressed: boolean; animated: boolean; stilled: boolean }> {
  // An animated wallpaper is a GIF too: same rule as the embedded pictures — keep the movement when
  // the document can afford it, and say so when it cannot.
  const picked = await readPickedImage(file, MAX_WALLPAPER_EDGE, 0.85)
  if (picked.animated && picked.url !== '') {
    return { url: picked.url, compressed: false, animated: true, stilled: picked.stilled }
  }
  const first = (await readImageFile(file, MAX_WALLPAPER_EDGE, 0.85)).url
  if (first === '') return { url: '', compressed: false, animated: false, stilled: false }
  if (first.length <= MAX_DATA_URL_LENGTH) return { url: first, compressed: false, animated: false, stilled: false }
  const steps: ReadonlyArray<readonly [number, number]> = [[1280, 0.8], [960, 0.72]]
  for (const [edge, quality] of steps) {
    const next = (await readImageFile(file, edge, quality)).url
    if (next !== '' && next.length <= MAX_DATA_URL_LENGTH) return { url: next, compressed: true, animated: false, stilled: false }
  }
  return { url: '', compressed: true, animated: false, stilled: false }
}

/**
 * Read an image file as a data URL.
 * @param file - the picked image file.
 * @param maxEdge - longest edge after downscaling.
 * @param quality - WebP quality used when downscaling.
 * @returns the data URL to store ('' when the file could not be read) and the picture's own size,
 *   so a fresh embed can start at the right shape instead of in a fixed 320×200 box.
 */
function readImageFile(file: File, maxEdge = MAX_IMAGE_EDGE, quality = 0.9): Promise<{ url: string; width: number; height: number }> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    const failed = { url: '', width: 0, height: 0 }
    reader.onerror = () => resolve(failed)
    reader.onload = () => {
      const url = String(reader.result ?? '')
      if (url === '') { resolve(failed); return }
      const image = new Image()
      image.onerror = () => resolve({ url, width: 0, height: 0 })
      image.onload = () => {
        const natural = { width: image.naturalWidth, height: image.naturalHeight }
        const edge = Math.max(image.naturalWidth, image.naturalHeight)
        if (edge <= maxEdge || typeof document === 'undefined') { resolve({ url, ...natural }); return }
        const scale = maxEdge / edge
        const target = document.createElement('canvas')
        target.width = Math.max(1, Math.round(image.naturalWidth * scale))
        target.height = Math.max(1, Math.round(image.naturalHeight * scale))
        const context = target.getContext('2d')
        if (context === null) { resolve({ url, ...natural }); return }
        context.drawImage(image, 0, 0, target.width, target.height)
        try { resolve({ url: target.toDataURL('image/webp', quality), ...natural }) } catch { resolve({ url, ...natural }) }
      }
      image.src = url
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Width of the docked panel, in px.
 *
 * The frame rules carry the same number as their CSS fallback, and the page inset is measured from
 * the live panel — this constant is only what the editor uses before the first measurement.
 */
const PANEL_WIDTH = 340

/** Common stacking values offered as one-click buttons next to the z-index field. */
const Z_INDEX_PRESETS: readonly number[] = [0, 10, 100, 1000]

/**
 * How many surfaces the 『界面显示』 card lists (settings + current page + remembered ones).
 *
 * The remembered list is capped: the panel is a tool, not a browser history, and a long list would
 * push the fields it exists to serve off the screen.
 */
const MAX_SURFACE_ROWS = 6

/**
 * How many outlines the canvas draws for the elements a scope covers.
 *
 * A 全站 identity can name dozens of elements; outlining the first screenful says "it is everywhere"
 * without turning the page into a grid of boxes, and the exact number is on the scope button.
 */
const PEER_OUTLINE_MAX = 24

interface CanvasProps {
  /** The DSH theme registry: the editor previews the draft's TOKENS through it (see the token effect). */
  theme: ThemeRuntime
  initial: SkinSettings
  onClose: () => void
  /** Persist the draft and STAY in the editor (「保存」). */
  onSave: (next: SkinSettings) => Promise<PersistReport>
  /** Persist and leave the editor on success (「应用」). */
  onCommit: (next: SkinSettings) => Promise<PersistReport>
  /** Persist just the canvas + css fields (the strength slider auto-saves). */
  onPersistStrength: (canvas: SkinCanvas, css: CssRule[]) => Promise<PersistReport>
  t: (key: MySkinKey) => string
}

/** Full-screen canvas editor over the live DSH DOM (transparent overlay). */
function SkinCanvas({ theme, initial, onClose, onSave, onCommit, onPersistStrength, t }: CanvasProps): ReactNode {
  const [draft, setDraft] = useState<SkinSettings>(() => parseSkin(initial))
  /** Signature of the draft's tokens: what the live token preview has to react to. */
  const tokenKey = Object.entries(draft.tokens).map(([name, modes]) => name + ':' + modes.light + '/' + modes.dark).join(';')
  const [selected, setSelected] = useState<Element | undefined>(undefined)
  const [mode, setMode] = useState<'edit' | 'interact'>('edit')
  const [showTokens, setShowTokens] = useState(false)
  const [hint, setHint] = useState<string | undefined>(undefined)
  /** Transient success message for the status row (「已写入皮肤文档」). */
  const [flash, setFlash] = useState<string | undefined>(undefined)
  /** Element under the pointer in edit mode: the dashed "you will select this" outline. */
  const [hover, setHover] = useState<Element | undefined>(undefined)
  /** The panel can be folded away to look at the whole page while drawing. */
  const [panelOpen, setPanelOpen] = useState(true)
  /**
   * Which side the panel — and the page inset that follows it — docks to.
   *
   * Remembered in browser storage, NOT in the skin document: it says something about this
   * machine's plugins, not about the skin, so it must not need a Host schema to change (see
   * dock.ts). An element pinned to the window edge does not move when the page is inset, and
   * docking the chrome to the other side is what makes such a component reachable again.
   */
  const [dock, setDock] = useState<DockSide>(() => readDockSide(browserStorage()))
  /** Elements the open panel is currently covering (see occlusion.ts) — normally none. */
  const [occluded, setOccluded] = useState<readonly Element[]>([])
  /**
   * The embedded image the canvas is editing, when one is selected.
   *
   * Images used to have no selection at all: their drag box was painted on top of whatever element
   * was selected, so the page showed two overlapping selections and the panel showed two sets of
   * settings. An image is now selected the same way a component is — one at a time, with the image
   * taking precedence — and the element selection is kept (hidden) only as the source for
   * 「用选中元素」/「取选中文字」.
   */
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined)
  /** Latest image selection, for the document-level key handler. */
  const selectedImageRef = useRef<string | undefined>(undefined)
  /**
   * Which kind of edit the panel is showing (see {@link PANEL_TABS}).
   *
   * One tab per kind of OBJECT — a component, an image, a piece of copy, the markdown output, the page
   * look — instead of one column holding all five. Remembered across sessions like the dock side.
   */
  const [panelTab, setPanelTab] = useState<PanelTab>(() => readPanelTab(browserStorage()))

  useEffect(() => { writePanelTab(browserStorage(), panelTab) }, [panelTab])
  /**
   * The page the main area is showing right now (see views.ts) — 『对话』, 『插件』, …
   *
   * Derived from the page's own markup, and kept fresh by the scan below rather than by a render:
   * navigating is the app's state, nothing about it mutates this component.
   */
  const [pageView, setPageView] = useState<Surface | undefined>(() => currentPageSurface(document, pageLabel))
  /** Whether the settings surface is mounted right now (『你在这里』). */
  const [inSettings, setInSettings] = useState(() => settingsOpen(document))
  /**
   * The pages the editor has already described — the 『常用』 rows.
   *
   * A page marker can only be derived from a mounted page, so the catalog is built by walking the
   * app; remembering it is what turns 「本页」 into a fixed list you can toggle without navigating
   * there again.
   */
  const [knownPages, setKnownPages] = useState<Surface[]>(() => readRememberedSurfaces(browserStorage()))
  /** 还原默认 is destructive to the draft, so it asks once before acting. */
  const [confirmReset, setConfirmReset] = useState(false)
  /** Bumped on every pick so the selection box remounts and replays its landing animation. */
  const [selectionEpoch, setSelectionEpoch] = useState(0)
  /** Low-sensitivity alignment guides while dragging (Alt suspends them for one gesture). */
  const [snapOn, setSnapOn] = useState(true)
  /** Guide lines currently drawn, in viewport coordinates. */
  const [guides, setGuides] = useState<readonly SnapLine[]>([])
  /** Latest selection and close action, read by the document-level key handler. */
  const selectedRef = useRef<Element | undefined>(undefined)
  const closeRef = useRef<() => void>(() => {})
  /** The last click point: the child-level button re-hit-tests it on demand. */
  const lastPointRef = useRef<{ x: number; y: number } | undefined>(undefined)
  const embedBgRef = useRef<HTMLInputElement | null>(null)
  const pageBgRef = useRef<HTMLInputElement | null>(null)
  const [, bump] = useState(0)
  const liveStyleRef = useRef<HTMLStyleElement | null>(null)
  /**
   * Controls restored from the recycle bin while the COMMITTED skin still removes them.
   *
   * Removal is one CSS declaration, so clearing it in the draft is the whole edit until
   * that removal has been saved — after that the committed stylesheet keeps saying
   * `display: none` under the same selector, and the editor has to out-shout it (see
   * {@link naturalDisplayOf}) until the next 保存. Selector → natural `display`.
   */
  const [restoredLive, setRestoredLive] = useState<Record<string, string>>({})
  /** Whether the Inspector edits the selected element alone or its whole block. */
  const [scope, setScope] = useState<EditScope>('single')
  /**
   * The block the current selection belongs to.
   *
   * Recomputed when the selection (or the re-pick epoch) changes, not on every render: it scans
   * the document for the element's peers, and this component re-renders on every frame of a drag.
   */
  const group = useMemo<ElementGroup | undefined>(
    () => (selected === undefined ? undefined : elementGroupFor(selected, document)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, selectionEpoch],
  )
  /**
   * The element's 全站 identity — the selector that reaches the same component in EVERY view.
   *
   * Recomputed with the selection for the same reason {@link group} is (it queries the document),
   * and it carries either the scope or the reason the element has none: a disabled button without
   * a reason is a dead end (see site-scope.ts).
   */
  const site = useMemo<SiteScopeOutcome | undefined>(
    () => (selected === undefined ? undefined : siteScopeFor(selected, document)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, selectionEpoch],
  )
  /** The 全站 selector, when this selection has one. */
  const siteScope = site !== undefined && site.ok ? site.scope : undefined
  /**
   * The selector every edit is written to: the element itself, its block (整组) or the same
   * identity everywhere (全站).
   *
   * A scope that cannot be resolved for THIS selection falls back to the element — and the panel
   * says why that scope is unavailable, rather than writing somewhere the user did not ask for.
   */
  const activeSelector = scope === 'group' && group !== undefined
    ? group.selector
    : scope === 'site' && siteScope !== undefined
      ? siteScope.selector
      : (selected === undefined ? '' : selectorOf(selected))
  /**
   * The selector that targets the space BETWEEN the block's members, when they are siblings.
   *
   * Undefined means "the gap is not the block's business here" (members nested under different
   * parents): the field then explains itself instead of writing a rule that matches nothing.
   */
  const gapSelector = useMemo(
    () => (scope === 'group' && group !== undefined ? gapSelectorFor(group, document) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scope, group, selectionEpoch],
  )
  /** The gap as written on the page ('' when the block has none). */
  const gap = gapSelector === undefined ? '' : gapOf(draft.css, gapSelector)
  /** One snapshot per editing run: dragging the gap is a single undo step, like the fields. */
  const gapEditRef = useRef(false)
  /**
   * Set (or clear) the gap between the members of the current block.
   * @param value - a CSS length, or '' to clear.
   */
  const setGap = (value: string): void => {
    if (gapSelector === undefined) return
    if (!gapEditRef.current) { snapshot(); gapEditRef.current = true }
    setDraft((prev) => ({ ...prev, css: withGapRule(prev.css, gapSelector, value) }))
  }
  /**
   * Switch the edit scope, carrying what is already styled onto the wider selector.
   *
   * 整组 / 全站 mean "the edit I already made now covers everything this scope names", and the
   * panel only writes on the NEXT field change — so without moving the declarations here, toggling
   * the scope looks like it did nothing at all (exactly the report). One snapshot, so Ctrl+Z takes
   * it back.
   * @param next - the scope to switch to.
   */
  const changeScope = (next: EditScope): void => {
    if (next === scope) return
    setScope(next)
    if (selected === undefined) return
    const wide = next === 'group' ? group?.selector : next === 'site' ? siteScope?.selector : undefined
    if (wide === undefined) return
    const own = selectorOf(selected)
    if (own === wide) return
    snapshot()
    setDraft((prev) => ({ ...prev, css: moveRuleToBlock(prev.css, own, wide) }))
  }
  /**
   * Hide or show the selected component in one surface (『界面显示』 card).
   *
   * The rule is written against the component's 全站 identity, not against the element selector:
   * the whole point is that the surfaces mount their own instance (or paint one global node), so a
   * structural selector would only ever reach the copy the user happens to be looking at. No
   * identity → nothing to write, and the card says why instead of pretending.
   * @param view - the surface to change.
   * @param hidden - true to hide the component there, false to show it again.
   */
  const setSurfaceVisibility = (surface: Surface, hidden: boolean): void => {
    if (siteScope === undefined) return
    snapshot()
    setDraft((prev) => ({
      ...prev,
      css: hidden
        ? withSurfaceHidden(prev.css, surface, siteScope.selector, true)
        : withVisibleWhile(prev.css, surface, siteScope.selector, surfaces),
    }))
  }
  /**
   * Preset 「只在本页显示」: keep it here, hide it everywhere else.
   *
   * One inverted rule instead of one rule per known surface — pages the editor has never opened
   * are covered too, which is the whole reason this is a preset and not a row.
   * @param surface - the page to keep it on.
   */
  const keepOnlySurface = (surface: Surface): void => {
    if (siteScope === undefined) return
    snapshot()
    setDraft((prev) => ({ ...prev, css: withOnlySurface(prev.css, surface, siteScope.selector, surfaces) }))
  }
  /** Preset 「到处都不显示」: one blunt rule, no surface in the selector. */
  const hideEverywhere = (): void => {
    if (siteScope === undefined) return
    snapshot()
    setDraft((prev) => ({ ...prev, css: withHiddenEverywhere(prev.css, siteScope.selector) }))
  }
  /**
   * Add one declaration to the element's rule (the 『设为 relative』 button behind the z-index
   * field). Merged, not replaced: whatever the panel and the user already wrote stays.
   * @param selector - the rule to edit.
   * @param declaration - e.g. `position: relative !important`.
   */
  const addDeclaration = (selector: string, declaration: string): void => {
    snapshot()
    setDraft((prev) => {
      const existing = prev.css.find((entry) => entry.selector === selector)?.rule
      const rest = prev.css.filter((entry) => entry.selector !== selector)
      return { ...prev, css: [...rest, { selector, rule: mergeDeclaration(existing, declaration) }] }
    })
  }
  /**
   * The undo for 「我把所有显示都关了」.
   *
   * Hiding a component everywhere takes it off the canvas, so the toggle that did it is no longer
   * reachable by clicking the page: this button (in the panel, which is still open) and the
   * recycle bin are the two ways back. Both remove exactly the \`display\` declarations that hide
   * this component — every surface, including rules written by an older build.
   */
  const restoreAllHidden = (): void => {
    if (siteScope === undefined) return
    snapshot()
    setDraft((prev) => ({ ...prev, css: withAllHiddenRestored(prev.css, siteScope.selector) }))
  }
  /**
   * The images the COMMITTED document carries.
   *
   * While the editor is open it owns the embed tags (it previews the draft, which may have
   * moved or deleted an image); when it closes — saving OR discarding — the page has to show
   * exactly what the document says. This is that reference point, and it follows every
   * successful 保存 / 应用.
   */
  const committedImagesRef = useRef<readonly EmbeddedImage[]>(initial.canvas.images)

  // Undo/redo history (deep-copied snapshots).
  const [, bumpHistory] = useState(0)
  const draftRef = useRef(draft)
  useEffect(() => { draftRef.current = draft }, [draft])
  useEffect(() => { selectedImageRef.current = selectedImage }, [selectedImage])
  // Picking an image on the canvas opens the image tab: the panel follows the object being edited.
  useEffect(() => {
    if (selectedImage !== undefined) setPanelTab('image')
  }, [selectedImage])
  // An image that disappears (deleted, undone) must not keep the selection: the image chrome would
  // step aside for a box that no longer exists, leaving the page with NO selection at all.
  useEffect(() => {
    if (selectedImage !== undefined && !draft.canvas.images.some((img) => img.id === selectedImage)) setSelectedImage(undefined)
  }, [draft.canvas.images, selectedImage])
  const pastRef = useRef<SkinSettings[]>([])
  const futureRef = useRef<SkinSettings[]>([])
  /** Durable-write status shown in the toolbar (edits are drafts until applied). */
  const [save, setSave] = useState<{ state: 'saved' | 'dirty' | 'saving' | 'failed'; detail?: string }>({ state: 'saved' })
  const snapshot = (): void => {
    pastRef.current = [...pastRef.current, JSON.parse(JSON.stringify(draftRef.current))]
    futureRef.current = []
    bumpHistory((n) => n + 1)
    setSave((prev) => prev.state === 'dirty' ? prev : { state: 'dirty' })
  }
  const undo = (): void => {
    const prev = pastRef.current[pastRef.current.length - 1]
    if (prev === undefined) return
    pastRef.current = pastRef.current.slice(0, -1)
    futureRef.current = [draftRef.current, ...futureRef.current]
    setDraft(prev)
    bumpHistory((n) => n + 1)
  }
  const redo = (): void => {
    const next = futureRef.current[0]
    if (next === undefined) return
    futureRef.current = futureRef.current.slice(1)
    pastRef.current = [...pastRef.current, draftRef.current]
    setDraft(next)
    bumpHistory((n) => n + 1)
  }

  // Keep the selection highlight tracking scroll/resize, coalesced to ONE repaint per
  // frame. Re-rendering per scroll event was the only part of this editor that could
  // actually cost frames while the app behind it is being scrolled.
  useEffect(() => {
    let frame = 0
    const schedule = (): void => {
      if (frame !== 0) return
      frame = requestAnimationFrame(() => { frame = 0; bump((n) => n + 1) })
    }
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
      if (frame !== 0) cancelAnimationFrame(frame)
    }
  }, [])

  // Capture gestures on the REAL page while in edit mode. The overlay itself is
  // pointer-events:none, so the app underneath stays visible, scrollable and
  // hoverable; we intercept in the capture phase and select the element instead.
  // Our own panels carry data-dsh-myskin-ui="1" and always pass through.
  useEffect(() => {
    if (mode !== 'edit') return
    const own = (target: EventTarget | null): boolean =>
      target instanceof Element && isOwnElement(target)
    const onPointerDown = (e: Event): void => {
      if (own(e.target)) return
      e.preventDefault()
      e.stopPropagation()
    }
    const onClick = (e: MouseEvent): void => {
      if (own(e.target)) return
      e.preventDefault()
      e.stopPropagation()
      liveApplyRef.current = false
      liveTextRef.current = false
      liveTransformRef.current = false
      setConfirmReset(false)
      // A stale warning ("先选中一个容器" …) must not outlive the action it complained about.
      setHint(undefined)
      setFlash(undefined)
      setSelectionEpoch((n) => n + 1)
      selectElement(hitTest(e.clientX, e.clientY))
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('click', onClick, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Docked layout: while the editor is open the REAL page is INSET (body
  // margin + height) instead of being covered — the app keeps its own area,
  // scrollbars and hover behaviour, and no panel sits on top of it. The two
  // measures come from ResizeObserver so a toolbar that wraps on a narrow window
  // still fits. Everything added here is removed on unmount.
  const barRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  /** The live inset measurement; re-run whenever the layout moves (see the dock effect below). */
  const measureRef = useRef<() => void>(() => {})

  // Publish the dock side where the frame rules read it — ONE attribute on <html> — and remember
  // it.
  //
  // A LAYOUT effect on purpose: the attribute decides which edge the page gives up, so it has to
  // flip inside the same commit that moves the panel. As a passive effect the app would paint one
  // frame with the panel on the new side and the margin still on the old one — a 340px jump — and
  // on mount it would briefly cover the very components this feature exists for. It is also
  // declared before the mount effect below, so the attribute is set when the frame stylesheet
  // lands.
  useLayoutEffect(() => {
    applyDockAttribute(document, dock)
    writeDockSide(browserStorage(), dock)
    measureRef.current()
    pulseWindowDragRecall(document)
  }, [dock])

  // Is the open panel covering something?
  //
  // The app's own layout never is — the page gives up exactly the panel's width — but an element
  // pinned to the window edge (`position: fixed`, which is how a plugin that binds to a side is
  // written) does not move with the body and ends up underneath: the picker cannot reach it and
  // every edit happens out of sight. When that is detected the toolbar offers the one-click fix
  // (dock the other way). Scanned on a slow timer — never per frame — and only while the panel is
  // actually open; the comparison keeps a steady answer from re-rendering the toolbar forever.
  useEffect(() => {
    if (!panelOpen) {
      setOccluded((prev) => (prev.length === 0 ? prev : []))
      return
    }
    let frame = 0
    const scan = (): void => {
      frame = 0
      const panel = panelRef.current
      if (panel === null) return
      const found = occludedBehindPanel(panel.getBoundingClientRect(), document, isOwnElement)
      setOccluded((prev) => (sameElements(prev, found) ? prev : found))
      // Same cadence, same reason: which page is open, and whether the settings dialog is up, are
      // the APP's state — nothing about them re-renders this component. The 『界面显示』 rows and
      // the 「当前界面」 line have to describe the page the user is actually on, or they mislead.
      const nextPage = currentPageSurface(document, pageLabel)
      setPageView((prev) => (prev?.id === nextPage?.id && prev?.label === nextPage?.label ? prev : nextPage))
      if (nextPage !== undefined) {
        setKnownPages((prev) => (prev.some((entry) => entry.id === nextPage.id) ? prev : rememberSurface(browserStorage(), prev, nextPage)))
      }
      const nextSettings = settingsOpen(document)
      setInSettings((prev) => (prev === nextSettings ? prev : nextSettings))
    }
    const schedule = (): void => { if (frame === 0) frame = requestAnimationFrame(scan) }
    const timer = window.setInterval(schedule, 1500)
    schedule()
    return () => {
      window.clearInterval(timer)
      if (frame !== 0) cancelAnimationFrame(frame)
    }
  }, [panelOpen, dock, mode, selectionEpoch])

  useEffect(() => {
    const root = document.documentElement
    const priorStyle = root.getAttribute('style')
    const priorDock = root.getAttribute(DOCK_ATTRIBUTE)
    const shell = readDesktopShell(document)
    const tag = document.createElement('style')
    tag.id = 'dsh-myskin-frame'
    tag.textContent = editorFrameRules(shell).join(String.fromCharCode(10))
    document.head.appendChild(tag)
    // The editor's own look + motion (one owned stylesheet, removed on unmount).
    const unmountUi = mountCanvasUi(document)
    // Electron recollects the window's drag rects only when a computed app-region
    // value changes, and the shell's watcher sees neither a <head> write nor an
    // <html> variable write: pulse once per layout move (no-op off macOS).
    pulseWindowDragRecall(document)
    const measure = (): void => {
      const bar = barRef.current
      const panel = panelRef.current
      root.style.setProperty('--dsh-myskin-inset-top', Math.round(bar === null ? 48 : bar.getBoundingClientRect().height) + 'px')
      // BOTH sides carry the measured width: the frame rules read only the docked one
      // (`--dsh-myskin-inset-x`, see desktop.ts), and writing both keeps the single frame that
      // flips the side correct without waiting for another measurement.
      const width = Math.round(panel === null ? PANEL_WIDTH : panel.getBoundingClientRect().width) + 'px'
      root.style.setProperty('--dsh-myskin-inset-left', width)
      root.style.setProperty('--dsh-myskin-inset-right', width)
    }
    measureRef.current = measure
    measure()
    const observer = new ResizeObserver(measure)
    if (barRef.current !== null) observer.observe(barRef.current)
    if (panelRef.current !== null) observer.observe(panelRef.current)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      unmountUi()
      tag.remove()
      setDrawCursor(document, false)
      // The dock attribute goes back to what it was before the editor opened (normally: absent).
      if (priorDock === null) clearDockAttribute(document)
      else root.setAttribute(DOCK_ATTRIBUTE, priorDock)
      if (priorStyle === null) root.removeAttribute('style')
      else root.setAttribute('style', priorStyle)
      pulseWindowDragRecall(document)
    }
  }, [])

  // Picking cursor over the live page, only while the editor actually picks.
  useEffect(() => {
    setDrawCursor(document, mode === 'edit')
    return () => { setDrawCursor(document, false) }
  }, [mode])

  // Live CSS + background preview: an owned style tag over the real DOM.
  useEffect(() => {
    const rules: string[] = []
    if (draft.canvas.background !== undefined && draft.canvas.background !== '') {
      const opacity = readBackgroundOpacity(draft)
      rules.push(...wallpaperRules(document, draft.canvas.background, surfaceTint(document, opacity, desktopFrameTint(document)), readBackgroundAnchor(draft)))
      rules.push(...backgroundSurfaceRules(document, opacity, desktopFrameTint(document)))
    }
    for (const { selector, rule } of draft.css) {
      if (selector !== '' && rule !== '') rules.push(selector + ' { ' + rule + ' }')
    }
    for (const img of draft.canvas.images) {
      if (img.selector !== '' && img.url !== '') {
        // Same declarations the engine writes for the committed skin — the preview must never tell
        // a different story than saving does. A blend mode needs the page as its backdrop, so it
        // moves the layer above the content; `normal` keeps the picture below the rows and buttons.
        // The engine builds the declaration block; the preview must never tell a different story
        // than saving does — a second copy of this CSS in the editor is how that happened twice.
        // A blend mode needs the page as its backdrop, so it moves the layer above the content;
        // `normal` keeps the picture below the rows and buttons; the feather widens the layer.
        const above = embedPaintsAbove(img, readImageLayer(draft, img.id))
        const feather = readImageFeather(draft, img.id)
        rules.push(embedHostRule(img.selector, above))
        rules.push(img.selector + embedAfterRule(img, above, feather))
      }
    }
    // A control restored from the recycle bin while the COMMITTED document still removes
    // it: dropping the declaration from the draft is not enough, because the committed
    // skin is a second stylesheet with the same selector and keeps saying `display: none`
    // until the next 保存. The natural `display` measured at restore time is emitted here,
    // in the editor's own layer, so the element is visible again right away — and it never
    // reaches the document: entries whose removal is back in the draft are dropped, and
    // the whole map is cleared on 保存 / 应用 / 还原.
    const removedNow = new Set(removedControls(draft.css).map((entry) => entry.selector))
    for (const [selector, display] of Object.entries(restoredLive)) {
      if (!removedNow.has(selector)) rules.push(selector + ' { display: ' + display + ' !important }')
    }
    const d = document
    if (rules.length > 0) {
      if (liveStyleRef.current === null) {
        const tag = d.createElement('style')
        tag.dataset.live = 'dsh-myskin'
        tag.id = DRAFT_STYLE_ID
        d.head.appendChild(tag)
        liveStyleRef.current = tag
      }
      liveStyleRef.current.textContent = rules.join('\n')
    } else if (liveStyleRef.current !== null) {
      liveStyleRef.current.remove()
      liveStyleRef.current = null
    }
  }, [draft.css, draft.canvas.background, draft.canvas.backgroundOpacity, draft.canvas.images, restoredLive])

  /**
   * The draft's images as one string: id, painting mode and anchor.
   *
   * Both preview paths (the tag for 组件嵌入, the overlay for 组件锚定) have to react when any of
   * those CHANGE — a new image, a re-anchor, a mode switch, a removal — but not on every frame
   * of an image drag, which rewrites the images array for each pointer move.
   */
  const imageSignature = draft.canvas.images.map((img) => img.id + '|' + imageModeOf(img) + '|' + anchorKey(anchorOf(img))).join(';')
  /** The ids the 组件锚定 preview layer has to carry (mount key: only a real change remounts). */
  const anchorImageIds = draft.canvas.images.filter((img) => imageModeOf(img) === 'anchor').map((img) => img.id).join(',')

  /**
   * Stamp the DRAFT's 组件嵌入 images onto the real page (and take stale tags off).
   *
   * The stylesheet paints these images through `[data-dsh-myskin-embed="<id>"]`, so the tag IS the
   * identity: it has to exist on whatever node currently plays the container. Reads the draft from
   * a ref rather than from this render's closure because a MutationObserver calls it later.
   */
  const stampDraftImages = (): void => {
    const images = draftRef.current.canvas.images
    // 组件锚定 images are painted by the overlay below, not by a rule on the anchor element:
    // they must NOT carry the tag (an image that switched mode has to give it back).
    const live = new Set(images.filter((img) => imageModeOf(img) === 'embed').map((img) => img.id))
    for (const node of Array.from(document.querySelectorAll('[data-dsh-myskin-embed]'))) {
      const id = node.getAttribute('data-dsh-myskin-embed') ?? ''
      if (!live.has(id)) node.removeAttribute('data-dsh-myskin-embed')
    }
    for (const img of images) {
      if (imageModeOf(img) !== 'embed') continue
      // A 整组 image belongs on EVERY member of its block (and on the members created later —
      // the block is a selector, so a new row is tagged on the next pass).
      const targets = resolveImageTargets(img, document)
      for (const node of Array.from(document.querySelectorAll('[data-dsh-myskin-embed="' + img.id + '"]'))) {
        if (!targets.includes(node)) node.removeAttribute('data-dsh-myskin-embed')
      }
      for (const target of targets) {
        if (target.getAttribute('data-dsh-myskin-embed') !== img.id) target.setAttribute('data-dsh-myskin-embed', img.id)
      }
    }
  }

  // Keep the real page stamped with the DRAFT's anchors while the editor is open.
  //
  // The engine does this for the committed document, but an image the user just anchored (or
  // re-anchored) has to appear in the preview first: that is what makes 「锚定」 something you
  // can see before saving — and what removes the tag from the element an image was just
  // moved away from.
  useEffect(() => {
    stampDraftImages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSignature])

  // …and keep it stamped across React rebuilds.
  //
  // The tag lives on a REAL node, so anything that rebuilds the subtree wipes it — folding the
  // sidebar and unfolding it again is enough. The engine retries that for the committed document,
  // but while the editor owns the tags its loop is skipped (it would revive images the draft just
  // deleted), so the editor owes the same retry. Without it the preview paints nothing after the
  // sidebar folds and unfolds — the exact report, which also explains why the selection box stayed:
  // the container itself never went anywhere.
  //
  // childList/subtree only: the pass writes ATTRIBUTES, so it can never wake itself.
  useEffect(() => {
    let frame = 0
    const pass = (): void => { frame = 0; stampDraftImages() }
    const schedule = (): void => { if (frame === 0) frame = requestAnimationFrame(pass) }
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      if (frame !== 0) cancelAnimationFrame(frame)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 组件锚定 in the preview: the very layer the engine will mount, fed from the live draft.
  // The editor cannot preview these with CSS — being painted outside the component is the
  // point — so the same code runs here, and what the user drags is what saving produces.
  const overlayRef = useRef<ImageOverlay | undefined>(undefined)
  useEffect(() => {
    if (anchorImageIds === '') return
    const overlay = mountImageOverlay(
      () => draftRef.current.canvas.images.filter((img) => imageModeOf(img) === 'anchor'),
      document,
    )
    overlayRef.current = overlay
    return () => { overlay.dispose(); overlayRef.current = undefined }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorImageIds])
  // Numbers change every frame of a drag; the overlay reads them rather than the DOM.
  useEffect(() => { overlayRef.current?.sync() })

  // The draft has to WIN while the editor is open. `applySkin` appends a NEW stylesheet on
  // every accepted settings change, and identical selectors are resolved by document order
  // — after the first 保存 the committed (old) rule sat behind the draft's and pinned the
  // element to its previous coordinates on every drag frame. Re-appending only happens when
  // something actually lands behind the draft's tag, so this costs nothing per frame.
  useEffect(() => {
    const observer = new MutationObserver(() => { keepStylesheetLast(liveStyleRef.current) })
    observer.observe(document.head, { childList: true })
    keepStylesheetLast(liveStyleRef.current)
    return () => { observer.disconnect() }
  }, [])

  // Remove the live style tag, every live text patch, and the draft's embed tags on unmount.
  useEffect(() => () => {
    if (liveStyleRef.current !== null) { liveStyleRef.current.remove(); liveStyleRef.current = null }
    restoreLiveText()
    // The editor tagged the page for the DRAFT — including images the user is now discarding.
    // Closing (✕/Esc) or saving both end here, so the committed document gets the page back:
    // its own images are re-resolved and re-tagged, every other tag is taken off.
    const committed = new Set(committedImagesRef.current.map((img) => img.id))
    for (const node of Array.from(document.querySelectorAll('[data-dsh-myskin-embed]'))) {
      const id = node.getAttribute('data-dsh-myskin-embed') ?? ''
      if (!committed.has(id)) node.removeAttribute('data-dsh-myskin-embed')
    }
    for (const img of committedImagesRef.current) {
      const target = resolveImageAnchor(img, document)
      if (target !== undefined && target.getAttribute('data-dsh-myskin-embed') !== img.id) target.setAttribute('data-dsh-myskin-embed', img.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Resolve a point to the element the canvas would select there.
   *
   * The decision itself lives in the engine ({@link pickElementAt}) because it is
   * pure DOM logic with a real regression behind it: the gray default text of an
   * empty composer is painted `pointer-events: none`, so the browser's own hit test
   * never returns it and clicking it used to select the empty contenteditable
   * behind it — an element with no text to edit.
   * @param clientX - pointer x.
   * @param clientY - pointer y.
   * @returns the element, or undefined when only own UI is under the point.
   */
  const elementAt = (clientX: number, clientY: number): Element | undefined =>
    pickElementAt(Array.from(document.elementsFromPoint(clientX, clientY)), clientX, clientY, isOwnElement)

  const hitTest = (clientX: number, clientY: number): Element | undefined => {
    // Remembered for the child-level button: it re-hit-tests this point on demand.
    lastPointRef.current = { x: clientX, y: clientY }
    return elementAt(clientX, clientY)
  }

  const applyStyle = (selector: string, declaration: string): void => {
    snapshot()
    const rules = draft.css.filter((r) => r.selector !== selector)
    setDraft({ ...draft, css: [...rules, { selector, rule: declaration }] })
  }
  const liveApplyRef = useRef(false)
  const liveTransformRef = useRef(false)
  /**
   * Whether the Inspector's X/Y/scale fields own the transform right now.
   *
   * Set by the panel's own inputs, cleared by a grip gesture and by every mirror update,
   * so a value the panel merely DISPLAYS can never be written back a frame late.
   */
  const transformAuthoredRef = useRef(false)
  /** True while the current run of edits on a whole-app font role owns one undo entry. */
  const roleEditRef = useRef(false)
  const liveApply = (selector: string, declaration: string): void => {
    if (!liveApplyRef.current) { snapshot(); liveApplyRef.current = true }
    // Only the properties the Inspector owns are rewritten; a hidden element (or a
    // hand-written geek rule) keeps its other declarations. Replacing the whole rule
    // here is what used to make a hidden element reappear on the next style tweak.
    //
    // The draft comes from React's own pending state, never from this render's closure:
    // several writers touch the same rule (canvas gestures, text, the Inspector) and a
    // stale base silently reverted whatever the others had just written — the second half
    // of the drag twitch.
    setDraft((prev) => {
      const existing = prev.css.find((r) => r.selector === selector)?.rule
      const merged = withManagedDeclarations(existing, declaration)
      // Nothing actually changed (selecting an element with a saved rule re-emits the same
      // values): stay out of the way instead of dirtying the draft and pushing an undo step.
      if (sameDeclarations(existing, merged)) return prev
      const rest = prev.css.filter((r) => r.selector !== selector)
      return merged === '' ? { ...prev, css: rest } : { ...prev, css: [...rest, { selector, rule: merged }] }
    })
  }
  /**
   * Set or drop ONE declaration on an element's rule.
   *
   * Hiding used to REPLACE the element's whole rule, silently throwing away every
   * other customization it had; merging by property keeps them.
   * @param selector - the element's selector.
   * @param property - CSS property to write.
   * @param value - value to write, or undefined to drop the property.
   */
  const setElementProperty = (selector: string, property: string, value: string | undefined): void => {
    snapshot()
    const existing = draft.css.find((r) => r.selector === selector)?.rule
    const merged = value === undefined
      ? withoutDeclaration(existing, property)
      : mergeDeclaration(existing, property + ': ' + value)
    const rest = draft.css.filter((r) => r.selector !== selector)
    setDraft({ ...draft, css: merged === '' ? rest : [...rest, { selector, rule: merged }] })
  }
  /** Hide a control but keep its layout slot (visibility). */
  const hideElement = (selector: string): void => { setElementProperty(selector, HIDE_PAIR[0], HIDE_PAIR[1]) }
  /** Undo {@link hideElement}. */
  const unhideElement = (selector: string): void => { setElementProperty(selector, HIDE_PAIR[0], undefined) }
  /** Remove a control and reclaim its slot (display: none). */
  const removeControl = (selector: string): void => {
    // Removing it again also takes it out of the bin's "make it visible" overrides.
    setRestoredLive((prev) => {
      if (prev[selector] === undefined) return prev
      const next = { ...prev }
      delete next[selector]
      return next
    })
    setElementProperty(selector, REMOVE_PAIR[0], REMOVE_PAIR[1])
  }
  /**
   * Put removed controls back (the Inspector's button AND the recycle bin).
   *
   * Dropping the declaration is the whole edit only while the removal has never been
   * saved. Once it has, the COMMITTED skin still declares `display: none` under the same
   * selector, so clearing it in the draft would change nothing on screen. The element is
   * therefore measured while both skin stylesheets are off ({@link naturalDisplayOf}) and
   * that value is emitted from the editor's own layer until the removal is gone from the
   * document too — nothing about it reaches the draft.
   * @param selectors - the entries to restore.
   */
  const restoreRemoved = (selectors: readonly string[]): void => {
    if (selectors.length === 0) return
    snapshot()
    // Measured unconditionally rather than "only when the committed document removes it":
    // the document can change under the editor (a 保存 mid-session), and a stale answer
    // would leave the entry looking restored in the list while the page kept it hidden.
    // Where nothing removes it, the emitted value equals what the element already
    // computes to, so the override is a no-op that the next 保存 drops anyway.
    const measured: Record<string, string> = {}
    for (const selector of selectors) {
      const element = safeQuery(selector)
      if (element === null) continue
      const display = naturalDisplayOf(element)
      if (display !== undefined) measured[selector] = display
    }
    if (Object.keys(measured).length > 0) setRestoredLive((prev) => ({ ...prev, ...measured }))
    setDraft((prev) => ({ ...prev, css: selectors.reduce((list, selector) => withControlRestored(list, selector), prev.css) }))
  }
  /** Undo {@link removeControl} for one element (the Inspector's 恢复显示). */
  const restoreControl = (selector: string): void => { restoreRemoved([selector]) }
  /**
   * Text the canvas has already written into the live page (node → original data).
   * The engine applies text only on commit, so without this "edit text" looked like a
   * no-op until 应用; every entry is restored on unmount, revert or reset.
   */
  const textPatches = useRef(new Map<Text | HTMLInputElement, string>())

  /**
   * Write one text override into the live page immediately.
   * @param selector - the target element's selector.
   * @param after - the new text.
   */
  const patchLiveText = (selector: string, after: string): void => {
    const host = document.querySelector(selector)
    if (host === null) return
    if (host.tagName === 'INPUT' || host.tagName === 'TEXTAREA') {
      const field = host as HTMLInputElement
      if (!textPatches.current.has(field)) textPatches.current.set(field, field.placeholder)
      field.placeholder = after
      return
    }
    const node = Array.from(host.childNodes).find((n) => n.nodeType === Node.TEXT_NODE) as Text | undefined
    if (node === undefined) return
    if (!textPatches.current.has(node)) textPatches.current.set(node, node.data)
    node.data = after
  }

  /**
   * Live text preview, under the same "one history entry per gesture" contract as
   * the style fields: the first keystroke snapshots, the rest only update the draft.
   *
   * Text used to be written ONLY by the explicit 编辑文字 button, so typing in the
   * field changed nothing on the page and read as "text cannot be edited".
   * @param selector - the text host's selector.
   * @param before - the original text the override replaces.
   * @param after - the text to show now.
   */
  const liveTextRef = useRef(false)
  /**
   * Write the X/Y/scale the canvas grips produced straight into the draft rule.
   *
   * One snapshot per gesture (like the text and style previews) and no history entry per
   * moved pixel; the caller throttles to one call per frame. An identity transform drops
   * the property instead of pinning `transform: none` onto the element.
   * @param selector - the element's selector.
   * @param x - horizontal offset in px.
   * @param y - vertical offset in px.
   * @param scale - uniform scale.
   */
  const liveTransform = (selector: string, x: number, y: number, scale: number): void => {
    if (!liveTransformRef.current) { snapshot(); liveTransformRef.current = true }
    // `transformEdit` rewrites ONLY the transform: the previous merge dropped every
    // managed property (width, padding, font-size…) and re-added the transform alone, so
    // a dragged element lost them and the Inspector's preview put them back — once per
    // frame. The draft is read from React's pending state so a gesture that spans several
    // renders can never write its stale base over a concurrent edit.
    setDraft((prev) => {
      const existing = prev.css.find((r) => r.selector === selector)?.rule
      const merged = transformEdit(existing, x, y, scale)
      if (sameDeclarations(existing, merged)) return prev
      const rest = prev.css.filter((r) => r.selector !== selector)
      return merged === '' ? { ...prev, css: rest } : { ...prev, css: [...rest, { selector, rule: merged }] }
    })
  }
  const liveText = (selector: string, before: string, after: string): void => {
    if (!liveTextRef.current) { snapshot(); liveTextRef.current = true }
    const rest = draft.text.filter((o) => o.selector !== selector || o.before !== before)
    setDraft({ ...draft, text: [...rest, { selector, before, after }] })
    patchLiveText(selector, after)
  }

  /**
   * Put live text patches back.
   * @param host - only restore patches inside this element; omit to restore all.
   */
  const restoreLiveText = (host?: Element): void => {
    for (const [target, original] of [...textPatches.current]) {
      if (host !== undefined) {
        const owns = target instanceof Text ? host.contains(target) : target === host
        if (!owns) continue
      }
      if (target instanceof Text) { if (target.isConnected) target.data = original }
      else if (target.isConnected) target.placeholder = original
      textPatches.current.delete(target)
    }
  }

  const addText = (selector: string, before: string, after: string): void => {
    snapshot()
    const rest = draft.text.filter((o) => o.selector !== selector || o.before !== before)
    setDraft({ ...draft, text: [...rest, { selector, before, after }] })
    patchLiveText(selector, after)
  }
  /** Drop every text override for one selector (reverts the copy in place). */
  const removeText = (selector: string): void => {
    snapshot()
    setDraft({ ...draft, text: draft.text.filter((o) => o.selector !== selector) })
    restoreLiveText(document.querySelector(selector) ?? undefined)
  }
  const removeSelector = (selector: string): void => {
    snapshot()
    setDraft({
      ...draft,
      css: draft.css.filter((r) => r.selector !== selector),
      text: draft.text.filter((o) => o.selector !== selector),
    })
  }
  /**
   * Register one embedded font.
   *
   * Stored as a normal `css` entry whose selector IS the at-rule
   * ({@link FONT_FACE_SELECTOR}), so the engine needs no new field, the live preview
   * shows the face immediately, and removing the entry un-embeds it.
   * @param family - the generated family name.
   * @param url - the font file as a data URL.
   * @param format - the CSS format keyword for this file.
   */
  const embedFont = (family: string, url: string, format: string): void => {
    snapshot()
    setDraft({ ...draft, css: [...draft.css, { selector: FONT_FACE_SELECTOR, rule: fontFaceRule(family, url, format) }] })
  }
  /** Drop one embedded font (and with it every element that referenced it falls back). */
  const removeFont = (family: string): void => {
    snapshot()
    setDraft({ ...draft, css: draft.css.filter((r) => !(r.selector === FONT_FACE_SELECTOR && r.rule.includes("'" + family + "'"))) })
  }
  /**
   * Set (or clear) one whole-app font role: 界面 / 正文 / 代码.
   *
   * One history entry per editing session instead of per keystroke, like every other field in
   * this panel: the first change of a session snapshots, the rest only update the draft.
   *
   * The write goes through {@link withRoleFont}, which merges by PROPERTY — 界面 and 代码 share
   * the `:root` entry (and so does the background-strength marker), so replacing the entry
   * would silently wipe whichever role was set first.
   * @param role - which role to write.
   * @param value - the family stack, or `''` to clear the role.
   */
  const setRoleFont = (role: FontRole, value: string): void => {
    if (!roleEditRef.current) { snapshot(); roleEditRef.current = true }
    setDraft((prev) => ({ ...prev, css: withRoleFont(prev.css, role, value) }))
  }

  const onEmbedBgFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file === undefined) return
    if (selected === undefined) {
      setHint(t('selectFirst'))
      return
    }
    const target = selected
    void readPickedImage(file).then(({ url, animated, stilled, width, height }) => {
      if (url === '') { setHint(t('applyFailed')); return }
      // Say what happened to an animation: a GIF that quietly lost its movement looks like a bug.
      if (animated) setHint(stilled ? t('gifStilled') : t('gifKept').replace('{n}', dataUrlSize(url)))
      snapshot()
      const id = 'embed-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
      target.setAttribute('data-dsh-myskin-embed', id)
      const img: EmbeddedImage = {
        id,
        selector: '[data-dsh-myskin-embed="' + id + '"]',
        fallbackSelector: selectorOf(target),
        // A brand-new image is anchored to the element the user embedded it on — or, when the
        // panel is in 整组 scope, to the whole block: one picture on every workspace row, now and
        // for the rows created later. The anchor panel can re-point it either way afterwards.
        anchor: scope === 'group' && group !== undefined
          ? { kind: 'group', value: group.selector, label: t(groupLabelKey(group.kind)) }
          : anchorFromElement(target),
        url, x: 0, y: 0, ...embedSizeFor(width, height), opacity: 0.9,
        pageKey: currentSettingsPageKey(target.ownerDocument),
      }
      setDraft({ ...draft, canvas: { ...draft.canvas, images: [...draft.canvas.images, img] } })
    })
  }
  const onPageBgFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file === undefined) return
    void readBoundedImage(file).then(({ url, compressed, animated, stilled }) => {
      if (url === '') { setHint(t('imageTooLarge')); return }
      snapshot()
      setDraft({ ...draft, canvas: { ...draft.canvas, background: url } })
      if (animated) setHint(stilled ? t('gifStilled') : t('gifKept').replace('{n}', dataUrlSize(url)))
      else setHint(compressed ? t('imageCompressed') : undefined)
    })
  }
  /**
   * 对话排版: write the card's rules into the document (one undo step per edit).
   * @param css - the new rule list.
   */
  /**
   * Preview the draft's TOKENS on the page.
   *
   * The editor only ever previewed `css`, so every token edit — markdown typography, a variant's accent,
   * the token panel — did nothing until 「应用」 was pressed. That is why the markdown card looked like it
   * was "not changing anything live" (reported). This applies the draft exactly the way the engine applies
   * the committed document: through the theme registry AND as inline variables (immediate + scheme-correct).
   */
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const tokens = draftRef.current.tokens
    const dark = document.body.hasAttribute('data-ds-dark-theme') || document.documentElement.style.colorScheme === 'dark'
    /** What was on the element BEFORE us, so the cleanup can hand it back. */
    const previous = new Map<string, string>()
    for (const [name, modes] of Object.entries(tokens)) {
      previous.set(name, document.body.style.getPropertyValue(name))
      document.body.style.setProperty(name, dark ? modes.dark : modes.light)
    }
    const dispose = typeof theme.overrideTokens === 'function' ? theme.overrideTokens(PLUGIN_ID, tokens) : undefined
    return () => {
      if (typeof dispose === 'function') dispose()
      // The engine binds the COMMITTED tokens to the very same inline properties: removing ours outright
      // would blank the saved skin until the next apply. Hand back what was there instead.
      for (const [name, before] of previous) {
        if (before === '') document.body.style.removeProperty(name)
        else document.body.style.setProperty(name, before)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenKey, theme])
  /**
   * 层级: put one image above or below its container's content (auto = the blend mode decides).
   * @param id - the image id.
   * @param layer - the layer to store.
   */
  const setImageLayer = (id: string, layer: ImageLayer): void => {
    snapshot()
    setDraft({ ...draft, css: withImageLayer(draft.css, id, layer) })
  }
  /**
   * 边缘晕染: soften one image's edges (width 0 turns it off).
   * @param id - the image id.
   * @param feather - the edge treatment to store.
   */
  const setImageFeather = (id: string, feather: ImageFeather): void => {
    snapshot()
    setDraft({ ...draft, css: withImageFeather(draft.css, id, feather) })
  }
  /**
   * 设置页作用域: keep this image on its own settings page, or let it show on all of them.
   * @param id - the image id.
   * @param own - true = only its own page (the default).
   */
  const setImagePageScope = (id: string, own: boolean): void => {
    snapshot()
    setDraft({ ...draft, css: withImageMarker(draft.css, id, IMAGE_PAGE_SCOPE_PROPERTY, own ? undefined : 'any') })
  }
  const setMarkdownSkin = (next: SkinSettings): void => {
    snapshot()
    setDraft(next)
  }
  /**
   * Switch where the wallpaper is anchored (see {@link BackgroundAnchor}).
   *
   * Stored as a marker declaration inside `css` rather than a `canvas` field: the running Host may
   * be older than this build, and an unknown `canvas` field would be dropped on save (the whole
   * point of the marker convention).
   * @param anchor - the anchor to store.
   */
  const setBackgroundAnchor = (anchor: BackgroundAnchor): void => {
    snapshot()
    const css = withBackgroundAnchor(draft.css, anchor)
    setDraft({ ...draft, css })
    // Persisted on the spot, like the strength slider: the setting is only observable in 交互模式
    // (that is where the sidebar folds), and 交互模式 paints the COMMITTED document — a draft-only
    // toggle would silently disappear the moment the user goes to look at it.
    schedulePersistStrength(draft.canvas, css)
  }
  const clearPageBg = (): void => {
    snapshot()
    setDraft({ ...draft, canvas: { ...draft.canvas, background: undefined } })
  }
  const setEmbedLive = (id: string, patch: Partial<EmbeddedImage>): void => {
    setDraft({ ...draft, canvas: { ...draft.canvas, images: draft.canvas.images.map((img) => img.id === id ? { ...img, ...patch } : img) } })
  }
  const updateEmbed = (id: string, patch: Partial<EmbeddedImage>): void => {
    snapshot()
    setEmbedLive(id, patch)
  }
  const removeEmbed = (id: string): void => {
    snapshot()
    setDraft({ ...draft, canvas: { ...draft.canvas, images: draft.canvas.images.filter((img) => img.id !== id) } })
  }
  const onEmbedPointerDown = (e: ReactPointerEvent, img: EmbeddedImage): void => {
    e.preventDefault()
    snapshot()
    const startX = e.clientX, startY = e.clientY, ox = img.x, oy = img.y
    beginPointerDrag(e, (ev) => { setEmbedLive(img.id, { x: ox + (ev.clientX - startX), y: oy + (ev.clientY - startY) }) })
  }
  /**
   * X/Y move and uniform scale, dragged from the grips on the selection box.
   *
   * One draft update per frame (rAF-coalesced) with a single history snapshot per
   * gesture; the panel's X/Y/scale fields follow through their rule-sync effect. The
   * grip is 20px on the corner, so it never blocks picking the element itself.
   * @param e - the grip's pointerdown.
   * @param kind - 'move' drags both axes, 'scale' scales uniformly from the diagonal.
   */
  const transformDrag = (e: ReactPointerEvent, kind: 'move' | 'scale'): void => {
    const el = selected
    if (el === undefined) return
    e.preventDefault()
    e.stopPropagation()
    // The grip is the writer for the rest of this gesture: the panel's fields become a
    // pure readout, so their (one render older) numbers can never be echoed back.
    transformAuthoredRef.current = false
    // A drag follows the panel's scope: in 整组 the whole block moves together, exactly like
    // typing a number into the X field would.
    const selector = activeSelector !== '' ? activeSelector : selectorOf(el)
    const base = parseTransform(draft.css.find((r) => r.selector === selector)?.rule)
    const rect = el.getBoundingClientRect()
    const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    const startX = e.clientX
    const startY = e.clientY
    const reach = Math.max(24, rect.width + rect.height)
    // Alignment lines are collected ONCE per gesture: the element is moved with
    // `transform`, which never reflows the page, so no target can move under the drag.
    const targets = snapOn ? snapTargetsFor(el, isOwnElement) : { x: [], y: [] }
    let frame = 0
    let pending: { x: number; y: number; scale: number } | undefined
    liveTransformRef.current = false
    const flush = (): void => {
      frame = 0
      const next = pending
      pending = undefined
      if (next !== undefined) liveTransform(selector, next.x, next.y, next.scale)
    }
    beginPointerDrag(e, (ev) => {
      if (kind === 'move') {
        let x = base.x + (ev.clientX - startX)
        let y = base.y + (ev.clientY - startY)
        // Alt (or the toolbar toggle) suspends the magnet for this gesture.
        if (snapOn && !ev.altKey) {
          const box = { left: rect.left + (x - base.x), top: rect.top + (y - base.y), width: rect.width, height: rect.height }
          const snap = snapMove(box, targets, SNAP_THRESHOLD)
          x += snap.dx
          y += snap.dy
          setGuides(snap.lines)
        } else setGuides([])
        pending = { x, y, scale: base.scale }
      } else {
        let scaleValue = clampNum(base.scale * (1 + ((ev.clientX - startX) + (ev.clientY - startY)) / reach), 0.2, 3)
        if (snapOn && !ev.altKey && base.scale > 0) {
          // The centre is fixed while scaling, so the box for the candidate scale is
          // symmetric around the gesture's centre.
          const width = rect.width * (scaleValue / base.scale)
          const height = rect.height * (scaleValue / base.scale)
          const box = { left: center.x - width / 2, top: center.y - height / 2, width, height }
          const snap = snapScale(box, scaleValue, targets, SNAP_THRESHOLD)
          scaleValue = clampNum(snap.scale, 0.2, 3)
          setGuides(snap.lines)
        } else setGuides([])
        pending = { x: base.x, y: base.y, scale: scaleValue }
      }
      if (frame === 0) frame = requestAnimationFrame(flush)
    })
    // The last frame must still land after the pointer is released.
    const finish = (): void => {
      if (frame !== 0) cancelAnimationFrame(frame)
      flush()
      setGuides([])
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
    }
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
  }
  const startEmbedResize = (e: ReactPointerEvent, img: EmbeddedImage): void => {
    e.preventDefault()
    snapshot()
    const startW = img.w, startH = img.h, sx = e.clientX, sy = e.clientY
    beginPointerDrag(e, (ev) => { setEmbedLive(img.id, { w: Math.max(24, startW + (ev.clientX - sx)), h: Math.max(24, startH + (ev.clientY - sy)) }) })
  }

  const setToken = (name: string, light: string, dark: string): void => {
    snapshot()
    setDraft({ ...draft, tokens: { ...draft.tokens, [name]: { light, dark } } })
  }
  const toggleToken = (name: string, on: boolean): void => {
    if (on) {
      const cur = getComputedStyle(document.body).getPropertyValue(name).trim() || '#808080'
      snapshot()
      setDraft({ ...draft, tokens: { ...draft.tokens, [name]: { light: cur, dark: cur } } })
    } else {
      snapshot()
      const tokens = { ...draft.tokens }
      delete tokens[name]
      setDraft({ ...draft, tokens })
    }
  }

  const resetDraft = (): void => { snapshot(); setDraft(parseSkin(EMPTY_SKIN)); setSelected(undefined); setRestoredLive({}); restoreLiveText() }
  /**
   * 保存: write the draft into the skin document and KEEP editing.
   *
   * 应用 performs the same write and then leaves the editor. They used to be one button,
   * so "persist my work, keep tweaking" was impossible — the only other exit (✕) closes
   * as well. `enabled` is deliberately left exactly as the document had it: saving must
   * not switch a deliberately disabled skin on behind the user's back (应用 does that).
   */
  const saveDraft = (): void => {
    setHint(undefined)
    setFlash(undefined)
    setSave({ state: 'saving' })
    void onSave({ ...draft }).then((report) => {
      // The document now says the same thing as the draft: the transient "make it visible
      // again" overrides for restored controls have done their job.
      if (report.ok) {
        committedImagesRef.current = draft.canvas.images
        setRestoredLive({})
        setSave({ state: 'saved' })
        setFlash(t('savedHint'))
        return
      }
      const detail = saveFailureText(report, t, draft.canvas)
      setSave({ state: 'failed', detail })
      setHint(detail)
    })
  }
  const onApply = (): void => {
    setHint(undefined)
    setFlash(undefined)
    setSave({ state: 'saving' })
    void onCommit({ ...draft, enabled: true }).then((report) => {
      if (report.ok) { committedImagesRef.current = draft.canvas.images; setRestoredLive({}); setSave({ state: 'saved' }); return }
      const detail = saveFailureText(report, t, draft.canvas)
      setSave({ state: 'failed', detail })
      setHint(detail)
    })
  }
  /**
   * Close the editor and DISCARD everything that was not written.
   *
   * This used to save first ("✕ means keep"), which quietly wrote a half-finished draft into
   * the skin document — the opposite of what a close button is for, and a nasty surprise when
   * the draft was an experiment. 保存 and 应用 are the explicit commit doors; ✕ (and Esc) now
   * mean "leave, change nothing", and every live edit is reverted on unmount.
   */
  const closeDiscarding = (): void => { onClose() }

  // Latest selection / close action for the document-level key handler. The handler is
  // registered once (a capture-phase listener re-added on every keystroke is pointless
  // churn); the refs are what keep it from acting on a stale selection or draft.
  useEffect(() => { selectedRef.current = selected }, [selected])
  useEffect(() => { closeRef.current = closeDiscarding })

  /**
   * Select an element — and leave image editing, because the canvas shows ONE selection at a time.
   * @param el - the element to select (undefined clears the selection, e.g. a click on nothing).
   */
  const selectElement = (el: Element | undefined): void => {
    setSelectedImage(undefined)
    setSelected(el)
    // Picking on the canvas follows the object picked: the panel shows that kind of edit.
    setPanelTab('component')
  }

  /** Select the nearest selectable ancestor of the current selection (父级 / Alt+↑). */
  const selectParent = (): void => {
    const el = selectedRef.current
    if (el === undefined) return
    const parent = parentTarget(el, isOwnElement)
    if (parent !== undefined) selectElement(parent)
  }
  /** Select the direct child under the last click (子级 / Alt+↓). */
  const selectChild = (): void => {
    const el = selectedRef.current
    if (el === undefined) return
    const point = lastPointRef.current ?? centerOf(el)
    if (point === undefined) return
    const stack = Array.from(document.elementsFromPoint(point.x, point.y))
    const child = childTargetIn(stack, el, isOwnElement)
    if (child !== undefined) selectElement(child)
  }

  /**
   * Hover highlight: show what a click would select BEFORE clicking.
   *
   * Uses the very same picker as the click, so the dashed outline can never promise a
   * different element than the click delivers. Throttled to one hit test per frame —
   * elementsFromPoint on every pointermove would be wasteful.
   */
  useEffect(() => {
    if (mode !== 'edit') { setHover(undefined); return }
    let frame = 0
    let pending: { x: number; y: number } | undefined
    const flush = (): void => {
      frame = 0
      const point = pending
      pending = undefined
      if (point === undefined) return
      setHover(elementAt(point.x, point.y))
    }
    const onMove = (e: PointerEvent): void => {
      if (e.target instanceof Element && isOwnElement(e.target)) pending = undefined
      else pending = { x: e.clientX, y: e.clientY }
      if (pending === undefined) { setHover(undefined); return }
      if (frame === 0) frame = requestAnimationFrame(flush)
    }
    const onLeave = (): void => { pending = undefined; setHover(undefined) }
    document.addEventListener('pointermove', onMove, true)
    document.addEventListener('pointerleave', onLeave, true)
    return () => {
      document.removeEventListener('pointermove', onMove, true)
      document.removeEventListener('pointerleave', onLeave, true)
      if (frame !== 0) cancelAnimationFrame(frame)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  /**
   * Keyboard shortcuts for drawing.
   *
   * Text fields keep every key they need: the handler stands down whenever the focused
   * element is an input, a textarea or a contenteditable, so panel typing (and the
   * app itself in interact mode) is never hijacked.
   */
  useEffect(() => {
    const editing = (target: EventTarget | null): boolean =>
      target instanceof HTMLElement
      && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    const onKey = (e: KeyboardEvent): void => {
      if (editing(e.target)) return
      const mod = e.ctrlKey || e.metaKey
      // In interact mode the page owns the keyboard: only Escape (leave the editor) stays ours.
      if (mode === 'edit') {
        if (mod && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return }
        if (mod && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); redo(); return }
        if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); selectParent(); return }
        if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); selectChild(); return }
      }
      if (e.key === 'Escape') {
        // An upstream dialog owns Escape while it is open: let it close first.
        if (document.querySelector('[data-shortcut-modal], [aria-modal="true"]') !== null) return
        e.preventDefault()
        // First Escape drops whatever is selected — an image first, then a component — and the one
        // after that leaves the editor (discarding). One selection at a time, one Escape each.
        if (selectedImageRef.current !== undefined) { setSelectedImage(undefined); return }
        if (selectedRef.current !== undefined) { setSelected(undefined); return }
        closeRef.current()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => { document.removeEventListener('keydown', onKey, true) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Debounced auto-save for the strength slider: the value must survive a refresh
  // even when the user never presses 应用.
  const strengthTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => { if (strengthTimer.current !== undefined) window.clearTimeout(strengthTimer.current) }, [])
  const schedulePersistStrength = (canvas: SkinCanvas, css: CssRule[]): void => {
    if (strengthTimer.current !== undefined) window.clearTimeout(strengthTimer.current)
    strengthTimer.current = window.setTimeout(() => {
      strengthTimer.current = undefined
      void onPersistStrength(canvas, css).then((report) => {
        if (report.ok) { setSave({ state: 'saved' }); return }
        const detail = saveFailureText(report, t, canvas)
        setSave({ state: 'failed', detail })
        setHint(detail)
      })
    }, 400)
  }

  /**
   * The other elements the active scope covers.
   *
   * 整组 / 全站 have to be VISIBLE on the page, not just a segmented control in the panel: every
   * other member gets an outline, so "this edit covers these" is something the user can see before
   * changing anything. A 全站 identity can name dozens of elements, so the outlines stop at a
   * screenful — the count on the scope button carries the rest.
   */
  const scopeSelector = scope === 'group' ? group?.selector : scope === 'site' ? siteScope?.selector : undefined
  const groupPeers = scopeSelector === undefined
    ? []
    : Array.from(document.querySelectorAll(scopeSelector)).filter((el) => el !== selected && el.isConnected).slice(0, PEER_OUTLINE_MAX)
  const selRect = selected !== undefined && selected.isConnected ? selected.getBoundingClientRect() : null
  // The dashed hover outline is skipped while the pointer is on the selection itself
  // (the solid box is already there) and dies with a node React replaced.
  const hoverRect = mode === 'edit' && hover !== undefined && hover !== selected && hover.isConnected ? hover.getBoundingClientRect() : null
  /**
   * Whether the ELEMENT chrome (selection box, grips, block outlines, hover outline) is drawn.
   *
   * An image takes the selection over completely: while one is being edited the page shows exactly
   * one box — the image's — instead of the element's selection underneath it. The element selection
   * itself is kept (it is what 「用选中元素」/「取选中文字」 act on); only its chrome steps aside.
   */
  const elementChrome = mode === 'edit' && selectedImage === undefined
  /** The selected image's record, when it still exists in the draft. */
  const selectedImageData = selectedImage === undefined ? undefined : draft.canvas.images.find((img) => img.id === selectedImage)
  /** Where the selected image currently lands (for the header card's label and 「选中容器」). */
  const selectedImageHost = selectedImageData === undefined ? undefined : resolveImageAnchor(selectedImageData, document)
  /**
   * Why the selected image may not be visible.
   *
   * Computed for the SELECTED image only: each verdict costs a handful of hit tests, and the answer is
   * only worth anything for the picture the user is looking at.
   */
  const imageDiag: ImageDiagnosis | undefined = selectedImageData === undefined
    ? undefined
    : diagnoseEmbeddedImage(selectedImageData, document, embedPaintsAbove(selectedImageData, readImageLayer(draft, selectedImageData.id)), 3, readImageFeather(draft, selectedImageData.id).width, (selectedImageData.pageKey ?? '') !== '' && !imagePageMatches(draft, selectedImageData, currentSettingsPageKey(document)))
  /** Save chip colour: grey when clean, amber when dirty, red when the write failed. */
  const saveColor = save.state === 'failed' ? tok.error : save.state === 'dirty' ? tok.warn : tok.labelTertiary
  /** The fold button points at the panel: toward it while it is open, away while it is folded. */
  const panelArrow = (dock === 'right') === panelOpen ? '›' : '‹'
  /** The dock button offers the OTHER side, which is the fix when something is hidden behind this one. */
  const dockTarget = otherDock(dock)
  /**
   * The block anchor offered to the images card, when the selection belongs to a block.
   *
   * 「整组」 as an anchor means one picture on EVERY member of the block (and on the members created
   * later) — the anchor panel points an image at it either way.
   */
  const groupAnchor: ImageAnchor | undefined = scope === 'group' && group !== undefined
    ? { kind: 'group', value: group.selector, label: t(groupLabelKey(group.kind)) }
    : undefined
  /** The settings surface as the 『界面显示』 card names it (label comes from the active locale). */
  const settingsView = settingsSurface(t('viewSettings'))
  /**
   * Every surface the 『界面显示』 card can name: the settings dialog, the page on screen, then the
   * pages visited before. Capped so a long history cannot push the rest of the panel away.
   */
  const surfaces: Surface[] = [settingsView]
  if (pageView !== undefined) surfaces.push(pageView)
  for (const known of knownPages) {
    if (surfaces.length >= MAX_SURFACE_ROWS || surfaces.some((entry) => entry.id === known.id)) continue
    surfaces.push(known)
  }
  /** Name of the topmost element the panel is covering, or '' when nothing is (see occlusion.ts). */
  const occludedLabel = occluded.length === 0 ? '' : shortLabel(elementLabel(occluded[0]))

  return (
    <div data-dsh-myskin-ui="1" data-dsh-myskin-canvas="1" style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', color: tok.labelPrimary }}>
      <div ref={barRef} className="dsh-myskin-bar" data-dsh-myskin-ui="1" style={{ pointerEvents: 'auto', position: 'absolute', top: 'var(--dsh-myskin-chrome-top, 0px)', left: 0, right: 0, background: tok.bgOverlay, borderBottom: '1px solid var(--dsw-alias-border-l1)', zIndex: 10005, color: tok.labelPrimary, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, flexWrap: 'wrap', padding: '6px 16px 6px var(--dsh-myskin-leading, 16px)' }}>
          <IconPersonalization size={16} />
          <span style={{ fontSize: 14, lineHeight: '22px', fontWeight: 500, whiteSpace: 'nowrap' }}>{t('title')} — {t('edit')}</span>
          <span style={{ display: 'inline-flex', border: '1px solid ' + tok.borderL2, borderRadius: 8, overflow: 'hidden' }} title={t('modeHint')}>
            <Button size="sm" variant={mode === 'edit' ? 'primary' : 'ghost'} onClick={() => { setMode('edit') }} title={t('editHint')}>{t('selectMode')}</Button>
            <Button size="sm" variant={mode === 'interact' ? 'primary' : 'ghost'} onClick={() => { setMode('interact') }} title={t('interactHint')}>{t('interactMode')}</Button>
          </span>
          <Button size="sm" variant="ghost" onClick={undo} disabled={pastRef.current.length === 0} title={t('undoHint')}>↶ {t('undo')}</Button>
          <Button size="sm" variant="ghost" onClick={redo} disabled={futureRef.current.length === 0} title={t('redoHint')}>↷ {t('redo')}</Button>
          <span className="dsh-myskin-sep" />
          <span style={{ flex: 1 }} />
          <Button style={btnBase} size="sm" variant="ghost" icon={<IconPlus size={16} />} onClick={() => { if (selected === undefined) setHint(t('selectFirst')); else embedBgRef.current?.click() }} title={t('embedImageHint')}>{t('embedImage')}</Button>
          <Button style={btnBase} size="sm" variant="ghost" icon={<IconPlus size={16} />} onClick={() => { pageBgRef.current?.click() }}>{t('backgroundImage')}</Button>
          {draft.canvas.background !== undefined && draft.canvas.background !== '' ? (
            <Button style={btnBase} size="sm" variant="ghost" onClick={clearPageBg}>{t('clearBackground')}</Button>
          ) : null}
          <span className="dsh-myskin-sep" />
          <Button style={btnBase} size="sm" variant={snapOn ? 'primary' : 'ghost'} onClick={() => { setSnapOn(!snapOn) }} title={t('snapHint')}>{t('snapAlign')}</Button>
          <Button style={btnBase} size="sm" variant={showTokens ? 'primary' : 'ghost'} onClick={() => { setShowTokens(!showTokens) }}>{t('tokenPanel')}</Button>
          <Button style={btnBase} size="sm" variant={panelOpen ? 'ghost' : 'primary'} onClick={() => { setPanelOpen(!panelOpen) }} title={panelOpen ? t('panelHideHint') : t('panelShowHint')}>{panelArrow} {t('panelLabel')}</Button>
          <Button style={btnBase} size="sm" variant="ghost" onClick={() => { setDock(dockTarget) }} title={dockTarget === 'left' ? t('dockLeftHint') : t('dockRightHint')}>{dockTarget === 'left' ? '⇤ ' : '⇥ '}{dockTarget === 'left' ? t('dockLeft') : t('dockRight')}</Button>
          <span className="dsh-myskin-sep" />
          <span title={save.state === 'failed' ? (save.detail ?? t('saveFailed')) : t('saveHint')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 9px', borderRadius: 999, border: '1px solid ' + tok.borderL2, background: tok.bgLayer2, fontSize: 12, lineHeight: '18px', whiteSpace: 'nowrap', color: saveColor }}>
            <span className="dsh-myskin-dot" data-state={save.state} style={{ width: 8, height: 8, borderRadius: '50%', background: saveColor, flex: 'none' }} />
            {save.state === 'dirty' ? t('unsaved') : save.state === 'saving' ? t('saving') : save.state === 'failed' ? t('saveFailed') + (save.detail ?? '') : t('savedOk')}
          </span>
          <Button style={btnBase} size="sm" variant="outline" onClick={saveDraft} title={t('saveHint')}>{t('saveDraft')}</Button>
          <Button style={btnBase} size="sm" onClick={onApply} title={t('applyHint')}>{t('apply')}</Button>
          {confirmReset ? (
            <>
              <span style={{ fontSize: 12, lineHeight: '18px', whiteSpace: 'nowrap', color: tok.warn }}>{t('resetConfirm')}</span>
              <Button style={btnBase} size="sm" variant="outline" onClick={() => { setConfirmReset(false); resetDraft() }}>{t('confirm')}</Button>
              <Button style={btnBase} size="sm" variant="ghost" onClick={() => { setConfirmReset(false) }}>{t('cancel')}</Button>
            </>
          ) : (
            <Button style={btnBase} size="sm" variant="ghost" icon={<IconTrash size={14} />} onClick={() => { setConfirmReset(true) }} title={t('resetHint')}>{t('reset')}</Button>
          )}
          <Button style={btnBase} size="sm" variant="ghost" icon={<IconClose size={16} />} onClick={closeDiscarding} title={t('closeHint')}>{t('close')}</Button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 6px var(--dsh-myskin-leading, 16px)', fontSize: 12, lineHeight: '18px', color: hint !== undefined ? tok.warn : flash !== undefined ? tok.success : tok.labelTertiary }}>
          <span key={hint ?? flash ?? 'idle'} className={hint !== undefined || flash !== undefined ? 'dsh-myskin-warn' : undefined} style={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hint ?? flash ?? (mode === 'edit' ? t('editHint') : t('interactHint'))}</span>
          {/* Something is pinned to the window edge and the panel is sitting on it: the fix is one
              click, and it is offered right here rather than in a manual nobody reads. */}
          {occluded.length > 0 ? (
            <button type="button" data-dsh-myskin-ui="1" className="dsh-myskin-chip" onClick={() => { setDock(dockTarget) }} title={t('occludedHint')}
              style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999, border: '1px solid ' + tok.warn, background: tok.bgLayer2, color: tok.warn, fontSize: 12, lineHeight: '18px', whiteSpace: 'nowrap', cursor: 'pointer' }}>
              ⚠ {t('occludedWarn').replace('{n}', occludedLabel)} · {dockTarget === 'left' ? t('dockLeft') : t('dockRight')}
            </button>
          ) : null}
          <span style={{ flex: 'none', color: tok.labelTertiary }}>{t('shortcuts')}</span>
        </div>
      </div>
      {/* The panel sits on the docked edge and keeps its hairline divider on the side facing the
          page: everything that is not the inset (position, border, the fold animation, the shadow
          in canvas-ui.ts) follows `dock`, so the two layouts cannot drift apart. */}
      <div ref={panelRef} className="dsh-myskin-panel dsh-myskin-scroll" data-open={panelOpen ? '1' : '0'} data-dsh-myskin-ui="1" style={{ pointerEvents: panelOpen ? 'auto' : 'none', visibility: panelOpen ? 'visible' : 'hidden', position: 'absolute', top: 'calc(var(--dsh-myskin-chrome-top, 0px) + var(--dsh-myskin-inset-top, 48px))', ...(dock === 'right' ? { right: 0 } : { left: 0 }), bottom: 0, width: panelOpen ? PANEL_WIDTH : 0, display: 'flex', flexDirection: 'column', gap: 12, overflowX: 'hidden', overflowY: 'auto', padding: panelOpen ? 12 : 0, background: panelOpen ? tok.bgOverlay : 'transparent', borderLeft: panelOpen && dock === 'right' ? '1px solid ' + tok.borderL2 : 'none', borderRight: panelOpen && dock === 'left' ? '1px solid ' + tok.borderL2 : 'none', zIndex: 10004 }}>
        {mode === 'edit' && panelTab === 'look' && draft.canvas.background !== undefined && draft.canvas.background !== '' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: tok.labelSecondary }}>
            <span>{t('backgroundOpacity')} · {Math.round(readBackgroundOpacity(draft) * 100)}%</span>
            <input
              type="range" min={0.35} max={1} step={0.05}
              value={readBackgroundOpacity(draft)}
              onPointerDown={() => { snapshot() }}
              onChange={(e) => {
                const opacity = Number(e.target.value)
                const canvas = { ...draft.canvas, backgroundOpacity: opacity }
                const css = withBackgroundOpacity(draft.css, opacity)
                setDraft({ ...draft, canvas, css })
                schedulePersistStrength(canvas, css)
              }}
            />
          </label>
          {/*
            可选项：壁纸锚在对话区自己的框上（侧边栏展开/收起时重新居中，不需要脚本）。
            它必须有自己的 label：套在滑块那个 label 里时，点这一行会去激活滑块（label 的第一个可标记控件），
            开关根本没被切换——而且嵌套 label 本身就不合法。
          */}
          <label className="dsh-myskin-field" style={{ gap: 6, alignItems: 'flex-start', cursor: 'pointer' }}>
            <input type="checkbox" checked={readBackgroundAnchor(draft) === 'conversation'}
              onChange={(e) => { setBackgroundAnchor(e.target.checked ? 'conversation' : 'viewport') }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 11, lineHeight: '16px', color: tok.labelSecondary }}>
              {t('backgroundAnchor')}
              <br />
              <span style={{ color: tok.labelTertiary }}>{t('backgroundAnchorHint')}</span>
            </span>
          </label>
          </div>
        ) : null}
          {/* 五类编辑各自一个页签：不同类型不再挤在同一条滚动里。 */}
          {mode === 'edit' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', border: '1px solid ' + tok.borderL2, borderRadius: 8, overflow: 'hidden' }}>
                  {PANEL_TABS.map((entry) => (
                    <Button key={entry} size="sm" variant={panelTab === entry ? 'primary' : 'ghost'} title={t('tabHint')}
                      onClick={() => { setPanelTab(entry) }}>
                      {t(PANEL_TAB_LABEL[entry] as MySkinKey)}
                      {entry === 'image' && draft.canvas.images.length > 0 ? ' ' + String(draft.canvas.images.length) : ''}
                      {entry === 'text' && draft.text.length > 0 ? ' ' + String(draft.text.length) : ''}
                    </Button>
                  ))}
                </span>
              </div>
            </div>
          ) : null}
          {mode === 'edit' && panelTab === 'component' ? (
            selected !== undefined ? (
              <Inspector
                target={selected}
                draft={draft}
                onSample={liveApply}
                onReplaceStyle={applyStyle}
                onText={addText}
                onLiveText={liveText}
                onRemoveText={removeText}
                onRemove={removeSelector}
                onHide={hideElement}
                onUnhide={unhideElement}
                onRemoveControl={removeControl}
                onRestoreControl={restoreControl}
                onSelectParent={selectParent}
                onSelectChild={selectChild}
                onEmbedFont={embedFont}
                onRemoveFont={removeFont}
                activeSelector={activeSelector}
                group={group}
                site={site}
                settingsView={settingsView}
                pageView={pageView}
                surfaces={surfaces}
                inSettings={inSettings}
                onSurfaceHidden={setSurfaceVisibility}
                onKeepOnly={keepOnlySurface}
                onHideEverywhere={hideEverywhere}
                onRestoreAllHidden={restoreAllHidden}
                onAddDeclaration={addDeclaration}
                scope={scope}
                onScope={changeScope}
                gapSelector={gapSelector}
                gap={gap}
                onGap={setGap}
                onGapEnd={() => { gapEditRef.current = false }}
                onRoleFont={setRoleFont}
                onRoleFontEnd={() => { roleEditRef.current = false }}
                transformAuthored={transformAuthoredRef}
                t={t}
              />
            ) : (
              <div className="dsh-myskin-empty">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: tok.labelSecondary }}>
                  <IconPersonalization size={16} />
                  <strong style={{ fontSize: 13, lineHeight: '20px', fontWeight: 500 }}>{t('emptyTitle')}</strong>
                </span>
                <span>{t('noSelection')}</span>
                <span>{t('emptySteps')}</span>
                <span style={{ color: tok.labelTertiary }}>{t('shortcuts')}</span>
              </div>
            )
          ) : mode === 'edit' ? null : (
            /* 交互模式下没有页签：面板只留一句提示（页面自己的键盘与鼠标都归 DSH）。 */
            <span style={{ fontSize: 12, lineHeight: '18px', color: tok.labelTertiary }}>{t('interactHint')}</span>
          )}
        {/* 图片页签：选中的那张 + 全部图片（每张一个面板）。 */}
        {mode === 'edit' && panelTab === 'image' ? (
          <>
            {selectedImageData !== undefined ? (
              /* 选中的图片：和选中组件同级——画布上只有这一个框，面板这里也只显示它。 */
              <div className="dsh-myskin-card" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 10 }}>
                <span style={{ fontSize: 12, lineHeight: '18px', color: tok.labelSecondary }}>{t('imageSelected')}</span>
                <span style={{ fontSize: 12, lineHeight: '18px', color: tok.labelPrimary, wordBreak: 'break-word' }}>
                  {selectedImageHost === undefined ? anchorLabel(anchorOf(selectedImageData), t) : elementLabel(selectedImageHost, 40)}
                </span>
                <span style={{ fontSize: 11, lineHeight: '16px', color: selectedImageHost === undefined ? tok.warn : tok.success }}>
                  {selectedImageHost === undefined ? t('anchorMissing') : t('anchorOk') + ' · ' + anchorLabel(anchorOf(selectedImageData), t)}
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Button style={btnBase} size="sm" variant="outline" disabled={selectedImageHost === undefined}
                    onClick={() => { if (selectedImageHost !== undefined) { selectElement(selectedImageHost); setSelectionEpoch((n) => n + 1) } }}>{t('selectHost')}</Button>
                  <Button style={btnBase} size="sm" variant="ghost" onClick={() => { setSelectedImage(undefined) }}>{t('deselect')}</Button>
                </div>
                {/* 为什么看不见：三种成因分开报，用户才不会去修错的地方。 */}
                <span style={{ fontSize: 11, lineHeight: '16px', color: imageDiag !== undefined && imageDiag.verdict === 'ok' ? tok.success : tok.warn }}>
                  {t(imageDiagKey(imageDiag))}
                </span>
                <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('imageSelectedHint')}</span>
              </div>
            ) : null}
          </>
        ) : null}
        {/* 变体：整套观感用选项拼出来，不需要写 CSS。 */}
        {mode === 'edit' && panelTab === 'variant' ? (
          <VariantPanel draft={draft} onChangeSkin={setMarkdownSkin} t={t} />
        ) : null}
        {/* 区域外观：整块改一个面（对话区/侧边栏/输入框/设置页/消息列表）。 */}
        {mode === 'edit' && panelTab === 'region' ? (
          <RegionPanel draft={draft} onChangeSkin={setMarkdownSkin} t={t} />
        ) : null}
        {/* 对话排版：DSH 生成的 markdown（锚点取渲染器自己的根元素，不写死构建哈希）。 */}
        {mode === 'edit' && panelTab === 'markdown' ? (
          <MarkdownPanel draft={draft} onChangeSkin={setMarkdownSkin} t={t} />
        ) : null}
        {/* 文字：所有改过的文案，一处一份，不必回到页面上找。 */}
        {mode === 'edit' && panelTab === 'text' ? (
          <TextPanel
            draft={draft}
            onEdit={liveText}
            onRemove={removeText}
            onSelect={(selector) => { const el = safeQuery(selector); if (el !== null) selectElement(el) }}
            t={t}
          />
        ) : null}
        {/* 嵌入图片：设置独立成卡，不依赖当前选中——不必先找到它嵌在哪儿。 */}
        {mode === 'edit' && panelTab === 'image' ? (
          <EmbedImages
            draft={draft}
            target={selected}
            groupAnchor={groupAnchor}
            onAnchor={(id, anchor) => { updateEmbed(id, { anchor }) }}
            onMode={(id, mode) => { updateEmbed(id, { mode }) }}
            onOpacity={(id, value) => { updateEmbed(id, { opacity: clampNum(value, 0, 1) }) }}
            onBlend={(id, value) => { updateEmbed(id, { blend: value }) }}
            onGeometry={(id, patch) => { updateEmbed(id, patch) }}
            onLayer={setImageLayer}
            onFeather={setImageFeather}
            onPageScope={setImagePageScope}
            onRemove={removeEmbed}
            selectedImage={selectedImage}
            onSelectImage={setSelectedImage}
            onSelectHost={(el) => { selectElement(el); setSelectionEpoch((n) => n + 1) }}
            t={t}
          />
        ) : null}
        {mode === 'edit' && panelTab === 'component' ? (
          <RecycleBin
            entries={removedControls(draft.css)}
            onRestore={(selector) => { restoreRemoved([selector]) }}
            onRestoreAll={() => { restoreRemoved(removedControls(draft.css).map((entry) => entry.selector)) }}
            t={t}
          />
        ) : null}
        {mode === 'edit' && panelTab === 'look' && showTokens ? (
          <TokenPanel tokens={draft.tokens} onToggle={toggleToken} onChange={setToken} t={t} />
        ) : null}
      </div>
      <input ref={embedBgRef} type="file" accept="image/*" multiple={false} style={{ display: 'none' }} onChange={onEmbedBgFile} />
      <input ref={pageBgRef} type="file" accept="image/*" multiple={false} style={{ display: 'none' }} onChange={onPageBgFile} />
      {mode === 'edit' && guides.map((line) => line.axis === 'x' ? (
        <div key={'gx' + String(line.at)} data-dsh-myskin-ui="1" className="dsh-myskin-guide" style={{ position: 'fixed', left: line.at, top: 0, bottom: 0, width: 1, background: tok.brand, pointerEvents: 'none', zIndex: 10003 }} />
      ) : (
        <div key={'gy' + String(line.at)} data-dsh-myskin-ui="1" className="dsh-myskin-guide" style={{ position: 'fixed', left: 0, right: 0, top: line.at, height: 1, background: tok.brand, pointerEvents: 'none', zIndex: 10003 }} />
      ))}
      {elementChrome && hoverRect !== null ? <ElementBox rect={hoverRect} label={elementLabel(hover as Element)} solid={false} /> : null}
      {elementChrome ? groupPeers.map((el, index) => {
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) return null
        return (
          <div key={'peer-' + String(index)} data-dsh-myskin-ui="1" className="dsh-myskin-peer"
            style={{ position: 'fixed', left: rect.left, top: rect.top, width: rect.width, height: rect.height, border: '1px dashed ' + tok.brand, borderRadius: 4, opacity: 0.5, pointerEvents: 'none', zIndex: 10000 }} />
        )
      }) : null}
      {elementChrome && selRect !== null ? <ElementBox key={'sel-' + selectionEpoch} rect={selRect} label={selected === undefined ? '' : elementLabel(selected) + (scope === 'group' && group !== undefined ? ' · ' + t('scopeGroup') + ' ' + String(group.count) : '')} solid /> : null}
      {elementChrome && selRect !== null ? (
        <>
          {/* Two grips only, both on corners: the element's own area stays pickable. */}
          <div data-dsh-myskin-ui="1" onPointerDown={(e) => { transformDrag(e, 'move') }} title={t('moveGripHint')}
            style={{ position: 'fixed', left: selRect.left - 11, top: selRect.top - 11, width: 22, height: 22, zIndex: 10002, borderRadius: 999, border: '1px solid ' + tok.brand, background: tok.bgOverlay, color: tok.brand, fontSize: 12, lineHeight: '19px', textAlign: 'center', cursor: 'move', pointerEvents: 'auto', touchAction: 'none', userSelect: 'none' }}>✥</div>
          <div data-dsh-myskin-ui="1" onPointerDown={(e) => { transformDrag(e, 'scale') }} title={t('scaleGripHint')}
            style={{ position: 'fixed', left: selRect.right - 9, top: selRect.bottom - 9, width: 18, height: 18, zIndex: 10002, borderRadius: 5, border: '2px solid ' + tok.bgOverlay, background: tok.brand, cursor: 'nwse-resize', pointerEvents: 'auto', touchAction: 'none' }} />
        </>
      ) : null}
      <datalist id="dsh-myskin-font-list">
        {FONT_SUGGESTIONS.map((family) => (<option key={family} value={family} />))}
      </datalist>
      {draft.canvas.images.map((img) => {
        // Resolved through the anchor, not the tag: a 组件锚定 image carries no tag at all. A
        // 整组 image has several members, so the handles follow the one the user selected.
        const imageTargets = resolveImageTargets(img, document)
        const container = (selected !== undefined && imageTargets.includes(selected) ? selected : imageTargets[0]) ?? null
        const crect = container !== null ? container.getBoundingClientRect() : null
        if (crect === null) return null
        const zx = crect.left + (img.x || 0), zy = crect.top + (img.y || 0)
        return (
          <Fragment key={img.id}>
            <div data-dsh-myskin-ui="1" onPointerDown={(e) => { setSelectedImage(img.id); onEmbedPointerDown(e, img) }} onClick={(e) => { e.stopPropagation() }}
              title={t('imageSelectedHint')}
              style={{ position: 'fixed', left: zx + 'px', top: zy + 'px', width: img.w + 'px', height: img.h + 'px', border: '2px ' + (img.id === selectedImage ? 'solid' : 'dashed') + ' ' + tok.brand, boxShadow: img.id === selectedImage ? '0 0 0 1px ' + tok.bgOverlay : 'none', background: 'transparent', pointerEvents: mode === 'edit' ? 'auto' : 'none', cursor: 'move', zIndex: 10001 }} />
            {mode === 'edit' ? (
              <>
                <button data-dsh-myskin-ui="1" onClick={(e) => { e.stopPropagation(); removeEmbed(img.id) }}
                  style={{ position: 'fixed', left: (zx + img.w - 16) + 'px', top: (zy - 12) + 'px', width: 24, height: 24, zIndex: 10003, border: 'none', borderRadius: '50%', background: 'var(--dsw-alias-state-error-primary)', color: '#fff', fontSize: 14, lineHeight: '24px', textAlign: 'center', cursor: 'pointer', pointerEvents: 'auto' }}>✕</button>
                <div data-dsh-myskin-ui="1" onPointerDown={(e) => { e.stopPropagation(); startEmbedResize(e, img) }}
                  style={{ position: 'fixed', left: (zx + img.w - 8) + 'px', top: (zy + img.h - 8) + 'px', width: 16, height: 16, zIndex: 10002, background: tok.brand, borderRadius: 3, cursor: 'nwse-resize', pointerEvents: 'auto' }} />
              </>
            ) : null}
          </Fragment>
        )
      })}
    </div>
  )
}
/**
 * One outlined box on the canvas: dashed while hovering, solid for the selection.
 *
 * The chip carries the element's tag, id/classes and a snippet of its text, because
 * people pick by what they SEE ("新对话" button, the header, a card) — never by a
 * generated selector. It flips under the box near the top of the viewport so it can
 * not hide beneath the toolbar.
 * @param rect - the element's viewport box.
 * @param label - chip text (empty hides the chip).
 * @param solid - true for the selection, false for the hover preview.
 */
function ElementBox({ rect, label, solid }: { rect: DOMRect; label: string; solid: boolean }): ReactNode {
  const z = solid ? 10001 : 10000
  const below = rect.top < 64
  return (
    <>
      <div className={solid ? 'dsh-myskin-box' : 'dsh-myskin-box dsh-myskin-hoverbox'} data-dsh-myskin-ui="1" style={{ position: 'fixed', left: rect.left, top: rect.top, width: rect.width, height: rect.height, border: (solid ? '2px solid ' : '1px dashed ') + tok.brand, boxShadow: solid ? '0 0 0 1px var(--dsw-alias-bg-overlay)' : 'none', borderRadius: 4, pointerEvents: 'none', zIndex: z }} />
      {label === '' ? null : (
        <div className="dsh-myskin-chip" data-dsh-myskin-ui="1" style={{ position: 'fixed', left: Math.max(4, rect.left), top: below ? rect.bottom + 4 : rect.top - 22, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, lineHeight: '17px', padding: '2px 7px', borderRadius: 6, background: tok.bgOverlay, border: '1px solid ' + (solid ? tok.brand : tok.borderL3), color: solid ? tok.labelPrimary : tok.labelSecondary, pointerEvents: 'none', zIndex: z }}>{label}</div>
      )}
    </>
  )
}

/**
 * Collapsible group of Inspector rows.
 *
 * Sixteen flat fields pushed everything else off the panel; grouping them keeps the
 * element actions and the embed list reachable, and the badge tells at a glance how
 * much of this element is already customised.
 * @param title - group heading.
 * @param badge - optional right-of-title marker.
 * @param children - the group's rows.
 */
function Section({ title, badge, children }: { title: string; badge?: string; children: ReactNode }): ReactNode {
  const [open, setOpen] = useState(true)
  return (
    <div className="dsh-myskin-card" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 10 }}>
      <button type="button" className="dsh-myskin-head" data-open={open ? '1' : '0'} onClick={() => { setOpen(!open) }}>
        <span className="dsh-myskin-chev">▾</span>
        <span>{title}</span>
        {badge === undefined ? null : <span style={{ fontSize: 11, lineHeight: '16px', color: tok.brand }}>{badge}</span>}
      </button>
      {open ? <div className="dsh-myskin-body">{children}</div> : null}
    </div>
  )
}

/** The three layer choices, in panel order. */
const IMAGE_LAYERS: readonly ImageLayer[] = ['auto', 'below', 'above']
/** Copy key per layer choice. */
const IMAGE_LAYER_LABEL: Readonly<Record<ImageLayer, MySkinKey>> = {
  auto: 'imageLayerAuto',
  below: 'imageLayerBelow',
  above: 'imageLayerAbove',
}
/** Tooltip copy per layer choice. */
const IMAGE_LAYER_HINT: Readonly<Record<ImageLayer, MySkinKey>> = {
  auto: 'imageLayerAutoHint',
  below: 'imageLayerBelowHint',
  above: 'imageLayerAboveHint',
}
/**
 * Copy key for one visibility diagnosis.
 * @param diagnosis - the diagnosis (absent while no image is selected).
 * @returns the copy key.
 */
function imageDiagKey(diagnosis: ImageDiagnosis | undefined): MySkinKey {
  if (diagnosis === undefined || diagnosis.verdict === 'ok') return 'imgDiagOk'
  if (diagnosis.verdict === 'unresolved') return 'imgDiagUnresolved'
  if (diagnosis.verdict === 'page-scope') return 'imgDiagPageScope'
  if (diagnosis.verdict === 'covered') return 'imgDiagCovered'
  return 'imgDiagClipped'
}


/** Props of {@link VariantPanel}. */
interface VariantPanelProps {
  /** The document being edited (the current choices are read out of its marker). */
  draft: SkinSettings
  /** Replace the document (the caller snapshots for undo). */
  onChangeSkin: (next: SkinSettings) => void
  t: (key: MySkinKey) => string
}

/**
 * 「变体」: choose a look, do not write one.
 *
 * Whole looks first (one click each), then the four axes behind them — and every axis shows its options
 * as plain words (`玻璃` / `纸片` / `描边` / `无框`), because the point of a variant is that the user does
 * not need to know what `backdrop-filter` is. The chosen option is read back out of the document marker,
 * so the card always shows what is actually in effect.
 * @param draft - the document being edited.
 * @param onChangeSkin - writes the new document.
 * @param t - copy lookup.
 */
function VariantPanel({ draft, onChangeSkin, t }: VariantPanelProps): ReactNode {
  const choices = readVariantChoices(draft)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 12, lineHeight: '18px', color: tok.labelSecondary }}>{t('variantTitle')}</span>
      <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('variantHint')}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {VARIANT_LOOKS.map((look) => (
          <Button key={look.id} style={btnBase} size="sm" variant="outline" title={t(look.hintKey as MySkinKey)}
            onClick={() => { onChangeSkin(applyVariantLook(draft, look)) }}>{t(look.labelKey as MySkinKey)}</Button>
        ))}
        <Button style={btnBase} size="sm" variant="ghost" title={t('variantResetHint')}
          onClick={() => { onChangeSkin(clearVariant(draft)) }}>{t('mdReset')}</Button>
      </div>
      {VARIANT_AXES.map((axis) => {
        const current = optionFor(axis, choices)
        return (
          <div key={axis.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, lineHeight: '18px', color: tok.labelSecondary }}>{t(axis.labelKey as MySkinKey)}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {axis.options.map((option) => (
                <Button key={option.id} size="sm" variant={option.id === current.id ? 'primary' : 'ghost'} style={btnBase}
                  title={t(option.hintKey as MySkinKey)}
                  onClick={() => { onChangeSkin(applyVariantOption(draft, axis, option)) }}>{t(option.labelKey as MySkinKey)}</Button>
              ))}
            </div>
          </div>
        )
      })}
      <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('variantNote')}</span>
    </div>
  )
}
/** Props of {@link RegionPanel}. */
interface RegionPanelProps {
  /** The document being edited (values are read back out of its `css`). */
  draft: SkinSettings
  /** Replace the document (the caller snapshots for undo). */
  onChangeSkin: (next: SkinSettings) => void
  t: (key: MySkinKey) => string
}

/**
 * 「区域外观」: shape a whole surface at once.
 *
 * Element-by-element editing answers "make this button rounder"; it is a bad answer to "I want my own
 * sidebar". A region is a named surface (对话区 / 侧边栏 / 输入框 / 设置页 / 消息列表) with a curated set of
 * properties — background, glass, radius, border, shadow, padding — that only read as a look when they
 * are set together, which is also why the presets describe a whole look rather than one property.
 * @param draft - the document being edited.
 * @param onChangeSkin - writes the new document.
 * @param t - copy lookup.
 */
function RegionPanel({ draft, onChangeSkin, t }: RegionPanelProps): ReactNode {
  const [regionId, setRegionId] = useState<string>(REGIONS[0].id)
  const region = REGIONS.find((entry) => entry.id === regionId) ?? REGIONS[0]
  const values = readRegionStyle(draft.css, region)
  /** How many elements this region resolves to on the page in front of the user. */
  const count = regionCount(document, region)
  const write = (field: RegionField, value: string | undefined): void => {
    onChangeSkin({ ...draft, css: writeRegionStyle(draft.css, region, field, value) })
  }
  const selectStyle: CSSProperties = { background: tok.bgBase, color: tok.labelPrimary, border: '1px solid ' + tok.borderL2, borderRadius: 6, fontSize: 12, lineHeight: '18px', padding: '2px 6px', flex: '1 1 90px', minWidth: 0 }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 12, lineHeight: '18px', color: tok.labelSecondary }}>{t('regionTitle')}</span>
      <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('regionHint')}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {REGIONS.map((entry) => (
          <Button key={entry.id} size="sm" variant={entry.id === region.id ? 'primary' : 'ghost'} style={btnBase}
            title={t(entry.hintKey as MySkinKey)} onClick={() => { setRegionId(entry.id) }}>{t(entry.labelKey as MySkinKey)}</Button>
        ))}
      </div>
      <span style={{ fontSize: 11, lineHeight: '16px', color: count > 0 ? tok.success : tok.warn }}>
        {count > 0 ? t('regionFound').replace('{n}', String(count)) : t('regionMissing')}
      </span>
      <span title={regionSelector(region)} style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary, wordBreak: 'break-all' }}>{regionSelector(region)}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {REGION_PRESETS.map((preset) => (
          <Button key={preset.id} style={btnBase} size="sm" variant="outline" title={t(preset.hintKey as MySkinKey)}
            onClick={() => { onChangeSkin({ ...draft, css: applyRegionPreset(draft.css, region, preset) }) }}>{t(preset.labelKey as MySkinKey)}</Button>
        ))}
        <Button style={btnBase} size="sm" variant="ghost" title={t('regionResetHint')}
          onClick={() => { onChangeSkin({ ...draft, css: clearRegionStyles(draft.css) }) }}>{t('mdReset')}</Button>
      </div>
      {REGION_FIELDS.filter((field) => field.kind !== 'option' || field.options !== undefined).map((field) => {
        const label = t(field.labelKey as MySkinKey)
        const raw = values.get(field.id)
        if (field.kind === 'color') return <ColorRow key={field.id} label={label} raw={raw} clearTitle={t('mdUnset')} onSet={(value) => { write(field, value) }} />
        if (field.kind === 'option') {
          return (
            <Field key={field.id} label={label} clearTitle={t('mdUnset')} clearable={raw !== undefined} onClear={() => { write(field, undefined) }}>
              <select value={raw ?? ''} style={selectStyle} onChange={(e: ChangeEvent<HTMLSelectElement>) => { write(field, e.target.value === '' ? undefined : e.target.value) }}>
                {(field.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>{t(option.labelKey as MySkinKey)}</option>
                ))}
              </select>
            </Field>
          )
        }
        if (field.kind === 'toggle') {
          return (
            <label key={field.id} className="dsh-myskin-field" style={{ gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={raw === field.onValue}
                onChange={(e) => { write(field, e.target.checked ? field.onValue : field.offValue) }} />
              <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
            </label>
          )
        }
        return (
          <NumberRow key={field.id} label={label} raw={raw} unit={field.unit ?? ''} step={field.step ?? 1}
            min={field.min ?? 0} max={field.max ?? 9999} clearTitle={t('mdUnset')} onSet={(value) => { write(field, value) }} />
        )
      })}
    </div>
  )
}
/** Props of {@link TextPanel}. */
interface TextPanelProps {
  /** The document being edited (the overrides are read from `text`). */
  draft: SkinSettings
  /** Apply a copy change live (the caller snapshots, so one edit is one undo step). */
  onEdit: (selector: string, before: string, after: string) => void
  /** Drop one override. */
  onRemove: (selector: string) => void
  /** Take the canvas to the element this override belongs to. */
  onSelect: (selector: string) => void
  t: (key: MySkinKey) => string
}

/**
 * A labelled numeric row: wheel + text, clamped, with a clear button.
 *
 * Shared by the markdown and region cards. Both write CSS values into the document ("14px", "1.7")
 * and read them back, so both need exactly this control — and a second copy of it is how the two cards
 * would start behaving differently.
 * @param label - row label.
 * @param raw - the current CSS value, if any.
 * @param unit - unit appended on write ('' for a bare number).
 * @param step - wheel/typing step.
 * @param min - lowest sensible value.
 * @param max - highest sensible value.
 * @param onSet - writes the value (undefined clears it).
 * @param clearTitle - tooltip of the clear button.
 * @returns the row.
 */
function NumberRow({ label, raw, unit, step, min, max, onSet, clearTitle }: {
  label: string
  raw: string | undefined
  unit: string
  step: number
  min: number
  max: number
  onSet: (value: string | undefined) => void
  clearTitle: string
}): ReactNode {
  const parsed = raw === undefined ? undefined : Number.parseFloat(raw)
  const value = parsed !== undefined && Number.isFinite(parsed) ? parsed : undefined
  return (
    <Field label={label} clearTitle={clearTitle} clearable={raw !== undefined} onClear={() => { onSet(undefined) }}>
      <WheelNudge onStep={(direction, big) => {
        const next = Math.min(max, Math.max(min, (value ?? 0) + direction * step * (big ? 10 : 1)))
        onSet(String(Math.round(next * 100) / 100) + unit)
      }}>
        <Input value={value === undefined ? '' : String(value) + unit} placeholder={clearTitle} title={label}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const cleaned = e.target.value.replace(/[^0-9.\-]/g, '')
            if (cleaned.trim() === '') { onSet(undefined); return }
            const next = Number.parseFloat(cleaned)
            if (!Number.isFinite(next)) return
            onSet(String(Math.min(max, Math.max(min, next))) + unit)
          }} />
      </WheelNudge>
    </Field>
  )
}

/**
 * A labelled colour row: a swatch plus free text, so `rgba(...)` and `var(...)` stay editable.
 * @param label - row label.
 * @param raw - the current CSS value, if any.
 * @param onSet - writes the value (undefined clears it).
 * @param clearTitle - tooltip of the clear button.
 * @returns the row.
 */
function ColorRow({ label, raw, onSet, clearTitle }: { label: string; raw: string | undefined; onSet: (value: string | undefined) => void; clearTitle: string }): ReactNode {
  return (
    <Field label={label} clearTitle={clearTitle} clearable={raw !== undefined} onClear={() => { onSet(undefined) }}>
      <input type="color" value={toHex(raw ?? '') ?? '#888888'} style={{ width: 28, height: 22, flex: 'none', padding: 0, border: '1px solid ' + tok.borderL2, borderRadius: 6, background: 'transparent' }}
        onChange={(e) => { onSet(e.target.value) }} />
      <Input value={raw ?? ''} placeholder={clearTitle} title={label}
        onChange={(e: ChangeEvent<HTMLInputElement>) => { const next = e.target.value.trim(); onSet(next === '' ? undefined : next) }} />
    </Field>
  )
}
/**
 * 「文字」: every copy override in the skin, in one place.
 *
 * Copy edits used to exist only as a row inside the element inspector, so editing one again meant
 * finding that element on the page first — the same trap the images had. Here each override is its own
 * card with before/after fields, a button that takes the canvas to it, and a remove button; the `text`
 * field is the only state, so a value typed by hand shows up here too.
 * @param draft - the document being edited.
 * @param onEdit - applies a copy change.
 * @param onRemove - drops an override.
 * @param onSelect - selects the element behind an override.
 * @param t - copy lookup.
 */
function TextPanel({ draft, onEdit, onRemove, onSelect, t }: TextPanelProps): ReactNode {
  const entries = draft.text
  return (
    <Section title={t('tabText')} badge={entries.length === 0 ? undefined : String(entries.length)}>
      {entries.length === 0 ? (
        <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('textEmpty')}</span>
      ) : (
        <>
          <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('textPanelHint')}</span>
          {entries.map((entry) => {
            const host = safeQuery(entry.selector)
            return (
              <div key={entry.selector} className="dsh-myskin-card" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 10 }}>
                <div className="dsh-myskin-field" style={{ gap: 6 }}>
                  <span title={entry.selector} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: tok.labelSecondary }}>
                    {host === null ? entry.selector : elementLabel(host, 30)}
                  </span>
                  <Button style={{ ...btnBase, flex: 'none' }} size="sm" variant="ghost" disabled={host === null}
                    onClick={() => { onSelect(entry.selector) }}>{t('selectHost')}</Button>
                  <Button style={{ ...btnBase, flex: 'none' }} size="sm" variant="ghost" icon={<IconTrash size={14} />}
                    title={t('remove')} onClick={() => { onRemove(entry.selector) }}>{t('remove')}</Button>
                </div>
                <Field label={t('textBefore')} clearTitle={t('mdClear')} clearable={false} onClear={() => undefined}>
                  <Input value={entry.before} title={t('textBefore')}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => { onEdit(entry.selector, e.target.value, entry.after) }} />
                </Field>
                <Field label={t('textAfter')} clearTitle={t('mdClear')} clearable={false} onClear={() => undefined}>
                  <Input value={entry.after} title={t('textAfter')}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => { onEdit(entry.selector, entry.before, e.target.value) }} />
                </Field>
              </div>
            )
          })}
        </>
      )}
    </Section>
  )
}
interface MarkdownPanelProps {
  /** The document being edited (values are read back out of its `tokens` and `css`). */
  draft: SkinSettings
  /** Replace the document (the caller snapshots for undo). */
  onChangeSkin: (next: SkinSettings) => void
  t: (key: MySkinKey) => string
}

/**
 * 「对话排版」: the panel's control over DSH's markdown output.
 *
 * The card is DATA-DRIVEN from {@link MARKDOWN_FIELDS}: one row per knob, grouped, and every value is
 * read back out of `draft.css` — so there is no second copy of the state, undo works like any other
 * edit, and a value the user types by hand in a rule is picked up by the panel on the next render.
 * @param draft - the document being edited.
 * @param onChangeCss - writes the new rule list.
 * @param onChangeScope - Writes the scope marker.
 * @param t - copy lookup.
 */
/**
 * 「对话排版」: the panel's control over DSH's markdown output.
 *
 * Two halves, because DSH splits the job in two: the TYPE comes from component tokens
 * (`MARKDOWN_TOKENS` — the sheet writes `font: var(--dsw-font-markdown-base)` and the design system
 * builds that shorthand from them), and the GAPS come from rules on the real container
 * (`MARKDOWN_FIELDS`). Everything is data-driven and every value is read back out of the document, so
 * there is no second copy of the state and a value typed into a rule by hand shows up here too.
 * @param draft - the document being edited.
 * @param onChangeSkin - writes the new document.
 * @param t - copy lookup.
 */
function MarkdownPanel({ draft, onChangeSkin, t }: MarkdownPanelProps): ReactNode {
  const scope = readMarkdownScope(draft)
  const values = readMarkdownStyles(draft.css, scope)
  const tokens = readMarkdownTokens(draft)
  /** What the page is showing right now, for the rows this skin does not override. */
  const effective = readEffectiveMarkdown(document, scope)
  const split = markdownTokenSplit(draft)
  /** How much markdown this page is showing (a skin can be right and the page empty). */
  const counts = markdownSurfaceCount(document, scope)
  const writeRule = (target: MarkdownField, value: string | undefined): void => {
    onChangeSkin({ ...draft, css: writeMarkdownStyle(draft.css, scope, target, value) })
  }
  const writeToken = (target: MarkdownTokenField, value: string | undefined): void => {
    onChangeSkin(writeMarkdownToken(draft, target, value))
  }
  const number = (raw: string | undefined): number | undefined => {
    if (raw === undefined) return undefined
    const parsed = Number.parseFloat(raw)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  /**
   * One numeric row (shared by tokens and rules: the only difference is where the value lands).
   * @param label - row label.
   * @param raw - current value, if any.
   * @param unit - unit appended on write.
   * @param step - wheel/typing step.
   * @param bounds - lowest/highest sensible value.
   * @param set - writes the value (undefined clears it).
   * @returns the row.
   */
  const numericRow = (label: string, raw: string | undefined, unit: string, step: number, bounds: readonly [number, number], set: (value: string | undefined) => void, current?: string): ReactNode => {
    const value = number(raw)
    return (
      <Field key={label} label={label} clearTitle={t('mdClear')} clearable={raw !== undefined} onClear={() => { set(undefined) }}>
        <WheelNudge onStep={(direction, big) => {
          const base = value ?? 0
          const next = Math.min(bounds[1], Math.max(bounds[0], base + direction * step * (big ? 10 : 1)))
          set(String(Math.round(next * 10) / 10) + unit)
        }}>
          <Input value={value === undefined ? '' : String(value) + unit} placeholder={current === undefined ? t('mdUnset') : current} title={label}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const cleaned = e.target.value.replace(/[^0-9.]/g, '')
              if (cleaned.trim() === '') { set(undefined); return }
              const parsed = Number.parseFloat(cleaned)
              if (!Number.isFinite(parsed)) return
              set(String(Math.min(bounds[1], Math.max(bounds[0], parsed))) + unit)
            }} />
        </WheelNudge>
      </Field>
    )
  }
  /**
   * One colour row: a swatch plus a free-text field (so `rgba(...)` and `var(...)` stay editable).
   * @param label - row label.
   * @param raw - current value, if any.
   * @param set - writes the value (undefined clears it).
   * @returns the row.
   */
  const colorRow = (label: string, raw: string | undefined, set: (value: string | undefined) => void, current?: string): ReactNode => (
    <Field key={label} label={label} clearTitle={t('mdClear')} clearable={raw !== undefined} onClear={() => { set(undefined) }}>
      <input type="color" value={toHex(raw ?? '') ?? '#888888'} style={{ width: 28, height: 22, flex: 'none', padding: 0, border: '1px solid ' + tok.borderL2, borderRadius: 6, background: 'transparent' }}
        onChange={(e) => { set(e.target.value) }} />
      <Input value={raw ?? ''} placeholder={current === undefined ? t('mdUnset') : current} title={label}
        onChange={(e: ChangeEvent<HTMLInputElement>) => { const next = e.target.value.trim(); set(next === '' ? undefined : next) }} />
    </Field>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 12, lineHeight: '18px', color: tok.labelSecondary }}>{t('mdTitle')}</span>
      <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('mdHint')}</span>
      <span style={{ fontSize: 11, lineHeight: '16px', color: counts.bodies > 0 ? tok.success : tok.warn }}>
        {counts.bodies > 0 ? t('mdFound').replace('{n}', String(counts.bodies)) : t('mdMissing')}
      </span>
      {counts.bodies > 0 && effective.size > 0 ? (
        <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('mdEffective')}</span>
      ) : null}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, lineHeight: '18px', color: tok.labelTertiary }}>{t('mdScopeLabel')}</span>
        <span style={{ display: 'inline-flex', border: '1px solid ' + tok.borderL2, borderRadius: 8, overflow: 'hidden' }}>
          <Button size="sm" variant={scope === 'all' ? 'primary' : 'ghost'} title={t('mdScopeAllHint')}
            onClick={() => { onChangeSkin({ ...draft, css: withMarkdownScope(draft.css, 'all') }) }}>{t('mdScopeAll')}</Button>
          <Button size="sm" variant={scope === 'conversation' ? 'primary' : 'ghost'} title={t('mdScopeConversationHint')}
            onClick={() => { onChangeSkin({ ...draft, css: withMarkdownScope(draft.css, 'conversation') }) }}>{t('mdScopeConversation')}</Button>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {MARKDOWN_PRESETS.map((preset) => (
          <Button key={preset.id} style={btnBase} size="sm" variant="outline"
            onClick={() => { onChangeSkin(applyMarkdownPreset(draft, scope, preset)) }}>{t(preset.labelKey as MySkinKey)}</Button>
        ))}
        <Button style={btnBase} size="sm" variant="ghost" title={t('mdResetHint')}
          onClick={() => { onChangeSkin(clearMarkdownTokens({ ...draft, css: clearMarkdownStyles(draft.css, scope) })) }}>{t('mdReset')}</Button>
      </div>
      <Section title={t('mdTokensGroup')} badge={tokens.size === 0 ? undefined : String(tokens.size)}>
        <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('mdTokensHint')}</span>
        {MARKDOWN_TOKENS.map((entry) => {
          const label = t(entry.labelKey as MySkinKey)
          const raw = tokens.get(entry.id)
          const set = (value: string | undefined): void => { writeToken(entry, value) }
          const row = entry.kind === 'color'
            ? colorRow(label, raw, set, effective.get(entry.id))
            : numericRow(label, raw, entry.unit ?? '', entry.step ?? 1, [entry.min ?? 1, entry.max ?? 999], set, effective.get(entry.id))
          if (!split.includes(entry.token)) return row
          return <Fragment key={entry.id}>{row}<span style={{ fontSize: 11, lineHeight: '16px', color: tok.warn }}>{t('mdTokenSplit')}</span></Fragment>
        })}
      </Section>
      {MARKDOWN_GROUPS.map((group) => {
        const fields = MARKDOWN_FIELDS.filter((entry) => entry.group === group.id)
        /** How many of this group's knobs carry a value (the badge is the "what have I touched"). */
        const setCount = fields.filter((entry) => values.has(entry.id)).length
        return (
          <Section key={group.id} title={t(group.labelKey as MySkinKey)} badge={setCount === 0 ? undefined : String(setCount)}>
            {fields.map((entry) => {
              const label = t(entry.labelKey as MySkinKey)
              const current = values.get(entry.id)
              if (entry.kind === 'toggle') {
                return (
                  <label key={entry.id} className="dsh-myskin-field" style={{ gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={current === entry.onValue}
                      onChange={(e) => { writeRule(entry, e.target.checked ? entry.onValue : entry.offValue) }} />
                    <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
                  </label>
                )
              }
              if (entry.kind === 'color') return colorRow(label, current, (value) => { writeRule(entry, value) }, effective.get(entry.id))
              if (entry.kind === 'number' && entry.unit === undefined) {
                // A bare number (font-weight): no unit, no decimals on the wheel.
                return numericRow(label, current, '', entry.step ?? 1, [entry.min ?? 100, entry.max ?? 900], (value) => { writeRule(entry, value) }, effective.get(entry.id))
              }
              return numericRow(label, current, entry.unit ?? '', entry.step ?? 1, [entry.min ?? 0, entry.max ?? 999], (value) => { writeRule(entry, value) }, effective.get(entry.id))
            })}
          </Section>
        )
      })}
    </div>
  )
}
/**
 * 「嵌入图片」: every embedded image's own settings, in one place that does NOT depend on the
 * selection.
 *
 * This card used to live inside the Inspector, which only exists while an element is selected — so
 * changing an image's opacity or blend mode meant first finding (and being able to click) whatever
 * container it was embedded into. An image anchored to a collapsed sidebar, to a row that is hard
 * to hit, or to something on another page was effectively uneditable. Here every image is listed
 * with its anchor, a 「选中容器」 button that takes the canvas to its host, and its full set of
 * controls; the selection is only needed for the two 「用选中…」 actions, which disable themselves
 * when there is nothing selected.
 * @param draft - the document being edited (the images are read from it).
 * @param target - the current selection, when there is one.
 * @param groupAnchor - the block anchor offered when the selection belongs to a block.
 * @param onAnchor - re-point one image.
 * @param onMode - switch one image between 组件嵌入 / 组件锚定.
 * @param onOpacity - set one image's opacity (0–1).
 * @param onBlend - set one image's blend mode.
 * @param onGeometry - move/resize one image (x/y/w/h).
 * @param onRemove - delete one image.
 * @param onSelectHost - take the canvas to an image's container.
 * @param t - copy lookup.
 */
function EmbedImages({ draft, target, groupAnchor, selectedImage, onSelectImage, onAnchor, onMode, onOpacity, onBlend, onGeometry, onLayer, onFeather, onPageScope, onRemove, onSelectHost, t }: EmbedImagesProps): ReactNode {
  const images = draft.canvas.images
  /** One string for "these images follow these things" — a text anchor scans the DOM. */
  const signature = images.map((img) => img.id + '|' + anchorKey(anchorOf(img))).join(';')
  /**
   * Where each image currently lands.
   *
   * Recomputed per anchor change (not per render: this panel re-renders on every frame of an image
   * drag) and used for three things the user cannot get anywhere else: the label, the ✓/⚠ line, and
   * the 「选中容器」 button that saves them from hunting for the host on the page.
   */
  const hosts = useMemo(() => {
    const out = new Map<string, Element | undefined>()
    for (const img of images) out.set(img.id, resolveImageAnchor(img, document))
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, target])
  /**
   * Which image panels are unfolded.
   *
   * One image, one panel — a picture's settings used to sit in a single shared card, so every image
   * pushed every other image's fields down the panel and none of them felt like "the one I am
   * editing". A single image therefore starts unfolded (its panel IS the card), and a whole gallery
   * starts tidy.
   */
  const [openImages, setOpenImages] = useState<string[]>(() => images.length === 1 ? [images[0].id] : [])
  /** Unfold one image's panel, or fold it back up. Unfolding is also SELECTING: the canvas follows. */
  const toggleImagePanel = (id: string): void => {
    if (openImages.includes(id)) { setOpenImages(openImages.filter((entry) => entry !== id)); return }
    setOpenImages([...openImages, id])
    onSelectImage(id)
  }
  // Selecting on the canvas (or from the header card) unfolds that image's panel, so the settings
  // for the picture under the selection box are always the ones in view.
  useEffect(() => {
    if (selectedImage === undefined) return
    setOpenImages((previous) => previous.includes(selectedImage) ? previous : [...previous, selectedImage])
  }, [selectedImage])
  if (images.length === 0) return null
  const selectStyle: CSSProperties = { background: tok.bgBase, color: tok.labelPrimary, border: '1px solid ' + tok.borderL2, borderRadius: 6, fontSize: 12, lineHeight: '18px', padding: '2px 6px' }
  /** The four numbers of an image, one ROW each: X / Y offset and 宽 / 高. */
  const axes = [
    { key: 'x' as const, label: 'X', hintKey: 'imageAxisX' as MySkinKey },
    { key: 'y' as const, label: 'Y', hintKey: 'imageAxisY' as MySkinKey },
    { key: 'w' as const, label: t('fieldWidth'), hintKey: 'imageAxisW' as MySkinKey },
    { key: 'h' as const, label: t('fieldHeight'), hintKey: 'imageAxisH' as MySkinKey },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 12, lineHeight: '18px', color: tok.labelSecondary }}>{t('embedImages')} · {String(images.length)}</span>
      <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('embedImagesHint')}</span>
      {images.map((img) => {
        const anchor = anchorOf(img)
        const host = hosts.get(img.id)
        const ok = host !== undefined
        const isSelected = img.id === selectedImage
        const open = openImages.includes(img.id)
        return (
          /* 每张图 = 它自己的面板：标题行可折叠，右边是它自己的动作，展开才是它自己的设置。 */
          <div key={img.id} className="dsh-myskin-card"
            style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 10, borderColor: isSelected ? tok.brand : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button type="button" className="dsh-myskin-head" data-open={open ? '1' : '0'} title={t('imagePanelHint')}
                onClick={() => { toggleImagePanel(img.id) }} style={{ flex: '1 1 auto', minWidth: 0 }}>
                <span className="dsh-myskin-chev">▾</span>
                <span title={img.selector} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isSelected ? tok.brand : undefined }}>
                  {ok ? elementLabel(host, 26) : anchorLabel(anchor, t)}
                </span>
                <span style={{ flex: 'none', fontSize: 11, lineHeight: '16px', color: ok ? tok.success : tok.warn }}>{ok ? '✓' : '⚠'}</span>
              </button>
              {/* 选中 = 与组件同级的那个选中态：画布上只留这一个框，面板顶部也换成它。 */}
              {/* 两个动作不许被标题挤小：标题可收缩，按钮不收缩。 */}
              <Button style={{ ...btnBase, flex: 'none' }} size="sm" variant={isSelected ? 'primary' : 'ghost'} title={t('selectImageHint')}
                onClick={() => { onSelectImage(isSelected ? undefined : img.id) }}>{isSelected ? t('deselect') : t('selectImage')}</Button>
              <Button style={{ ...btnBase, flex: 'none' }} size="sm" variant="ghost" icon={<IconTrash size={14} />} title={t('remove')} onClick={() => { onRemove(img.id) }}>{t('remove')}</Button>
            </div>
            {open ? (
            <div className="dsh-myskin-body">
            <div className="dsh-myskin-field" style={{ gap: 6 }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 11, lineHeight: '16px', color: ok ? tok.success : tok.warn }}>
                {ok ? t('anchorOk') + ' · ' + anchorLabel(anchor, t) : t('anchorMissing')}
              </span>
              <Button style={btnBase} size="sm" variant="ghost" disabled={!ok} title={t('selectHostHint')}
                onClick={() => { if (host !== undefined) onSelectHost(host) }}>{t('selectHost')}</Button>
            </div>
            {/* 锚定：图片跟随谁。元素=结构选择器；文字=跟着这段文案；内置组件=固定部位；整组=整类元素 */}
            <div className="dsh-myskin-field" style={{ gap: 6 }}>
              <span style={{ color: tok.labelTertiary, minWidth: 40 }}>{t('anchor')}</span>
              <select value={anchor.kind} title={t('anchorHint')} style={selectStyle}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  const kind = e.target.value as AnchorKind
                  if (target === undefined) { onAnchor(img.id, { kind, value: anchor.value, label: anchor.label }); return }
                  onAnchor(img.id, defaultAnchor(kind, img, target, groupAnchor))
                }}>
                <option value="element">{t('anchorKindElement')}</option>
                <option value="text">{t('anchorKindText')}</option>
                <option value="component">{t('anchorKindComponent')}</option>
                <option value="group" disabled={groupAnchor === undefined}>{t('anchorKindGroup')}</option>
              </select>
              {anchor.kind === 'component' ? (
                <select value={anchor.value} title={t('anchorHint')} style={{ ...selectStyle, flex: '1 1 90px', minWidth: 90 }}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => { onAnchor(img.id, { kind: 'component', value: e.target.value }) }}>
                  {ANCHOR_COMPONENTS.map((component) => (<option key={component.id} value={component.id}>{t(component.labelKey)}</option>))}
                </select>
              ) : (
                <Input value={anchor.value}
                  title={anchor.kind === 'text' ? t('anchorTextHint') : t('anchorSelectorHint')}
                  placeholder={anchor.kind === 'text' ? t('anchorTextPlaceholder') : t('anchorSelectorPlaceholder')}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { onAnchor(img.id, { kind: anchor.kind, value: e.target.value }) }} />
              )}
              {anchor.kind === 'element' ? (
                <Button style={btnBase} size="sm" variant="ghost" disabled={target === undefined} onClick={() => { if (target !== undefined) onAnchor(img.id, anchorFromElement(target)) }}>{t('anchorUseSelected')}</Button>
              ) : null}
              {anchor.kind === 'text' ? (
                <Button style={btnBase} size="sm" variant="ghost" disabled={target === undefined} title={t('anchorUseTextHint')}
                  onClick={() => { if (target === undefined) return; const copy = anchorTextOf(target); if (copy !== undefined) onAnchor(img.id, { kind: 'text', value: copy, label: copy }) }}>{t('anchorUseText')}</Button>
              ) : null}
            </div>
            <div className="dsh-myskin-field" style={{ gap: 6 }}>
              <span style={{ color: tok.labelTertiary, minWidth: 40 }}>{t('imageMode')}</span>
              <select value={imageModeOf(img)} title={t('imageModeHint')} style={selectStyle}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => { onMode(img.id, e.target.value as ImageMode) }}>
                <option value="embed">{t('imageModeEmbed')}</option>
                <option value="anchor">{t('imageModeAnchor')}</option>
              </select>
              <span style={{ flex: '1 1 120px', minWidth: 0, fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>
                {imageModeOf(img) === 'anchor' ? t('imageModeAnchorNote') : t('imageModeEmbedNote')}
              </span>
            </div>
            <div className="dsh-myskin-field" style={{ gap: 6 }}>
              <span style={{ color: tok.labelTertiary, minWidth: 40 }}>{t('opacity')}</span>
              <input type="range" min={0} max={100} value={Math.round((img.opacity ?? 1) * 100)} onChange={(e) => { onOpacity(img.id, Number(e.target.value) / 100) }} style={{ flex: '1 1 70px', minWidth: 70 }} />
              <span style={{ color: tok.labelTertiary }}>{t('blend')}</span>
              <select value={img.blend ?? 'normal'} onChange={(e) => { onBlend(img.id, e.target.value as BlendMode) }} style={selectStyle}>
                {BLEND_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{t(o.labelKey)}</option>))}
              </select>
            </div>
            {/* 混合模式要能看见背后的页面，所以它会把这层挪到内容之上；normal 则留在内容之下。 */}
            <span style={{ fontSize: 11, lineHeight: '16px', color: embedPaintsAbove(img, readImageLayer(draft, img.id)) ? tok.warn : tok.labelTertiary }}>{t('blendLayerNote')}</span>
            {/* 层级：内容之上的卡片（如设置页）里，默认的「内容之下」会被内容盖住——这里可以改。 */}
            <div className="dsh-myskin-field" style={{ gap: 6 }}>
              <span style={{ color: tok.labelTertiary, minWidth: 40 }}>{t('imageLayer')}</span>
              <span style={{ display: 'inline-flex', border: '1px solid ' + tok.borderL2, borderRadius: 8, overflow: 'hidden' }}>
                {IMAGE_LAYERS.map((entry) => (
                  <Button key={entry} size="sm" variant={readImageLayer(draft, img.id) === entry ? 'primary' : 'ghost'}
                    title={t(IMAGE_LAYER_HINT[entry])} onClick={() => { onLayer(img.id, entry) }}>{t(IMAGE_LAYER_LABEL[entry])}</Button>
                ))}
              </span>
            </div>
            <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('imageLayerHint')}</span>
            {/* 设置页作用域：默认只在嵌入时那一页显示（键按标签比，重渲染不会误判）。 */}
            {(img.pageKey ?? '') === '' ? null : (
              <label className="dsh-myskin-field" style={{ gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={readImagePageScope(draft, img.id)}
                  onChange={(e) => { onPageScope(img.id, e.target.checked) }} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 11, lineHeight: '16px', color: tok.labelSecondary }}>
                  {t('imagePageScope')}
                  <br />
                  <span style={{ color: tok.labelTertiary }}>{t('imagePageScopeHint')}</span>
                </span>
              </label>
            )}
            {/* 边缘晕染：硬边的贴图直接贴上去很生硬，羽化可以让它「化」进背景。 */}
            {(() => {
              const feather = readImageFeather(draft, img.id)
              const setFeather = (patch: Partial<ImageFeather>): void => { onFeather(img.id, { ...feather, ...patch }) }
              return (
                <>
                  <div className="dsh-myskin-field" style={{ gap: 6 }}>
                    <span style={{ color: tok.labelTertiary, minWidth: 40 }}>{t('imageFeather')}</span>
                    <WheelNudge onStep={(direction, big) => {
                      const next = Math.max(0, Math.min(200, feather.width + direction * (big ? 10 : 2)))
                      setFeather({ width: next })
                    }}>
                      <Input value={feather.width === 0 ? '' : String(Math.round(feather.width)) + 'px'} placeholder={t('imageFeatherOff')}
                        title={t('imageFeatherHint')}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const cleaned = e.target.value.replace(/[^0-9.]/g, '')
                          setFeather({ width: cleaned.trim() === '' ? 0 : Math.min(200, Number.parseFloat(cleaned) || 0) })
                        }} />
                    </WheelNudge>
                  </div>
                  {feather.width > 0 ? (
                    <>
                      <div className="dsh-myskin-field" style={{ gap: 6 }}>
                        <span style={{ color: tok.labelTertiary, minWidth: 40 }}>{t('imageFeatherSoft')}</span>
                        <WheelNudge onStep={(direction, big) => {
                          setFeather({ soft: Math.max(0, Math.min(1, feather.soft + direction * (big ? 0.25 : 0.05))) })
                        }}>
                          <Input value={feather.soft === 0 ? '' : String(Math.round(feather.soft * 100))} placeholder={t('imageFeatherOff')}
                            title={t('imageFeatherSoftHint')}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                              const cleaned = e.target.value.replace(/[^0-9.]/g, '')
                              setFeather({ soft: cleaned.trim() === '' ? 0 : Math.min(1, (Number.parseFloat(cleaned) || 0) / 100) })
                            }} />
                        </WheelNudge>
                      </div>
                      <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('imageFeatherNote')}</span>
                    </>
                  ) : null}
                </>
              )
            })()}
            {/* 位置与大小：一行一个轴。两个控件并排会把面板撑出边界（Input 自己有最小宽度），
                所以竖向；数值只到小数点后一位——0.1px 已经是这套编辑器的精度上限。 */}
            {axes.map((axis) => (
              <Field key={axis.key} label={axis.label} clearTitle={t('clearField')} clearable={false} onClear={() => undefined}>
                <WheelNudge onStep={(direction, big) => { onGeometry(img.id, { [axis.key]: round1(stepValue(img[axis.key], direction, big ? 10 : 1)) }) }}>
                  <Input value={formatOne(img[axis.key])} title={t(axis.hintKey)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => { onGeometry(img.id, { [axis.key]: round1(toNum(e.target.value, img[axis.key])) }) }} />
                </WheelNudge>
              </Field>
            ))}
            </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Props of {@link EmbedImages}. Kept next to the component so the panel and the list agree on
 * exactly which edits an image accepts.
 */
interface EmbedImagesProps {
  draft: SkinSettings
  target: Element | undefined
  groupAnchor: ImageAnchor | undefined
  /** The image the canvas is editing (its row is highlighted, and it can be (de)selected here). */
  selectedImage: string | undefined
  /** Select (or clear) an image from the list — the same selection the canvas box uses. */
  onSelectImage: (id: string | undefined) => void
  onAnchor: (id: string, anchor: ImageAnchor) => void
  onMode: (id: string, mode: ImageMode) => void
  onOpacity: (id: string, value: number) => void
  onBlend: (id: string, value: BlendMode) => void
  onGeometry: (id: string, patch: Partial<Pick<EmbeddedImage, 'x' | 'y' | 'w' | 'h'>>) => void
  /** Put one image above or below its container's content. */
  onLayer: (id: string, layer: ImageLayer) => void
  /** Change one image's edge treatment. */
  onFeather: (id: string, feather: ImageFeather) => void
  /** Keep one image on its own settings page (`false` = show it on every settings page). */
  onPageScope: (id: string, own: boolean) => void
  onRemove: (id: string) => void
  onSelectHost: (el: Element) => void
  t: (key: MySkinKey) => string
}
/**
 * 「回收站」: the controls the skin removes, with a way back.
 *
 * A removed control is `display: none`, so the canvas can no longer hit-test it — save the
 * removal and the element could never be selected again, which is what made the removal a
 * one-way door. The list is DERIVED from the document's rules ({@link removedControls})
 * instead of being stored a second time, so it cannot drift out of sync with what is really
 * removed, and it survives a reload for free. The element is still in the DOM, which is what
 * lets an entry show the user a name instead of a selector.
 * @param entries - one entry per removed selector.
 * @param onRestore - restore a single entry.
 * @param onRestoreAll - restore every entry.
 * @param t - copy lookup.
 */
function RecycleBin({ entries, onRestore, onRestoreAll, t }: {
  entries: readonly RemovedControl[]
  onRestore: (selector: string) => void
  onRestoreAll: () => void
  t: (key: MySkinKey) => string
}): ReactNode {
  return (
    <Section title={t('recycleBin')} badge={entries.length === 0 ? undefined : String(entries.length)}>
      {entries.length === 0 ? (
        <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('recycleEmpty')}</span>
      ) : (
        <>
          <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('recycleHint')}</span>
          {entries.map((entry) => {
            const host = safeQuery(entry.selector)
            return (
              <div key={entry.selector} className="dsh-myskin-field" style={{ gap: 6 }}>
                <span title={entry.selector} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: tok.labelSecondary }}>
                  {host === null ? entry.selector : elementLabel(host, 30)}
                </span>
                <Button style={btnBase} size="sm" variant="outline" onClick={() => { onRestore(entry.selector) }}>{t('restore')}</Button>
              </div>
            )
          })}
          {entries.length > 1 ? (
            <div style={{ display: 'flex' }}>
              <Button style={btnBase} size="sm" variant="ghost" onClick={onRestoreAll}>{t('restoreAll')}</Button>
            </div>
          ) : null}
        </>
      )}
    </Section>
  )
}

/**
 * Turns wheel movement over a control into steps.
 *
 * React attaches `wheel` as a PASSIVE listener at the root, so `onWheel` + `preventDefault`
 * cannot stop the panel scrolling under the pointer — hence a native non-passive listener
 * of our own. The gesture (pointer over the field, wheel nudges the number) is the one
 * users expect from a numeric control in a design tool; Shift makes it coarse.
 * @param onStep - receives the direction (+1 = wheel up) and whether Shift was held.
 * @param children - the control to wrap.
 */
function WheelNudge({ onStep, children }: { onStep: (direction: 1 | -1, big: boolean) => void; children: ReactNode }): ReactNode {
  const ref = useRef<HTMLSpanElement | null>(null)
  const handler = useRef(onStep)
  useEffect(() => { handler.current = onStep })
  useEffect(() => {
    const el = ref.current
    if (el === null) return
    return attachWheelNudge(el, (direction, big) => { handler.current(direction, big) })
  }, [])
  return <span ref={ref} style={{ display: 'inline-flex', alignItems: 'center', flex: '1 1 90px', minWidth: 0 }}>{children}</span>
}

/**
 * One labelled Inspector row with an optional per-property revert.
 * @param label - property name.
 * @param clearTitle - tooltip for the revert button.
 * @param clearable - whether this property currently carries something to revert.
 * @param onClear - revert callback.
 * @param children - the row's controls.
 */
function Field({ label, clearTitle, clearable, onClear, children }: { label: string; clearTitle: string; clearable: boolean; onClear: () => void; children: ReactNode }): ReactNode {
  return (
    <label className="dsh-myskin-field">
      <span style={{ minWidth: 52, flex: 'none', color: tok.labelSecondary }}>{label}</span>
      {children}
      {clearable ? (
        <button type="button" className="dsh-myskin-iconbtn" title={clearTitle} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClear() }}>×</button>
      ) : null}
    </label>
  )
}

interface InspectorProps {
  target: Element
  draft: SkinSettings
  onSample: (selector: string, declaration: string) => void
  /** Replace one selector's whole rule (geek mode: the user typed the CSS themselves). */
  onReplaceStyle: (selector: string, declaration: string) => void
  onText: (selector: string, before: string, after: string) => void
  /** Preview the text field on the live page without adding a history entry per keypress. */
  onLiveText: (selector: string, before: string, after: string) => void
  /** Drop the text override that reverts the copy. */
  onRemoveText: (selector: string) => void
  onRemove: (selector: string) => void
  onHide: (selector: string) => void
  onUnhide: (selector: string) => void
  onRemoveControl: (selector: string) => void
  onRestoreControl: (selector: string) => void
  /** Select the parent of the current target (panel button / Alt+↑). */
  onSelectParent: () => void
  /** Select the child under the last click (panel button / Alt+↓). */
  onSelectChild: () => void
  /** Register one embedded font file (`@font-face` entry in the skin's css). */
  onEmbedFont: (family: string, url: string, format: string) => void
  /** Drop one embedded font. */
  onRemoveFont: (family: string) => void
  /** The selector edits are written to: the element itself, or its whole block. */
  activeSelector: string
  /** The block the selection belongs to, when it has one. */
  group: ElementGroup | undefined
  /** The 全站 identity of the selection — or why it has none. */
  site: SiteScopeOutcome | undefined
  /** The settings surface, as the 『界面显示』 card names it. */
  settingsView: Surface
  /** The page the main area shows (undefined when it carries no marker to hold on to). */
  pageView: Surface | undefined
  /** Every surface the card lists, in display order (settings first, then pages). */
  surfaces: readonly Surface[]
  /** Whether the settings surface is the one on screen right now. */
  inSettings: boolean
  /** Hide or show the selection's component in one surface. */
  onSurfaceHidden: (surface: Surface, hidden: boolean) => void
  /** Preset: keep the component visible only on this surface. */
  onKeepOnly: (surface: Surface) => void
  /** Preset: hide the component on every surface at once. */
  onHideEverywhere: () => void
  /** Show the selection's component everywhere again (the undo for hiding it in every surface). */
  onRestoreAllHidden: () => void
  /** Merge one declaration into the element's rule (the z-index field's 「设为 relative」). */
  onAddDeclaration: (selector: string, declaration: string) => void
  /** Whether the panel edits one element or its whole block. */
  scope: EditScope
  /** Switch the edit scope. */
  onScope: (scope: EditScope) => void
  /** Selector for the space BETWEEN block members (undefined when they are not siblings). */
  gapSelector: string | undefined
  /** The gap currently written, as a CSS length ('' when none). */
  gap: string
  /** Set (or clear, with '') the gap between block members. */
  onGap: (value: string) => void
  /** End the current gap-editing run (the next change starts a new undo step). */
  onGapEnd: () => void
  /** Set (or clear, with `''`) one whole-app font role. */
  onRoleFont: (role: FontRole, value: string) => void
  /** Close the current role-editing run so the next write starts its own undo entry. */
  onRoleFontEnd: () => void
  /**
   * Whether the X/Y/scale fields — not the element's rule — are the source of truth.
   *
   * Owned by the canvas because the canvas is the other writer: a grip drag must be able
   * to take the fields out of the loop. Mirrored values are display-only, so echoing them
   * back one frame late was what made a dragged element alternate between the new and the
   * old coordinates.
   */
  transformAuthored: MutableRefObject<boolean>
  t: (key: MySkinKey) => string
}

function Inspector({ target, draft, onSample, onReplaceStyle, onText, onLiveText, onRemoveText, onRemove, onHide, onUnhide, onRemoveControl, onRestoreControl, onSelectParent, onSelectChild, onEmbedFont, onRemoveFont, activeSelector, group, site, settingsView, pageView, surfaces, inSettings, onSurfaceHidden, onKeepOnly, onHideEverywhere, onRestoreAllHidden, onAddDeclaration, scope, onScope, gapSelector, gap, onGap, onGapEnd, onRoleFont, onRoleFontEnd, transformAuthored, t }: InspectorProps): ReactNode {
  const [fontSize, setFontSize] = useState('')
  const [color, setColor] = useState('')
  const [bg, setBg] = useState('')
  const [weight, setWeight] = useState('')
  const [radius, setRadius] = useState('')
  const [borderColor, setBorderColor] = useState('')
  const [borderWidth, setBorderWidth] = useState('')
  const [padding, setPadding] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [margin, setMargin] = useState('')
  const [lineHeight, setLineHeight] = useState('')
  const [opacity, setOpacity] = useState('')
  const [shadow, setShadow] = useState('')
  const [textAlign, setTextAlign] = useState('')
  /** Stacking order of the selection ('' = untouched, i.e. the rule keeps `auto`). */
  const [zIndex, setZIndex] = useState('')
  /**
   * Whether the selection is `position: static`.
   *
   * z-index only stacks positioned elements (plus flex/grid items), and a number that quietly does
   * nothing is the kind of thing this panel exists to explain — hence the hint and the one-click
   * `position: relative` next to the field.
   */
  const [staticPosition, setStaticPosition] = useState(false)
  /**
   * What the selection competes with, and what caps it (see stacking.ts).
   *
   * The panel shows it next to the z-index field because a stacking number that changes nothing is
   * indistinguishable from a broken field: this says which of the three cases it is, and offers
   * the two numbers that always do something.
   */
  const [stacking, setStacking] = useState<StackingReport | undefined>(undefined)
  const [bgImage, setBgImage] = useState('')
  const [text, setText] = useState('')
  /** Font stack of the selection ('' = untouched, the placeholder shows the computed one). */
  const [fontFamily, setFontFamily] = useState('')
  const [computedFont, setComputedFont] = useState('')
  /** Font feedback: text plus whether it is a success or a warning. */
  const [fontIssue, setFontIssue] = useState<{ text: string; kind: 'ok' | 'warn' } | undefined>(undefined)
  const fontRef = useRef<HTMLInputElement | null>(null)
  /** This machine's fonts, once the user asked for them (undefined = list closed). */
  const [fontScan, setFontScan] = useState<FontScan | undefined>(undefined)
  const [fontQuery, setFontQuery] = useState('')
  const [fontBusy, setFontBusy] = useState(false)
  /** Which list is on screen, said out loud (the machine's, or what a probe could prove). */
  const [fontNote, setFontNote] = useState<string | undefined>(undefined)
  /** What the local-font list writes into: the selected element, or one whole-app role. */
  const [fontTarget, setFontTarget] = useState<'element' | FontRole>('element')
  /** X/Y move + uniform scale of the selection ('' = untouched axis). */
  const [transX, setTransX] = useState('')
  const [transY, setTransY] = useState('')
  const [scale, setScale] = useState('')
  /**
   * True while one of the transform inputs has focus.
   *
   * The panel mirrors canvas drags from the rule, and that mirror must not fire while the
   * user is typing (it would rewrite the field under the cursor).
   */
  const transformFocusRef = useRef(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [geek, setGeek] = useState(false)
  const [geekCss, setGeekCss] = useState('')
  const [geekSel, setGeekSel] = useState('')
  useEffect(() => {
    // Geek mode starts from whatever the panel is editing: the element, or its whole block.
    setGeekSel(activeSelector !== '' ? activeSelector : selectorOf(target))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, activeSelector])
  const applyGeek = (): void => {
    // Geek mode is the escape hatch: the user wrote the whole rule, so it REPLACES the
    // element's rule instead of merging into it the way the style fields do.
    if (geekSel.trim() !== '' && geekCss.trim() !== '') onReplaceStyle(geekSel, geekCss.trim())
  }
  useEffect(() => {
    if (!geek) return
    setGeekCss(draft.css.find((r) => r.selector === geekSel)?.rule ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geek, target, geekSel, draft.css])
  const beforeRef = useRef('')
  /** The element whose text node the override must target (undefined = nothing editable). */
  const hostRef = useRef<Element | undefined>(undefined)
  const [textIssue, setTextIssue] = useState<string | undefined>(undefined)
  const bgImageRef = useRef<HTMLInputElement | null>(null)
  const onEmbedBg = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file === undefined) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result ?? '')
      setBgImage('url("' + url + '")')
      touch('bgImage')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  useEffect(() => {
    // A freshly selected element is owned by its own rule, not by the fields.
    transformAuthored.current = false
    const sel = selectorOf(target)
    const rule = draft.css.find((r) => r.selector === sel)?.rule
    setStaticPosition(getComputedStyle(target).position === 'static')
    if (rule !== undefined && rule.trim() !== '') {
      // This state has its own saved rule -> load its values so the fields visibly
      // differ from 正常 (normal) and match exactly what this state overrides.
      const d = parseStateRule(rule)
      setFontSize(d['font-size'] ?? ''); setColor(d['color'] ?? ''); setBg(d['background-color'] ?? '')
      setWeight(d['font-weight'] ?? ''); setRadius(d['border-radius'] ?? ''); setBorderColor(d['border-color'] ?? '')
      setBorderWidth(d['border-width'] ?? ''); setPadding(d['padding'] ?? ''); setWidth(d['width'] ?? '')
      setHeight(d['height'] ?? ''); setMargin(d['margin'] ?? ''); setLineHeight(d['line-height'] ?? '')
      setOpacity(d['opacity'] ?? ''); setShadow(d['box-shadow'] ?? ''); setTextAlign(d['text-align'] ?? '')
      setZIndex(d['z-index'] ?? '')
      setBgImage(d['background-image'] ?? '')
      setFontFamily(d['font-family'] ?? '')
      const tr = parseTransform(rule)
      setTransX(tr.x === 0 ? '' : String(tr.x))
      setTransY(tr.y === 0 ? '' : String(tr.y))
      setScale(tr.scale === 1 ? '' : String(tr.scale))
      setTouched({
        fontSize: d['font-size'] !== undefined, color: d['color'] !== undefined, bg: d['background-color'] !== undefined,
        bgImage: d['background-image'] !== undefined, weight: d['font-weight'] !== undefined, radius: d['border-radius'] !== undefined,
        borderColor: d['border-color'] !== undefined, borderWidth: d['border-width'] !== undefined, padding: d['padding'] !== undefined,
        width: d['width'] !== undefined, height: d['height'] !== undefined, margin: d['margin'] !== undefined,
        lineHeight: d['line-height'] !== undefined, opacity: d['opacity'] !== undefined, shadow: d['box-shadow'] !== undefined,
        textAlign: d['text-align'] !== undefined, zIndex: d['z-index'] !== undefined,
        fontFamily: d['font-family'] !== undefined,
        transX: d['transform'] !== undefined && tr.x !== 0,
        transY: d['transform'] !== undefined && tr.y !== 0,
        scale: d['transform'] !== undefined && tr.scale !== 1,
      })
    } else {
      // No saved rule for this state yet: show the element's current appearance as baseline.
      const css = getComputedStyle(target)
      // The computed stack is what the element actually renders with, so it belongs in the
      // placeholder rather than in the field (writing it back would freeze the current
      // theme's font into the skin).
      setComputedFont(css.fontFamily)
      setFontFamily('')
      setTransX(''); setTransY(''); setScale('')
      setFontSize(css.fontSize); setColor(css.color); setBg(css.backgroundColor); setWeight(css.fontWeight)
      setRadius(css.borderRadius); setBorderColor(css.borderTopColor); setBorderWidth(css.borderTopWidth); setPadding(css.padding)
      setWidth(css.width); setHeight(css.height); setMargin(css.margin); setLineHeight(css.lineHeight)
      setOpacity(css.opacity); setShadow(css.boxShadow); setTextAlign(css.textAlign)
      setZIndex(css.zIndex === 'auto' ? '' : css.zIndex)
      setBgImage(css.backgroundImage === 'none' ? '' : css.backgroundImage)
      setTouched({})
    }
    // Text overrides are independent of the style rule, so this resolves on every
    // selection: the node that actually holds editable text (the selection may be a
    // wrapper whose label lives in a child, or an icon button with no text at all).
    const host = textHostOf(target)
    hostRef.current = host
    const isField = host !== undefined && (host.tagName === 'INPUT' || host.tagName === 'TEXTAREA')
    const direct = host === undefined
      ? undefined
      : Array.from(host.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && (n as Text).data.trim() !== '')
    const raw = host === undefined
      ? ''
      : isField
        ? (host as HTMLInputElement).placeholder
        : direct === undefined ? '' : (direct as Text).data
    beforeRef.current = raw.trim()
    const applied = host === undefined ? undefined : draft.text.find((o) => o.selector === selectorOf(host))
    setText(applied !== undefined ? applied.after : raw.trim())
    setTextIssue(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  // Recompute the stacking picture whenever the binding or the draft changes: the numbers the
  // two buttons offer have to describe the page as it is right now, not as it was when the
  // element was selected.
  useEffect(() => {
    setStacking(stackingReport(target, isOwnElement, (el) => elementLabel(el, 32)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, draft.css, zIndex])

  /**
   * Write a z-index and make it MEAN something.
   *
   * On a `position: static` element the number is inert, so 置顶/置底 also position it — otherwise
   * the button whose whole job is "put this above the others" would produce exactly the nothing
   * the user reported.
   * @param value - the z-index to write.
   */
  const applyZIndex = (value: string): void => {
    setZIndex(value)
    touch('zIndex')
    if (staticPosition) onAddDeclaration(sel, 'position: relative !important')
  }

  /**
   * Pending live-preview timer for the text field.
   *
   * Cancelled on apply, on re-select and on unmount so a stale keystroke can never
   * write into a different element's text node.
   */
  const textTimer = useRef<number | undefined>(undefined)
  const cancelTextTimer = (): void => {
    if (textTimer.current !== undefined) { window.clearTimeout(textTimer.current); textTimer.current = undefined }
  }
  /** Write the field's current value into the live page (or drop the override when reverted). */
  const runLiveText = (): void => {
    const host = hostRef.current
    if (host === undefined || touched.text !== true) return
    const desired = text.trim()
    if (desired === '') return
    const selector = selectorOf(host)
    if (desired === beforeRef.current) { onRemoveText(selector); return }
    onLiveText(selector, beforeRef.current, desired)
  }
  useEffect(() => {
    if (touched.text !== true) return
    cancelTextTimer()
    const host = hostRef.current
    textTimer.current = window.setTimeout(() => {
      textTimer.current = undefined
      // The selection may have moved between the keystroke and the debounce.
      if (hostRef.current !== host) return
      runLiveText()
    }, 250)
    return cancelTextTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])
  useEffect(() => { cancelTextTimer() }, [target])
  useEffect(() => () => { cancelTextTimer() }, [])

  const touch = (field: string): void => { setTouched((prev) => ({ ...prev, [field]: true })) }
  const used = (field: string): boolean => touched[field] === true
  /** Embedded fonts already in the document, with their decoded size. */
  const embeddedFonts = draft.css
    .filter((r) => r.selector === FONT_FACE_SELECTOR)
    .map((r) => {
      const family = (r.rule.match(/font-family:\s*'([^']+)'/) ?? [])[1] ?? ''
      const base64 = (r.rule.match(/base64,([^']*)'/) ?? [])[1] ?? ''
      return { family, bytes: Math.round((base64.length * 3) / 4) }
    })
    .filter((font) => font.family !== '')
  /**
   * One wheel notch on a transform field.
   *
   * Offsets move by 1px (Shift 10px), scale by 0.05 (Shift 0.25) inside 0.2–3 — all of it
   * through {@link stepValue}, so the rounding and clamping match every other path that
   * can change these numbers.
   * @param field - which of the three transform fields.
   * @param direction - +1 for wheel up, -1 for wheel down.
   * @param big - Shift was held.
   */
  const nudge = (field: 'transX' | 'transY' | 'scale', direction: 1 | -1, big: boolean): void => {
    transformAuthored.current = true
    if (field === 'scale') {
      setScale(String(stepValue(toNum(scale, 1), direction, big ? 0.25 : 0.05, 0.2, 3)))
      touch('scale')
      return
    }
    const next = String(stepValue(toNum(field === 'transX' ? transX : transY, 0), direction, big ? 10 : 1))
    if (field === 'transX') setTransX(next)
    else setTransY(next)
    touch(field)
  }
  /**
   * The per-axis reset button of a transform field (X, Y and scale each reset alone).
   * @param title - tooltip naming the axis.
   * @param disabled - nothing to reset.
   * @param onClick - clears exactly this field.
   */
  const resetButton = (title: string, disabled: boolean, onClick: () => void): ReactNode => (
    <button type="button" className="dsh-myskin-iconbtn" title={title} disabled={disabled}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick() }}>↺</button>
  )

  /**
   * Read this machine's installed fonts and show them as a list.
   *
   * Chromium's Local Font Access API is the only way to enumerate them, and it needs a user
   * gesture plus a permission grant — which is why this runs from the button and nothing
   * else. Without the API (or without the grant) the list degrades to the candidate
   * families a text-metric probe can actually prove are installed, and the header says
   * which of the two is on screen instead of pretending they are the same thing.
   */
  const loadLocalFonts = (): void => {
    if (fontBusy) return
    setFontBusy(true)
    void scanFonts(document, window).then((scan) => {
      setFontBusy(false)
      setFontScan(scan)
      setFontQuery('')
      if (scan.source === 'local') {
        setFontNote(t('fontLocalCount') + ' · ' + String(scan.families.length))
        return
      }
      const reason = scan.denied === true ? t('fontDenied') : t('fontProbeCount')
      setFontNote(reason + ' · ' + String(scan.families.length))
    }).catch(() => {
      // scanFonts already degrades on its own; a rejected promise here would be a bug,
      // and the panel still must not look frozen.
      setFontBusy(false)
      setFontScan({ source: 'detected', families: [] })
      setFontNote(t('fontProbeCount') + ' · 0')
    })
  }
  /**
   * Send a family picked from the local-font list to whatever the list is aimed at.
   *
   * One list, four targets (the selected element and the three whole-app roles). A role is a
   * portable setting — it gets exported and imported elsewhere — so it stores the family plus
   * a generic fallback of the right KIND; the element field keeps the plain family it always
   * wrote.
   * @param family - the family name, unquoted.
   */
  const applyPickedFamily = (family: string): void => {
    const quoted = quoteFamily(family)
    if (fontTarget === 'element') { setFontFamily(quoted); touch('fontFamily'); return }
    onRoleFontEnd()
    onRoleFont(fontTarget, roleStackFor(quoted, fontTarget))
    setFontIssue({ text: t('roleApplied') + ' · ' + t(roleLabelKey(fontTarget)), kind: 'ok' })
  }
  /**
   * Read one font file and register it as an `@font-face` entry.
   * @param e - the hidden file input's change event.
   */
  const onPickFont = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file === undefined) return
    const format = fontFormat(file.name)
    if (format === undefined) { setFontIssue({ text: t('fontUnsupported'), kind: 'warn' }); return }
    if (file.size > MAX_FONT_BYTES) { setFontIssue({ text: t('fontTooLarge'), kind: 'warn' }); return }
    const heavy = file.size > FONT_WARN_BYTES
    const size = (file.size / (1024 * 1024)).toFixed(1) + ' MB'
    const reader = new FileReader()
    reader.onerror = () => { setFontIssue({ text: t('fontTooLarge'), kind: 'warn' }) }
    reader.onload = () => {
      const url = String(reader.result ?? '')
      if (url === '') { setFontIssue({ text: t('fontTooLarge'), kind: 'warn' }); return }
      const family = 'myskin-font-' + Math.random().toString(36).slice(2, 7)
      onEmbedFont(family, url, format)
      setFontFamily(family)
      touch('fontFamily')
      // Big fonts are allowed on purpose, but they ride in the durable document as
      // base64: say what that costs instead of letting the first slow save surprise.
      setFontIssue(heavy ? { text: t('fontHeavy') + ' · ' + size, kind: 'warn' } : { text: t('fontEmbedded') + ' · ' + size, kind: 'ok' })
    }
    reader.readAsDataURL(file)
  }
  /** How many properties of one group this element already carries (shown on the header). */
  const customBadge = (fields: readonly string[]): string | undefined => {
    const count = fields.filter((field) => touched[field] === true).length
    return count === 0 ? undefined : t('customBadge') + ' ' + count
  }
  /**
   * Drop one property from the preview.
   *
   * The value goes back to '' AND the touched flag to false instead of deleting the key:
   * that is what makes the preview effect run once more and rewrite the rule without
   * this declaration. Deleting the key would leave the old value on the page.
   * @param field - the field key.
   * @param reset - clears the field's own state.
   */
  const clearField = (field: string, reset: () => void): void => {
    reset()
    setTouched((prev) => ({ ...prev, [field]: false }))
  }
  const colorType = (v: string, set: (x: string) => void, field: string): ReactNode => (
    <input type="color" value={toHex(v) ?? '#000000'} onChange={(e) => { set(e.target.value); touch(field) }}
      style={{ width: 28, height: 24, border: '1px solid ' + tok.borderL2, borderRadius: 4, background: tok.bgBase, padding: 0, cursor: 'pointer' }} />
  )

  /**
   * What the panel edits.
   *
   * Not necessarily the selected element: in 整组 scope it is the block's selector, which is what
   * makes one edit cover every workspace — including the ones created later. Text replacement
   * deliberately keeps using the element's own selector (each row has its own name).
   */
  const sel = activeSelector !== '' ? activeSelector : selectorOf(target)
  const rule = draft.css.find((r) => r.selector === sel)?.rule
  /** The rows the open font list shows for the current search (empty when it is closed). */
  const fontFamilies = fontScan === undefined ? [] : filterFamilies(fontScan.families, fontQuery)
  /**
   * The first family of whatever the font list is aimed at, lower-cased.
   *
   * The list highlights the row that is already in use — which is the role's stack while a role
   * is being edited, and the element's own family otherwise.
   */
  const activeFontFamily = (fontTarget === 'element' ? fontFamily : roleFont(draft.css, fontTarget))
    .split(',')[0].trim().replace(/^"|"$/g, '').toLowerCase()
  const hidden = rule !== undefined && /visibility\s*:\s*hidden/.test(rule)
  const removed = rule !== undefined && /display\s*:\s*none/.test(rule)

  // Real-time preview: apply the combined declaration whenever a field value,
  // the interaction state, or the touched set changes (runs after React settles).
  // X/Y move + scale as one `transform` declaration (identity parts are omitted, an
  // all-identity transform clears the property instead of pinning `transform: none`).
  //
  // The transform enters this preview from the FIELDS only while the panel authored it.
  // The fields are otherwise a mirror of the element's rule — a canvas grip wrote it — and
  // echoing a mirrored value back one render late is exactly what made a dragged element
  // alternate between its new and its old coordinates. When the panel does not own the
  // transform, the rule's own declaration is re-emitted verbatim: the preview replaces the
  // managed properties, so leaving it out would silently DROP a move the user just made
  // (and reformatting it would drop a hand-written `rotate()` beside our offsets).
  const previewTransform = transformValue(toNum(transX, 0), toNum(transY, 0), toNum(scale, 1))
  const transformDecl = transformPreview(rule, { x: toNum(transX, 0), y: toNum(transY, 0), scale: toNum(scale, 1) }, transformAuthored.current)
  useEffect(() => {
    const decl = [
      used('fontSize') ? 'font-size: ' + fontSize + ' !important' : '',
      used('fontFamily') && fontFamily.trim() !== '' ? 'font-family: ' + fontFamily.trim() + ' !important' : '',
      used('color') ? 'color: ' + color + ' !important' : '',
      transformDecl,
      used('bg') ? 'background-color: ' + bg + ' !important' : '',
      used('bgImage') ? 'background-image: ' + bgImage + ' !important; background-size: cover !important; background-position: center !important' : '',
      used('weight') ? 'font-weight: ' + weight + ' !important' : '',
      used('radius') ? 'border-radius: ' + radius + ' !important' : '',
      used('borderColor') ? 'border-color: ' + borderColor + ' !important' : '',
      used('borderWidth') ? 'border-width: ' + borderWidth + ' !important' : '',
      used('padding') ? 'padding: ' + padding + ' !important' : '',
      used('width') ? 'width: ' + width + ' !important' : '',
      used('height') ? 'height: ' + height + ' !important' : '',
      used('margin') ? 'margin: ' + margin + ' !important' : '',
      used('lineHeight') ? 'line-height: ' + lineHeight + ' !important' : '',
      used('opacity') ? 'opacity: ' + opacity + ' !important' : '',
      used('zIndex') ? 'z-index: ' + zIndex + ' !important' : '',
      used('shadow') ? 'box-shadow: ' + shadow + ' !important' : '',
      used('textAlign') ? 'text-align: ' + textAlign + ' !important' : '',
    ].filter((s) => s !== '').join('; ')
    // Called even when the declaration set is empty: that is how "the last field was
    // cleared" reaches the page. The engine treats an unchanged rule as a no-op, so a
    // mere selection never marks the draft dirty.
    onSample(sel, decl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontSize, fontFamily, color, bg, bgImage, weight, radius, borderColor, borderWidth, padding, width, height, margin, lineHeight, opacity, shadow, textAlign, zIndex, transX, transY, scale, touched])

  // A canvas grip drag writes the rule directly, so the panel mirrors it back — except
  // while one of these inputs has focus (that would rewrite the field mid-typing). The
  // mirror hands the transform back to the rule: from here on the fields DISPLAY it, and
  // only a fresh edit in one of them makes the panel the writer again.
  useEffect(() => {
    if (transformFocusRef.current) return
    transformAuthored.current = false
    const current = parseTransform(draft.css.find((r) => r.selector === sel)?.rule)
    setTransX(current.x === 0 ? '' : String(current.x))
    setTransY(current.y === 0 ? '' : String(current.y))
    setScale(current.scale === 1 ? '' : String(current.scale))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.css])
  /**
   * Apply the text box to the node that holds the text.
   *
   * The old version required a non-empty `before` and stayed silent otherwise, so
   * selecting a wrapper (or an element whose text had whitespace) looked like the
   * feature was missing. This targets the resolved host and always reports back.
   */
  const applyText = (): void => {
    const host = hostRef.current
    const desired = text.trim()
    if (host === undefined || desired === '') { setTextIssue(t('noEditableText')); return }
    cancelTextTimer()
    onText(selectorOf(host), beforeRef.current, desired)
    setTextIssue(t('textApplied'))
  }
  /** The 全站 scope for this selection, when it has one (see site-scope.ts). */
  const siteGroup = site !== undefined && site.ok ? site.scope : undefined
  /**
   * Every rule that currently hides this component, whatever surface wrote it.
   *
   * Derived from the document's own css: the toggles are a view of what is written, so flipping
   * one, restoring from the recycle bin and editing geek-mode CSS can never disagree. Rules from
   * an older build are listed here too, which is what makes 「全部恢复显示」 a real undo.
   */
  const hideRules = siteGroup === undefined ? [] : hiddenRulesFor(draft.css, siteGroup.selector)
  /**
   * Whether the component can no longer be reached by clicking the page.
   *
   * Two ways to get there, and both deserve the warning: hiding it in every surface the card
   * knows, or (the blunt one) 「移除控件」, which writes the identity itself with no surface at all.
   */
  const hiddenEverywhere = siteGroup !== undefined && (hideRules.some((entry) => entry.selector === siteGroup.selector)
    || surfaces.every((surface) => hiddenInSurface(draft.css, surface, siteGroup.selector)))

  /**
   * Why 全站 is unavailable for this selection, in one sentence.
   *
   * Both ways it can fail are things the user can act on (pick an element that carries more of its
   * own identity), so the button explains itself instead of just being greyed out.
   */
  const siteMissText = site === undefined || site.ok
    ? t('scopeSiteHint')
    : site.reason === 'too-generic'
      ? t('scopeSiteTooGeneric').replace('{n}', String(site.count))
      : t('scopeSiteNoIdentity')

  const fieldLabel: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontSize: 12, lineHeight: '20px', width: '100%' }

  const style: CSSProperties = {
    // `flex: none`: the panel is the scroller. Letting the Inspector shrink instead squeezes
    // its own content (and, at the limit, everything below it) into slivers.
    position: 'relative', zIndex: 5, width: '100%', flex: 'none', overflow: 'auto',
    display: 'flex', flexDirection: 'column', gap: 10, color: tok.labelPrimary,
  }


  return (
    <div style={style}>
      <strong style={{ fontSize: 14, lineHeight: '22px', fontWeight: 500 }}>{t('editMenu')}</strong>
      <div className="dsh-myskin-card" style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ flex: 1, fontSize: 12, lineHeight: '18px', color: tok.labelTertiary }}>{t('target')}</span>
          <Button style={btnBase} size="sm" variant="ghost" onClick={onSelectParent} title={t('selectParentHint')}>↑ {t('selectParent')}</Button>
          <Button style={btnBase} size="sm" variant="ghost" onClick={onSelectChild} title={t('selectChildHint')}>↓ {t('selectChild')}</Button>
        </div>
        <span style={{ fontSize: 12, lineHeight: '18px', color: tok.labelPrimary, wordBreak: 'break-word' }}>{elementLabel(target, 48)}</span>
        {/* 编辑范围：单元素 / 整组（同类元素）/ 全站（同一个组件，出现在哪个界面都生效） */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, lineHeight: '18px', color: tok.labelTertiary }}>{t('editScope')}</span>
          <span style={{ display: 'inline-flex', border: '1px solid ' + tok.borderL2, borderRadius: 8, overflow: 'hidden' }}>
            <Button size="sm" variant={scope === 'single' ? 'primary' : 'ghost'} onClick={() => { onScope('single') }}>{t('scopeSingle')}</Button>
            <Button size="sm" variant={scope === 'group' ? 'primary' : 'ghost'} disabled={group === undefined}
              title={group === undefined ? t('scopeUnavailable') : t('scopeGroupHint')}
              onClick={() => { onScope('group') }}>
              {group === undefined ? t('scopeGroup') : t('scopeGroup') + ' · ' + t(groupLabelKey(group.kind)) + ' ' + String(group.count)}
            </Button>
            <Button size="sm" variant={scope === 'site' ? 'primary' : 'ghost'} disabled={siteGroup === undefined}
              title={siteGroup === undefined ? siteMissText : t('scopeSiteHint')}
              onClick={() => { onScope('site') }}>
              {siteGroup === undefined ? t('scopeSite') : t('scopeSite') + ' · ' + String(siteGroup.count)}
            </Button>
          </span>
        </div>
        {/* 全站：标识来自元素自身，不带祖先路径——所以其他界面的实例、之后新建的实例都跟着变。
            只命中 1 处时要说清楚：这不是“只影响一个”。 */}
        {scope === 'site' && siteGroup === undefined ? (
          <span style={{ fontSize: 11, lineHeight: '16px', color: tok.warn }}>{siteMissText}</span>
        ) : null}
        {scope === 'site' && siteGroup !== undefined ? (
          <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>
            {siteGroup.count === 1 ? t('scopeSiteOne') : t('scopeSiteMany').replace('{n}', String(siteGroup.count))}
          </span>
        ) : null}
        {/* 整组：成员之间的间隔（用相邻兄弟选择器，只动彼此之间，不碰首元素与容器顶） */}
        {scope === 'group' ? (
          gapSelector === undefined ? (
            <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('gapUnavailable')}</span>
          ) : (
            <Field label={t('gap')} clearTitle={t('gapClear')} clearable={gap.trim() !== ''} onClear={() => { onGap(''); onGapEnd() }}>
              <WheelNudge onStep={(direction, big) => { onGap(gapLength(String(stepValue(toNum(gap, 0), direction, big ? 10 : 1)))) }}>
                <Input value={gap.replace(/px$/i, '')} placeholder="0" title={t('gapHint')}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { onGap(gapLength(e.target.value)) }}
                  onBlur={onGapEnd} />
              </WheelNudge>
              <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>px</span>
            </Field>
          )
        ) : null}
        <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('scopeWrites')}</span>
        <span style={{ fontSize: 11, lineHeight: '16px', color: scope === 'single' ? tok.labelTertiary : tok.brand, fontFamily: 'var(--ds-font-family-code, monospace)', wordBreak: 'break-all' }}>{sel}</span>
        {target.matches(COMPOSER_PLACEHOLDER_SELECTOR) ? (
          <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('placeholderTarget')}</span>
        ) : null}
      </div>
      {/* 界面显示：同一个组件在不同界面显示 / 隐藏。规则 = body:has(<界面标记>) + 组件标识（views.ts），
          所以「每个界面各渲染一份」与「一个全局节点盖在所有界面上」两种插件形态都能管。
          「常用」三个按钮是整状态的预设：只在本页显示 / 到处都不显示 / 全部恢复。 */}
      <div className="dsh-myskin-card" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 12, lineHeight: '18px', color: tok.labelSecondary }}>{t('viewCard')}</span>
          <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>
            {t('viewCurrent')}{inSettings ? settingsView.label : (pageView?.label ?? t('viewUnknown'))}
          </span>
        </div>
        {surfaces.map((surface) => {
          const hidden = siteGroup !== undefined && hiddenWhile(draft.css, surface, siteGroup.selector, surfaces)
          const isPage = surface.id === pageView?.id
          return (
            <div key={surface.id} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ flex: '1 1 88px', minWidth: 0, fontSize: 12, lineHeight: '18px', color: tok.labelPrimary }} title={surface.marker}>
                {isPage ? t('viewThisPage') + surface.label : surface.label}
              </span>
              <span style={{ display: 'inline-flex', border: '1px solid ' + tok.borderL2, borderRadius: 8, overflow: 'hidden' }}>
                <Button size="sm" variant={hidden ? 'ghost' : 'primary'} disabled={siteGroup === undefined} title={surface.marker}
                  onClick={() => { onSurfaceHidden(surface, false) }}>{t('viewShown')}</Button>
                <Button size="sm" variant={hidden ? 'primary' : 'ghost'} disabled={siteGroup === undefined} title={surface.marker}
                  onClick={() => { onSurfaceHidden(surface, true) }}>{t('viewHidden')}</Button>
              </span>
            </div>
          )
        })}
        {pageView === undefined ? (
          <span style={{ fontSize: 11, lineHeight: '16px', color: tok.warn }}>{t('viewNoPageMarker')}</span>
        ) : null}
        {/* 常用预设：一次设定整个「哪里显示」状态，而不是逐个界面点。 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, lineHeight: '18px', color: tok.labelTertiary }}>{t('viewPresets')}</span>
          <Button style={btnBase} size="sm" variant="outline" disabled={siteGroup === undefined || pageView === undefined}
            title={t('viewOnlyHereHint')}
            onClick={() => { if (pageView !== undefined) onKeepOnly(pageView) }}>{t('viewOnlyHere')}</Button>
          <Button style={btnBase} size="sm" variant="outline" disabled={siteGroup === undefined}
            title={t('viewHideEverywhereHint')} onClick={onHideEverywhere}>{t('viewHideEverywhere')}</Button>
          <Button style={btnBase} size="sm" variant="outline" disabled={siteGroup === undefined || hideRules.length === 0}
            title={t('viewRestoreAllHint')} onClick={onRestoreAllHidden}>{t('viewRestoreAll')}</Button>
        </div>
        {hiddenEverywhere ? (
          <span style={{ fontSize: 11, lineHeight: '16px', color: tok.warn }}>{t('viewAllHidden')}</span>
        ) : null}
        <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('viewHint')}</span>
        {siteGroup === undefined ? (
          <span style={{ fontSize: 11, lineHeight: '16px', color: tok.warn }}>{siteMissText}</span>
        ) : hideRules.length === 0 ? (
          <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary, fontFamily: 'var(--ds-font-family-code, monospace)', wordBreak: 'break-all' }}>{siteGroup.selector}</span>
        ) : (
          <span style={{ fontSize: 11, lineHeight: '16px', color: tok.brand, fontFamily: 'var(--ds-font-family-code, monospace)', wordBreak: 'break-all' }}>
            {t('viewRules')}{hideRules.map((entry) => entry.selector).join('  ')}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Button style={btnBase} size="sm" variant={geek ? 'primary' : 'ghost'} onClick={() => { setGeek(!geek) }}>{t('geekMode')}</Button>
      </div>
      {geek ? (
        <div className="dsh-myskin-card" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 10 }}>
          <label style={fieldLabel}>{t('target')}<Input value={geekSel} onChange={(e: ChangeEvent<HTMLInputElement>) => { setGeekSel(e.target.value) }} placeholder="#root > … :hover" /></label>
          <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('selectorHint')}</span>
          <CodeEditor value={geekCss} onChange={setGeekCss} />

          <div style={{ display: 'flex', gap: 6 }}>
            <Button style={btnBase} variant="outline" onClick={applyGeek}>{t('apply')}</Button>
            <Button style={btnBase} variant="ghost" onClick={() => { setGeekCss('') }}>{t('reset')}</Button>
          </div>
          <details>
            <summary style={{ fontSize: 12, color: tok.labelTertiary, cursor: 'pointer' }}>{t('codeRef')}</summary>
            <pre style={{ fontSize: 11, lineHeight: '16px', overflow: 'auto', maxHeight: 120, color: tok.labelSecondary, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontFamily: 'var(--ds-font-family-code, monospace)' }}>{target.outerHTML.slice(0, 500)}</pre>
          </details>
        </div>
      ) : null}
      {geek ? null : (<>
      <Section title={t('groupText')} badge={customBadge(['fontSize', 'weight', 'lineHeight', 'color', 'textAlign'])}>
        <Field label={t('fieldFontSize')} clearTitle={t('clearField')} clearable={used('fontSize')} onClear={() => { clearField('fontSize', () => { setFontSize('') }) }}>
          <Input value={fontSize} onChange={(e: ChangeEvent<HTMLInputElement>) => { setFontSize(e.target.value); touch('fontSize') }} />
        </Field>
        <Field label={t('fieldFont')} clearTitle={t('clearField')} clearable={used('fontFamily')} onClear={() => { clearField('fontFamily', () => { setFontFamily('') }) }}>
          <Input list="dsh-myskin-font-list" value={fontFamily} placeholder={computedFont} onChange={(e: ChangeEvent<HTMLInputElement>) => { setFontFamily(e.target.value); touch('fontFamily') }} />
        </Field>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          <Button style={btnBase} size="sm" variant="ghost" onClick={loadLocalFonts} disabled={fontBusy} title={t('fontListHint')}>{fontBusy ? t('fontListing') : t('fontList')}</Button>
          <Button style={btnBase} size="sm" variant="ghost" onClick={() => { fontRef.current?.click() }} title={t('embedFontHint')}>{t('embedFont')}</Button>
          <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('fontTargetNote')}{fontTarget === 'element' ? t('fieldFont') : t(roleLabelKey(fontTarget))}</span>
          <span style={{ flex: '1 1 120px', minWidth: 0, fontSize: 11, lineHeight: '16px', color: fontIssue === undefined ? tok.labelTertiary : fontIssue.kind === 'ok' ? tok.success : tok.warn }}>{fontIssue?.text ?? t('fontHint')}</span>
        </div>
        <input ref={fontRef} type="file" accept=".woff2,.woff,.ttf,.otf" style={{ display: 'none' }} onChange={onPickFont} />
        {/* 整站字体：界面 / 正文 / 代码。三者各自独立可清除，写的都是皮肤文档里的普通 css 条目。 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 6, borderTop: '1px solid ' + tok.borderL2 }}>
          <span style={{ fontSize: 12, lineHeight: '18px', color: tok.labelSecondary }}>{t('fontRoles')}</span>
          {FONT_ROLES.map((role) => {
            const value = roleFont(draft.css, role)
            return (
              <Field key={role} label={t(roleLabelKey(role))} clearTitle={t('clearField')} clearable={value !== ''} onClear={() => { onRoleFont(role, '') }}>
                <Input value={value} placeholder={t('roleUnset')} title={t('fontRolesHint')}
                  onFocus={() => { setFontTarget(role) }}
                  onBlur={onRoleFontEnd}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { onRoleFont(role, e.target.value) }} />
                <Button style={btnBase} size="sm" variant="ghost" title={t('rolePickHint')}
                  onClick={() => { setFontTarget(role); if (fontScan === undefined) loadLocalFonts() }}>{t('rolePick')}</Button>
              </Field>
            )
          })}
          <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('fontRolesHint')}</span>
        </div>
        {fontScan === undefined ? null : (
          <div className="dsh-myskin-card" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 11, lineHeight: '16px', color: fontScan.source === 'local' ? tok.success : tok.warn }}>{fontNote}</span>
              <button type="button" className="dsh-myskin-iconbtn" title={t('close')} onClick={() => { setFontScan(undefined) }}>×</button>
            </div>
            <Input value={fontQuery} placeholder={t('fontSearch')} onChange={(e: ChangeEvent<HTMLInputElement>) => { setFontQuery(e.target.value) }} />
            {fontQuery.trim() === '' ? null : (
              <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{String(fontFamilies.length)} / {String(fontScan.families.length)}</span>
            )}
            {/* A block scroller with a FIXED height: as a flex column, 200+ rows were flex
                items that shrank to their padding floor (and `overflow: hidden` then clipped
                every line away) — the list rendered as an empty box with two scrollbars. */}
            <div className="dsh-myskin-scroll" style={{ display: 'block', flex: 'none', height: 156, overflowY: 'auto', overflowX: 'hidden' }}>
              {fontFamilies.length === 0 ? (
                <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('fontListEmpty')}</span>
              ) : fontFamilies.map((family) => (
                <button key={family} type="button" className="dsh-myskin-fontpick"
                  data-active={activeFontFamily === family.toLowerCase() ? '1' : undefined}
                  title={family} style={{ fontFamily: quoteFamily(family) }}
                  onClick={() => { applyPickedFamily(family) }}>{family}</button>
              ))}
            </div>
          </div>
        )}
        {embeddedFonts.length === 0 ? null : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {embeddedFonts.map((font) => (
              <div key={font.family} className="dsh-myskin-field" style={{ gap: 6 }}>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: tok.labelSecondary }}>{font.family}</span>
                <span style={{ flex: 'none', fontSize: 11, color: tok.labelTertiary }}>{Math.round(font.bytes / 1024)} KB</span>
                <button type="button" className="dsh-myskin-iconbtn" title={t('remove')} onClick={() => { onRemoveFont(font.family) }}>×</button>
              </div>
            ))}
          </div>
        )}
        <Field label={t('fieldWeight')} clearTitle={t('clearField')} clearable={used('weight')} onClear={() => { clearField('weight', () => { setWeight('') }) }}>
          <Input value={weight} onChange={(e: ChangeEvent<HTMLInputElement>) => { setWeight(e.target.value); touch('weight') }} />
        </Field>
        <Field label={t('fieldLineHeight')} clearTitle={t('clearField')} clearable={used('lineHeight')} onClear={() => { clearField('lineHeight', () => { setLineHeight('') }) }}>
          <Input value={lineHeight} onChange={(e: ChangeEvent<HTMLInputElement>) => { setLineHeight(e.target.value); touch('lineHeight') }} />
        </Field>
        <Field label={t('fieldColor')} clearTitle={t('clearField')} clearable={used('color')} onClear={() => { clearField('color', () => { setColor('') }) }}>
          {colorType(color, setColor, 'color')}<Input value={color} onChange={(e: ChangeEvent<HTMLInputElement>) => { setColor(e.target.value); touch('color') }} />
        </Field>
        <Field label={t('fieldTextAlign')} clearTitle={t('clearField')} clearable={used('textAlign')} onClear={() => { clearField('textAlign', () => { setTextAlign('') }) }}>
          <Input value={textAlign} onChange={(e: ChangeEvent<HTMLInputElement>) => { setTextAlign(e.target.value); touch('textAlign') }} />
        </Field>
      </Section>
      <Section title={t('groupBox')} badge={customBadge(['width', 'height', 'padding', 'margin', 'radius', 'borderWidth', 'borderColor'])}>
        <Field label={t('fieldWidth')} clearTitle={t('clearField')} clearable={used('width')} onClear={() => { clearField('width', () => { setWidth('') }) }}>
          <Input value={width} onChange={(e: ChangeEvent<HTMLInputElement>) => { setWidth(e.target.value); touch('width') }} />
        </Field>
        <Field label={t('fieldHeight')} clearTitle={t('clearField')} clearable={used('height')} onClear={() => { clearField('height', () => { setHeight('') }) }}>
          <Input value={height} onChange={(e: ChangeEvent<HTMLInputElement>) => { setHeight(e.target.value); touch('height') }} />
        </Field>
        <Field label={t('fieldPadding')} clearTitle={t('clearField')} clearable={used('padding')} onClear={() => { clearField('padding', () => { setPadding('') }) }}>
          <Input value={padding} onChange={(e: ChangeEvent<HTMLInputElement>) => { setPadding(e.target.value); touch('padding') }} />
        </Field>
        <Field label={t('fieldMargin')} clearTitle={t('clearField')} clearable={used('margin')} onClear={() => { clearField('margin', () => { setMargin('') }) }}>
          <Input value={margin} onChange={(e: ChangeEvent<HTMLInputElement>) => { setMargin(e.target.value); touch('margin') }} />
        </Field>
        <Field label={t('fieldRadius')} clearTitle={t('clearField')} clearable={used('radius')} onClear={() => { clearField('radius', () => { setRadius('') }) }}>
          <Input value={radius} onChange={(e: ChangeEvent<HTMLInputElement>) => { setRadius(e.target.value); touch('radius') }} />
        </Field>
        <Field label={t('fieldBorderWidth')} clearTitle={t('clearField')} clearable={used('borderWidth')} onClear={() => { clearField('borderWidth', () => { setBorderWidth('') }) }}>
          <Input value={borderWidth} onChange={(e: ChangeEvent<HTMLInputElement>) => { setBorderWidth(e.target.value); touch('borderWidth') }} />
        </Field>
        <Field label={t('fieldBorderColor')} clearTitle={t('clearField')} clearable={used('borderColor')} onClear={() => { clearField('borderColor', () => { setBorderColor('') }) }}>
          {colorType(borderColor, setBorderColor, 'borderColor')}<Input value={borderColor} onChange={(e: ChangeEvent<HTMLInputElement>) => { setBorderColor(e.target.value); touch('borderColor') }} />
        </Field>
      </Section>
      <Section title={t('groupLook')} badge={customBadge(['bg', 'bgImage', 'shadow', 'opacity'])}>
        <Field label={t('fieldBg')} clearTitle={t('clearField')} clearable={used('bg')} onClear={() => { clearField('bg', () => { setBg('') }) }}>
          {colorType(bg, setBg, 'bg')}<Input value={bg} onChange={(e: ChangeEvent<HTMLInputElement>) => { setBg(e.target.value); touch('bg') }} />
        </Field>
        <Field label={t('fieldBgImage')} clearTitle={t('clearField')} clearable={used('bgImage')} onClear={() => { clearField('bgImage', () => { setBgImage('') }) }}>
          <Input value={bgImage} placeholder="url(...)/gradient" onChange={(e: ChangeEvent<HTMLInputElement>) => { setBgImage(e.target.value); touch('bgImage') }} />
          <Button style={btnBase} size="sm" variant="ghost" onClick={() => { bgImageRef.current?.click() }}>{t('embedBg')}</Button>
        </Field>
        <input ref={bgImageRef} type="file" accept="image/*" multiple={false} style={{ display: 'none' }} onChange={onEmbedBg} />
        <Field label={t('fieldShadow')} clearTitle={t('clearField')} clearable={used('shadow')} onClear={() => { clearField('shadow', () => { setShadow('') }) }}>
          <Input value={shadow} onChange={(e: ChangeEvent<HTMLInputElement>) => { setShadow(e.target.value); touch('shadow') }} />
        </Field>
        <Field label={t('fieldOpacity')} clearTitle={t('clearField')} clearable={used('opacity')} onClear={() => { clearField('opacity', () => { setOpacity('') }) }}>
          <Input value={opacity} onChange={(e: ChangeEvent<HTMLInputElement>) => { setOpacity(e.target.value); touch('opacity') }} />
        </Field>
      </Section>
      <Section title={t('groupTransform')} badge={previewTransform === '' && !used('zIndex') ? undefined : t('customBadge')}>
        <Field label={t('fieldTransX')} clearTitle={t('clearField')} clearable={false} onClear={() => undefined}>
          <WheelNudge onStep={(direction, big) => { nudge('transX', direction, big) }}>
            <Input value={transX} placeholder="0" title={t('wheelHint')} onChange={(e: ChangeEvent<HTMLInputElement>) => { transformAuthored.current = true; setTransX(e.target.value); touch('transX') }} onFocus={() => { transformFocusRef.current = true }} onBlur={() => { transformFocusRef.current = false }} />
          </WheelNudge>
          {resetButton(t('resetAxisX'), transX.trim() === '', () => { transformAuthored.current = true; clearField('transX', () => { setTransX('') }) })}
        </Field>
        <Field label={t('fieldTransY')} clearTitle={t('clearField')} clearable={false} onClear={() => undefined}>
          <WheelNudge onStep={(direction, big) => { nudge('transY', direction, big) }}>
            <Input value={transY} placeholder="0" title={t('wheelHint')} onChange={(e: ChangeEvent<HTMLInputElement>) => { transformAuthored.current = true; setTransY(e.target.value); touch('transY') }} onFocus={() => { transformFocusRef.current = true }} onBlur={() => { transformFocusRef.current = false }} />
          </WheelNudge>
          {resetButton(t('resetAxisY'), transY.trim() === '', () => { transformAuthored.current = true; clearField('transY', () => { setTransY('') }) })}
        </Field>
        <Field label={t('fieldScale')} clearTitle={t('clearField')} clearable={false} onClear={() => undefined}>
          <WheelNudge onStep={(direction, big) => { nudge('scale', direction, big) }}>
            <Input value={scale} placeholder="1" title={t('wheelHintScale')} onChange={(e: ChangeEvent<HTMLInputElement>) => { transformAuthored.current = true; setScale(e.target.value); touch('scale') }} onFocus={() => { transformFocusRef.current = true }} onBlur={() => { transformFocusRef.current = false }} />
          </WheelNudge>
          {resetButton(t('resetScale'), scale.trim() === '', () => { transformAuthored.current = true; clearField('scale', () => { setScale('') }) })}
        </Field>
        <Field label={t('scaleSlider')} clearTitle={t('clearField')} clearable={false} onClear={() => undefined}>
          <input type="range" min={20} max={300} step={1} value={Math.round(toNum(scale, 1) * 100)} onChange={(e) => { transformAuthored.current = true; setScale(String(Number(e.target.value) / 100)); touch('scale') }} style={{ flex: '1 1 120px', minWidth: 120 }} />
        </Field>
        {/* 层级（z-index）：和位置放一起，因为「谁盖住谁」是同一个问题。常用值做成快捷键。 */}
        <Field label={t('fieldZIndex')} clearTitle={t('clearField')} clearable={used('zIndex')} onClear={() => { clearField('zIndex', () => { setZIndex('') }) }}>
          <WheelNudge onStep={(direction, big) => { setZIndex(String(stepValue(toNum(zIndex, 0), direction, big ? 10 : 1))); touch('zIndex') }}>
            <Input value={zIndex} placeholder={t('zIndexAuto')} title={t('zIndexHint')} onChange={(e: ChangeEvent<HTMLInputElement>) => { setZIndex(e.target.value); touch('zIndex') }} />
          </WheelNudge>
          {Z_INDEX_PRESETS.map((value) => (
            <Button key={value} style={btnBase} size="sm" variant="ghost" title={t('zIndexPresetHint')}
              onClick={() => { setZIndex(String(value)); touch('zIndex') }}>{String(value)}</Button>
          ))}
        </Field>
        {/* 层级诊断：z-index 只在「有重叠、且没被祖先的层叠上下文关住」时看得出来。
            没变化时这三行直接说明是哪一种情况；置顶/置底按真实竞争者算出数字，点了必然有效果。 */}
        {stacking === undefined ? null : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 4, borderTop: '1px solid ' + tok.borderL2 }}>
            <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary, wordBreak: 'break-word' }}>
              {t('zIndexNow')}z-index {stacking.zIndex} · position {stacking.position} · {t('zIndexContext')}
              {stacking.context === undefined ? t('zIndexContextRoot') : elementLabel(stacking.context, 32) + '（' + (stacking.contextReason ?? '') + '）'}
            </span>
            {stacking.context !== undefined ? (
              <span style={{ fontSize: 11, lineHeight: '16px', color: tok.warn }}>{t('zIndexTrapped')}</span>
            ) : null}
            {stacking.neighbours.length === 0 ? (
              <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('zIndexNoOverlap')}</span>
            ) : (
              <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary, wordBreak: 'break-word' }}>
                {t('zIndexNeighbours').replace('{n}', String(stacking.neighbours.length))}
                {stacking.neighbours.map((entry) => ' · ' + entry.label + ' z=' + entry.zIndex).join('')}
              </span>
            )}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Button style={btnBase} size="sm" variant="outline" title={t('zIndexTopHint')} onClick={() => { applyZIndex(String(stacking.above)) }}>
                {t('zIndexTop').replace('{n}', String(stacking.above))}
              </Button>
              <Button style={btnBase} size="sm" variant="outline" title={t('zIndexBottomHint')} onClick={() => { applyZIndex(String(stacking.below)) }}>
                {t('zIndexBottom').replace('{n}', String(stacking.below))}
              </Button>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          <Button style={btnBase} size="sm" variant="ghost" onClick={() => { transformAuthored.current = true; clearField('transX', () => { setTransX('') }); clearField('transY', () => { setTransY('') }); clearField('scale', () => { setScale('') }) }}>{t('resetTransform')}</Button>
          <span style={{ flex: '1 1 120px', minWidth: 0, fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('transformHint')}</span>
        </div>
      </Section>
      <Section title={t('elementActions')}>
      <label style={fieldLabel}>{t('editText')}<Input value={text} placeholder={beforeRef.current !== '' ? beforeRef.current : t('noEditableText')} onChange={(e: ChangeEvent<HTMLInputElement>) => { setText(e.target.value); touch('text') }} onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); applyText() } }} /></label>
      <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('textLiveHint')}</span>
      {scope === 'group' ? (
        <span style={{ fontSize: 11, lineHeight: '16px', color: tok.warn }}>{t('textScopeNote')}</span>
      ) : null}
      <span style={{ fontSize: 11, lineHeight: '16px', color: textIssue !== undefined && textIssue !== t('textApplied') ? 'var(--dsw-alias-state-warn-primary)' : tok.labelTertiary }}>
        {t('textWhere')}: {hostRef.current === undefined ? '—' : selectorOf(hostRef.current)}{textIssue === undefined ? '' : ' · ' + textIssue}
      </span>
      {hidden || removed ? (
        <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>
          {hidden ? t('hiddenBadge') : ''}{hidden && removed ? ' · ' : ''}{removed ? t('removedBadge') : ''}
        </span>
      ) : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button style={btnBase} variant="outline" onClick={applyText}>{t('applyText')}</Button>
        <Button style={btnBase} variant="ghost" disabled={hostRef.current === undefined} onClick={() => { const host = hostRef.current; if (host !== undefined) onRemoveText(selectorOf(host)) }}>{t('textRevert')}</Button>
        {hidden
          ? <Button style={btnBase} variant="outline" onClick={() => { onUnhide(sel) }}>{t('unhide')}</Button>
          : <Button style={btnBase} variant="ghost" onClick={() => { onHide(sel) }}>{t('hide')}</Button>}
        {removed
          ? <Button style={btnBase} variant="outline" onClick={() => { onRestoreControl(sel) }}>{t('restoreControl')}</Button>
          : <Button style={btnBase} variant="ghost" icon={<IconTrash size={16} />} onClick={() => { onRemoveControl(sel) }}>{t('removeControl')}</Button>}
        <Button style={btnBase} variant="ghost" onClick={() => { onRemove(sel) }}>{t('clearElement')}</Button>
      </div>
      </Section>
      </>)}



    </div>
  )
}

/** Build a structural selector for a real DSH node, relative to the app root. */

interface TokenPanelProps {
  tokens: TokenOverrides
  onToggle: (name: string, on: boolean) => void
  onChange: (name: string, light: string, dark: string) => void
  t: (key: MySkinKey) => string
}


/** Light CSS syntax highlighting for the editor preview (best-effort). */
function highlightCss(css: string): string {
  const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  let html = esc(css)
  html = html.replace(/([a-zA-Z-]+)(\s*:)/g, '<span style="color:#f472b6">$1</span>$2')
  html = html.replace(/:\s*([^;]+)(;)/g, ':<span style="color:#86efac">$1</span>$2')
  html = html.replace(/(-?\d+\.?\d*)(px|%|rem|em|fr|deg|s|ms)?/g, '<span style="color:#7dd3fc">$1$2</span>')
  return html
}

/** A small standard code editor: line numbers + auto-indent + monospace. */
function CodeEditor({ value, onChange }: { value: string; onChange: (v: string) => void }): ReactNode {
  const gutterRef = useRef<HTMLDivElement | null>(null)
  const preRef = useRef<HTMLPreElement | null>(null)
  const taRef = useRef<HTMLTextAreaElement | null>(null)
  const lines = value.split('\n')
  const codeFont = 'var(--ds-font-family-code, "SFMono-Regular", Consolas, monospace)'
  const syncScroll = (el: HTMLTextAreaElement): void => {
    if (gutterRef.current !== null) gutterRef.current.scrollTop = el.scrollTop
    if (preRef.current !== null) { preRef.current.scrollTop = el.scrollTop; preRef.current.scrollLeft = el.scrollLeft }
  }
  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    const el = e.currentTarget
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = el.selectionStart, end = el.selectionEnd
      onChange(value.slice(0, start) + '  ' + value.slice(end))
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 2 })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const start = el.selectionStart
      const before = value.slice(0, start), after = value.slice(el.selectionEnd)
      const lineStart = before.lastIndexOf('\n') + 1
      const indent = (before.slice(lineStart).match(/^\s+/) || [''])[0]
      onChange(before + '\n' + indent + after)
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 1 + indent.length })
    }
  }
  return (
    <div style={{ position: 'relative', border: '1px solid ' + tok.borderL2, borderRadius: 8, background: tok.bgBase, overflow: 'hidden', fontFamily: codeFont, fontSize: 12, lineHeight: '18px' }}>
      <div style={{ display: 'flex' }}>
        <div ref={gutterRef} style={{ flex: 'none', padding: '8px 6px', minWidth: 28, textAlign: 'right', color: tok.labelTertiary, fontFamily: codeFont, fontSize: 12, lineHeight: '18px', userSelect: 'none', background: tok.bgBase, overflow: 'hidden', maxHeight: 150 }}>
          {lines.map((_, i) => <div key={i} style={{ height: '18px' }}>{i + 1}</div>)}
        </div>
        <div style={{ position: 'relative', flex: 1 }}>
          <pre ref={preRef} aria-hidden style={{ position: 'absolute', inset: 0, margin: 0, padding: '8px 10px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: codeFont, fontSize: 12, lineHeight: '18px', color: tok.labelPrimary, pointerEvents: 'none', overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: highlightCss(value) + '\n' }} />
          <textarea ref={taRef} value={value} onChange={(e) => { onChange(e.target.value); syncScroll(e.target) }} onKeyDown={onKey} onScroll={(e) => syncScroll(e.currentTarget)} spellCheck={false} rows={6}
            style={{ position: 'relative', display: 'block', width: '100%', height: 150, padding: '8px 10px', background: 'transparent', color: 'transparent', caretColor: tok.labelPrimary, border: 'none', outline: 'none', resize: 'vertical', fontFamily: codeFont, fontSize: 12, lineHeight: '18px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: 96 }} />
        </div>
      </div>
    </div>
  )
}

/** Visual token palette for the canvas: group + toggle + light/dark picker. */

interface TokenPanelProps {
  tokens: TokenOverrides
  onToggle: (name: string, on: boolean) => void
  onChange: (name: string, light: string, dark: string) => void
  t: (key: MySkinKey) => string
}

function TokenPanel({ tokens, onToggle, onChange, t }: TokenPanelProps): ReactNode {
  const groups: TokenGroup[] = ['background', 'border', 'brand', 'label', 'button', 'interactive']
  const groupLabel = (g: TokenGroup): string => t(TOKEN_GROUP_KEYS[g] as MySkinKey)
  const current = (name: string): string => tokens[name]?.light ?? (getComputedStyle(document.body).getPropertyValue(name).trim() || '#808080')
  const panelStyle: CSSProperties = {
    width: '100%', maxHeight: 360, overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 10, padding: 10,
    color: tok.labelPrimary, fontSize: 12,
  }
  const groupStyle: CSSProperties = { fontSize: 12, lineHeight: '18px', fontWeight: 600, color: tok.labelTertiary, marginTop: 4 }
  const rowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }
  const nameStyle: CSSProperties = { fontSize: 11, lineHeight: '16px', fontFamily: 'var(--ds-font-family-code, monospace)', color: tok.labelSecondary, minWidth: 150, flex: 1 }
  const pick = (v: string): string => toHex(v) ?? '#000000'
  return (
    <div className="dsh-myskin-card dsh-myskin-scroll" style={panelStyle}>
      <strong style={{ fontSize: 13, lineHeight: '20px', fontWeight: 500 }}>{t('tokenPanel')}</strong>
      <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary }}>{t('light')} / {t('dark')}</span>
      {groups.map((g) => {
        const items = TOKEN_CATALOG.filter((item) => item.group === g)
        if (items.length === 0) return null
        return (
          <div key={g} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={groupStyle}>{groupLabel(g)}</span>
            {items.map((item) => {
              const on = Object.prototype.hasOwnProperty.call(tokens, item.name)
              const cur = current(item.name)
              return (
                <div key={item.name} className="dsh-myskin-field" style={rowStyle}>
                  <input type="checkbox" checked={on} onChange={(e) => { onToggle(item.name, e.target.checked) }} style={{ accentColor: 'var(--dsw-alias-brand-primary)', width: 14, height: 14, cursor: 'pointer', flex: 'none' }} />
                  <span style={{ width: 14, height: 14, borderRadius: 5, border: '1px solid ' + tok.borderL2, background: on ? cur : tok.bgLayer2, flex: 'none' }} />
                  <span style={nameStyle}>{item.name}</span>
                  {on ? (
                    <>
                      <input type="color" value={pick(tokens[item.name].light)} onChange={(e) => { onChange(item.name, e.target.value, tokens[item.name].dark) }} style={{ width: 24, height: 22, padding: 0, border: '1px solid ' + tok.borderL2, borderRadius: 4, background: 'transparent', cursor: 'pointer' }} />
                      <input type="color" value={pick(tokens[item.name].dark)} onChange={(e) => { onChange(item.name, tokens[item.name].light, e.target.value) }} style={{ width: 24, height: 22, padding: 0, border: '1px solid ' + tok.borderL2, borderRadius: 4, background: 'transparent', cursor: 'pointer' }} />
                    </>
                  ) : null}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// selectorOf() lives in skin-engine.ts: it is portal-aware (dialogs and menus mount
// beside #root) and unit-tested there.
