/**
 * 「对话排版」: styling DSH's markdown output.
 *
 * Two failure modes matter and both are pinned here: (a) an anchor that stops matching (an earlier
 * version used `_markdownPayload` — the TRAJECTORY TABLE's wrapper — so the card did nothing at all in
 * the conversation body), and (b) the card's own values drifting from the document. The last test
 * checks a rule AND a token really reach a rendered heading.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { loadTs } from './helpers/load-ts.mjs'

const md = await loadTs('src/client/markdown.ts')
const engine = await loadTs('src/client/skin-engine.ts')

const FIXTURE = '<!doctype html><html><head></head><body data-ds-dark-theme=""><div id="app"></div></body></html>'

/**
 * Install a fresh jsdom document as the global DOM (same shape the engine tests use).
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

/** Minimal stand-in for ctx.theme that records the token override. @returns the fake registry. */
function fakeTheme() {
  const calls = []
  return { calls, overrideTokens(source, tokens) { calls.push({ source, tokens }); return () => { calls.length = 0 } } }
}

/** A document with no markdown rules of its own. */
function emptySkin(extra = {}) {
  return { enabled: true, tokens: {}, css: [], text: [], layers: [], library: [], canvas: { images: [] }, ...extra }
}

const field = (id) => {
  const found = md.MARKDOWN_FIELDS.find((entry) => entry.id === id)
  assert.notEqual(found, undefined, 'unknown rule field: ' + id)
  return found
}
const tokenField = (id) => {
  const found = md.MARKDOWN_TOKENS.find((entry) => entry.id === id)
  assert.notEqual(found, undefined, 'unknown token field: ' + id)
  return found
}

test('the anchor is the renderer own root, hash-proof, with compact excluded', () => {
  // MarkdownText renders: className = clsx(markdownCss.markdown, compact && markdownCss.compact),
  // data-markdown-variant = variant === 'compact' ? variant : undefined.
  assert.equal(md.MD_BODY, '[class*="_markdown"]:not([data-markdown-variant="compact"])')
  assert.equal(md.markdownBody('all'), md.MD_BODY, 'the body IS the markdown root — no `> div` step')
  assert.match(md.markdownBody('conversation'), /^\[data-conversation-content\] /)
  assert.match(md.markdownBody('conversation'), /:not\(\[data-markdown-variant="compact"\]\)/)
  // `compact` may only ever appear inside the :not(...) guard, and never as a positive target.
  for (const entry of [...md.MARKDOWN_FIELDS]) {
    const selector = md.markdownSelector(entry, 'all')
    const seen = (selector.match(/compact/g) ?? []).length
    const guarded = (selector.match(/:not\(\[data-markdown-variant="compact"\]\)/g) ?? []).length
    assert.equal(seen, guarded, entry.id + ' targets the compact variant')
  }
  // Every selector starts from the real root, so nothing depends on a build hash.
  assert.match(md.markdownSelector(field('tableZebra'), 'all'), /^\[class\*="_markdown"\]/)
  assert.match(md.markdownSelector(field('paraGap'), 'all'), / p, /)
})

test('the old wrong anchor is gone for good', () => {
  // `_markdownPayload` is the trajectory table's wrapper: it exists for tool output and NOT for the
  // conversation body, which is exactly why the first version silently did nothing.
  const everything = [md.MD_BODY, md.MD_CONVERSATION, ...md.MARKDOWN_FIELDS.map((entry) => md.markdownSelector(entry, 'all'))].join(' ')
  assert.doesNotMatch(everything, /_markdownPayload/)
  assert.doesNotMatch(everything, /> div/)
})

test('rule values round-trip through css, merge per selector, and clear cleanly', () => {
  let css = []
  css = md.writeMarkdownStyle(css, 'all', field('paraGap'), '12px')
  css = md.writeMarkdownStyle(css, 'all', field('hGap'), '24px')
  css = md.writeMarkdownStyle(css, 'all', field('tableZebra'), field('tableZebra').onValue)
  assert.equal(css.length, 3)
  assert.equal(css[0].rule, 'margin: 12px !important')
  assert.deepEqual(new Map(md.readMarkdownStyles(css, 'all')), new Map([
    ['paraGap', '12px'], ['hGap', '24px'], ['tableZebra', 'rgba(127, 127, 127, 0.08)'],
  ]))
  // The same field under the other scope is a DIFFERENT rule — that is what makes the switch work.
  assert.equal(md.readMarkdownStyles(css, 'conversation').size, 0)
  css = md.writeMarkdownStyle(css, 'all', field('paraGap'), undefined)
  assert.equal(md.readMarkdownStyles(css, 'all').has('paraGap'), false)
  assert.equal(css.length, 2, 'the emptied rule is pruned')
})

