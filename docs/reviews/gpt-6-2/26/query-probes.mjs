import assert from "node:assert/strict";
import fs from "node:fs/promises";

const rows = [];
for (const line of ["mainline", "maintenance"]) {
  const mod = await import(`./fixture/current/${line}/vendor/index.js`);
  const version = JSON.parse(await fs.readFile(new URL(`./fixture/current/${line}/vendor/package.json`, import.meta.url))).version;
  const client = new mod.QueryClient();
  let reads = 0;
  const options = { queryKey: ["current"], staleTime: Infinity, retry: false, queryFn: async () => {
    reads++;
    throw new Error("read unavailable");
  }};
  client.setQueryData(options.queryKey, "previous");
  await client.invalidateQueries({ queryKey: options.queryKey });
  const inactiveReads = reads;
  assert.equal(inactiveReads, 0);
  client.setQueryData(options.queryKey, "previous");
  const observer = new mod.QueryObserver(client, options);
  const stop = observer.subscribe(() => {});
  await client.invalidateQueries({ queryKey: options.queryKey });
  const defaultSettled = { state: observer.getCurrentResult().status, reads };
  assert.equal(defaultSettled.state, "error");
  assert.equal(defaultSettled.reads, 1);
  await assert.rejects(client.invalidateQueries({ queryKey: options.queryKey }, { throwOnError: true }), /read unavailable/);
  const throwingReads = reads;
  stop();
  const hasQuery = typeof client.query === "function";
  const cached = hasQuery ? await client.query({ ...options, staleTime: "static" }) : await client.ensureQueryData(options);
  assert.equal(cached, "previous");
  assert.equal(reads, throwingReads);
  await assert.rejects(hasQuery ? client.query({ ...options, staleTime: 0 }) : client.fetchQuery({ ...options, staleTime: 0 }), /read unavailable/);
  assert.equal(reads, throwingReads+1);
  rows.push({ line, version, hasQuery, inactiveReads, defaultSettled, throwOnErrorRefetchRejected: true,
    cacheFirstValue: cached, cacheFirstReads: 0, explicitStaleReadRejected: true, totalReads: reads });
  client.clear();
}
console.log(JSON.stringify({ node: process.version, results: rows }, null, 2));
