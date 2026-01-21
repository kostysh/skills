# Toolchain Reference

> **Load when:** User asks about pnpm, ESLint, Biome, tsconfig, build tools, or project configuration.

Modern TypeScript toolchain configuration.

## Contents

- [TypeScript Configuration](#typescript-configuration)
- [Module Resolution Matrix](#module-resolution-matrix)
- [Package Manager (pnpm)](#package-manager-pnpm)
- [Linting and Formatting](#linting-and-formatting)
  - [Biome](#biome)
  - [ESLint (Type-Aware)](#eslint-type-aware)
- [Testing](#testing)

---

## TypeScript Configuration

### Strict Enterprise Configuration (bundler-first)

```json
// tsconfig.json
{
  "compilerOptions": {
    // Language and Environment
    "target": "ES2024",
    "lib": ["ES2024"],
    "module": "ESNext",
    "moduleResolution": "bundler",

    // Strict Type Checking
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,

    // Module Handling
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,

    // Output
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",

    // Path Aliases
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },

    // Performance
    "skipLibCheck": true,
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/.cache/tsbuildinfo"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Node.js Backend Configuration

```json
// tsconfig.json for Node.js
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,

    "esModuleInterop": true,
    "isolatedModules": true,
    "skipLibCheck": true,

    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

### Configuration Options Explained

| Option | Purpose |
|--------|---------|
| `strict` | Enable all strict type checking options |
| `noUncheckedIndexedAccess` | Add `undefined` to indexed access results |
| `exactOptionalPropertyTypes` | Differentiate `undefined` from missing |
| `noImplicitOverride` | Require `override` keyword |
| `noPropertyAccessFromIndexSignature` | Require bracket notation for index signatures |
| `isolatedModules` | Ensure each file can be transpiled independently |
| `verbatimModuleSyntax` | Enforce explicit `type` imports/exports |

---

## Module Resolution Matrix

Choose `moduleResolution` based on runtime and bundler:

| App type | moduleResolution | module | Notes |
|---------|------------------|--------|-------|
| Node.js apps | `NodeNext` (module) | `NodeNext` | Use Node-style module resolution; align with `package.json` `type`. |
| React apps (Vite) | `bundler` | `ESNext` | Use bundler resolution for modern Vite/ESM workflows. |

Shortcut: Node.js apps use module resolution (NodeNext); React apps use bundler resolution.
---

## Package Manager (pnpm)

### Why pnpm

| Feature | npm | pnpm |
|---------|-----|------|
| Disk usage | Duplicates packages | Shared store, symlinks |
| Install speed | Slower | 2-3x faster |
| Strictness | Allows phantom deps | Strict by default |
| Monorepo support | Basic workspaces | First-class support |

### Basic Commands

```bash
# Install dependencies
pnpm install

# Add packages
pnpm add typescript
pnpm add -D @types/node

# Run scripts
pnpm run build
pnpm test

# Update packages
pnpm update
pnpm update --interactive

# List packages
pnpm list
pnpm why lodash

# Clean install
pnpm install --frozen-lockfile
```

### Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

```json
// package.json (root)
{
  "name": "my-monorepo",
  "private": true,
  "scripts": {
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint"
  }
}
```

---

## Build Tool (Vite)

For Vite setup and configuration, see `references/vite.md`.

---

## Linting and Formatting

Use both: Biome for fast formatting and baseline linting, ESLint for type-aware rules.

### Biome

Fast all-in-one linter and formatter written in Rust. Simpler setup, excellent TypeScript support out of the box.

#### Installation

```bash
pnpm add -D @biomejs/biome
pnpm biome init
```

#### Configuration

```json
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noExcessiveCognitiveComplexity": "warn"
      },
      "suspicious": {
        "noExplicitAny": "error"
      },
      "style": {
        "useConst": "error",
        "noNonNullAssertion": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingCommas": "es5"
    }
  }
}
```

#### Commands

```bash
# Check (lint + format check)
pnpm biome check .

# Fix all auto-fixable issues
pnpm biome check --write .

# Format only
pnpm biome format --write .

# Lint only
pnpm biome lint .
```

#### Package Scripts (Biome + ESLint)

```json
{
  "scripts": {
    "lint": "biome check . && eslint .",
    "lint:fix": "biome check --write . && eslint . --fix",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit"
  }
}
```

#### VSCode Integration

Install extension: `biomejs.biome`

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports.biome": "explicit"
  }
}
```

---

### ESLint (Type-Aware)

Use alongside Biome for deep type-aware linting rules that Biome doesn't support yet. Do not use ESLint for formatting; let Biome handle formatting and import organization.

#### Why ESLint in addition to Biome

- `@typescript-eslint/no-floating-promises` — catch unhandled promises
- `@typescript-eslint/await-thenable` — prevent awaiting non-promises
- `@typescript-eslint/strict-boolean-expressions` — strict boolean checks
- `@typescript-eslint/no-misused-promises` — promise misuse detection

#### Flat Config Format

```javascript
// eslint.config.js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },

  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports'
      }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error'
    }
  },

  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js']
  }
);
```

#### Important Type-Aware Rules

```javascript
{
  rules: {
    // Promise handling (requires type info)
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',

    // Strict boolean (requires type info)
    '@typescript-eslint/strict-boolean-expressions': 'error',

    // Prefer nullish coalescing
    '@typescript-eslint/prefer-nullish-coalescing': 'error',

    // Require return types on public API
    '@typescript-eslint/explicit-module-boundary-types': 'warn'
  }
}
```

---

### Biome vs ESLint Comparison

| Feature | Biome | ESLint + typescript-eslint |
|---------|-------|---------------------------|
| Speed | ~100x faster | Slower |
| Setup | Single tool | Multiple packages |
| Formatting | Built-in | Needs separate tool |
| Type-aware rules | Limited | Comprehensive |
| Promise checking | No | Yes |
| Strict boolean | No | Yes |
| VSCode integration | Yes | Yes |

**Recommendation:** Use both. Biome provides fast formatting and baseline linting, ESLint provides type-aware rules.

---

## Testing

For testing patterns and tooling, see the dedicated skill: **typescript-test-engineer**.

---

## Project Setup Notes

- For Vite-based setup and project layout, see `references/vite.md`.
- For environment validation, use `scripts/validate-setup.sh`.
