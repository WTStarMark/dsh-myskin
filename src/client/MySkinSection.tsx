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

import { Fragment, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { ChangeEvent, CSSProperties, MouseEvent, PointerEvent, ReactNode } from 'react'
import { Button, Pill, Input, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { IconClose, IconPersonalization, IconPlus, IconTrash } from './icons.ts'
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { InjectFace } from '@deepseek-ai/dsh-client-ui-slots'
import type { ThemeRuntime } from '@deepseek-ai/dsh-client-ui-theme/client'
import { parseSkin, EMPTY_SKIN, type BlendMode, type EmbeddedImage, type NamedSkin, type SkinSettings, type TokenOverrides } from '../skin-schema.ts'
import { backgroundSurfaceRules, currentSettingsPageKey } from './skin-engine.ts'
import type { MySkinKey } from './locales.ts'
import { PRESETS } from './presets.ts'
import { TOKEN_CATALOG, TOKEN_GROUP_KEYS, type TokenGroup } from './token-catalog.ts'

/** Native settings-panel tokens. */
const tok = {
  labelPrimary: 'var(--dsw-alias-label-primary)',
  labelSecondary: 'var(--dsw-alias-label-secondary)',
  labelTertiary: 'var(--dsw-alias-label-tertiary)',
  borderL2: 'var(--dsw-alias-border-l2)',
  bgOverlay: 'var(--dsw-alias-bg-overlay)',
  bgBase: 'var(--dsw-alias-bg-base)',
  brand: 'var(--dsw-alias-brand-primary)',
  success: 'var(--dsw-alias-state-success-primary)',
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

/** Clamp a number to [min, max]; NaN -> min. */
function clampNum(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min
  return Math.min(max, Math.max(min, v))
}

/** Run a drag/resize gesture with pointer capture, ending cleanly on release. */
function beginPointerDrag(e: PointerEvent, onMove: (ev: PointerEvent) => void): void {
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

/** Persist the whole skin document to the durable settings namespace. */
function persist(scope: ConfigForm<SkinSettings>, skin: SkinSettings): Promise<boolean[]> {
  return Promise.all([
    scope.set('enabled', skin.enabled),
    scope.set('tokens', skin.tokens),
    scope.set('css', skin.css),
    scope.set('text', skin.text),
    scope.set('canvas', skin.canvas),
    scope.set('layers', skin.layers),
    scope.set('content', skin.content ?? {}),
    scope.set('library', skin.library),
  ])
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
function openSkinEditor(initial: SkinSettings, t: (k: MySkinKey) => string, onCommit: (next: SkinSettings) => Promise<boolean>, onClose: () => void): void {
  closeSkinEditor()
  const container = document.createElement('div')
  document.body.appendChild(container)
  editorHost = { root: createRoot(container), container }
  editorHost.root.render(
    <SkinCanvas initial={initial} t={t} onCommit={async (next) => { const ok = await onCommit(next); if (ok) closeSkinEditor(); return ok }} onClose={() => { onClose(); closeSkinEditor() }} />,
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
  const persistNow = async (next: SkinSettings): Promise<boolean> => {
    setSkin(parseSkin(next))
    try {
      const accepted = await persist(scope, next)
      return accepted.every((ok) => ok)
    } catch { return false }
  }

  const update = (next: SkinSettings): void => {
    void persistNow(next).then((ok) => { if (!ok) setNotice('save failed') })
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
  const onExport = (): void => {
    const blob = new Blob([JSON.stringify(skin, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dsh-myskin.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  const onImportFile = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file === undefined) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? ''))
        update(parseSkin(parsed as SkinSettings))
        setNotice(t('saved'))
      } catch {
        setNotice(t('importError'))
      }
    }
    reader.readAsText(file)
    e.target.value = ''
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
        <Button style={btnBase} variant="outline" icon={<IconPersonalization size={16} />} onClick={() => { close?.(); openSkinEditor(skin, t, (next) => persistNow(next), () => {}) }}>{t('edit')}</Button>
        <Button style={btnBase} variant="outline" onClick={onPreview}>{t('preview')}</Button>
        <Button style={btnBase} onClick={applyNow}>{t('apply')}</Button>
        <Button style={btnBase} variant="ghost" onClick={reset}>{t('reset')}</Button>
        <span style={{ flex: 1 }} />
        <Button style={btnBase} size="sm" variant="ghost" onClick={saveSkin}>{t('saveSkin')}</Button>
        <Button style={btnBase} size="sm" variant="ghost" onClick={onExport}>{t('exportSkin')}</Button>
        <Button style={btnBase} size="sm" variant="ghost" onClick={() => { importRef.current?.click() }}>{t('importSkin')}</Button>
        <input ref={importRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={onImportFile} />
      </div>

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
        <Input value={skinName} autoFocus onChange={(e) => { setSkinName(e.target.value) }}
          onKeyDown={(e) => { if (e.key === 'Enter') confirmSkinName() }} />
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

/** Longest edge a stored skin image is downscaled to (keeps the settings document small). */
const MAX_IMAGE_EDGE = 2048

/**
 * Read an image file as a data URL, downscaling anything larger than
 * {@link MAX_IMAGE_EDGE}. The document is written to the profile patch and
 * re-sent on every edit, so an untouched 8 MB photo would make every save slow.
 * @param file - the picked image file.
 * @returns the data URL to store ('' when the file could not be read).
 */
function readImageFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onerror = () => resolve('')
    reader.onload = () => {
      const url = String(reader.result ?? '')
      if (url === '') { resolve(''); return }
      const image = new Image()
      image.onerror = () => resolve(url)
      image.onload = () => {
        const edge = Math.max(image.naturalWidth, image.naturalHeight)
        if (edge <= MAX_IMAGE_EDGE || typeof document === 'undefined') { resolve(url); return }
        const scale = MAX_IMAGE_EDGE / edge
        const target = document.createElement('canvas')
        target.width = Math.max(1, Math.round(image.naturalWidth * scale))
        target.height = Math.max(1, Math.round(image.naturalHeight * scale))
        const context = target.getContext('2d')
        if (context === null) { resolve(url); return }
        context.drawImage(image, 0, 0, target.width, target.height)
        try { resolve(target.toDataURL('image/webp', 0.9)) } catch { resolve(url) }
      }
      image.src = url
    }
    reader.readAsDataURL(file)
  })
}

interface CanvasProps {
  initial: SkinSettings
  onClose: () => void
  onCommit: (next: SkinSettings) => Promise<boolean>
  t: (key: MySkinKey) => string
}

/** Full-screen canvas editor over the live DSH DOM (transparent overlay). */
function SkinCanvas({ initial, onClose, onCommit, t }: CanvasProps): ReactNode {
  const [draft, setDraft] = useState<SkinSettings>(() => parseSkin(initial))
  const [selected, setSelected] = useState<Element | undefined>(undefined)
  const [mode, setMode] = useState<'edit' | 'interact'>('edit')
  const [showTokens, setShowTokens] = useState(false)
  const [hint, setHint] = useState<string | undefined>(undefined)
  const embedBgRef = useRef<HTMLInputElement | null>(null)
  const pageBgRef = useRef<HTMLInputElement | null>(null)
  const [, bump] = useState(0)
  const liveStyleRef = useRef<HTMLStyleElement | null>(null)

  // Undo/redo history (deep-copied snapshots).
  const [, bumpHistory] = useState(0)
  const draftRef = useRef(draft)
  useEffect(() => { draftRef.current = draft }, [draft])
  const pastRef = useRef<SkinSettings[]>([])
  const futureRef = useRef<SkinSettings[]>([])
  const snapshot = (): void => {
    pastRef.current = [...pastRef.current, JSON.parse(JSON.stringify(draftRef.current))]
    futureRef.current = []
    bumpHistory((n) => n + 1)
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

  // Keep the selection highlight tracking scroll/resize.  
  useEffect(() => {
    const onMove = (): void => bump((n) => n + 1)
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => { window.removeEventListener('scroll', onMove, true); window.removeEventListener('resize', onMove) }
  }, [])

  // Capture gestures on the REAL page while in edit mode. The overlay itself is
  // pointer-events:none, so the app underneath stays visible, scrollable and
  // hoverable; we intercept in the capture phase and select the element instead.
  // Our own panels carry data-dsh-myskin-ui="1" and always pass through.
  useEffect(() => {
    if (mode !== 'edit') return
    const own = (target: EventTarget | null): boolean =>
      target instanceof Element && target.closest('[data-dsh-myskin-ui="1"]') !== null
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
      setSelected(hitTest(e.clientX, e.clientY))
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('click', onClick, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Live CSS + background preview: an owned style tag over the real DOM.
  useEffect(() => {
    const rules: string[] = []
    if (draft.canvas.background !== undefined && draft.canvas.background !== '') {
      rules.push('body { background-image: url("' + draft.canvas.background + '") !important; background-size: cover !important; background-position: center !important; }')
      rules.push(...backgroundSurfaceRules(document))
    }
    for (const { selector, rule } of draft.css) {
      if (selector !== '' && rule !== '') rules.push(selector + ' { ' + rule + ' }')
    }
    for (const img of draft.canvas.images) {
      if (img.selector !== '' && img.url !== '') {
        rules.push(img.selector + ' { position: relative; }')
        const blendCss = img.blend !== undefined && img.blend !== 'normal' ? ' mix-blend-mode: ' + img.blend + ';' : ''
        rules.push(img.selector + '::after { content: ""; position: absolute; inset: 0; background-image: url("' + img.url + '"); background-repeat: no-repeat; background-position: ' + img.x + 'px ' + img.y + 'px; background-size: ' + img.w + 'px ' + img.h + 'px; opacity: ' + (img.opacity ?? 1) + '; pointer-events: none; z-index: 1;' + blendCss + ' }')
      }
    }
    const d = document
    if (rules.length > 0) {
      if (liveStyleRef.current === null) {
        const tag = d.createElement('style')
        tag.dataset.live = 'dsh-myskin'
        tag.id = 'dsh-myskin-live'
        d.head.appendChild(tag)
        liveStyleRef.current = tag
      }
      liveStyleRef.current.textContent = rules.join('\n')
    } else if (liveStyleRef.current !== null) {
      liveStyleRef.current.remove()
      liveStyleRef.current = null
    }
  }, [draft.css, draft.canvas.background, draft.canvas.images])

  // Remove the live style tag on unmount.
  useEffect(() => () => { if (liveStyleRef.current !== null) { liveStyleRef.current.remove(); liveStyleRef.current = null } }, [])

  const hitTest = (clientX: number, clientY: number): Element | undefined => {
    const d = document
    const excluded = (el: Element): boolean =>
      el.getAttribute('data-dsh-myskin-ui') === '1'
      || el.closest('[data-dsh-myskin-ui="1"]') !== null
      || el === d.body || el === d.documentElement || el === d.getElementById('root')
    for (const el of d.elementsFromPoint(clientX, clientY)) {
      if (excluded(el)) continue
      // Prefer the nearest interactive ancestor (button/link/input/…) so clicking a
      // button styles the whole button, not the inner SVG path/icon it contains.
      const interactive = el.closest('button, a, input, textarea, select, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="menuitemcheckbox"], [role="checkbox"], [role="switch"]')
      if (interactive !== null && !excluded(interactive)) return interactive
      return el
    }
    return undefined
  }

  const applyStyle = (selector: string, declaration: string): void => {
    snapshot()
    const rules = draft.css.filter((r) => r.selector !== selector)
    setDraft({ ...draft, css: [...rules, { selector, rule: declaration }] })
  }
  const liveApplyRef = useRef(false)
  const liveApply = (selector: string, declaration: string): void => {
    if (!liveApplyRef.current) { snapshot(); liveApplyRef.current = true }
    const rules = draft.css.filter((r) => r.selector !== selector)
    setDraft({ ...draft, css: [...rules, { selector, rule: declaration }] })
  }
  const hideElement = (selector: string): void => {
    snapshot()
    const rules = draft.css.filter((r) => r.selector !== selector)
    setDraft({ ...draft, css: [...rules, { selector, rule: 'display: none !important' }] })
  }
  const addText = (selector: string, before: string, after: string): void => {
    snapshot()
    const rest = draft.text.filter((o) => o.selector !== selector || o.before !== before)
    setDraft({ ...draft, text: [...rest, { selector, before, after }] })
  }
  const removeSelector = (selector: string): void => {
    snapshot()
    setDraft({
      ...draft,
      css: draft.css.filter((r) => r.selector !== selector),
      text: draft.text.filter((o) => o.selector !== selector),
    })
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
    void readImageFile(file).then((url) => {
      if (url === '') { setHint(t('applyFailed')); return }
      snapshot()
      const id = 'embed-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
      target.setAttribute('data-dsh-myskin-embed', id)
      const img: EmbeddedImage = { id, selector: '[data-dsh-myskin-embed="' + id + '"]', fallbackSelector: selectorOf(target), url, x: 0, y: 0, w: 320, h: 200, opacity: 0.9, pageKey: currentSettingsPageKey(target.ownerDocument) }
      setDraft({ ...draft, canvas: { ...draft.canvas, images: [...draft.canvas.images, img] } })
    })
  }
  const onPageBgFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file === undefined) return
    void readImageFile(file).then((url) => {
      if (url === '') { setHint(t('applyFailed')); return }
      snapshot()
      setDraft({ ...draft, canvas: { ...draft.canvas, background: url } })
    })
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
  const onEmbedPointerDown = (e: PointerEvent, img: EmbeddedImage): void => {
    e.preventDefault()
    snapshot()
    const startX = e.clientX, startY = e.clientY, ox = img.x, oy = img.y
    beginPointerDrag(e, (ev) => { setEmbedLive(img.id, { x: ox + (ev.clientX - startX), y: oy + (ev.clientY - startY) }) })
  }
  const startEmbedResize = (e: PointerEvent, img: EmbeddedImage): void => {
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

  const resetDraft = (): void => { snapshot(); setDraft(parseSkin(EMPTY_SKIN)); setSelected(undefined) }
  const onApply = (): void => {
    setHint(undefined)
    void onCommit({ ...draft, enabled: true }).then((ok) => { if (!ok) setHint(t('applyFailed')) })
  }
  const toggleMode = (): void => { setMode(mode === 'edit' ? 'interact' : 'edit') }

  const selRect = selected !== undefined && selected.isConnected ? selected.getBoundingClientRect() : null

  return (
    <div data-dsh-myskin-ui="1" data-dsh-myskin-canvas="1" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', pointerEvents: 'none', color: tok.labelPrimary }}>
      <div data-dsh-myskin-ui="1" style={{ pointerEvents: 'auto', flex: 'none', minHeight: 48, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '6px 16px', background: tok.bgOverlay, borderBottom: '1px solid var(--dsw-alias-border-l1)', zIndex: 10005, color: tok.labelPrimary }}>
        <IconPersonalization size={16} />
        <span style={{ fontSize: 14, lineHeight: '22px', fontWeight: 500 }}>{t('title')} — {t('edit')}</span>
        <span style={{ flex: 1 }} />
        <Button style={btnBase} size="sm" variant={mode === 'edit' ? 'primary' : 'ghost'} onClick={toggleMode}>{mode === 'edit' ? t('interactMode') : t('selectMode')}</Button>
        <Button style={btnBase} size="sm" variant="ghost" onClick={undo} disabled={pastRef.current.length === 0}>{t('undo')}</Button>
        <Button style={btnBase} size="sm" variant="ghost" onClick={redo} disabled={futureRef.current.length === 0}>{t('redo')}</Button>
        <Button style={btnBase} size="sm" variant={showTokens ? 'primary' : 'ghost'} onClick={() => { setShowTokens(!showTokens) }}>{t('tokenPanel')}</Button>
        <Button style={btnBase} variant="outline" icon={<IconPlus size={16} />} onClick={() => { if (selected === undefined) setHint(t('selectFirst')); else embedBgRef.current?.click() }}>{t('embedImage')}</Button>
        <Button style={btnBase} variant="outline" icon={<IconPlus size={16} />} onClick={() => { pageBgRef.current?.click() }}>{t('backgroundImage')}</Button>
        {draft.canvas.background !== undefined && draft.canvas.background !== '' ? (
          <Button style={btnBase} size="sm" variant="ghost" onClick={clearPageBg}>{t('clearBackground')}</Button>
        ) : null}
        <span style={{ fontSize: 12, lineHeight: '18px', color: tok.labelTertiary }}>{mode === 'edit' ? t('editHint') : t('interactHint')}</span>
        {hint !== undefined ? <span style={{ fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-state-warn-primary)' }}>{hint}</span> : null}
        <Button style={btnBase} onClick={onApply}>{t('apply')}</Button>
        <Button style={btnBase} variant="ghost" icon={<IconTrash size={16} />} onClick={resetDraft}>{t('reset')}</Button>
        <Button style={btnBase} variant="ghost" icon={<IconClose size={16} />} onClick={onClose}>{t('close')}</Button>
      </div>
      <div style={{ display: 'flex', flex: 1, minHeight: 0, pointerEvents: 'none' }}>
        <div style={{ flex: 1 }} />
        <div data-dsh-myskin-ui="1" style={{ pointerEvents: 'auto', flex: 'none', width: 340, overflow: 'auto', padding: 12, background: tok.bgOverlay, borderLeft: '1px solid ' + tok.borderL2, zIndex: 10004 }}>
          {mode === 'edit' ? (
            selected !== undefined ? (
              <Inspector target={selected} draft={draft} onSample={liveApply} onText={addText} onRemove={removeSelector} onEmbedOpacity={(id, v) => updateEmbed(id, { opacity: clampNum(v, 0, 1) })} onEmbedBlend={(id, v) => updateEmbed(id, { blend: v })} onRemoveEmbed={removeEmbed} onHide={hideElement} t={t} />
            ) : (
              <span style={{ fontSize: 12, lineHeight: '18px', color: tok.labelTertiary }}>{t('noSelection')}</span>
            )
          ) : (
            <span style={{ fontSize: 12, lineHeight: '18px', color: tok.labelTertiary }}>{t('interactHint')}</span>
          )}
        </div>
      </div>
      <input ref={embedBgRef} type="file" accept="image/*" multiple={false} style={{ display: 'none' }} onChange={onEmbedBgFile} />
      <input ref={pageBgRef} type="file" accept="image/*" multiple={false} style={{ display: 'none' }} onChange={onPageBgFile} />
      {mode === 'edit' && selRect !== null ? (
        <div data-dsh-myskin-ui="1" style={{ position: 'fixed', left: selRect.left, top: selRect.top, width: selRect.width, height: selRect.height, border: '2px solid ' + tok.brand, boxShadow: '0 0 0 1px var(--dsw-alias-bg-overlay)', borderRadius: 2, pointerEvents: 'none', zIndex: 10001 }} />
      ) : null}
      {draft.canvas.images.map((img) => {
        const container = document.querySelector(img.selector) as HTMLElement | null
        const crect = container !== null ? container.getBoundingClientRect() : null
        if (crect === null) return null
        const zx = crect.left + (img.x || 0), zy = crect.top + (img.y || 0)
        return (
          <Fragment key={img.id}>
            <div data-dsh-myskin-ui="1" onPointerDown={(e) => { onEmbedPointerDown(e, img) }} onClick={(e) => { e.stopPropagation() }}
              style={{ position: 'fixed', left: zx + 'px', top: zy + 'px', width: img.w + 'px', height: img.h + 'px', border: '2px dashed ' + tok.brand, background: 'transparent', pointerEvents: mode === 'edit' ? 'auto' : 'none', cursor: 'move', zIndex: 10001 }} />
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
      {mode === 'edit' && showTokens ? (
        <div data-dsh-myskin-ui="1" style={{ position: 'fixed', bottom: 16, left: 16, zIndex: 10004, pointerEvents: 'auto' }}>
          <TokenPanel tokens={draft.tokens} onToggle={toggleToken} onChange={setToken} t={t} />
        </div>
      ) : null}
    </div>
  )
}
interface InspectorProps {
  target: Element
  draft: SkinSettings
  onSample: (selector: string, declaration: string) => void
  onText: (selector: string, before: string, after: string) => void
  onRemove: (selector: string) => void
  onEmbedOpacity: (id: string, v: number) => void
  onEmbedBlend: (id: string, v: BlendMode) => void
  onRemoveEmbed: (id: string) => void
  onHide: (selector: string) => void
  t: (key: MySkinKey) => string
}

function Inspector({ target, draft, onSample, onText, onRemove, onEmbedOpacity, onEmbedBlend, onRemoveEmbed, onHide, t }: InspectorProps): ReactNode {
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
  const [bgImage, setBgImage] = useState('')
  const [text, setText] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [geek, setGeek] = useState(false)
  const [geekCss, setGeekCss] = useState('')
  const [geekSel, setGeekSel] = useState('')
  useEffect(() => {
    setGeekSel(selectorOf(target))
  }, [target])
  const applyGeek = (): void => {
    if (geekSel.trim() !== '' && geekCss.trim() !== '') onSample(geekSel, geekCss.trim())
  }
  useEffect(() => {
    if (!geek) return
    setGeekCss(draft.css.find((r) => r.selector === geekSel)?.rule ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geek, target, geekSel, draft.css])
  const beforeRef = useRef('')
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
    const sel = selectorOf(target)
    const rule = draft.css.find((r) => r.selector === sel)?.rule
    if (rule !== undefined && rule.trim() !== '') {
      // This state has its own saved rule -> load its values so the fields visibly
      // differ from 正常 (normal) and match exactly what this state overrides.
      const d = parseStateRule(rule)
      setFontSize(d['font-size'] ?? ''); setColor(d['color'] ?? ''); setBg(d['background-color'] ?? '')
      setWeight(d['font-weight'] ?? ''); setRadius(d['border-radius'] ?? ''); setBorderColor(d['border-color'] ?? '')
      setBorderWidth(d['border-width'] ?? ''); setPadding(d['padding'] ?? ''); setWidth(d['width'] ?? '')
      setHeight(d['height'] ?? ''); setMargin(d['margin'] ?? ''); setLineHeight(d['line-height'] ?? '')
      setOpacity(d['opacity'] ?? ''); setShadow(d['box-shadow'] ?? ''); setTextAlign(d['text-align'] ?? '')
      setBgImage(d['background-image'] ?? '')
      setTouched({
        fontSize: d['font-size'] !== undefined, color: d['color'] !== undefined, bg: d['background-color'] !== undefined,
        bgImage: d['background-image'] !== undefined, weight: d['font-weight'] !== undefined, radius: d['border-radius'] !== undefined,
        borderColor: d['border-color'] !== undefined, borderWidth: d['border-width'] !== undefined, padding: d['padding'] !== undefined,
        width: d['width'] !== undefined, height: d['height'] !== undefined, margin: d['margin'] !== undefined,
        lineHeight: d['line-height'] !== undefined, opacity: d['opacity'] !== undefined, shadow: d['box-shadow'] !== undefined,
        textAlign: d['text-align'] !== undefined,
      })
      beforeRef.current = ''
      setText('')
      return
    }
    // No saved rule for this state yet: show the element's current appearance as baseline.
    const css = getComputedStyle(target)
    setFontSize(css.fontSize); setColor(css.color); setBg(css.backgroundColor); setWeight(css.fontWeight)
    setRadius(css.borderRadius); setBorderColor(css.borderTopColor); setBorderWidth(css.borderTopWidth); setPadding(css.padding)
    setWidth(css.width); setHeight(css.height); setMargin(css.margin); setLineHeight(css.lineHeight)
    setOpacity(css.opacity); setShadow(css.boxShadow); setTextAlign(css.textAlign)
    const direct = Array.from(target.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && (n as Text).data.trim() !== '')
    const isField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
    const raw = isField ? (target as HTMLInputElement).placeholder : (direct !== undefined ? (direct as Text).data : '')
    beforeRef.current = raw.trim()
    setText(raw.trim())
    setTouched({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  const touch = (field: string): void => { setTouched((prev) => ({ ...prev, [field]: true })) }
  const used = (field: string): boolean => touched[field] === true
  const colorType = (v: string, set: (x: string) => void, field: string): ReactNode => (
    <input type="color" value={toHex(v) ?? '#000000'} onChange={(e) => { set(e.target.value); touch(field) }}
      style={{ width: 28, height: 24, border: '1px solid ' + tok.borderL2, borderRadius: 4, background: tok.bgBase, padding: 0, cursor: 'pointer' }} />
  )

  const applySample = (): void => {
    const decl = [
      used('fontSize') ? 'font-size: ' + fontSize : '',
      used('color') ? 'color: ' + color : '',
      used('bg') ? 'background-color: ' + bg : '',
      used('bgImage') ? 'background-image: ' + bgImage + '; background-size: cover; background-position: center;' : '',
      used('weight') ? 'font-weight: ' + weight : '',
      used('radius') ? 'border-radius: ' + radius : '',
      used('borderColor') ? 'border-color: ' + borderColor : '',
      used('borderWidth') ? 'border-width: ' + borderWidth : '',
      used('padding') ? 'padding: ' + padding : '',
      used('width') ? 'width: ' + width : '',
      used('height') ? 'height: ' + height : '',
      used('margin') ? 'margin: ' + margin : '',
      used('lineHeight') ? 'line-height: ' + lineHeight : '',
      used('opacity') ? 'opacity: ' + opacity : '',
      used('shadow') ? 'box-shadow: ' + shadow : '',
      used('textAlign') ? 'text-align: ' + textAlign : '',
    ].filter((s) => s !== '').join('; ')
    if (decl !== '') onSample(selectorOf(target), decl)
  }
  // Real-time preview: apply the combined declaration whenever a field value,
  // the interaction state, or the touched set changes (runs after React settles).
  useEffect(() => {
    const decl = [
      used('fontSize') ? 'font-size: ' + fontSize + ' !important' : '',
      used('color') ? 'color: ' + color + ' !important' : '',
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
      used('shadow') ? 'box-shadow: ' + shadow + ' !important' : '',
      used('textAlign') ? 'text-align: ' + textAlign + ' !important' : '',
    ].filter((s) => s !== '').join('; ')
    if (decl !== '') onSample(selectorOf(target), decl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontSize, color, bg, bgImage, weight, radius, borderColor, borderWidth, padding, width, height, margin, lineHeight, opacity, shadow, textAlign, touched])
  const applyText = (): void => {
    if (text.trim() !== '' && beforeRef.current !== '' && text.trim() !== beforeRef.current) {
      onText(selectorOf(target), beforeRef.current, text.trim())
    }
  }

  const fieldLabel: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontSize: 12, lineHeight: '20px', width: '100%' }

  const style: CSSProperties = {
    position: 'relative', zIndex: 5, width: '100%', overflow: 'auto',
    display: 'flex', flexDirection: 'column', gap: 10, color: tok.labelPrimary,
  }


  return (
    <div style={style}>
      <strong style={{ fontSize: 14, lineHeight: '22px', fontWeight: 500 }}>{t('editMenu')}</strong>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderBottom: '1px solid ' + tok.borderL2, paddingBottom: 8 }}>
        <span style={{ fontSize: 12, lineHeight: '18px', color: tok.labelTertiary }}>{t('target')}</span>
        <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelSecondary, fontFamily: 'var(--ds-font-family-code, monospace)', wordBreak: 'break-all' }}>{target.tagName.toLowerCase()}</span>
        <span style={{ fontSize: 11, lineHeight: '16px', color: tok.labelTertiary, fontFamily: 'var(--ds-font-family-code, monospace)', wordBreak: 'break-all' }}>{selectorOf(target)}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Button style={btnBase} size="sm" variant={geek ? 'primary' : 'ghost'} onClick={() => { setGeek(!geek) }}>{t('geekMode')}</Button>
      </div>
      {geek ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid ' + tok.borderL2, paddingBottom: 8, marginBottom: 2 }}>
          <label style={fieldLabel}>{t('target')}<Input value={geekSel} onChange={(e) => { setGeekSel(e.target.value) }} placeholder="#root > … :hover" /></label>
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
      <label style={fieldLabel}>字号<Input value={fontSize} onChange={(e) => { setFontSize(e.target.value); touch('fontSize') }} /></label>
      <label style={fieldLabel}>颜色{colorType(color, setColor, 'color')}<Input value={color} onChange={(e) => { setColor(e.target.value); touch('color') }} /></label>
      <label style={fieldLabel}>背景色{colorType(bg, setBg, 'bg')}<Input value={bg} onChange={(e) => { setBg(e.target.value); touch('bg') }} /></label>
      <label style={fieldLabel}>背景图<Input value={bgImage} placeholder="url(...)/gradient" onChange={(e) => { setBgImage(e.target.value); touch('bgImage') }} /><Button style={btnBase} size="sm" variant="ghost" onClick={() => { bgImageRef.current?.click() }}>{t('embedBg')}</Button></label>
      <input ref={bgImageRef} type="file" accept="image/*" multiple={false} style={{ display: 'none' }} onChange={onEmbedBg} />
      <label style={fieldLabel}>字重<Input value={weight} onChange={(e) => { setWeight(e.target.value); touch('weight') }} /></label>
      <label style={fieldLabel}>圆角<Input value={radius} onChange={(e) => { setRadius(e.target.value); touch('radius') }} /></label>
      <label style={fieldLabel}>边框宽<Input value={borderWidth} placeholder="width" onChange={(e) => { setBorderWidth(e.target.value); touch('borderWidth') }} /></label>
      <label style={fieldLabel}>边框色{colorType(borderColor, setBorderColor, 'borderColor')}<Input value={borderColor} placeholder="color" onChange={(e) => { setBorderColor(e.target.value); touch('borderColor') }} /></label>
      <label style={fieldLabel}>内边距<Input value={padding} onChange={(e) => { setPadding(e.target.value); touch('padding') }} /></label>
      <label style={fieldLabel}>宽<Input value={width} onChange={(e) => { setWidth(e.target.value); touch('width') }} /></label>
      <label style={fieldLabel}>高<Input value={height} onChange={(e) => { setHeight(e.target.value); touch('height') }} /></label>
      <label style={fieldLabel}>外边距<Input value={margin} onChange={(e) => { setMargin(e.target.value); touch('margin') }} /></label>
      <label style={fieldLabel}>行高<Input value={lineHeight} onChange={(e) => { setLineHeight(e.target.value); touch('lineHeight') }} /></label>
      <label style={fieldLabel}>不透明度<Input value={opacity} onChange={(e) => { setOpacity(e.target.value); touch('opacity') }} /></label>
      <label style={fieldLabel}>阴影<Input value={shadow} onChange={(e) => { setShadow(e.target.value); touch('shadow') }} /></label>
      <label style={fieldLabel}>文字对齐<Input value={textAlign} onChange={(e) => { setTextAlign(e.target.value); touch('textAlign') }} /></label>
      <label style={fieldLabel}>文字内容<Input value={text} placeholder={beforeRef.current !== '' ? beforeRef.current : '输入新文字，点“编辑文字”替换'} onChange={(e) => { setText(e.target.value); touch('text') }} /></label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button style={btnBase} variant="outline" onClick={applyText}>{t('editText')}</Button>

        <Button style={btnBase} variant="ghost" onClick={() => { onHide(selectorOf(target)) }}>{t('hide')}</Button>
        <Button style={btnBase} variant="ghost" icon={<IconTrash size={16} />} onClick={() => { onRemove(selectorOf(target)) }}>{t('remove')}</Button>
      </div>
      </>)}

      {draft.canvas.images.length === 0 ? null : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, lineHeight: '18px', borderTop: '1px solid ' + tok.borderL2, paddingTop: 8 }}>
          <span style={{ fontSize: 12, color: tok.labelTertiary }}>{t('embedBg')}</span>
          {draft.canvas.images.map((img) => (
            <div key={img.id} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ color: tok.labelTertiary }}>{t('opacity')}</span>
              <input type="range" min={0} max={100} value={Math.round((img.opacity ?? 1) * 100)} onChange={(e) => { onEmbedOpacity(img.id, Number(e.target.value) / 100) }} style={{ width: 90 }} />
              <span style={{ color: tok.labelTertiary }}>{t('blend')}</span>
              <select value={img.blend ?? 'normal'} onChange={(e) => { onEmbedBlend(img.id, e.target.value as BlendMode) }}
                style={{ background: tok.bgBase, color: tok.labelPrimary, border: '1px solid ' + tok.borderL2, borderRadius: 4, fontSize: 12, lineHeight: '18px', padding: '2px 4px' }}>
                {BLEND_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{t(o.labelKey)}</option>))}
              </select>
              <Button style={btnBase} size="sm" variant="ghost" icon={<IconTrash size={14} />} onClick={() => { onRemoveEmbed(img.id) }}>{t('remove')}</Button>
            </div>
          ))}
        </div>
      )}

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
    width: 340, maxHeight: 'calc(100vh - 120px)', overflow: 'auto',
    background: tok.bgOverlay, border: '1px solid ' + tok.borderL2, borderRadius: 12, padding: 14,
    display: 'flex', flexDirection: 'column', gap: 10, color: tok.labelPrimary, fontSize: 12,
  }
  const groupStyle: CSSProperties = { fontSize: 12, lineHeight: '18px', fontWeight: 600, color: tok.labelTertiary, marginTop: 4 }
  const rowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }
  const nameStyle: CSSProperties = { fontSize: 11, lineHeight: '16px', fontFamily: 'var(--ds-font-family-code, monospace)', color: tok.labelSecondary, minWidth: 150, flex: 1 }
  const pick = (v: string): string => toHex(v) ?? '#000000'
  return (
    <div style={panelStyle}>
      <strong style={{ fontSize: 14, lineHeight: '22px', fontWeight: 500 }}>{t('tokenPanel')}</strong>
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
                <div key={item.name} style={rowStyle}>
                  <input type="checkbox" checked={on} onChange={(e) => { onToggle(item.name, e.target.checked) }} />
                  <span style={{ width: 14, height: 14, borderRadius: 3, border: '1px solid ' + tok.borderL2, background: on ? cur : 'var(--dsw-alias-bg-layer-2)', flex: 'none' }} />
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

/** Build a structural selector for a real DSH node, relative to the app root. */
function selectorOf(el: Element): string {
  if (el.id !== '') return '#' + CSS.escape(el.id)
  const parts: string[] = []
  const root = el.ownerDocument.getElementById('root') as HTMLElement | null
  let node: Element | null = el
  while (node !== null && node !== root && node.parentElement !== null) {
    const parent = node.parentElement
    const sameTag = Array.from(parent.children).filter((c) => c.tagName === node!.tagName)
    const idx = sameTag.indexOf(node) + 1
    const name = node.tagName.toLowerCase()
    parts.unshift(idx > 1 ? (name + ':nth-of-type(' + idx + ')') : name)
    node = parent
  }
  return '#root > ' + parts.join(' > ')
}
