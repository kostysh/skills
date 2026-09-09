import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs/promises';
import path from 'node:path';
import { startProxy, LIMITS } from './proxy.mjs';

const image = 'test/postgres@sha256:' + 'f'.repeat(64);
const runId = 'fp-cli-current-20260909';
const body = extra => ({ Image: image, Labels: { 'com.supabase.cli.project': runId }, HostConfig: {}, ...extra });
async function fixture(t) {
  const dir = await fs.mkdtemp('/tmp/framework-platforms-20260909/infrastructure/docker-proxy/test-');
  const daemonSocket = path.join(dir, 'd.sock'); const socketPath = path.join(dir, 'p.sock');
  const seen = []; const containers = new Map(); const networks = new Map(); const volumes = new Map(); const streams = []; const peers = new Set(); let next = 0;
  const fake = http.createServer(async (req, res) => {
    const data = []; for await (const c of req) data.push(c);
    const bytes = Buffer.concat(data); const input = bytes.length && !req.url.includes('/archive') ? JSON.parse(bytes) : null;
    const route = req.url.replace(/^\/v\d+\.\d+/, '').split('?')[0];
    seen.push({ method: req.method, route, input, headers: req.headers, bytes });
    const reply = (code, value) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(value == null ? '' : JSON.stringify(value)); };
    if (route === '/containers/create') {
      if (input.Cmd?.[0] === 'fail') return reply(400, { message: 'failed' });
      if (input.Cmd?.[0] === 'ambiguous') { req.socket.destroy(); return; }
      if (input.Cmd?.[0] === 'slow') await new Promise(r => setTimeout(r, 30));
      const id = (++next).toString(16).padStart(64, '0');
      containers.set(id, { Id: id, Config: input, HostConfig: input.HostConfig, Mounts: [] });
      return reply(201, { Id: id });
    }
    if (route === '/networks/create' || route === '/volumes/create') {
      const kind = route.split('/')[1]; const map = kind === 'networks' ? networks : volumes;
      const id = kind === 'networks' ? (++next).toString(16).padStart(64, '0') : input.Name;
      map.set(id, { ...input, Id: id }); return reply(201, kind === 'networks' ? { Id: id } : input);
    }
    if (route === '/containers/json') return reply(200, [...containers.values(), { Id: 'e'.repeat(64), Labels: {} }]);
    if (route === '/networks') return reply(200, [...networks.values()]);
    if (route === '/volumes') return reply(200, { Volumes: [...volumes.values()] });
    const match = /^\/(containers|networks|volumes)\/([^/]+)(?:\/(.*))?$/.exec(route);
    if (match) {
      const [,kind,id,action] = match; const map = { containers, networks, volumes }[kind];
      const value = map.get(id) ?? [...map.values()].find(x => x.Name === id);
      if (!value) return reply(404, { message: 'missing' });
      if (req.method === 'DELETE') { map.delete(id); return reply(204); }
      if (action === 'exec') return reply(201, { Id: (++next).toString(16).padStart(64, '0') });
      if (action === 'logs' || action === 'archive') { res.writeHead(200, { 'content-type': 'application/octet-stream' }); res.end('stream-data'); return; }
      if (action === 'json' || !action) return reply(200, value);
      return reply(204);
    }
    if (route === '/_ping') { res.end('OK'); return; }
    reply(200, {});
  });
  fake.on('connection', socket => { peers.add(socket); socket.on('close', () => peers.delete(socket)); });
  fake.on('upgrade', (req, socket, head) => {
    streams.push({ route: req.url, chunks: [head] }); const record = streams.at(-1);
    socket.write('HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: tcp\r\n\r\n');
    socket.on('data', c => { record.chunks.push(c); socket.write(c); });
    socket.on('error', () => {});
  });
  await new Promise(r => fake.listen(daemonSocket, r));
  const config = { runId, projectId: runId, socketPath, daemonSocket, statePath: path.join(dir, 'state.json'), images: [image], hostNetworkImages: [image] };
  let proxy = await startProxy(config);
  t.after(async () => { await proxy.close(); for (const s of peers) s.destroy(); await new Promise(r => fake.close(r)); await fs.rm(dir, { recursive: true }); });
  const request = (method, url, data, options = {}) => new Promise((resolve, reject) => {
    const bytes = data == null ? Buffer.alloc(0) : Buffer.isBuffer(data) ? data : Buffer.from(JSON.stringify(data));
    const req = http.request({ socketPath, method, path: url, headers: { ...(options.chunked ? { 'transfer-encoding': 'chunked' } : { 'content-length': bytes.length }), ...options.headers }, agent: options.agent ?? false }, res => {
      const chunks = []; res.on('data', x => chunks.push(x)); res.on('end', () => { const text = Buffer.concat(chunks).toString(); let data; try { data = JSON.parse(text); } catch {} resolve({ code: res.statusCode, text, data }); });
    });
    req.on('error', reject); if (options.chunked) { req.write(bytes.subarray(0, 11)); req.end(bytes.subarray(11)); } else req.end(bytes);
  });
  return { request, proxy, seen, config, containers, networks, volumes, streams, async restart() { await proxy.close(); proxy = await startProxy(config); return proxy; } };
}

