/**
 * Draw-mode chrome: the canvas editor's own look, motion and cursor.
 *
 * One plugin-owned `<style>` for the whole editor, injected on mount and removed on
 * unmount (same reversibility contract as every other layer in this package).
 *
 * The motion rules are written for the environment they run in: the editor draws over
 * the LIVE DSH page, so anything that triggers layout would re-lay-out the app behind
 * it. Therefore:
 *   - motion is CSS-only and limited to `transform` / `opacity` (compositor work, no
 *     layout, no per-frame JavaScript, nothing to clean up when it ends);
 *   - no width/height/padding/margin is ever animated — the page inset is driven by a
 *     ResizeObserver, so an animated width would rewrite the root variables (and thus
 *     re-layout the app) on every frame;
 *   - no `backdrop-filter`: blurring the live page behind a moving surface is the most
 *     expensive thing this UI could do, for a barely visible gain over the opaque
 *     `--dsw-alias-bg-overlay`;
 *   - `prefers-reduced-motion: reduce` switches all of it off.
 *
 * Visual language follows the native settings surface: `--dsw-alias-*` tokens only,
 * 8–12px radii, hairline `border-l2` dividers, layer surfaces for cards.
 */

import { DOCK_ATTRIBUTE } from './dock.ts'

/** Id of the editor's own style tag (also what tests assert on). */
export const CANVAS_UI_STYLE_ID = 'dsh-myskin-canvas-ui'

/**
 * Attribute set on `<html>` while the picker owns the pointer.
 *
 * The crosshair is the standard "you are picking" affordance; it lives on the root
 * element so the rule can reach the app's own elements (the canvas layer itself is
 * `pointer-events: none`, so a cursor there would never be seen) and is removed the
 * moment the editor is closed or switched to interact mode.
 */
export const CANVAS_UI_ATTR = 'data-dsh-myskin-draw'

/**
 * The editor's stylesheet.
 * @returns CSS text (no user data is interpolated into it).
 */
