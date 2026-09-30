/**
 * Image anchors: WHAT an embedded picture follows.
 *
 * An element selector is one answer, and the brittle one. These tests pin the other two —
 * a piece of copy, and a named landmark of the DSH UI — plus the normalization that keeps
 * documents written before anchors existed working unchanged.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { loadTs } from './helpers/load-ts.mjs'

const engine = await loadTs('src/client/skin-engine.ts')
const pack = await loadTs('src/client/dshskin.ts')
const anchors = await loadTs('src/client/anchors.ts')
const locales = await loadTs('src/client/locales.ts')

/**
 * Install a fresh jsdom document as the global DOM.
 * @param html - body markup.
 * @returns the jsdom window.
 */
function setup(html) {
  const dom = new JSDOM('<!doctype html><html><head></head><body>' + html + '</body></html>', { pretendToBeVisual: true })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.Node = dom.window.Node
  globalThis.MutationObserver = dom.window.MutationObserver
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)
  return dom.window
}

/** The image every test anchors; only the anchor changes. */
const IMG = {
  id: 'e1',
  selector: '[data-dsh-myskin-embed="e1"]',
  url: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
  x: 0, y: 0, w: 40, h: 20,
}

/** Minimal stand-in for ctx.theme. */
const fakeTheme = () => ({ overrideTokens: () => () => {} })

test('the catalog only names landmarks this package already depends on', () => {
  const ids = anchors.ANCHOR_COMPONENTS.map((entry) => entry.id)
  assert.equal(new Set(ids).size, ids.length, 'ids must be unique: they are what the document stores')
  for (const entry of anchors.ANCHOR_COMPONENTS) {
    assert.notEqual(entry.selector.trim(), '', entry.id + ' has no selector')
    // A catalog entry with copy in only one language shows the raw key in the other UI.
    assert.equal(typeof locales.zh[entry.labelKey], 'string', entry.id + ' is missing zh copy')
    assert.equal(typeof locales.en[entry.labelKey], 'string', entry.id + ' is missing en copy')
  }
  // Every entry must be a marker the compat check / engine already verifies, so a DSH
  // generation bump can never silently turn an anchor into a no-op.
  for (const needle of ['#root', '_frame', '_centerCol', 'data-slot="conversation.session"', 'data-composer-seat', 'data-composer-input', 'data-composer-placeholder', 'role="tree"']) {
    assert.ok(anchors.ANCHOR_COMPONENTS.some((entry) => entry.selector.includes(needle)), 'nothing covers ' + needle)
  }
  assert.equal(anchors.componentById('composer').id, 'composer')
  assert.equal(anchors.componentById('nope'), undefined)
})

test('a document written before anchors existed keeps its meaning', () => {
  const legacy = { ...IMG, fallbackSelector: '#root > div' }
  assert.deepEqual(anchors.anchorOf(legacy), { kind: 'element', value: '#root > div' })
  // An anchor whose element value was never filled in means the same thing.
  assert.deepEqual(anchors.anchorOf({ ...legacy, anchor: { kind: 'element', value: '' } }), { kind: 'element', value: '#root > div' })
  // Text and component anchors are theirs, untouched.
  assert.deepEqual(anchors.anchorOf({ ...legacy, anchor: { kind: 'text', value: '新对话' } }), { kind: 'text', value: '新对话' })
  assert.deepEqual(anchors.anchorOf({ ...legacy, anchor: { kind: 'component', value: 'composer' } }), { kind: 'component', value: 'composer' })
  assert.equal(anchors.anchorKey({ kind: 'component', value: 'composer' }), 'component:composer')
})

test('an anchor reads back the way the user named it', () => {
  const t = (key) => locales.zh[key]
  assert.equal(anchors.anchorLabel({ kind: 'element', value: '#go', label: '发送按钮' }, t), '发送按钮')
  assert.equal(anchors.anchorLabel({ kind: 'element', value: '#go' }, t), '#go')
  assert.equal(anchors.anchorLabel({ kind: 'component', value: 'composer' }, t), locales.zh.compComposer)
  assert.equal(anchors.anchorLabel({ kind: 'text', value: '新对话', label: '新对话' }, t), '新对话')
})

