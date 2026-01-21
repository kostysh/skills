# Testing Notes

## Structure
- Unit: `test/unit/*.test.ts` (or your repo’s equivalent)
- Integration: `test/integration/*.test.ts` (or your repo’s equivalent)
- E2E: `test/e2e/*.test.ts` (or your repo’s equivalent)

## Runner
- Use `node:test` and a lightweight TS strip/transform (`node --experimental-strip-types` or similar).
- No ts-node.

## Patterns
- Unit tests: pure helpers (env parsing, redaction, small utilities).
- Integration: `createApp().request()` with mocked config/env.
- E2E: runtime-specific harness (Cloudflare Workers: `wrangler unstable_dev`), keep concurrency low.