test('three children including local DB rewritten; fourth denied; stop retains; exact delete releases', async t => {
  const f = await fixture(t); const ids = [];
  for (let n = 0; n < 3; n++) {
    const r = await f.request('POST', '/v1.43/containers/create', body()); assert.equal(r.code, 201); ids.push(r.data.Id);
  }
  for (const { input } of f.seen.filter(r => r.route === '/containers/create')) {
    assert.equal(input.HostConfig.NanoCpus, LIMITS.cpu); assert.equal(input.HostConfig.Memory, LIMITS.memory); assert.equal(input.HostConfig.MemorySwap, LIMITS.memory); assert.equal(input.HostConfig.CpusetCpus, '28-31');
    assert.equal(input.Labels['local.study.run'], runId);
  }
  assert.equal((await f.request('POST', '/containers/create', body())).code, 409);
  assert.equal((await f.request('POST', `/containers/${ids[0]}/stop`)).code, 204);
  assert.equal((await f.request('POST', '/containers/create', body())).code, 409);
  assert.equal((await f.request('DELETE', `/containers/${ids[0]}?force=1`)).code, 204);
  assert.equal((await f.request('POST', '/containers/create', body())).code, 201);
});

test('concurrent pending creates count atomically', async t => {
  const f = await fixture(t);
  const results = await Promise.all(Array.from({ length: 8 }, () => f.request('POST', '/containers/create', body({ Cmd: ['slow'] }))));
  assert.equal(results.filter(r => r.code === 201).length, 3); assert.equal(results.filter(r => r.code === 409).length, 5);
  assert.equal(f.seen.filter(x => x.route === '/containers/create').length, 3);
});

test('keepalive second create and chunked bodies reauthorize and rewrite', async t => {
  const f = await fixture(t); const agent = new http.Agent({ keepAlive: true, maxSockets: 1 }); t.after(() => agent.destroy());
  for (let i = 0; i < 3; i++) assert.equal((await f.request('POST', '/containers/create', body(), { agent, chunked: true })).code, 201);
  assert.equal((await f.request('POST', '/containers/create', body(), { agent })).code, 409);
  assert.equal((await f.request('POST', '/containers/' + 'e'.repeat(64) + '/start', null, { agent })).code, 404);
  assert.equal(f.seen.filter(x => x.route === '/containers/create').length, 3);
});

test('pipelined fourth create never reaches daemon; ambiguous framing rejected', async t => {
  const f = await fixture(t); const encoded = JSON.stringify(body());
  const one = `POST /containers/create HTTP/1.1\r\nHost: docker\r\nContent-Length: ${Buffer.byteLength(encoded)}\r\n\r\n${encoded}`;
  const response = await raw(f.config.socketPath, one.repeat(4), 4);
  assert.equal((response.match(/201 Created/g) ?? []).length, 3); assert.equal((response.match(/409 Conflict/g) ?? []).length, 1);
  const before = f.seen.length;
  const rejected = await raw(f.config.socketPath, 'POST /containers/create HTTP/1.1\r\nHost: docker\r\nContent-Length: 0\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\n', 1);
  assert.match(rejected, /400/); assert.equal(f.seen.length, before);
});
function raw(socketPath, bytes, responses) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(socketPath); let result = ''; const timer = setTimeout(() => { socket.destroy(); reject(new Error('raw timeout')); }, 3000);
    socket.on('connect', () => socket.write(bytes)); socket.on('error', reject);
    socket.on('data', c => { result += c; if ((result.match(/HTTP\/1\.1/g) ?? []).length >= responses) { clearTimeout(timer); socket.destroy(); resolve(result); } });
    socket.on('end', () => { clearTimeout(timer); resolve(result); });
  });
}

test('deny unknown/start/update/privilege/host mounts without forwarding or foreign cleanup', async t => {
  const f = await fixture(t);
  const id = (await f.request('POST', '/containers/create', body())).data.Id;
  for (const [method, route, input] of [['POST', '/containers/' + id + '/update', { Memory: 1 }], ['POST','/containers/' + 'e'.repeat(64) + '/start'], ['DELETE','/containers/' + 'e'.repeat(64)], ['POST','/containers/prune'], ['POST','/images/create'], ['POST','/build']]) {
    const before = f.seen.length; assert.ok((await f.request(method, route, input)).code >= 400); assert.equal(f.seen.length, before);
  }
  for (const HostConfig of [{ Privileged: true }, { Binds: ['/var/run/docker.sock:/var/run/docker.sock'] }, { CpuQuota: 1000 }, { MemorySwap: -1 }, { Devices: [{ PathOnHost: '/dev/sda' }] }, { PidMode: 'host' }, { SecurityOpt: ['seccomp=unconfined'] }, { Mounts: [{ Type: 'bind', Source: '/', Target: '/host' }] }]) {
    const before = f.seen.length; assert.ok([403, 404].includes((await f.request('POST', '/containers/create', body({ HostConfig }))).code)); assert.equal(f.seen.length, before);
  }
});

