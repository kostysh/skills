import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
  {
    ignores: [
      '**/bin/**',
      '**/dist/**',
      '**/dists/**',
      '**/node_modules/**',
      '**/scripts/**',
      '.temp/**',
      'skills/*/references/**',
      'skills/*/assets/**',
      'skills/*/agents/**',
    ],
  },
  {
    files: ['eslint.config.js', 'skills/*/test/**/*.mjs'],
    ...js.configs.recommended,
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: [
      'skills/*/src/**/*.ts',
      'skills/*/test/**/*.ts',
      'skills/*/vite.config.ts',
      'cli/src/**/*.ts',
      'cli/test/**/*.ts',
      'cli/vite.config.ts',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs['recommended-type-checked'].rules,
    },
  },
];
