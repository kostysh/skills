import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
    files: ['skills/*/src/**/*.ts', 'skills/*/test/**/*.ts', 'skills/*/vite.config.ts'],
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