export function canvasUiRules(): string {
  return [
    '@keyframes dsh-myskin-drop { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }',
    '@keyframes dsh-myskin-slide { from { opacity: 0; transform: translateX(14px) } to { opacity: 1; transform: translateX(0) } }',
    '@keyframes dsh-myskin-slide-left { from { opacity: 0; transform: translateX(-14px) } to { opacity: 1; transform: translateX(0) } }',
    '@keyframes dsh-myskin-pop { from { opacity: 0; transform: scale(.982) } to { opacity: 1; transform: scale(1) } }',
    '@keyframes dsh-myskin-fade { from { opacity: 0 } to { opacity: 1 } }',
    '@keyframes dsh-myskin-pulse { 0%, 100% { opacity: 1 } 50% { opacity: .35 } }',
    '[data-dsh-myskin-canvas] { --dsh-myskin-ease: cubic-bezier(.2, .7, .3, 1) }',
    // Toolbar: entrance + a soft seat so it reads as its own surface above the app.
    '[data-dsh-myskin-canvas] .dsh-myskin-bar { animation: dsh-myskin-drop 170ms var(--dsh-myskin-ease) both; box-shadow: 0 12px 26px -22px rgba(0, 0, 0, .6) }',
    '[data-dsh-myskin-canvas] .dsh-myskin-sep { width: 1px; align-self: stretch; margin: 6px 2px; flex: none; background: var(--dsw-alias-border-l2) }',
    // Panel: entrance + a fade/slide when folded away. Width is NOT animated: the page
    // inset follows the panel through a ResizeObserver, and animating it would re-layout
    // the whole app on every frame.
    '[data-dsh-myskin-canvas] .dsh-myskin-panel { animation: dsh-myskin-slide 190ms var(--dsh-myskin-ease) both; transition: opacity 140ms ease, transform 140ms ease; box-shadow: -12px 0 28px -24px rgba(0, 0, 0, .65) }',
    '[data-dsh-myskin-canvas] .dsh-myskin-panel[data-open="0"] { opacity: 0; transform: translateX(16px) }',
    // Docked left, the panel mirrors: it enters from its own edge, its shadow falls the other way
    // and folding it away slides it toward that edge. Gated on the same <html> attribute the frame
    // rules use (dock.ts), so there is one answer to "which side is it on" for the whole editor.
    'html[' + DOCK_ATTRIBUTE + '="left"] [data-dsh-myskin-canvas] .dsh-myskin-panel { animation-name: dsh-myskin-slide-left; box-shadow: 12px 0 28px -24px rgba(0, 0, 0, .65) }',
    'html[' + DOCK_ATTRIBUTE + '="left"] [data-dsh-myskin-canvas] .dsh-myskin-panel[data-open="0"] { transform: translateX(-16px) }',
    // `flex: none`: a card is a block of content, not a rubber band. Without it a tall card in
    // the height-constrained panel is squeezed (its own `overflow` drops its automatic minimum
    // size to 0) instead of letting the panel scroll.
    '[data-dsh-myskin-canvas] .dsh-myskin-card { flex: none; background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l2); border-radius: 10px; transition: background-color 140ms ease, border-color 140ms ease }',
    '[data-dsh-myskin-canvas] .dsh-myskin-card:hover { border-color: var(--dsw-alias-border-l3) }',
    // Hover/selection chrome: two tiny boxes, animation only on (re)mount.
    '[data-dsh-myskin-canvas] .dsh-myskin-box { animation: dsh-myskin-pop 130ms var(--dsh-myskin-ease) both }',
    '[data-dsh-myskin-canvas] .dsh-myskin-chip { animation: dsh-myskin-fade 130ms var(--dsh-myskin-ease) both; box-shadow: 0 3px 12px -8px rgba(0, 0, 0, .6) }',
    '[data-dsh-myskin-canvas] .dsh-myskin-hoverbox { opacity: .9 }',
    // Alignment guides: a hairline that fades in, no layout, nothing to clean up.
    '[data-dsh-myskin-canvas] .dsh-myskin-guide { animation: dsh-myskin-fade 90ms ease-out both; box-shadow: 0 0 3px -1px var(--dsw-alias-brand-primary) }',
    // Save chip: the only looping animation, and only while a write is in flight.
    '[data-dsh-myskin-canvas] .dsh-myskin-dot { transition: background-color 160ms ease }',
    '[data-dsh-myskin-canvas] .dsh-myskin-dot[data-state="saving"] { animation: dsh-myskin-pulse 900ms ease-in-out infinite }',
    '[data-dsh-myskin-canvas] .dsh-myskin-warn { animation: dsh-myskin-fade 140ms ease-out both }',
    // Our own controls (the ui-primitives Button styles itself; these do not).
    '[data-dsh-myskin-canvas] .dsh-myskin-iconbtn { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; padding: 0; border-radius: 7px; border: 1px solid var(--dsw-alias-border-l2); background: transparent; color: var(--dsw-alias-label-tertiary); cursor: pointer; font-size: 12px; line-height: 18px; transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease, transform 90ms ease }',
    '[data-dsh-myskin-canvas] .dsh-myskin-iconbtn:hover { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l3); color: var(--dsw-alias-label-primary) }',
    '[data-dsh-myskin-canvas] .dsh-myskin-iconbtn:active { transform: scale(.92) }',
    '[data-dsh-myskin-canvas] .dsh-myskin-iconbtn:disabled { opacity: .35; cursor: default; transform: none }',
    '[data-dsh-myskin-canvas] .dsh-myskin-iconbtn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px }',
    // Collapsible group headers: the chevron rotates instead of the body growing.
    '[data-dsh-myskin-canvas] .dsh-myskin-head { display: flex; align-items: center; gap: 6px; width: 100%; padding: 2px 0; background: transparent; border: none; cursor: pointer; text-align: left; color: var(--dsw-alias-label-primary); font-size: 13px; line-height: 20px; font-weight: 500; transition: color 120ms ease }',
    '[data-dsh-myskin-canvas] .dsh-myskin-head:hover { color: var(--dsw-alias-brand-primary) }',
    '[data-dsh-myskin-canvas] .dsh-myskin-head:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; border-radius: 6px }',
    '[data-dsh-myskin-canvas] .dsh-myskin-chev { display: inline-block; width: 10px; flex: none; color: var(--dsw-alias-label-tertiary); transition: transform 160ms var(--dsh-myskin-ease) }',
    '[data-dsh-myskin-canvas] .dsh-myskin-head[data-open="0"] .dsh-myskin-chev { transform: rotate(-90deg) }',
    '[data-dsh-myskin-canvas] .dsh-myskin-body { display: flex; flex-direction: column; gap: 8px; animation: dsh-myskin-fade 150ms ease-out both }',
    '[data-dsh-myskin-canvas] .dsh-myskin-field { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; width: 100%; min-height: 28px; padding: 0 2px; border-radius: 7px; font-size: 12px; line-height: 20px; transition: background-color 120ms ease }',
    '[data-dsh-myskin-canvas] .dsh-myskin-field:hover { background: var(--dsw-alias-bg-layer-2) }',
    // Font list rows: each name is drawn in its own family (the list doubles as the
    // preview). Static metrics only — this sheet never animates layout.
    //
    // `flex: none` + `min-height` are LOAD-BEARING, not cosmetics. A flex item with
    // `overflow: hidden` has an automatic minimum size of ZERO, so a 224-family list inside a
    // height-constrained column shrinks every row to its padding floor — and `overflow: hidden`
    // then clips the 20px line box away entirely. The result: rows that scroll but render not
    // one readable name (and, before `box-sizing`, a stray horizontal scrollbar from
    // `width: 100%` + padding + border).
    '[data-dsh-myskin-canvas] .dsh-myskin-fontpick { display: block; box-sizing: border-box; flex: none; width: 100%; min-height: 26px; text-align: left; padding: 3px 7px; border: 1px solid transparent; border-radius: 7px; background: transparent; color: var(--dsw-alias-label-primary); font-size: 12px; line-height: 20px; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: background-color 120ms ease, border-color 120ms ease }',
    '[data-dsh-myskin-canvas] .dsh-myskin-fontpick:hover { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2) }',
    '[data-dsh-myskin-canvas] .dsh-myskin-fontpick[data-active="1"] { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-brand-primary) }',
    '[data-dsh-myskin-canvas] .dsh-myskin-empty { display: flex; flex-direction: column; gap: 8px; padding: 16px 14px; border: 1px dashed var(--dsw-alias-border-l3); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; animation: dsh-myskin-fade 160ms ease-out both }',
    // Thin scrollbar for the panel only (the app keeps its own).
    '[data-dsh-myskin-canvas] .dsh-myskin-scroll::-webkit-scrollbar { width: 8px; height: 8px }',
    '[data-dsh-myskin-canvas] .dsh-myskin-scroll::-webkit-scrollbar-thumb { background: var(--dsw-alias-border-l2); border-radius: 8px }',
    '[data-dsh-myskin-canvas] .dsh-myskin-scroll::-webkit-scrollbar-track { background: transparent }',
    // Sliders and disclosure markers get the native-surface treatment too: the panel
    // otherwise mixes styled controls with raw browser widgets.
    '[data-dsh-myskin-canvas] input[type="range"] { -webkit-appearance: none; appearance: none; height: 18px; background: transparent; cursor: pointer }',
    '[data-dsh-myskin-canvas] input[type="range"]::-webkit-slider-runnable-track { height: 4px; border-radius: 999px; background: var(--dsw-alias-border-l2) }',
    '[data-dsh-myskin-canvas] input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 12px; height: 12px; margin-top: -4px; border-radius: 50%; background: var(--dsw-alias-brand-primary); border: 2px solid var(--dsw-alias-bg-overlay); transition: transform 100ms ease }',
    '[data-dsh-myskin-canvas] input[type="range"]:hover::-webkit-slider-thumb { transform: scale(1.15) }',
    '[data-dsh-myskin-canvas] input[type="range"]:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; border-radius: 999px }',
    '[data-dsh-myskin-canvas] details > summary { list-style: none; cursor: pointer }',
    '[data-dsh-myskin-canvas] details > summary::-webkit-details-marker { display: none }',
    '[data-dsh-myskin-canvas] details > summary::before { content: "\\25B8"; display: inline-block; width: 10px; color: var(--dsw-alias-label-tertiary); transition: transform 160ms var(--dsh-myskin-ease) }',
    '[data-dsh-myskin-canvas] details[open] > summary::before { transform: rotate(90deg) }',
    // Picking cursor over the real page; our own chrome keeps its normal cursors.
    'html[' + CANVAS_UI_ATTR + '="1"] body, html[' + CANVAS_UI_ATTR + '="1"] body :not([data-dsh-myskin-ui]):not([data-dsh-myskin-ui] *) { cursor: crosshair }',
    '@media (prefers-reduced-motion: reduce) {',
    '  [data-dsh-myskin-canvas] .dsh-myskin-bar, [data-dsh-myskin-canvas] .dsh-myskin-panel, [data-dsh-myskin-canvas] .dsh-myskin-box, [data-dsh-myskin-canvas] .dsh-myskin-chip, [data-dsh-myskin-canvas] .dsh-myskin-body, [data-dsh-myskin-canvas] .dsh-myskin-empty, [data-dsh-myskin-canvas] .dsh-myskin-warn, [data-dsh-myskin-canvas] .dsh-myskin-dot, [data-dsh-myskin-canvas] .dsh-myskin-chev, [data-dsh-myskin-canvas] .dsh-myskin-guide, [data-dsh-myskin-canvas] input[type="range"]::-webkit-slider-thumb { animation: none !important; transition: none !important }',
    '}',
  ].join(String.fromCharCode(10))
}

