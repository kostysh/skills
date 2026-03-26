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
    sourcemap: true,
    target: 'node22',
    lib: {
      entry: 'src/cli.ts',
      fileName: () => 'architecture-backlog.mjs',
      formats: ['es'],
    },
    rollupOptions: {
      external: BUILTIN_EXTERNALS,
      output: {
        banner: '#!/usr/bin/env node',
      },
    },
  },
});