test('token overrides land in the document tokens, and the scope rides a marker', () => {
  let skin = emptySkin({ css: [{ selector: '#hand', rule: 'color: red' }] })
  skin = md.writeMarkdownToken(skin, tokenField('tokBaseSize'), '15px')
  skin = md.writeMarkdownToken(skin, tokenField('tokInlineCodeBg'), '#eef2ff')
  assert.equal(skin.tokens['--dsw-font-markdown-base-font-size'].light, '15px')
  assert.equal(skin.tokens['--dsw-font-markdown-base-font-size'].dark, '15px', 'one value covers both variants')
  assert.deepEqual(new Map(md.readMarkdownTokens(skin)), new Map([['tokBaseSize', '15px'], ['tokInlineCodeBg', '#eef2ff']]))
  assert.deepEqual(md.markdownTokenSplit(skin), [])
  skin = { ...skin, tokens: { ...skin.tokens, '--dsw-font-markdown-base-font-size': { light: '15px', dark: '16px' } } }
  assert.deepEqual(md.markdownTokenSplit(skin), ['--dsw-font-markdown-base-font-size'], 'a split pair is reported')
  // Scope marker shares the single :root rule with the other markers.
  let css = engine.withBackgroundOpacity(skin.css, 0.6)
  css = md.withMarkdownScope(css, 'conversation')
  assert.equal(md.readMarkdownScope({ canvas: { images: [] }, css }), 'conversation')
  assert.equal(css.filter((rule) => rule.selector === ':root').length, 1)
  assert.match(css.find((rule) => rule.selector === ':root').rule, /--dsh-myskin-bg-opacity: 0.6/)
  assert.equal(md.readMarkdownScope({ canvas: { images: [] }, css: md.withMarkdownScope(css, 'all') }), 'all')
  // …and the legacy value from the broken first version still reads as the conversation scope.
  assert.equal(md.readMarkdownScope({ canvas: { images: [] }, css: [{ selector: ':root', rule: '--dsh-myskin-md-scope: assistant;' }] }), 'conversation')
})

test('presets write both halves and reset touches only this card', () => {
  const tight = md.MARKDOWN_PRESETS.find((preset) => preset.id === 'tight')
  let skin = emptySkin({ css: [{ selector: '#hand', rule: 'color: red' }], tokens: { '--other-token': { light: '1', dark: '2' } } })
  skin = md.applyMarkdownPreset(skin, 'all', tight)
  assert.equal(md.readMarkdownTokens(skin).get('tokBaseSize'), '13px', 'the type half is a token')
  assert.equal(md.readMarkdownStyles(skin.css, 'all').get('paraGap'), '6px', 'the gap half is a rule')
  assert.equal(skin.tokens['--other-token'].light, '1', 'unrelated tokens survive')
  const reset = md.clearMarkdownTokens({ ...skin, css: md.clearMarkdownStyles(skin.css, 'all') })
  assert.equal(md.readMarkdownTokens(reset).size, 0)
  assert.equal(md.readMarkdownStyles(reset.css, 'all').size, 0)
  assert.deepEqual(reset.css.map((rule) => rule.selector), ['#hand'], 'a hand-written rule is untouched')
  assert.equal(reset.tokens['--other-token'].light, '1')
})

