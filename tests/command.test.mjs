/**
 * `/dsh-myskin` — the command that starts a theme design session.
 *
 * DSH only lets the composer reach the model through a REGISTERED command (an unknown `/name`
 * comes back as "unknown or malformed command" and is never sent), so this contract has three
 * parts worth pinning: the metadata DSH validates, the shape of the injected message, and the
 * two failure modes (no command service at all; a Host that refuses `followup`).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs, schemasteryEntry } from './helpers/load-ts.mjs'

const entry = schemasteryEntry()
const alias = entry === undefined ? {} : { '@deepseek-ai/schemastery': entry }
const command = await loadTs('src/command-brief.ts', alias)
const host = await loadTs('src/index.ts', alias)

/** The grammar DSH's own registry enforces on a command name. */
const COMMAND_NAME = /^[a-z][a-z0-9_-]*$/u

/** A command registry that records what was registered. */
function fakeRegistry() {
  const seen = []
  return { seen, register: (definition) => { seen.push(definition) } }
}

test('the command name is the documented spelling and one DSH accepts', () => {
  assert.equal(command.DESIGN_COMMAND_NAME, 'dsh-myskin')
  assert.match(command.DESIGN_COMMAND_NAME, COMMAND_NAME)
})

test('the brief routes to the skill first and carries the user wording verbatim', () => {
  const brief = command.designBrief('深色 + 青色，界面用等宽字体')
  assert.match(brief, /深色 \+ 青色，界面用等宽字体/)
  assert.match(brief, /skill 工具，name: dsh-myskin/)
  // Order matters: load the skill before proposing anything.
  assert.ok(brief.indexOf('先加载技能') < brief.indexOf('给出 1–2 套'))
  // The hard rules ride along, so they survive even before the skill is loaded.
  assert.match(brief, /4\.5:1/)
  assert.match(brief, /不改 DSH 源码/)
  assert.match(brief, /可逆/)
})

test('an empty request asks for the interview instead of inventing a theme', () => {
  const brief = command.designBrief('   ')
  assert.match(brief, /先提问，不要直接动手/)
  assert.doesNotMatch(brief, /用户的方向/)
})

test('the injected message has the shape DSH mints, and is frozen', () => {
  const message = command.designMessage('hello')
  assert.equal(message.role, 'user')
  assert.equal(message.content[0].type, 'text')
  assert.equal(message.content[0].text, 'hello')
  assert.equal(message.source.kind, 'plugin')
  assert.equal(message.source.plugin, 'dsh-myskin')
  assert.match(message.id, /^[0-9a-f-]{36}$/iu)
  assert.notEqual(command.designMessage('hello').id, message.id, 'each message gets its own identity')
  assert.ok(Object.isFrozen(message), 'the message is frozen like createUserMessage output')
  assert.ok(Object.isFrozen(message.content) && Object.isFrozen(message.source))
})

test('the registered metadata is what the composer menu needs', () => {
  const registry = fakeRegistry()
  command.registerDesignCommand(registry)
  assert.equal(registry.seen.length, 1)
  const definition = registry.seen[0]
  assert.equal(definition.name, 'dsh-myskin')
  assert.ok(definition.description.trim().length > 0, 'a command without a description is rejected by DSH')
  assert.ok(definition.input.hint.trim().length > 0, 'the input hint must not be empty')
  assert.equal(definition.input.attachments, false)
  assert.equal(typeof definition.handler, 'function')
})

test('the handler hands the brief to the agent and reports success', () => {
  const registry = fakeRegistry()
  command.registerDesignCommand(registry)
  const sent = []
  const outcome = registry.seen[0].handler({ rawInput: '纸质浅色，衬线正文', agent: { followup: (message) => { sent.push(message) } } })
  assert.equal(outcome.kind, 'success')
  assert.equal(sent.length, 1, 'exactly one model-visible message')
  assert.match(sent[0].content[0].text, /纸质浅色，衬线正文/)
})

test('a refused followup still leaves the user with the brief', () => {
  const registry = fakeRegistry()
  command.registerDesignCommand(registry)
  const outcome = registry.seen[0].handler({ rawInput: 'x', agent: { followup: () => { throw new Error('nope') } } })
  assert.equal(outcome.kind, 'success')
  assert.match(outcome.text, /无法自动转交/)
  assert.match(outcome.text, /dsh-myskin-request/)
})

test('the Host half registers the command, and never breaks the skin when it cannot', () => {
  const seen = []
  host.apply({ inject: (deps, callback) => { assert.deepEqual(deps, ['commands']); callback({ commands: { register: (definition) => { seen.push(definition) } } }) } })
  assert.equal(seen.length, 1)
  // No command service (older DSH / headless profile): the skin plugin must still load.
  host.apply({ inject: (_deps, callback) => { callback({}) } })
  // A hostile registry must not escape into the plugin lifecycle either.
  host.apply({ inject: (_deps, callback) => { callback({ commands: { register: () => { throw new Error('boom') } } }) } })
  assert.equal(seen.length, 1)
})
