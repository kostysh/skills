import { builtinModules } from 'node:module';

import { defineConfig } from 'vite';

const BUILTIN_EXTERNALS = [
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
];

export default defineConfig({
  build: {
    emptyOutDir: true,
    minify: false,
    outDir: 'scripts',
    target: 'node22',
    rollupOptions: {
      input: {
        'dossier-engineer': 'src/entrypoints/dossier-engineer.ts',
        dossier: 'src/entrypoints/dossier.ts',
        'backlog-engineer': 'src/entrypoints/backlog-engineer.ts',
      },
      external: BUILTIN_EXTERNALS,
      output: {
        assetFileNames: 'assets/[name][extname]',
        banner: '#!/usr/bin/env node',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: '[name].mjs',
        format: 'es',
      },
    },
  },
});