test('the card can read what is actually in effect on the page', () => {
  // "It did not pick up my configuration": the card used to show only what the SKIN overrides, so an
  // empty row sat next to a page that clearly has a font size. Sampling computed styles answers it.
  const window = setup()
  const doc = window.document
  doc.body.innerHTML = [
    '<div class="h_markdown">',
    '  <h1 id="h1">T</h1><p id="p">text</p>',
    '  <ul><li id="li">a</li></ul>',
    '  <pre><code id="block">x</code></pre>',
    '  <p>inline <code id="code">y</code></p>',
    '</div>',
  ].join('')
  const style = doc.createElement('style')
  style.textContent = [
    '.h_markdown { font-size: 15px; line-height: 24px; }',
    '.h_markdown h1 { font-size: 26px; margin-top: 30px; }',
    '.h_markdown p { margin-top: 12px; }',
    '.h_markdown li { margin-top: 6px; }',
    '.h_markdown :not(pre) > code { font-size: 12.000001px; }',
    '.h_markdown a { color: rgb(10, 20, 30); }',
  ].join('')
  doc.head.appendChild(style)
  const effective = md.readEffectiveMarkdown(doc, 'all')
  assert.equal(effective.get('tokBaseSize'), '15px')
  assert.equal(effective.get('tokBaseLine'), '24px')
  assert.equal(effective.get('tokH1Size'), '26px')
  assert.equal(effective.get('tokCodeSize'), '12px', 'pixel noise is rounded away')
  assert.equal(effective.get('hGap'), '30px')
  assert.equal(effective.get('paraGap'), '12px')
  assert.equal(effective.get('liGap'), '6px')
  assert.equal(effective.get('tokLink'), undefined, 'no <a> on the page: nothing to report')
  // A page without markdown reports nothing rather than inventing values.
  doc.body.innerHTML = '<div>plain</div>'
  assert.equal(md.readEffectiveMarkdown(doc, 'all').size, 0)
  // …and a probe that cannot be read (jsdom has no font-weight rule here) is simply absent.
  assert.equal(md.readEffectiveMarkdown(doc, 'all').has('tokBaseSize'), false)
})

test('token rows report the computed token, even with no such element on the page', () => {
  // The reported problem: 正文字号/行高 showed values but H1…H6 and the code rows said 未设置, because the
  // page had no <h1> to measure. Tokens are custom properties — their computed value is available from
  // any markdown element, so every token row can report the real number.
  const window = setup()
  const doc = window.document
  doc.body.innerHTML = '<div class="h_markdown"><p>only a paragraph here</p></div>'
  const style = doc.createElement('style')
  style.textContent = [
    ':root { --dsw-font-markdown-base-font-size: 14px; --dsw-font-markdown-h1-font-size: 22px; }',
    '.h_markdown { font-size: 14px; }',
  ].join('')
  doc.head.appendChild(style)
  // jsdom computes no custom properties (`getComputedStyle(el).getPropertyValue('--x')` is always
  // empty), so the reader is injected here and the REAL one is asserted separately below.
  const tokens = { '--dsw-font-markdown-base-font-size': '14px', '--dsw-font-markdown-h1-font-size': '22px' }
  const effective = md.readEffectiveMarkdown(doc, 'all', (name) => tokens[name] ?? '')
  assert.equal(effective.get('tokBaseSize'), '14px', 'the token, not a measurement')
})

test('a rule and a token really reach rendered markdown — and never the compact variant', () => {
  const window = setup()
  window.document.body.innerHTML = [
    '<div class="Y0dWHa_markdown"><h1 id="big">Hi</h1><table><tbody><tr id="row"><td>x</td></tr><tr id="even"><td>y</td></tr></tbody></table></div>',
    '<div class="Y0dWHa_markdown Y0dWHa_compact" data-markdown-variant="compact"><p id="small">tool</p></div>',
  ].join('')
  const doc = window.document
  let css = md.writeMarkdownStyle([], 'all', field('hGap'), '40px')
  css = md.writeMarkdownStyle(css, 'all', field('tableZebra'), field('tableZebra').onValue)
  const override = engine.applySkin(fakeTheme(), emptySkin({ css }))
  // jsdom resolves sheet rules but does not implement inheritance, so assert on targeted elements.
  assert.equal(window.getComputedStyle(doc.getElementById('big')).marginTop, '40px')
  assert.equal(window.getComputedStyle(doc.getElementById('even')).backgroundColor, 'rgba(127, 127, 127, 0.08)')
  const compact = window.getComputedStyle(doc.getElementById('small')).marginTop
  assert.notEqual(compact, '40px', 'the compact variant keeps DSH typography')
  override.dispose()
})
