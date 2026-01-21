// ESLint 9 Flat Config for TypeScript (Type-Aware Rules)
// Use alongside Biome for type-aware rules that Biome doesn't support
// Copy to project root as eslint.config.js

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Base ESLint recommendations
  eslint.configs.recommended,

  // TypeScript strict type-checking
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // TypeScript parser options
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Custom TypeScript rules
  {
    rules: {
      // Unused variables (allow underscore prefix)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Enforce type imports for better tree-shaking
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],

      // Enforce type exports
      '@typescript-eslint/consistent-type-exports': [
        'error',
        {
          fixMixedExportsWithInlineTypeSpecifier: true,
        },
      ],

      // Promise handling (type-aware - not in Biome)
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',

      // Strict boolean expressions (type-aware - not in Biome)
      '@typescript-eslint/strict-boolean-expressions': 'error',

      // Prefer modern operators
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // No any type
      '@typescript-eslint/no-explicit-any': 'error',

      // Require explicit return types on public API
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
    },
  },

  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.config.js',
      '*.config.ts',
      'coverage/**',
    ],
  }
);
