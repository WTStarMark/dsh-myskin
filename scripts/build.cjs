/**
 * Portable bundle build for dsh-myskin (Windows / macOS / Linux).
 *
 * Replaces the original build that hard-coded a Windows checkout path. esbuild
 * is discovered in this order: DSH_MYSKIN_ESBUILD, this package's own
 * node_modules, a local DSH install's pnpm store, then normal resolution.
 *
 * Client half: CJS closure-factory bundle in DSH's module-loader wrapper, with
 * the frozen platform module table's names external (React + UI primitives come
 * from the shell, so they must NOT be bundled).
 * Host half: ESM with schemastery external (DSH 0.1.7 supplies 3.18.4, whose
 * `.volatile()` the Config schema needs).
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const watch = process.argv.includes('--watch')

/**
 * Load esbuild from the first location that has it.
 * @returns the esbuild module.
 */
function loadEsbuild() {
  const explicit = process.env.DSH_MYSKIN_ESBUILD
  const local = path.join(root, 'node_modules', 'esbuild', 'lib', 'main.js')
  for (const candidate of [explicit, local]) {
    if (candidate && fs.existsSync(candidate)) return require(candidate)
  }
  try { return require('esbuild') } catch { /* not installed here */ }
  const dshRoot = process.env.DSH_INSTALL || '/opt/dsh-web'
  const store = path.join(dshRoot, 'node_modules', '.pnpm')
  if (fs.existsSync(store)) {
    const dir = fs.readdirSync(store).filter((name) => name.startsWith('esbuild@')).sort().pop()
    if (dir) return require(path.join(store, dir, 'node_modules', 'esbuild', 'lib', 'main.js'))
  }
  throw new Error('esbuild not found: run "npm install" here, or set DSH_MYSKIN_ESBUILD')
}

const esbuild = loadEsbuild()
const define = { 'process.env.NODE_ENV': '"production"' }
const banner = { js: 'window.__ModuleLoader__.load({ id: "dsh-myskin", factory: (require) => { var module = { exports: {} }; var exports = module.exports;' }
const footer = { js: 'return module.exports; } });' }

const clientOptions = {
  entryPoints: [path.join(root, 'src', 'client', 'index.ts')],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  outfile: path.join(root, 'lib', 'client.js'),
  external: ['react', 'react/jsx-runtime', 'react-dom/client', '@deepseek-ai/dsh-client-ui-primitives'],
  jsx: 'automatic',
  define,
  banner,
  footer,
  logLevel: 'warning',
}

// The host half bundles its ONE dependency (schemastery) instead of leaving it
// external. A profile install that only links/copies this folder (a zip extract,
// or the "link:" route the README used to recommend) has no node_modules of its
// own, so an external import made the Loader report
//   "dsh-myskin (dsh-myskin): failed to import"
// (app-boot records fiber === undefined as the literal 'failed to import' and
// swallows ERR_MODULE_NOT_FOUND). Bundling is safe: cordis validates a plugin's
// Config through the Standard Schema protocol (Config["~standard"].validate) and
// Symbol.for('cordis.resolveConfig'), both structural, so a second schemastery
// instance is not an identity problem.
const hostOptions = {
  entryPoints: [path.join(root, 'src', 'index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'es2024',
  outfile: path.join(root, 'lib', 'index.js'),
  logLevel: 'warning',
}

/**
 * Print one artifact's path and size.
 * @param label - human label for the artifact.
 * @param outfile - absolute artifact path.
 */
function report(label, outfile) {
  const bytes = fs.statSync(outfile).size
  console.log(label + ': ' + path.relative(root, outfile) + ' (' + bytes + ' bytes)')
}

if (watch) {
  Promise.all([esbuild.context(clientOptions), esbuild.context(hostOptions)])
    .then(([client, host]) => { client.watch(); host.watch(); console.log('watching...') })
    .catch((error) => { console.error(error); process.exit(1) })
} else {
  esbuild.buildSync(clientOptions)
  esbuild.buildSync(hostOptions)
  report('client', clientOptions.outfile)
  report('host', hostOptions.outfile)
}
