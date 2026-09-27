/**
 * Test helper: bundle a TypeScript source with esbuild and import the result,
 * so tests exercise the SAME sources the plugin ships without a build step.
 *
 * Bare @deepseek-ai/* specifiers are aliased to the local DSH install when it
 * is present (the plugin never bundles them: the Host supplies schemastery and
 * the browser shell supplies the UI platform modules).
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)

/** Package root (the directory containing package.json). */
export const root = path.resolve(import.meta.dirname, '..', '..')

/** Scratch directory for generated bundles (gitignored). */
export const tmp = path.join(root, '.tmp')

/**
 * Locate the DSH install to take platform packages from.
 * @returns the install root (may not exist).
 */
export function dshRoot() { return process.env.DSH_INSTALL || '/opt/dsh-web' }

/**
 * Newest schemastery entry in the local DSH pnpm store.
 * @returns the module file path, or undefined when no install is present.
 */
export function schemasteryEntry() {
  const store = path.join(dshRoot(), 'node_modules', '.pnpm')
  if (!fs.existsSync(store)) return undefined
  const dirs = fs.readdirSync(store).filter((name) => name.startsWith('@deepseek-ai+schemastery@')).sort().reverse()
  for (const dir of dirs) {
    const entry = path.join(store, dir, 'node_modules', '@deepseek-ai', 'schemastery', 'lib', 'index.mjs')
    if (fs.existsSync(entry)) return entry
  }
  return undefined
}

/**
 * Bundle one source file to ESM under .tmp and import it.
 * @param entry - package-relative source path, e.g. src/skin-schema.ts
 * @param alias - esbuild alias map (bare specifier to absolute path).
 * @returns the imported module namespace.
 */
export async function loadTs(entry, alias = {}) {
  fs.mkdirSync(tmp, { recursive: true })
  const out = path.join(tmp, entry.replace(/[^A-Za-z0-9]/g, '_') + '.mjs')
  require('esbuild').buildSync({
    entryPoints: [path.join(root, entry)],
    bundle: true, format: 'esm', platform: 'node', target: 'es2024',
    outfile: out, alias, logLevel: 'warning',
  })
  return import(pathToFileURL(out).href)
}
