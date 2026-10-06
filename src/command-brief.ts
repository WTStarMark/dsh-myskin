/**
 * `/dsh-myskin` — the entry point that turns "帮我做个主题" into a design session.
 *
 * A slash command is the one honest way to reach the model from the composer: DSH checks
 * `/name` against the Host command registry and answers anything unknown with
 * "unknown or malformed command", so the line NEVER reaches the assistant on its own. This
 * module therefore contributes a real command whose handler pushes one model-visible user
 * message into the session (the same Agent.followup mechanism /goal, webhooks and schedules
 * use), carrying the brief below.
 *
 * Two deliberate properties:
 *
 *   - no @deepseek-ai imports. This half ships as a single bundled file that must load from a
 *     profile bundle with no node_modules next to it, so the message is built to the same
 *     runtime shape createUserMessage produces (frozen, fresh uuid id, role/source tags)
 *     instead of importing the constructor;
 *   - the skill stays the source of truth. The brief only routes: it says which skill to load
 *     and in what order to work. Everything about tokens, draw mode, contrast floors and
 *     reversibility lives in skills/dsh-myskin/SKILL.md, so there is exactly one place to keep
 *     correct.
 */

import { SKIN_SETTINGS_NAMESPACE } from './skin-schema.ts'

/**
 * A fresh message identity, in the shape DSH's own `createMessage` mints.
 *
 * `globalThis.crypto` is used rather than `node:crypto` so this half keeps ZERO runtime
 * imports: it must load from a profile bundle that has no `node_modules` beside it, and it
 * must not need node type declarations to type-check either.
 * @returns a v4 UUID string.
 */
function messageId(): string {
  const source = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (typeof source?.randomUUID === 'function') return source.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16)
    return (char === 'x' ? value : (value & 0x3) | 0x8).toString(16)
  })
}

/** The command users type: `/dsh-myskin`. */
export const DESIGN_COMMAND_NAME = 'dsh-myskin'

/** Menu text: what the command does, in one line. */
export const DESIGN_COMMAND_DESCRIPTION = '让 AI 帮你设计一套 DSH 主题（皮肤）· Design your own DSH theme with the AI'

/** Placeholder shown beside the command in the composer. */
export const DESIGN_COMMAND_HINT = '[风格描述，可留空：例如「深色 + 青色，界面用等宽字体」]'

/** The skill the brief tells the model to load before doing anything. */
export const DESIGN_SKILL_NAME = 'dsh-myskin'

/**
 * The brief handed to the model.
 *
 * It is written as an instruction block rather than a user request, so the assistant cannot
 * mistake it for the user own words, and it repeats the hard rules (reversible, no DSH sources
 * touched, contrast floors) because this text is what survives in session history even when the
 * skill has not been loaded yet.
 * @param rawInput - whatever the user typed after the command (may be empty).
 * @returns the complete brief.
 */
export function designBrief(rawInput: string): string {
  const wish = rawInput.trim()
  const wishBlock = wish === ''
    ? '用户没有描述方向：**先提问，不要直接动手**。'
    : '用户的方向：' + wish
  const skill = '`' + DESIGN_SKILL_NAME + '`'
  return [
    '<dsh-myskin-request>',
    '用户希望用 dsh-myskin 设计一套自己的 DSH 主题（皮肤）。',
    wishBlock,
    '',
    '请按这个顺序做：',
    '1. 先加载技能 ' + skill + '（skill 工具，name: ' + DESIGN_SKILL_NAME + '）——它是本插件唯一的操作契约来源，',
    '   并按其中「设计向导（/dsh-myskin）」一节执行。',
    '2. 用户没给方向时：**一轮问清**这几件事（别挤牙膏、别连续追问）：明暗偏好（跟随系统 / 固定深色 / 固定浅色）、',
    '   主色或氛围、字体偏好（界面 / 正文 / 代码）、要不要背景图或嵌入图片。',
    '3. 给出 1–2 套**具体**方案：写清将覆盖的令牌（背景 / 表面 / 边框 / 文字档位 / 品牌色）与关键 css 规则，',
    '   并说明对比度依据（正文与次级 ≥ 4.5:1、三级 ≥ 3:1、caption ≥ 2.6、dimmed ≥ 2.2）。',
    '4. 落地：写进「皮肤管理」的皮肤文档（预设通道或绘制模式），**不改 DSH 源码、不动 profile 之外的东西**，全程可逆。',
    '5. 收尾报告：用了哪些令牌与规则、对比度怎么过的、怎么一键还原、怎么导出 .dshframework 备份。',
    '</dsh-myskin-request>',
  ].join('\n')
}

/** One model-visible user message, shaped exactly like createUserMessage runtime output. */
export interface PluginMessage {
  /** Fresh message identity. */
  readonly id: string
  /** Always the user role: the agent loop reads it as input to work on. */
  readonly role: 'user'
  /** One text block. */
  readonly content: readonly { readonly type: 'text'; readonly text: string }[]
  /** Marks the message as plugin-produced rather than typed by the human. */
  readonly source: { readonly kind: 'plugin'; readonly plugin: string }
}

/**
 * Build the frozen message the command follows up with.
 * @param text - the brief.
 * @returns an immutable message with a fresh identity.
 */
export function designMessage(text: string): PluginMessage {
  return Object.freeze({
    id: messageId(),
    role: 'user' as const,
    content: Object.freeze([Object.freeze({ type: 'text' as const, text })]),
    source: Object.freeze({ kind: 'plugin' as const, plugin: SKIN_SETTINGS_NAMESPACE }),
  })
}

/** The slice of one command invocation this plugin reads. */
export interface DesignInvocation {
  /** Text typed after the command name. */
  rawInput: string
  /** The session agent: followup queues a model-visible message. */
  agent: { followup(message: PluginMessage): void }
}

/** The outcome DSH renders for one command run. */
export interface DesignOutcome {
  /** Success unless the command could not do anything useful. */
  kind: 'success' | 'error'
  /** Line shown in the session flow. */
  text: string
}

/** The slice of the Host command registry this plugin uses. */
export interface CommandRegistryLike {
  /** Register one human-facing slash command. */
  register(definition: {
    definitionId: string
    name: string
    description: string
    input: { hint: string; attachments: boolean }
    handler: (invocation: DesignInvocation) => DesignOutcome
  }): void
}

/**
 * Register the design command on the Host command registry.
 *
 * The handler can fail in one way that matters: agent.followup is a Host API and a future DSH
 * may tighten it. When that happens the brief is returned as the command own text, so the user
 * still gets the exact instruction to paste instead of a dead command — degraded, never silent.
 * @param commands - the command registry (ctx.commands).
 */
export function registerDesignCommand(commands: CommandRegistryLike): void {
  commands.register({
    definitionId: SKIN_SETTINGS_NAMESPACE,
    name: DESIGN_COMMAND_NAME,
    description: DESIGN_COMMAND_DESCRIPTION,
    input: { hint: DESIGN_COMMAND_HINT, attachments: false },
    handler: (invocation) => {
      const brief = designBrief(invocation.rawInput)
      try {
        invocation.agent.followup(designMessage(brief))
        return { kind: 'success', text: '已把主题设计请求交给助手（技能：' + DESIGN_SKILL_NAME + '）。' }
      } catch {
        // Keep the request reachable even if the Host refuses the injected message.
        return { kind: 'success', text: '无法自动转交，请把下面这段发给助手：\n' + brief }
      }
    },
  })
}
