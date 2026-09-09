import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export const LIMITS = Object.freeze({ slots: 3, cpu: 750000000, memory: 3221225472, cpus: '28-31', body: 2 ** 20, archive: 16 * 2 ** 20, stream: 64 * 2 ** 20, time: 600000, connections: 24, requests: 16, sessions: 8 });
const RUN = 'local.study.run';
const NONCE = 'local.study.reservation';
const PROJECT = 'com.supabase.cli.project';
const COMPOSE = 'com.docker.compose.project';
const fail = (message = 'policy denied', status = 403) => { throw Object.assign(new Error(message), { status }); };
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const inert = x => x == null || x === false || x === '' || x === 0 || (Array.isArray(x) ? x.every(inert) : object(x) && Object.values(x).every(inert));
function fields(x, names) {
  if (!object(x)) fail('object required');
  for (const [key, value] of Object.entries(x)) if (!names.includes(key) && !inert(value)) fail('unsupported field');
}
function json(bytes) { try { const x = JSON.parse(bytes); if (!object(x)) fail(); return x; } catch { fail('invalid JSON', 400); } }
function integer(value, fallback, cap) {
  if (value == null || value === 0) return fallback;
  if (!Number.isSafeInteger(value) || value <= 0 || value > cap) fail('resource conflict');
  return value;
}
function meter(max) {
  let bytes = 0;
  return new Transform({ transform(chunk, encoding, done) { bytes += chunk.length; done(bytes > max ? new Error('byte bound') : null, chunk); } });
}
async function collect(stream, max) {
  const chunks = []; let size = 0;
  for await (const chunk of stream) { size += chunk.length; if (size > max) fail('body too large', 413); chunks.push(chunk); }
  return Buffer.concat(chunks);
}
function apiPath(req) {
  if (!req.url.startsWith('/') || req.url.startsWith('//') || /[%\\#]/.test(req.url.split('?')[0])) fail('invalid path', 400);
  const url = new URL(req.url, 'http://local');
  const route = url.pathname.replace(/^\/v\d+\.\d+(?=\/)/, '');
  if (route.includes('//') || route.includes('..')) fail('invalid path', 400);
  return { url, route };
}
function query(url, allowed) {
  const seen = new Set();
  for (const key of url.searchParams.keys()) { if (!allowed.includes(key) || seen.has(key)) fail('unsupported query'); seen.add(key); }
}
function headers(req, length, upgrade = false) {
  // Reconstruct, never relay auth, Docker registry auth or client hop-by-hop headers.
  const result = { host: 'docker', connection: upgrade ? 'Upgrade' : 'close', 'content-length': length };
  if (req.headers['content-type']) result['content-type'] = req.headers['content-type'];
  if (upgrade) result.upgrade = 'tcp';
  return result;
}
export async function startProxy(config) {
  for (const key of ['runId', 'projectId', 'socketPath', 'daemonSocket', 'statePath']) if (typeof config[key] !== 'string' || !config[key]) fail('missing config');
  if (!/^[a-z0-9][a-z0-9-]{7,63}$/.test(config.runId) || !config.projectId.startsWith(config.runId) || !/^[a-z0-9_-]+$/.test(config.projectId)) fail('invalid identity');
  if (!Array.isArray(config.images) || !config.images.length || config.images.some(x => typeof x !== 'string' || !x)) fail('explicit image allowlist required');
  if (!Array.isArray(config.hostNetworkImages ?? []) || (config.hostNetworkImages ?? []).some(x => !config.images.includes(x))) fail('invalid host network allowlist');
  for (const key of ['socketPath', 'daemonSocket', 'statePath']) if (!path.isAbsolute(config[key])) fail('absolute paths required');
  if (config.socketPath === config.daemonSocket) fail('socket conflict');
  const fingerprint = createHash('sha256').update(JSON.stringify({ runId: config.runId, projectId: config.projectId, daemon: config.daemonSocket, images: config.images, host: config.hostNetworkImages ?? [], limits: LIMITS })).digest('hex');
  const lockPath = `${config.statePath}.lock`;
  const lock = fs.openSync(lockPath, 'wx', 0o600);
  let state = { version: 1, fingerprint, containers: [], networks: [], volumes: [], execs: [] };
  let poisoned = false;
  const sockets = new Set(); const outbound = new Set(); let active = 0; let sessions = 0; let archives = 0; let closingPromise;
  function save() {
    try {
      const tmp = `${config.statePath}.next`;
      const fd = fs.openSync(tmp, 'w', 0o600);
      try { fs.writeFileSync(fd, JSON.stringify(state)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
      fs.renameSync(tmp, config.statePath);
      const dir = fs.openSync(path.dirname(config.statePath), 'r');
      try { fs.fsyncSync(dir); } finally { fs.closeSync(dir); }
    } catch { poisoned = true; fail('state persistence failed', 503); }
  }
  const scopedName = name => typeof name === 'string' && (/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name)) && (name.startsWith(`${config.runId}-`) || (name.startsWith('supabase_') && name.endsWith(`_${config.projectId}`)));
  function labels(input, nonce) {
    if (!object(input ?? {})) fail('invalid labels');
    const result = { ...input };
    for (const [key, value] of Object.entries({ [RUN]: config.runId, [NONCE]: nonce, [PROJECT]: config.projectId, [COMPOSE]: config.projectId })) {
      if (key !== NONCE && result[key] != null && result[key] !== value) fail('foreign labels');
      if (key === NONCE && result[key] != null) fail('reserved label');
      result[key] = value;
    }
    return result;
  }
  function owned(kind, id) {
    const record = state[kind].find(x => x.id === id || x.name === id);
    if (!record?.id || record.pending) fail('untracked object', 404);
    return record;
  }
  function reserve(kind, name) {
    if (state[kind].length >= (kind === 'containers' ? LIMITS.slots : 16)) fail('reservation budget exhausted', 409);
    if (state[kind].some(x => x.name === name)) fail('reservation name conflict', 409);
    const record = { nonce: randomUUID(), name, pending: true };
    state[kind].push(record); save(); return record;
  }
  function remove(kind, record) {
    state[kind] = state[kind].filter(x => x !== record);
    if (kind === 'containers') state.execs = state.execs.filter(x => x.container !== record.id);
    save();
  }
  async function upstream(req, body, upgrade = false) {
    return new Promise((resolve, reject) => {
      const outgoing = http.request({ socketPath: config.daemonSocket, path: req.url, method: req.method, headers: headers(req, body.length, upgrade), agent: false, timeout: LIMITS.time });
      outbound.add(outgoing);
      const deadline = setTimeout(() => outgoing.destroy(new Error('deadline')), LIMITS.time);
      outgoing.on('close', () => { clearTimeout(deadline); outbound.delete(outgoing); });
      outgoing.on('error', reject);
      outgoing.on('timeout', () => outgoing.destroy(new Error('deadline')));
      outgoing.on('response', response => resolve({ response }));
      outgoing.on('upgrade', (response, socket, head) => resolve({ response, socket, head }));
      outgoing.end(body);
    });
  }
  async function internal(method, url) {
    const { response, socket } = await upstream({ method, url, headers: {} }, Buffer.alloc(0));
    if (socket) { socket.destroy(); fail('unexpected upgrade', 502); }
    const bytes = await collect(response, LIMITS.body);
    return { code: response.statusCode, bytes };
  }
  function hostConfig(input, image) {
    const h = input ?? {};
    fields(h, ['NanoCpus', 'Memory', 'MemorySwap', 'CpusetCpus', 'MemoryReservation', 'ShmSize', 'Binds', 'Mounts', 'NetworkMode', 'PortBindings', 'ExtraHosts', 'AutoRemove', 'RestartPolicy', 'SecurityOpt', 'LogConfig', 'CapDrop', 'ReadonlyRootfs', 'Init', 'Tmpfs']);
    // Zero-valued SDK fields are discarded; only this reconstructed surface reaches Docker.
    const out = { NanoCpus: integer(h.NanoCpus, LIMITS.cpu, LIMITS.cpu), Memory: integer(h.Memory, LIMITS.memory, LIMITS.memory), CpusetCpus: LIMITS.cpus };
    if (h.CpusetCpus && h.CpusetCpus !== LIMITS.cpus) {
      const tokens = h.CpusetCpus.split(',');
      if (!tokens.length || tokens.some(t => !/^(28|29|30|31)$/.test(t)) || new Set(tokens).size !== tokens.length) fail('cpuset conflict');
      out.CpusetCpus = tokens.join(',');
    }
    out.MemorySwap = integer(h.MemorySwap, out.Memory, LIMITS.memory);
    if (out.MemorySwap < out.Memory) fail('memory swap conflict');
    if (h.MemoryReservation) out.MemoryReservation = integer(h.MemoryReservation, 0, out.Memory);
    out.ShmSize = integer(h.ShmSize, 64 * 2 ** 20, out.Memory);
    const network = h.NetworkMode || 'none';
    if (network === 'host') { if (!(config.hostNetworkImages ?? []).includes(image)) fail('host network not authorized'); }
    else if (network !== 'none') owned('networks', network);
    out.NetworkMode = network;
    out.Binds = (h.Binds ?? []).map(bind => {
      if (typeof bind !== 'string') fail('invalid bind');
      const parts = bind.split(':');
      if (parts.length < 2 || parts.length > 3 || !parts[1].startsWith('/') || !['rw', 'ro', undefined].includes(parts[2])) fail('unsupported bind');
      owned('volumes', parts[0]); return bind;
    });
    out.Mounts = (h.Mounts ?? []).map(m => {
      fields(m, ['Type', 'Source', 'Target', 'ReadOnly', 'VolumeOptions']);
      if (m.Type !== 'volume' || typeof m.Target !== 'string' || !m.Target.startsWith('/')) fail('unsupported mount');
      owned('volumes', m.Source); fields(m.VolumeOptions ?? {}, ['NoCopy']);
      return { Type: 'volume', Source: m.Source, Target: m.Target, ReadOnly: !!m.ReadOnly, VolumeOptions: { NoCopy: !!m.VolumeOptions?.NoCopy } };
    });
    if (h.Tmpfs && Object.keys(h.Tmpfs).length) {
      out.Tmpfs = {};
      for (const [target, options] of Object.entries(h.Tmpfs)) {
        if (!target.startsWith('/') || typeof options !== 'string' || options.split(',').some(x => !['rw','ro','nosuid','nodev','noexec'].includes(x) && !/^size=[1-9][0-9]*$/.test(x))) fail('unsupported tmpfs');
        const sizes = options.split(',').filter(x => x.startsWith('size='));
        if (sizes.length !== 1 || Number(sizes[0].slice(5)) > out.Memory) fail('tmpfs requires bounded size');
        out.Tmpfs[target] = options;
      }
    }
    out.PortBindings = {};
    for (const [port, bindings] of Object.entries(h.PortBindings ?? {})) {
      if (!/^\d{1,5}\/(tcp|udp)$/.test(port)) fail('invalid port');
      out.PortBindings[port] = bindings.map(binding => {
        fields(binding, ['HostIp','HostPort']);
        if (binding.HostIp && binding.HostIp !== '127.0.0.1') fail('non-loopback publication');
        if (!/^\d{0,5}$/.test(binding.HostPort ?? '') || Number(binding.HostPort) > 65535) fail('invalid port');
        return { HostIp: '127.0.0.1', HostPort: binding.HostPort || '0' };
      });
    }
    if ((h.SecurityOpt ?? []).some(x => !['no-new-privileges', 'no-new-privileges:true'].includes(x))) fail('unsupported security option');
    fields(h.RestartPolicy ?? {}, ['Name', 'MaximumRetryCount']);
    if (!['', 'no', 'always', 'unless-stopped', 'on-failure'].includes(h.RestartPolicy?.Name ?? '')) fail('restart policy denied');
    if (!inert(h.LogConfig) && h.LogConfig?.Type !== 'json-file') fail('unsupported log driver');
    out.LogConfig = { Type: 'json-file', Config: { 'max-size': '10m', 'max-file': '2' } };
    out.AutoRemove = !!h.AutoRemove; out.RestartPolicy = { Name: h.RestartPolicy?.Name || 'no', MaximumRetryCount: integer(h.RestartPolicy?.MaximumRetryCount, 0, 10) };
    out.SecurityOpt = ['no-new-privileges:true'];
    for (const key of ['CapDrop', 'ReadonlyRootfs', 'Init', 'ExtraHosts']) if (h[key] != null) out[key] = h[key];
    return out;
  }
  async function authorize(req, body, upgrading) {
    if (poisoned) fail('state unavailable', 503);
    const { url, route } = apiPath(req); const method = req.method;
    if (['GET', 'HEAD', 'DELETE'].includes(method) && body.length) fail('body denied');
    let plan = { req, body };
    const setJson = x => { plan.body = Buffer.from(JSON.stringify(x)); plan.req = { ...req, headers: { 'content-type': 'application/json' }, url: req.url, method }; };
    if (upgrading && !(method === 'POST' && (/^\/containers\/[^/]+\/attach$/.test(route) || /^\/exec\/[^/]+\/start$/.test(route)))) fail('upgrade denied');
    if (['GET','HEAD'].includes(method) && ['/_ping','/version','/info'].includes(route)) { query(url, []); return plan; }
    if (method === 'GET' && /^\/images\/.+\/json$/.test(route)) {
      query(url, []); const image = route.slice(8, -5); if (!config.images.includes(image)) fail('image not allowed'); return plan;
    }
    if (method === 'POST' && route === '/containers/create') {
      query(url, ['name','platform']);
      const c = json(body);
      fields(c, ['Hostname','Domainname','User','AttachStdin','AttachStdout','AttachStderr','ExposedPorts','Tty','OpenStdin','StdinOnce','Env','Cmd','Healthcheck','Image','Volumes','WorkingDir','Entrypoint','NetworkDisabled','Labels','StopSignal','StopTimeout','HostConfig','NetworkingConfig']);
      if (!config.images.includes(c.Image)) fail('image not allowed');
      if (Object.keys(c.Volumes ?? {}).length) fail('anonymous volumes denied; use tracked named volume');
      const name = url.searchParams.get('name') || `${config.runId}-${randomUUID()}`;
      if (!scopedName(name)) fail('foreign name');
      c.HostConfig = hostConfig(c.HostConfig, c.Image);
      const endpoints = c.NetworkingConfig?.EndpointsConfig ?? {};
      fields(c.NetworkingConfig ?? {}, ['EndpointsConfig']);
      for (const [network, endpoint] of Object.entries(endpoints)) { owned('networks', network); fields(endpoint, ['Aliases']); }
      const nonce = randomUUID(); c.Labels = labels(c.Labels, nonce);
      const record = reserve('containers', name); record.nonce = nonce; save();
      url.searchParams.set('name', name); plan.req = { ...req, url: url.pathname + url.search, method, headers: req.headers };
      plan.body = Buffer.from(JSON.stringify(c)); plan.created = { kind: 'containers', record }; return plan;
    }
    if (method === 'POST' && ['/networks/create','/volumes/create'].includes(route)) {
      query(url, []); const kind = route.startsWith('/networks') ? 'networks' : 'volumes'; const c = json(body);
      fields(c, kind === 'networks' ? ['Name','CheckDuplicate','Driver','Internal','Attachable','EnableIPv6','IPAM','Labels'] : ['Name','Driver','DriverOpts','Labels']);
      if (!scopedName(c.Name)) fail('foreign name');
      if (kind === 'networks' ? c.Driver && c.Driver !== 'bridge' : c.Driver && c.Driver !== 'local') fail('unsupported driver');
      if (!inert(c.DriverOpts) || !inert(c.IPAM)) fail('custom network or volume options denied');
      const existing = state[kind].find(x => x.name === c.Name && x.id && !x.pending);
      if (existing) { const probe = await internal('GET', `/${kind}/${existing.id}`); if (probe.code !== 200) fail('tracked object requires reconciliation', 409); return { local: { code: 201, bytes: kind === 'networks' ? Buffer.from(JSON.stringify({ Id: existing.id, Warning: '' })) : probe.bytes } }; }
      const checkedLabels = labels(c.Labels, randomUUID());
      const record = reserve(kind, c.Name);
      const probe = await internal('GET', `/${kind}/${c.Name}`);
      if (probe.code !== 404) { if (probe.code === 200) remove(kind, record); fail('pre-existing or ambiguous object', 409); }
      c.Labels = { ...checkedLabels, [NONCE]: record.nonce }; if (kind === 'networks') c.CheckDuplicate = true;
      setJson(c); plan.created = { kind, record }; return plan;
    }
    if (method === 'GET' && ['/containers/json','/networks','/volumes'].includes(route)) {
      query(url, ['all','limit','size','filters']);
      const kind = route.startsWith('/containers') ? 'containers' : route.slice(1);
      let filters = {};
      if (url.searchParams.has('filters')) filters = json(Buffer.from(url.searchParams.get('filters')));
      // Never trust caller filters to establish ownership: intersect response with exact inventory.
      filters.label = [`${RUN}=${config.runId}`]; url.searchParams.set('filters', JSON.stringify(filters));
      plan.req = { ...req, url: url.pathname + url.search, method, headers: req.headers }; plan.list = kind; return plan;
    }
    const match = /^\/(containers|networks|volumes|exec)\/([^/]+)(?:\/(.+))?$/.exec(route);
    if (!match) fail('endpoint denied');
    const [, kind, id, action = ''] = match;
    if (kind === 'exec') {
      const execution = state.execs.find(x => x.id === id); if (!execution) fail('untracked exec', 404);
      owned('containers', execution.container);
      if (method === 'GET' && action === 'json') { query(url, []); return plan; }
      if (method !== 'POST' || action !== 'start') fail('exec action denied');
      query(url, []); const c = json(body); fields(c, ['Detach','Tty','ConsoleSize']);
      if (c.Detach) fail('detached exec denied');
      plan.stream = true; return plan;
    }
    const record = owned(kind, id);
    // Names are accepted only as tracked aliases; daemon mutations always use the exact full ID.
    plan.req = { ...req, method, headers: req.headers, url: req.url.replace(`/${kind}/${id}`, `/${kind}/${record.id}`) };
    if (method === 'DELETE' && !action) { query(url, kind === 'containers' ? ['v','force','link'] : ['force']); if (url.searchParams.get('link') === '1' || url.searchParams.get('link') === 'true') fail(); if (kind === 'containers') { const deletion = new URL(plan.req.url, 'http://local'); deletion.searchParams.set('v', '1'); plan.req.url = deletion.pathname + deletion.search; } plan.deleted = { kind, record }; return plan; }
    if (kind !== 'containers') {
      if (method === 'GET' && !action) { query(url, ['verbose','scope']); return plan; }
      if (kind === 'networks' && method === 'POST' && ['connect','disconnect'].includes(action)) {
        query(url, []); const c = json(body); fields(c, ['Container','EndpointConfig','Force']);
        c.Container = owned('containers', c.Container).id; fields(c.EndpointConfig ?? {}, ['Aliases']); setJson(c);
        plan.req.url = req.url.replace(`/networks/${id}`, `/networks/${record.id}`); return plan;
      }
      fail('object action denied');
    }
    const allowed = { GET: ['json','logs','archive'], HEAD: ['archive'], POST: ['start','stop','restart','kill','wait','attach','exec'], PUT: ['archive'] };
    if (!(allowed[method] ?? []).includes(action)) fail('container action denied');
    const queries = { json: ['size'], logs: ['follow','stdout','stderr','since','until','timestamps','tail','details'], archive: ['path','noOverwriteDirNonDir','copyUIDGID'], start: [], stop: ['t','signal'], restart: ['t','signal'], kill: ['signal'], wait: ['condition'], attach: ['logs','stream','stdin','stdout','stderr','detachKeys'], exec: [] };
    query(url, queries[action]);
    if (action === 'archive' && (!url.searchParams.get('path')?.startsWith('/') || url.searchParams.get('path').includes('\0'))) fail('invalid archive path');
    if (action === 'exec') {
      const c = json(body); fields(c, ['AttachStdin','AttachStdout','AttachStderr','DetachKeys','Tty','Env','Cmd','User','WorkingDir','ConsoleSize']);
      if (state.execs.length >= 128) fail('exec inventory exhausted', 409);
      plan.execContainer = record.id;
    } else if (!['archive','attach'].includes(action) && body.length) fail('body denied');
    if (['attach','logs','archive','wait'].includes(action)) plan.stream = true;
    return plan;
  }
  function verifyContainer(c, record) {
    const h = c.HostConfig;
    const cpus = h?.CpusetCpus;
    const validCpuSet = cpus === LIMITS.cpus || (typeof cpus === 'string' && cpus.length > 0 && cpus.split(',').every(x => /^(28|29|30|31)$/.test(x)));
    if (c.Id !== record.id || c.Config?.Labels?.[RUN] !== config.runId || c.Config?.Labels?.[NONCE] !== record.nonce || !h || !Number.isSafeInteger(h.NanoCpus) || h.NanoCpus <= 0 || h.NanoCpus > LIMITS.cpu || !Number.isSafeInteger(h.Memory) || h.Memory <= 0 || h.Memory > LIMITS.memory || !Number.isSafeInteger(h.MemorySwap) || h.MemorySwap < h.Memory || h.MemorySwap > LIMITS.memory || !validCpuSet) fail('tracked resource mismatch');
  }
  async function processResponse(plan, result, res) {
    const { response, socket } = result;
    if (socket) { socket.destroy(); fail('unexpected upgrade', 502); }
    if (plan.stream && !plan.created && !plan.deleted && !plan.execContainer && !plan.list) {
      res.writeHead(response.statusCode, safeResponseHeaders(response));
      const timer = setTimeout(() => { response.destroy(); res.destroy(); }, LIMITS.time);
      try { await pipeline(response, meter(LIMITS.stream), res); } finally { clearTimeout(timer); } return;
    }
    let bytes = await collect(response, LIMITS.body);
    if (plan.created) {
      const { kind, record } = plan.created;
      if (response.statusCode >= 200 && response.statusCode < 300) {
        const c = json(bytes); const id = kind === 'volumes' ? c.Name : c.Id;
        if (typeof id !== 'string' || (kind !== 'volumes' && !/^[a-f0-9]{64}$/.test(id)) || (kind === 'volumes' && id !== record.name)) fail('ambiguous create result', 502);
        if (kind === 'volumes' && (c.Labels?.[RUN] !== config.runId || c.Labels?.[NONCE] !== record.nonce)) fail('volume ownership conflict', 502);
        record.id = id; save();
        if (kind === 'containers') {
          const probe = await internal('GET', `/containers/${id}/json`);
          if (probe.code !== 200) fail('create inspection ambiguous', 502);
          const created = json(probe.bytes);
          verifyContainer(created, record);
          if ((created.Mounts ?? []).length > 32) fail('mount count bound', 502);
          record.anonymousVolumes = (created.Mounts ?? []).filter(m => m.Type === 'volume' && !state.volumes.some(v => v.id === m.Name)).map(m => m.Name);
          if (record.anonymousVolumes.some(n => typeof n !== 'string' || !/^[a-f0-9]{64}$/.test(n))) fail('unexpected implicit volume', 502);
        }
        record.pending = false; save();
      } else if ([400,404,409,422].includes(response.statusCode)) remove(kind, record);
    }
    if (plan.deleted && [204,404].includes(response.statusCode)) remove(plan.deleted.kind, plan.deleted.record);
    if (plan.execContainer && response.statusCode === 201) {
      const id = json(bytes).Id; if (typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id)) fail('invalid exec ID', 502);
      state.execs.push({ id, container: plan.execContainer }); save();
    }
    if (plan.list && response.statusCode === 200) {
      const data = JSON.parse(bytes); const records = state[plan.list];
      const selected = (Array.isArray(data) ? data : data.Volumes ?? []).filter(x => records.some(r => r.id && r.id === (x.Id ?? x.ID ?? x.Name)));
      bytes = Buffer.from(JSON.stringify(plan.list === 'volumes' ? { Volumes: selected, Warnings: [] } : selected));
    }
    res.writeHead(response.statusCode, { ...safeResponseHeaders(response), 'content-length': bytes.length }); res.end(bytes);
  }
  function safeResponseHeaders(response) {
    const out = {};
    for (const key of ['content-type','api-version','docker-experimental','ostype','server','x-docker-container-path-stat']) if (response.headers[key]) out[key] = response.headers[key];
    return out;
  }
  function error(res, err) {
    // Fixed errors only: never emit/log upstream errors, bodies, Env or request headers.
    if (res.headersSent) { res.destroy(); return; }
    res.writeHead(err.status ?? 502, { 'content-type': 'application/json', connection: 'close' });
    res.end(JSON.stringify({ message: err.status ? err.message : 'proxy upstream failure; reservation retained if ambiguous' }));
  }
  const server = http.createServer({ maxHeaderSize: 16384, requestTimeout: 30000, headersTimeout: 15000, keepAliveTimeout: 2000 }, async (req, res) => {
    if (++active > LIMITS.requests) { active--; error(res, { status: 429, message: 'request bound' }); return; }
    let heldArchive = false;
    try {
      const archive = req.method === 'PUT' && /\/archive(?:\?|$)/.test(req.url);
      if (archive && archives >= 1) fail('archive concurrency bound', 429);
      if (archive) { archives++; heldArchive = true; }
      const body = await collect(req, archive ? LIMITS.archive : LIMITS.body);
      const plan = await authorize(req, body, false);
      if (plan.local) { res.writeHead(plan.local.code, { 'content-type': 'application/json' }); res.end(plan.local.bytes); }
      else await processResponse(plan, await upstream(plan.req, plan.body), res);
    } catch (err) { error(res, err); } finally { active--; if (heldArchive) archives--; }
  });
  server.on('connection', socket => {
    if (sockets.size >= LIMITS.connections) { socket.destroy(); return; }
    sockets.add(socket); socket.on('close', () => sockets.delete(socket)); socket.on('error', () => {});
  });
  server.on('clientError', (_err, socket) => socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n'));
  server.on('connect', (_req, socket) => socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n'));
  server.on('upgrade', async (req, client, head) => {
    let remote; let timer;
    if (++sessions > LIMITS.sessions) { sessions--; client.end('HTTP/1.1 429 Too Many Requests\r\nConnection: close\r\nContent-Length: 0\r\n\r\n'); return; }
    try {
      if (req.headers.upgrade?.toLowerCase() !== 'tcp' || req.headers['transfer-encoding']) fail('upgrade framing denied');
      const size = Number(req.headers['content-length'] ?? 0);
      if (!Number.isSafeInteger(size) || size < 0 || size > LIMITS.body) fail('upgrade body bound');
      const body = await readUpgradeBody(client, head, size);
      const plan = await authorize(req, body, true);
      const result = await upstream(plan.req, plan.body, true); remote = result.socket;
      if (!remote || result.response.statusCode !== 101 || result.response.headers.upgrade?.toLowerCase() !== 'tcp') { result.response.destroy(); fail('daemon did not authorize stream', 502); }
      timer = setTimeout(() => { client.destroy(); remote.destroy(); }, LIMITS.time);
      client.write('HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: tcp\r\n\r\n');
      if (result.head.length) client.write(result.head);
      // This socket is now solely daemon attach/exec stdin, never another HTTP dispatcher.
      await Promise.all([pipeline(client, meter(LIMITS.stream), remote), pipeline(remote, meter(LIMITS.stream - result.head.length), client)]);
    } catch (err) {
      if (!remote) client.end(`HTTP/1.1 ${err.status ?? 502} Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
      else { client.destroy(); remote.destroy(); }
    } finally { clearTimeout(timer); sessions--; }
  });
  try {
    if (fs.existsSync(config.statePath)) {
      state = JSON.parse(fs.readFileSync(config.statePath, 'utf8'));
      if (state.version !== 1 || state.fingerprint !== fingerprint || !['containers','networks','volumes','execs'].every(k => Array.isArray(state[k]))) fail('state identity conflict');
      if (state.containers.length > LIMITS.slots || ['containers','networks','volumes'].some(k => state[k].some(r => r.pending || !r.id))) fail('ambiguous state requires coordinator reconciliation');
      for (const record of state.containers) {
        const probe = await internal('GET', `/containers/${record.id}/json`);
        if (probe.code !== 200) fail('tracked container requires reconciliation');
        verifyContainer(json(probe.bytes), record);
      }
      for (const kind of ['networks', 'volumes']) for (const record of state[kind]) {
        const probe = await internal('GET', `/${kind}/${record.id}`);
        if (probe.code !== 200) fail('tracked object requires reconciliation');
        const c = json(probe.bytes);
        if ((c.Id ?? c.Name) !== record.id || c.Labels?.[RUN] !== config.runId || c.Labels?.[NONCE] !== record.nonce) fail('tracked object ownership mismatch');
      }
    } else save();
    // Never unlink an existing socket: it could belong to an active or foreign proxy.
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(config.socketPath, resolve); });
    fs.chmodSync(config.socketPath, 0o600);
  } catch (err) { fs.closeSync(lock); fs.unlinkSync(lockPath); throw err; }
  return { state: () => structuredClone(state), close() {
    if (closingPromise) return closingPromise;
    closingPromise = (async () => {
    const closed = new Promise(resolve => server.close(resolve));
    for (const socket of sockets) socket.destroy();
    for (const request of outbound) request.destroy();
    await closed;
    const until = Date.now() + 3000;
    while ((active || sessions) && Date.now() < until) await new Promise(resolve => setTimeout(resolve, 10));
    if (active || sessions) fail('shutdown incomplete; lock retained', 503);
    fs.closeSync(lock); fs.unlinkSync(lockPath);
    })(); return closingPromise;
  } };
}
async function readUpgradeBody(socket, head, size) {
  // Refuse bytes after the HTTP body at the transition; they could be pipelined control.
  if (head.length > size) fail('pipelined upgrade denied', 400);
  if (head.length === size) return head;
  return new Promise((resolve, reject) => {
    const chunks = [head]; let length = head.length;
    const timer = setTimeout(() => finish(new Error('upgrade body timeout')), 15000);
    function finish(err) { clearTimeout(timer); socket.pause(); socket.off('data', onData); socket.off('error', onError); socket.off('end', onEnd); err ? reject(err) : resolve(Buffer.concat(chunks)); }
    function onError() { finish(new Error('upgrade disconnected')); }
    function onEnd() { finish(new Error('upgrade body incomplete')); }
    function onData(chunk) { chunks.push(chunk); length += chunk.length; if (length > size) finish(Object.assign(new Error('pipelined upgrade denied'), { status: 400 })); else if (length === size) finish(); }
    socket.on('data', onData); socket.once('error', onError); socket.once('end', onEnd); socket.resume();
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const proxy = await startProxy(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')));
    process.stdout.write(JSON.stringify({ event: 'ready' }) + '\n');
    let closing = false;
    for (const signal of ['SIGINT','SIGTERM']) process.on(signal, async () => {
      if (closing) return; closing = true;
      try { await proxy.close(); } catch { process.exitCode = 1; }
    });
  } catch { process.stderr.write('Proxy initialization failed; inspect scoped state/config without dumping credentials.\n'); process.exitCode = 1; }
}
