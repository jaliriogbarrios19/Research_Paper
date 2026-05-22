const esbuild = require("esbuild");

const production = process.argv.includes("production");

esbuild
  .build({
    entryPoints: ["main.ts"],
    bundle: true,
    external: ["obsidian", "electron"],
    format: "cjs",
    target: "es2020",
    platform: "browser",
    outfile: "main.js",
    sourcemap: production ? false : "inline",
    minify: production,
    treeShaking: true,
  })
  .catch(() => process.exit(1));
