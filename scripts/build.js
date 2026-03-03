#!/usr/bin/env node
import esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  format: 'esm',
  outfile: 'dist/broadcast-clock.js',
  minify: true,
  sourcemap: true,
  target: ['es2022'],
  loader: { '.js': 'jsx' },
  external: [],
  define: { 'process.env.NODE_ENV': '"production"' },
}).catch(() => process.exit(1))

console.log('✅ Build complete: dist/broadcast-clock.js')