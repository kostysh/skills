# Vite Reference (TypeScript/React)

> **Load when:** User asks about Vite, React apps, or bundler-based TypeScript configuration.

## React app setup
```bash
pnpm create vite@latest my-app --template react-ts
cd my-app && pnpm install
```

## Vite config (React + TS paths)
```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  build: {
    target: 'es2022',
    sourcemap: true
  }
});
```

## Commands
```bash
pnpm dev
pnpm build
pnpm preview
```

## Notes
- For testing patterns (Vitest, Testing Library, E2E), use the `typescript-test-engineer` skill.
