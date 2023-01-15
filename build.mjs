import { build } from "esbuild";

/** @type {import('esbuild').BuildOptions} */
const options = {
  tsconfig: "tsconfig.json",
  platform: "node",
  outdir: 'dist',
  entryPoints: ['index.ts'],
  watch: process.argv.includes("--watch"),
}

build(options)