test('an image anchored to copy follows the line the user read', () => {
  const window = setup('<div id="root"><button id="go"><span>发送</span></button><p>发送给所有人</p></div>')
  const doc = window.document
  const img = { ...IMG, fallbackSelector: '#root > button', anchor: { kind: 'text', value: '发送' } }
  // Exact match on an element's own text beats a container that merely contains the words.
  assert.equal(engine.resolveImageAnchor(img, doc), doc.querySelector('#go > span'))
  // Copy that is not on the page falls back to the frozen structural selector instead of
  // dropping the picture somewhere arbitrary.
  assert.equal(engine.resolveImageAnchor({ ...img, anchor: { kind: 'text', value: '不存在的文案' } }, doc), doc.getElementById('go'))
  assert.equal(engine.resolveImageAnchor({ ...img, anchor: { kind: 'text', value: '   ' } }, doc), doc.getElementById('go'))
})

test('an image can follow a field placeholder or a built-in landmark', () => {
  const window = setup('<div id="root"><input placeholder="描述你想要构建的内容" /><div data-composer-seat id="seat"></div></div>')
  const doc = window.document
  const text = { ...IMG, fallbackSelector: '', anchor: { kind: 'text', value: '描述你想要构建的内容' } }
  assert.equal(engine.resolveImageAnchor(text, doc), doc.querySelector('input'))
  const component = { ...IMG, fallbackSelector: '', anchor: { kind: 'component', value: 'composer' } }
  assert.equal(engine.resolveImageAnchor(component, doc), doc.getElementById('seat'))
  // An id this build does not know about, and no landmark on the page: the frozen selector
  // is still better than painting nowhere.
  const unknown = { ...IMG, fallbackSelector: '#root', anchor: { kind: 'component', value: 'nope' } }
  assert.equal(engine.resolveImageAnchor(unknown, doc), doc.getElementById('root'))
})

test('the copy frozen into a text anchor is the copy the Inspector edits', () => {
  const window = setup('<div id="root"><button id="go"><span>  发送  </span></button><button id="icon"><svg></svg></button><input id="field" placeholder="说点什么" /></div>')
  const doc = window.document
  assert.equal(engine.anchorTextOf(doc.getElementById('go')), '发送')
  assert.equal(engine.anchorTextOf(doc.getElementById('icon')), undefined)
  assert.equal(engine.anchorTextOf(doc.getElementById('field')), '说点什么')
})

test('an anchor rides through a .dshskin package', async () => {
  const skin = {
    enabled: true, tokens: {}, css: [], text: [], layers: [], library: [],
    canvas: { background: undefined, images: [{ ...IMG, fallbackSelector: '#root', anchor: { kind: 'text', value: '新对话', label: '新对话' } }] },
  }
  const { bytes } = pack.packSkin(skin, { name: 'anchors', generator: 'dsh-myskin test' })
  const back = await pack.unpackSkin(bytes)
  assert.deepEqual(back.skin.canvas.images[0].anchor, { kind: 'text', value: '新对话', label: '新对话' })
  // The asset swap (data URL → file → data URL) must not disturb the anchor beside it.
  assert.equal(back.skin.canvas.images[0].url, IMG.url)
})

