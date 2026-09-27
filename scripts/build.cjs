const esbuild = require('D:/Mochen/Project/deepseek-harness/node_modules/.pnpm/esbuild@0.25.12/node_modules/esbuild/lib/main.js')
const my = 'D:/Mochen/Project/dsh-myskin'
const watch = process.argv.includes('--watch')
const define = {
  'process.env.NODE_ENV': '"production"'
  ,'import.meta.env.MODE': '"production"'
  ,'import.meta.env': '{"MODE":"production"}'
}
const banner = { js: 'window.__ModuleLoader__.load({ id: "dsh-myskin", factory: (require) => { var module = { exports: {} }; var exports = module.exports;' }
const footer = { js: 'return module.exports; } });' }

// Client: closure-factory format. Externals = shell-provided module-table rows.
const clientOptions = {
  entryPoints: [my + '/src/client/index.ts'],
  bundle: true, format: 'cjs', platform: 'browser',
  outfile: my + '/lib/client.js',
  external: ['react', 'react/jsx-runtime', 'react-dom/client', '@deepseek-ai/dsh-client-ui-primitives'],
  jsx: 'automatic', define, banner, footer,
}
// Host: self-contained (zero external @deepseek-ai).
const hostOptions = {
  entryPoints: [my + '/src/index.ts'],
  bundle: true, format: 'esm', platform: 'node', target: 'es2024',
  outfile: my + '/lib/index.js',
  external: [],
}

if (!watch) {
  esbuild.buildSync(clientOptions)
  esbuild.buildSync(hostOptions)
  console.log('built')
} else {
  Promise.all([esbuild.context(clientOptions), esbuild.context(hostOptions)])
    .then(([a, b]) => { a.watch(); b.watch(); console.log('watching...') })
    .catch((err) => { console.error(err); process.exit(1) })
}
