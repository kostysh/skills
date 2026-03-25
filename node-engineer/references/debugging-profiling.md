# Debugging, Resolution, and Profiling

## Package inspection workflow

Use package-manager-aware commands and inspect the installed package, not only documentation.

Prefer:
- `pnpm why <pkg>` or `npm why <pkg>` to learn why a dependency is present
- `rg --files node_modules/<pkg>` for quick file discovery
- `ls` for local structure checks when the path is already known
- direct reads of `package.json`, `README`, `exports`, or type definition files when needed

Example:

```bash
pnpm why fastify
rg --files node_modules/fastify | sed -n '1,40p'
sed -n '1,120p' node_modules/fastify/package.json
```

## Module resolution debugging

For CommonJS-oriented checks:

```bash
node -p "require.resolve('fastify')"
node -p "require.resolve.paths('fastify')"
```

For ESM-oriented checks:

```bash
node --input-type=module -e "console.log(import.meta.resolve('fastify'))"
```

Use the command that matches the module system you are actually debugging.

## README and docs lookup inside `node_modules`

Prefer this sequence:
1. read the obvious path directly if you already know it;
2. list the package directory;
3. use `rg --files` inside that package directory if the layout is unclear.

Do not turn simple package inspection into a full recursive filesystem scan by default.

## Process-hang checklist

For a Node process that does not exit:
1. reproduce with the narrowest command possible;
2. inspect active resources and the last started subsystems;
3. look for intervals, servers, client pools, workers, watchers, or readline handles;
4. add deterministic cleanup where the resource is created;
5. rerun until the process exits cleanly.

If the issue is specifically inside tests, defer the full runbook to `typescript-test-engineer`.

## Profiling workflow

Do not optimize blind.

Use this order:
1. establish a baseline;
2. capture a profile;
3. identify the hot path;
4. change one thing;
5. verify the improvement.

## Useful tools

- Node built-in CPU profiling: `node --cpu-prof app.js`
- Chrome DevTools / inspector for heap and allocations: `node --inspect app.js`
- HTTP benchmarking: `autocannon http://localhost:3000`

For example:

```bash
autocannon -c 50 -d 20 http://localhost:3000
node --cpu-prof server.js
```

## Performance guardrails

- Check for event-loop blocking before parallelizing everything.
- Profile real bottlenecks before adding worker threads.
- Use worker pools only for genuinely CPU-bound work.
- Re-run the benchmark after the fix; do not assume the optimization helped.