/**
 * Read one wheel event as a nudge step.
 * @param deltaY - the event's vertical delta.
 * @param shiftKey - whether Shift was held (coarse step).
 * @returns the direction and coarseness, or undefined when the event carries no step.
 */
export function wheelStep(deltaY: number, shiftKey: boolean): { direction: 1 | -1; big: boolean } | undefined {
  if (deltaY === 0) return undefined
  return { direction: deltaY < 0 ? 1 : -1, big: shiftKey }
}

/**
 * Turn wheel movement over one control into nudge steps.
 *
 * The listener is attached natively with `{ passive: false }` on purpose: React registers
 * `onWheel` as a PASSIVE listener at the root, where `preventDefault()` is ignored — the
 * panel would scroll while the number changed. Everything else (which control, which step)
 * stays with the caller.
 * @param el - the element to listen on (the input's wrapper, so the event bubbles to it).
 * @param onStep - called with the direction (+1 = wheel up) and whether Shift was held.
 * @returns a disposer that removes exactly this listener.
 */
export function attachWheelNudge(el: HTMLElement, onStep: (direction: 1 | -1, big: boolean) => void): () => void {
  const onWheel = (e: WheelEvent): void => {
    const step = wheelStep(e.deltaY, e.shiftKey)
    if (step === undefined) return
    e.preventDefault()
    onStep(step.direction, step.big)
  }
  el.addEventListener('wheel', onWheel, { passive: false })
  return () => { el.removeEventListener('wheel', onWheel) }
}

/**
 * Inject the editor stylesheet and return its disposer.
 * @param doc - the document to style (the live app document).
 * @returns a function that removes exactly this tag.
 */
export function mountCanvasUi(doc: Document): () => void {
  const tag = doc.createElement('style')
  tag.id = CANVAS_UI_STYLE_ID
  tag.textContent = canvasUiRules()
  doc.head.appendChild(tag)
  return () => { tag.remove() }
}

/**
 * Toggle the picker cursor for the live page.
 * @param doc - the live app document.
 * @param on - true while the editor is in pick (edit) mode.
 */
export function setDrawCursor(doc: Document, on: boolean): void {
  if (on) doc.documentElement.setAttribute(CANVAS_UI_ATTR, '1')
  else doc.documentElement.removeAttribute(CANVAS_UI_ATTR)
}
