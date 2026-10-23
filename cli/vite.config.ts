import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    target: 'node24',
    sourcemap: true,
    minify: false,
    lib: { entry: 'src/cli.ts', formats: ['es'], fileName: () => 'cli.mjs' },
    rolldownOptions: {
      platform: 'node',
      external: [...builtinModules, ...builtinModules.map((name) => `node:${name}`)],
      output: { banner: '#!/usr/bin/env node' },
    },
  },
});