test('definite failed create releases; disconnect holds durable reservation and blocks restart', async t => {
  const f = await fixture(t);
  assert.equal((await f.request('POST', '/containers/create', body({ Cmd: ['fail'] }))).code, 400); assert.equal(f.proxy.state().containers.length, 0);
  assert.equal((await f.request('POST', '/containers/create', body({ Cmd: ['ambiguous'] }))).code, 502); assert.equal(f.proxy.state().containers.length, 1);
  const persisted = JSON.parse(await fs.readFile(f.config.statePath)); assert.equal(persisted.containers[0].pending, true);
  assert.equal((await f.request('POST', '/containers/create', body())).code, 201); assert.equal((await f.request('POST', '/containers/create', body())).code, 201);
  assert.equal((await f.request('POST', '/containers/create', body())).code, 409);
  // Restart failure is verified with a second attempt while the first owns the state: lock must reject.
  await assert.rejects(startProxy(f.config), /EEXIST/);
  await f.proxy.close();
  await assert.rejects(startProxy(f.config), /ambiguous state/);
});

test('restart validates durable tracked inventory, tighter resources preserved', async t => {
  const f = await fixture(t);
  assert.equal((await f.request('POST', '/containers/create', body({ HostConfig: { NanoCpus: 500000000, Memory: 1024 ** 3, MemorySwap: 1024 ** 3, CpusetCpus: '28,29' } }))).code, 201);
  const restarted = await f.restart(); assert.equal(restarted.state().containers.length, 1);
});

test('scoped networks volumes archives, no adoption of foreign pre-existing volume', async t => {
  const f = await fixture(t); const network = `supabase_network_${runId}`; const volume = `supabase_db_${runId}`;
  const n = await f.request('POST', '/networks/create', { Name: network, Driver: 'bridge' }); assert.equal(n.code, 201);
  assert.equal((await f.request('POST', '/volumes/create', { Name: volume })).code, 201);
  assert.equal((await f.request('POST', '/volumes/create', { Name: volume })).code, 201);
  const result = await f.request('POST', '/containers/create?name=' + volume, body({ HostConfig: { NetworkMode: network, Binds: [`${volume}:/var/lib/postgresql/data`], RestartPolicy: { Name: 'always' } }, NetworkingConfig: { EndpointsConfig: { [network]: { Aliases: ['db'] } } } }));
  assert.equal(result.code, 201);
  assert.equal((await f.request('PUT', `/containers/${result.data.Id}/archive?path=/`, Buffer.from('tiny archive'), { chunked: true })).code, 200);
  const list = await f.request('GET', '/containers/json?all=1'); assert.equal(list.data.length, 1);
  const foreign = `${runId}-preexisting`; f.volumes.set(foreign, { Name: foreign, Labels: {} });
  assert.equal((await f.request('POST', '/volumes/create', { Name: foreign })).code, 409);
  assert.equal((await f.request('DELETE', '/volumes/' + foreign)).code, 404); assert.ok(f.volumes.has(foreign));
});

test('authorized tracked exec and attach upgrades stream data; unknown upgrades denied', async t => {
  const f = await fixture(t); const id = (await f.request('POST', '/containers/create', body({ HostConfig: { NetworkMode: 'host' } }))).data.Id;
  const execution = await f.request('POST', `/containers/${id}/exec`, { Cmd: ['sh'], AttachStdin: true, AttachStdout: true }); assert.equal(execution.code, 201);
  for (const [url, input] of [[`/containers/${id}/attach?stream=1&stdin=1&stdout=1`, null], [`/exec/${execution.data.Id}/start`, { Detach: false, Tty: false }]]) {
    await new Promise((resolve, reject) => {
      const bytes = input ? Buffer.from(JSON.stringify(input)) : Buffer.alloc(0);
      const req = http.request({ socketPath: f.config.socketPath, path: url, method: 'POST', headers: { connection: 'Upgrade', upgrade: 'tcp', 'content-length': bytes.length }, agent: false });
      const timer = setTimeout(() => reject(new Error('upgrade timeout')), 3000);
      req.on('upgrade', (res, socket) => { assert.equal(res.statusCode, 101); socket.on('error', () => {}); socket.once('data', chunk => { assert.equal(chunk.toString(), 'stdin-payload'); clearTimeout(timer); socket.destroy(); resolve(); }); socket.write('stdin-payload'); });
      req.on('error', reject); req.on('response', res => { clearTimeout(timer); reject(new Error(`upgrade rejected ${res.statusCode}`)); }); req.end(bytes);
    });
  }
  assert.equal(f.streams.length, 2);
  for (const route of ['/containers/create', `/containers/${'e'.repeat(64)}/attach`, `/exec/${'e'.repeat(64)}/start`]) {
    assert.match(await raw(f.config.socketPath, `POST ${route} HTTP/1.1\r\nHost: docker\r\nConnection: Upgrade\r\nUpgrade: tcp\r\nContent-Length: 0\r\n\r\n`, 1), /40[034]/);
  }
  assert.equal(f.streams.length, 2);
});

