/**
 * The three whole-app font roles: 界面 / 正文 / 代码.
 *
 * DSH already separates these internally, and the separation is where the value is — the
 * app-wide family ({@link UI_FONT_PROPERTY}, consumed by `body` and by the many
 * `font: <size>/<lh> var(--dsw-font-family)` shorthands) must not force a monospace onto code
 * or a display face onto prose.
 *
 *   - 界面 `ui`   → `:root { --dsw-font-family: … }`      (DSH's own app-wide variable)
 *   - 代码 `code` → `:root { --ds-font-family-code: … }`  (what `pre`, inline code and the
 *                    code editors read; `--dsw-font-markdown-code-font-family` rides along)
 *   - 正文 `text` → an explicit rule on the conversation content, because DSH has no variable
 *                    for prose: it inherits `--dsw-font-family` and markdown re-reads it per
 *                    block, so prose needs a rule of its own to differ from the UI face.
 *
 * Everything lives in the skin's ordinary `css` list — no schema field, no engine path, and
 * each role stays individually readable, editable and clearable (that is why the two
 * `:root` roles merge by PROPERTY into one entry instead of fighting over the selector).
 */

import type { CssRule } from '../skin-schema.ts'
import { mergeDeclaration, withoutDeclaration } from './skin-engine.ts'

/** One whole-app font role. */
export type FontRole = 'ui' | 'text' | 'code'

/** Every role, in the order the panel shows them. */
export const FONT_ROLES: readonly FontRole[] = ['ui', 'text', 'code']

/** DSH's app-wide font variable — what the UI face is. */
export const UI_FONT_PROPERTY = '--dsw-font-family'
/** The family DSH's code surfaces read. */
export const CODE_FONT_PROPERTY = '--ds-font-family-code'
/** The markdown code family; set together with {@link CODE_FONT_PROPERTY}. */
export const CODE_MARKDOWN_FONT_PROPERTY = '--dsw-font-markdown-code-font-family'

/** The `:root` entry both variable-based roles live in. */
export const ROOT_FONT_SELECTOR = ':root'

/**
 * Selector of the 正文 rule.
 *
 * The conversation content slots plus the composer and markdown blocks: prose, not chrome.
 * DSH's own rules for these are class selectors of the same specificity, and the skin's
 * stylesheet is appended last, so this wins without an `!important` — which matters, because
 * `!important` here would also drag inline code inside a paragraph out of the code face.
 */
export const TEXT_FONT_SELECTOR = [
  '[data-slot="conversation.session"]',
  '[data-slot^="conversation.view"]',
  '[class*="_markdown_"]',
  '[data-composer-input]',
  '[data-composer-placeholder]',
].join(', ')

/** Where one role's value lives. */
interface RoleTarget {
  selector: string
  properties: readonly string[]
}

/** Per-role storage. The two `:root` roles differ only by property. */
const ROLE_TARGETS: Record<FontRole, RoleTarget> = {
  ui: { selector: ROOT_FONT_SELECTOR, properties: [UI_FONT_PROPERTY] },
  code: { selector: ROOT_FONT_SELECTOR, properties: [CODE_FONT_PROPERTY, CODE_MARKDOWN_FONT_PROPERTY] },
  text: { selector: TEXT_FONT_SELECTOR, properties: ['font-family'] },
}

/**
 * Read one declared property out of a rule, `!important` stripped and trailing space trimmed.
 * @param rule - the declaration block, or undefined.
 * @param property - the property to read.
 * @returns the value, or undefined when it is not declared.
 */
function propertyOf(rule: string | undefined, property: string): string | undefined {
  for (const part of (rule ?? '').split(';')) {
    const index = part.indexOf(':')
    if (index < 0) continue
    if (part.slice(0, index).trim() !== property) continue
    return part.slice(index + 1).replace(/\s*!important\s*$/i, '').trim()
  }
  return undefined
}

/**
 * The family one role currently uses.
 * @param css - the skin's rule list.
 * @param role - the role to read.
 * @returns the declared stack, or `''` when the role is unset.
 */
export function roleFont(css: readonly CssRule[], role: FontRole): string {
  const target = ROLE_TARGETS[role]
  const rule = css.find((entry) => entry.selector === target.selector)?.rule
  for (const property of target.properties) {
    const value = propertyOf(rule, property)
    if (value !== undefined && value !== '') return value
  }
  return ''
}

/**
 * Set (or clear) one role's family, leaving every other declaration alone.
 *
 * Setting a role writes its property into the role's entry — creating it when absent — and
 * clearing removes exactly that property, dropping the entry when nothing is left. Two roles
 * sharing `:root` therefore merge by property and never overwrite each other (nor the
 * background-strength marker that also lives there).
 * @param css - the skin's rule list.
 * @param role - the role to write.
 * @param stack - the family stack, or `''` to clear the role.
 * @returns a new rule list.
 */
export function withRoleFont(css: readonly CssRule[], role: FontRole, stack: string): CssRule[] {
  const target = ROLE_TARGETS[role]
  const value = stack.trim()
  const existing = css.find((entry) => entry.selector === target.selector)
  let rule = existing?.rule
  for (const property of target.properties) {
    rule = value === ''
      ? withoutDeclaration(rule, property)
      : mergeDeclaration(rule, property + ': ' + value)
  }
  const rest = css.filter((entry) => entry.selector !== target.selector)
  const merged = rule ?? ''
  if (merged === '') return rest
  return [...rest, { selector: target.selector, rule: merged }]
}

/**
 * What a family picked from the local-font list becomes for one role.
 *
 * A role is a whole-app setting that gets exported and imported on other machines, so the
 * picked family carries a generic fallback: a stack that cannot resolve must land on the right
 * KIND of face (monospace for code, the system sans for UI and prose) rather than on the
 * browser's default serif.
 * @param family - the family name (unquoted).
 * @param role - the role it is being picked for.
 * @returns the stack to store.
 */
export function roleStackFor(family: string, role: FontRole): string {
  const fallback = role === 'code' ? 'monospace' : 'system-ui, sans-serif'
  return family + ', ' + fallback
}