test('a text-anchored image lands on the page and survives a full rebuild', async () => {
  const window = setup('<div id="root"><button id="old"><span>新对话</span></button></div>')
  const doc = window.document
  const img = { ...IMG, fallbackSelector: '#root > button', anchor: { kind: 'text', value: '新对话' } }
  const override = engine.applySkin(fakeTheme(), {
    enabled: true, tokens: {}, css: [], text: [], layers: [], library: [],
    canvas: { background: undefined, images: [img] },
  })
  assert.equal(doc.querySelector('span').getAttribute('data-dsh-myskin-embed'), 'e1')
  assert.match(doc.getElementById('dsh-myskin-rule').textContent, /\[data-dsh-myskin-embed="e1"\] \{ position: relative; \}/)
  // React throws the whole subtree away: the stale structural path matches nothing, but the
  // copy the user anchored to is still on the page, so the image keeps its home.
  const rebuilt = doc.createElement('div')
  rebuilt.innerHTML = '<button id="new"><span>新对话</span></button>'
  doc.getElementById('root').replaceChildren(rebuilt)
  await new Promise((resolve) => { setTimeout(resolve, 0) })
  assert.equal(doc.querySelector('span').getAttribute('data-dsh-myskin-embed'), 'e1')
  // …and the tag is ours to take back: dispose must not leave an anchor behind.
  override.dispose()
  assert.equal(doc.querySelector('span').getAttribute('data-dsh-myskin-embed'), null)
})

test('整组 anchor: one image, every workspace row — including a row created later', async () => {
  const window = setup('<div id="root"><div class="tree" role="tree"><div class="row" role="treeitem" aria-expanded="false" data-id="w1"></div><div class="row" role="treeitem" aria-expanded="false" data-id="w2"></div></div></div>')
  const doc = window.document
  const ids = () => Array.from(doc.querySelectorAll('[data-dsh-myskin-embed="e1"]')).map((el) => el.dataset.id)
  // The block anchor: the picture belongs on EVERY workspace row, not on one of them.
  const img = { ...IMG, fallbackSelector: '', anchor: { kind: 'group', value: '[role="treeitem"][aria-expanded]' } }
  const override = engine.applySkin(fakeTheme(), {
    enabled: true, tokens: {}, css: [], text: [], layers: [], library: [],
    canvas: { background: undefined, images: [img] },
  })
  assert.deepEqual(ids(), ['w1', 'w2'])
  assert.match(doc.getElementById('dsh-myskin-rule').textContent, /\[data-dsh-myskin-embed="e1"\] \{ position: relative; \}/)
  // A workspace created later: the selector already covers it, the retag loop stamps it.
  const later = doc.createElement('div')
  later.className = 'row'
  later.setAttribute('role', 'treeitem')
  later.setAttribute('aria-expanded', 'false')
  later.dataset.id = 'w3'
  doc.querySelector('.tree').appendChild(later)
  await new Promise((resolve) => { setTimeout(resolve, 0) })
  assert.deepEqual(ids(), ['w1', 'w2', 'w3'])
  // …and dispose takes every one of them back.
  override.dispose()
  assert.equal(doc.querySelectorAll('[data-dsh-myskin-embed]').length, 0)
})

test('a member that leaves the block loses the tag again', async () => {
  const window = setup('<div id="root"><div class="tree" role="tree"><div class="row" role="treeitem" aria-expanded="false" data-id="w1"></div><div class="row" role="treeitem" aria-expanded="false" data-id="w2"></div></div></div>')
  const doc = window.document
  const img = { ...IMG, fallbackSelector: '', anchor: { kind: 'group', value: '[role="treeitem"][aria-expanded]' } }
  const override = engine.applySkin(fakeTheme(), {
    enabled: true, tokens: {}, css: [], text: [], layers: [], library: [],
    canvas: { background: undefined, images: [img] },
  })
  assert.equal(doc.querySelector('[data-id="w2"]').getAttribute('data-dsh-myskin-embed'), 'e1')
  // The row stops being a workspace row (aria-expanded dropped): it is no longer a member.
  doc.querySelector('[data-id="w2"]').removeAttribute('aria-expanded')
  await new Promise((resolve) => { setTimeout(resolve, 0) })
  assert.equal(doc.querySelector('[data-id="w2"]').getAttribute('data-dsh-myskin-embed'), null)
  assert.equal(doc.querySelector('[data-id="w1"]').getAttribute('data-dsh-myskin-embed'), 'e1')
  override.dispose()
})