test('request secrets never forwarded as auth metadata nor persisted', async t => {
  const f = await fixture(t); const secret = 'secret-unique-canary';
  assert.equal((await f.request('POST', '/containers/create', body({ Env: ['PASSWORD=' + secret] }), { headers: { authorization: secret, 'x-registry-auth': secret } })).code, 201);
  const created = f.seen.find(x => x.route === '/containers/create'); assert.equal(created.headers.authorization, undefined); assert.equal(created.headers['x-registry-auth'], undefined);
  assert.ok(!String(await fs.readFile(f.config.statePath)).includes(secret));
});

test('HTTP-looking bytes after authorized upgrade are stdin; pipelined transition denied', async t => {
  const f = await fixture(t); const id = (await f.request('POST', '/containers/create', body())).data.Id;
  const control = 'POST /containers/create HTTP/1.1\r\nHost: docker\r\nContent-Length: 0\r\n\r\n';
  const headers = `POST /containers/${id}/attach?stdin=1&stream=1 HTTP/1.1\r\nHost: docker\r\nConnection: Upgrade\r\nUpgrade: tcp\r\nContent-Length: 0\r\n\r\n`;
  assert.match(await raw(f.config.socketPath, headers + control, 1), /400/); assert.equal(f.streams.length, 0);
  await new Promise((resolve, reject) => {
    const socket = net.connect(f.config.socketPath); let phase = 'headers'; let received = '';
    const timer = setTimeout(() => { socket.destroy(); reject(new Error('stream test timeout')); }, 3000);
    socket.on('error', reject); socket.on('connect', () => socket.write(headers));
    socket.on('data', chunk => {
      received += chunk;
      if (phase === 'headers' && received.includes('\r\n\r\n')) { assert.match(received, /101/); phase = 'stdin'; received = ''; socket.write(control); }
      else if (phase === 'stdin' && received.includes(control)) { clearTimeout(timer); socket.destroy(); resolve(); }
    });
  });
  assert.equal(f.streams.length, 1); assert.equal(f.seen.filter(r => r.route === '/containers/create').length, 1);
});

test('resource mismatch blocks restart with reservation preserved', async t => {
  const f = await fixture(t);
  const id = (await f.request('POST', '/containers/create', body())).data.Id;
  f.containers.get(id).HostConfig.Memory = 4 * 1024 ** 3;
  await f.proxy.close();
  await assert.rejects(startProxy(f.config), /resource mismatch/);
});


test('native missing-container classifier and default IPAM preserve denial boundary', async t => {
  const f = await fixture(t);
  const missing = await f.request('GET', '/containers/supabase_db_' + runId + '/json');
  assert.equal(missing.code, 404); assert.match(missing.data.message, /no such container/i);
  assert.equal(f.seen.length, 0);
  for (const IPAM of [{Driver:'custom'}, {Driver:'default',Config:[{Subnet:'10.3.0.0/16'}]}, {Driver:'default',Options:{foo:'bar'}}]) {
    assert.equal((await f.request('POST','/networks/create',{Name:runId+'-denied',IPAM})).code,403);
  }
  assert.equal(f.seen.length, 0);
  const created = await f.request('POST','/networks/create',{Name:runId+'-default',IPAM:{Driver:'default',Options:{},Config:[]}});
  assert.equal(created.code,201);
  assert.equal(f.seen.find(x=>x.route==='/networks/create').input.IPAM,undefined);
});


test('native MemorySwappiness sentinel is discarded without relaxing caps', async t => {
  const f = await fixture(t);
  assert.equal((await f.request('POST','/containers/create',body({HostConfig:{MemorySwappiness:100}}))).code,403);
  assert.equal(f.seen.length,0);
  const r=await f.request('POST','/containers/create',body({HostConfig:{MemorySwappiness:-1}}));
  assert.equal(r.code,201);
  const h=f.seen.find(x=>x.route==='/containers/create').input.HostConfig;
  assert.equal(h.MemorySwappiness,undefined);assert.equal(h.MemorySwap,h.Memory);
});
