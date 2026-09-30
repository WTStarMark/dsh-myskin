/**
 * The installed DSH theme's token table: every `--dsw-*` variable it defines, resolved to a
 * concrete value per palette mode.
 *
 * DSH ships the theme as one stylesheet: the primitives live in a block of `--dsw-static-*`
 * declarations, the light aliases in `body{…}` and the dark overrides in
 * `body[data-ds-dark-theme]{…}`, with aliases pointing at primitives through `var()`. This
 * reads all three and follows the references, which is what makes an install-dependent check
 * possible without a browser: "does this preset name a token that exists?", "does it leave a
 * light surface behind in a dark theme?".
 *
 * @param root - DSH install root (defaults to the local one).
 * @returns `{ light, dark }` value maps, or undefined when no theme package is installed.
 */
import fs from 'node:fs'
import path from 'node:path'
import { dshRoot } from './load-ts.mjs'

/**
 * Split a declaration block into custom-property pairs.
 * @param text - the block body.
 * @returns name -> value.
 */
function declarations(text) {
  const out = {}
  for (const part of text.split(';')) {
    const index = part.indexOf(':')
    if (index < 0) continue
    const name = part.slice(0, index).trim()
    if (name.startsWith('--')) out[name] = part.slice(index + 1).trim()
  }
  return out
}

/**
 * Every depth-1 rule block that declares custom properties, with its selector.
 * @param css - the stylesheet.
 * @returns the blocks.
 */
function blocks(css) {
  const out = []
  for (let i = 0; i < css.length; i += 1) {
    if (css[i] !== '{') continue
    let depth = 1
    let j = i + 1
    for (; j < css.length && depth > 0; j += 1) {
      if (css[j] === '{') depth += 1
      else if (css[j] === '}') depth -= 1
    }
    const body = css.slice(i + 1, j - 1)
    if (!body.includes('--dsw-')) continue
    let k = i - 1
    while (k >= 0 && css[k] !== '}' && css[k] !== '{' && css[k] !== ';') k -= 1
    out.push({ selector: css.slice(k + 1, i).trim(), body })
  }
  return out
}

/**
 * Read the theme token table of one DSH install.
 * @param root - install root.
 * @returns the per-mode value maps, or undefined when unavailable.
 */
export function readDshTokens(root = dshRoot()) {
  const store = path.join(root, 'node_modules', '.pnpm')
  if (!fs.existsSync(store)) return undefined
  const dirs = fs.readdirSync(store).filter((name) => name.startsWith('@deepseek-ai+dsh-client-ui-theme@')).sort().reverse()
  let css
  for (const dir of dirs) {
    const file = path.join(store, dir, 'node_modules', '@deepseek-ai', 'dsh-client-ui-theme', 'lib', 'client.js')
    if (fs.existsSync(file)) { css = fs.readFileSync(file, 'utf8'); break }
  }
  if (css === undefined) return undefined
  const statics = {}
  const light = {}
  const dark = {}
  for (const block of blocks(css)) {
    const declared = declarations(block.body)
    if (block.selector === 'body') Object.assign(light, declared)
    else if (block.selector.includes('data-ds-dark-theme')) Object.assign(dark, declared)
    for (const [name, value] of Object.entries(declared)) {
      if (name.startsWith('--dsw-static-')) statics[name] = value
    }
  }
  if (Object.keys(light).length === 0) return undefined
  /**
   * Follow `var(--x)` references down to a literal value.
   * @param value - the declared value.
   * @param depth - recursion guard.
   * @returns the resolved value.
   */
  const resolve = (value, depth = 0) => {
    const match = /^var\((--[a-z0-9-]+)\)$/.exec(value)
    if (match === null || depth > 8) return value
    return resolve(statics[match[1]] ?? '', depth + 1)
  }
  const resolveAll = (map) => Object.fromEntries(Object.entries(map).map(([name, value]) => [name, resolve(value)]))
  return { light: resolveAll(light), dark: resolveAll(dark), statics }
}
