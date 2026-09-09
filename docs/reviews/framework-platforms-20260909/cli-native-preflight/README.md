# Task-local Docker resource proxy

Status: fake Unix HTTP daemon verified on Node **v24.15.0**; actual Docker and Supabase CLI compatibility **unverified**. This implements only the task-scoped Engine object/resource boundary. It is not an adversarial OS or network isolation system. Only supervisor infrastructure may access the real Engine socket; the CLI runner must receive only this proxy socket through `DOCKER_HOST=unix://...`.

Source authority: coordinator task plus `remaining-hono-supabase-fixture-preparation.md` and superseding `remaining-hs-cli-envelope-delta.md` in the framework-platforms study. Native behavior cross-checked against pinned `shadow-database.ts`, `cli-legacy-docker.go`, `cli-legacy-diff.go`, `cli-legacy-dbstart.go`, and `cli-legacy-migra.go`. No target skill, fixture, CLI, or global config was changed.

## Commands and configuration

No dependencies or install/build step. Public scripts:

```sh
npm test
npm start -- /absolute/private/config.json
```

The coordinator supplies an **explicit** config, in a private directory unavailable to the runner:

```json
{
  "runId": "fp-cli-current-20260909",
  "projectId": "fp-cli-current-20260909",
  "socketPath": "/absolute/task-socket-directory/docker.sock",
  "daemonSocket": "/absolute/real-engine.sock",
  "statePath": "/absolute/supervisor-private-directory/state.json",
  "images": ["exact-native-image-reference-validated-by-coordinator"],
  "hostNetworkImages": []
}
```

Legacy uses `fp-cli-legacy-20260909` and explicitly lists its pinned migra image in `hostNetworkImages`, a subset of `images`. The image list is an exact reference allowlist, not a resolver: coordinator must bind preloaded tags to observed immutable digests, or allow digest references accepted by the actual CLI. Pull/build is denied. Config does not itself pin a tag's mutable daemon resolution. No Env, auth values, archive data, or credentials belong in config/state/logs.

`runId` is a safe lowercase prefix (8–64 characters); `projectId` must begin with it. Use one fresh private directory/state/socket per sequential case. A private path and exclusive `.lock` file are mandatory. The socket is created mode0600: supervisor must provide the intended runner access through controlled UID/socket mapping. The proxy does not modify host-wide permissions. State directory and config must not be writable or mounted into the runner. Existing socket paths are never unlinked on startup. The `SIGTERM`/`SIGINT` handler closes task connections and waits up to3s for handlers before releasing the lock. Incomplete drain retains the lock and reports nonzero exit.

The coordinator must separately enforce runner1.25CPU/6GiB and proxy0.25CPU/256MiB, cpuset28–31, and validate those CPUs exist. This program enforces only Engine-created child containers: **max3 total pending/live/stopped/restartable reservations**, each ≤0.75CPU, ≤3GiB memory and total memory+swap, cpuset28–31. The retained local DB must be created through this proxy and consumes one slot; there is no adopt/register endpoint or exemption for a pre-existing DB. Shared-daemon overhead is outside child HostConfig caps.

## Ownership and reservations

- Each create gets reserved before forwarding, with a random nonce and durable write/fsync/atomic rename/directory fsync. Scoped labels identify run, project, and reservation. Full daemon IDs are recorded before a successful create response is released. Caller labels cannot conflict with ownership labels.
- Supplied names must begin `runId-`, or match safe `supabase_*_<projectId>` native names. Native unnamed shadows receive a scoped UUID name. Subsequent names are only aliases already in the exact inventory; daemon operations use full IDs, never partial IDs.
- Container creates get an immediate internal inspect. Confirmed ID, nonce/run labels and CPU/memory/cpuset bounds are required. Any ambiguous create response/readback holds the slot. Explicit400/404/409/422 create failure releases it;500, disconnect, incomplete/malformed successful response, or failed inspection retains it. A stopped/auto-removed container retains its slot until exact-ID deletion returns204/404. Container deletes always request `v=1`.
- Image-defined implicit volumes are inventoried from the newly created container's Mounts and must have Docker-style64hex names. They are removed only via that exact container's `v=1` cleanup; there is no anonymous-volume delete exposure. User-supplied `Config.Volumes` is denied. Named volumes must already be tracked and task-created, using the local driver with no driver options. Host binds, devices, volume plugins and arbitrary volume adoption are denied.
- Networks use task names, bridge driver, default IPAM, no driver options. Creation first confirms404 for that name; an existing foreign object is not adopted. Volumes also probe404 and verify returned nonce labels. Concurrent/pending name conflicts reject. Max16 records per ancillary kind. Network connects/disconnects require exact tracked network and container. Lists are filtered twice: run label upstream and exact inventory downstream. No prune or foreign cleanup.
- Restart policies `no`, `always`, `unless-stopped`, and `on-failure` remain inside the same held slot; bounded retry counts up to10 are accepted. This preserves native local DB's `always`. Explicit resource controls above the caps or conflicting quota/period/cgroup controls fail closed; unset limits receive caps. Tighter positive numeric limits remain tighter. Cpuset accepts `28-31` or a comma-separated subset of individual28/29/30/31 values.
- After restart, tracked container resource/ownership readback and network/volume ownership readback must pass before listening. State/config fingerprint mismatch and pending/ambiguous records block startup. Exec IDs are persisted only for tracked containers and bounded to128; remove of the owning container removes its exec inventory.

## Explicit API surface

Unversioned paths and `/v<major>.<minor>/...` prefixes share identical policy. Every ordinary request is parsed and checked independently by Node's strict HTTP parser, including keepalive, chunked input and pipelined requests. Framing ambiguity is rejected. Control is never converted into a raw tunnel.

| Methods | Paths | Scope |
|---|---|---|
| GET, HEAD | `/_ping`, `/version`, `/info` | Daemon negotiation/read-only metadata; no query |
| GET | `/images/<exact allowed reference>/json` | Preloaded allowed images only |
| POST | `/containers/create` | Full JSON validation, resource rewriting, durable reservation and inspect |
| GET | `/containers/json`, `/networks`, `/volumes` | Exact tracked inventory only |
| POST | `/networks/create`, `/volumes/create` | Scoped objects; no adoption |
| GET | `/networks/<tracked>`, `/volumes/<tracked>` | Tracked IDs/names only |
| DELETE | `/containers/<tracked>`, `/networks/<tracked>`, `/volumes/<tracked>` | Exact tracked IDs; container deletion forces volume cleanup |
| POST | `/networks/<tracked>/connect`, `/disconnect` | Tracked container only; aliases only |
| GET | `/containers/<tracked>/json`, `/logs`, `/archive` | Container-owned reads |
| HEAD, PUT | `/containers/<tracked>/archive` | Container absolute path; bounded archive body |
| POST | `/containers/<tracked>/start`, `/stop`, `/restart`, `/kill`, `/wait` | Existing reservation only; no update |
| POST | `/containers/<tracked>/exec` | Nonprivileged exec on tracked container; track returned exec ID |
| GET | `/exec/<tracked>/json` | Owned exec inspection |
| POST | `/exec/<tracked>/start`, `/containers/<tracked>/attach` | Bounded stream path below |

Queries are endpoint-specific allowlists in `authorize()`. Unknown methods/routes/queries and non-inert unsupported HostConfig fields are denied. In particular update, rename, commit, export, image changes, events, build, pull, prune, plugins, services and swarm are unsupported. Percent-encoded path segments are currently rejected, including encoded image refs; compatibility with native client escaping must be checked. HEAD routes are restricted as in the table. Read-only daemon `/info` may disclose host metadata to the task runner but is not logged.

The proxy reconstructs HostConfig; it never forwards unsupported nondefault security or resource fields. Privileged, added capabilities, host PID/IPC/UTS/cgroup modes, cgroup parent/runtime overrides, devices, Docker-socket binds, host bind mounts, unconfined security and custom drivers are denied. `no-new-privileges:true` is forced. Logs use json-file capped at10MiB×2. Port publication is rewritten to127.0.0.1 with native requested/ephemeral port. Named/none networks are permitted; host network only for exact opted-in images. This host-network exception deliberately does not promise arbitrary network destination confinement. Archives/exec remain container-local; their data and commands are neither logged nor persisted.

`tmpfs` needs explicit numeric byte size ≤container memory and only rw/ro/nosuid/nodev/noexec options. The accepted PG17 sources do not require the old PG≤14 empty-size tmpfs path. `VolumesFrom` and custom mount options are denied. Missing endpoint support must be investigated against the pinned native source; it is not a reason to bypass the proxy.

## Stream and memory bounds

Ordinary forwarding uses independent upstream HTTP connections with reconstructed headers, no auth/registry headers, and a10minute overall upstream deadline. JSON bodies/responses≤1MiB; PUT archive≤16MiB with one concurrent archive request; ordinary active requests≤16 and connections≤24. Response streams≤64MiB and10minutes, with stream backpressure. The external256MiB proxy cap remains necessary; this is bounded buffering, not measured peak-RSS proof.

Only exact tracked attach and tracked exec/start may request `Connection: Upgrade`, `Upgrade: tcp`. The request body must have a bounded Content-Length (≤1MiB), no transfer-encoding, and no extra pipelined bytes at the transition. An actual daemon101/tcp response is required. Afterward the connection is only that attach/exec stdin/stdout session, byte-metered≤64MiB per direction, duration≤10minutes, max8 sessions. Sending HTTP-looking bytes after101 delivers stdin to the authorized container process; it cannot re-enter the Engine HTTP dispatcher. Chunked upgrade bodies, CONNECT, websocket/h2c, unknown upgrades, detached exec and daemon non101 hijack variants are denied. Native ordinary streaming200 responses remain one-way response pipelines and never grant a raw control tunnel.

## Recovery and evidence limits

State is an ownership/reservation journal, not a cleanup command. **Do not delete/reset it merely because a CLI/proxy exited.** The `.lock` file remains after a crash. Coordinator must first prove the previous proxy has terminated and no in-flight Engine create can complete, then read back exact nonce/run labels and IDs from the real daemon in the supervisor boundary. Pending create absence before an in-flight Engine call has completed is not sufficient evidence to free a slot. Reconcile only that run's IDs, inspect resource bounds, and delete only confirmed task-owned objects (including recorded anonymous volumes left by failure). Keep a separate evidence record. Then restore a reconciled journal or use a new empty journal only after confirmed complete scoped cleanup. This initial implementation intentionally has no automatic ambiguous-state recovery/adoption tool; ambiguity stops the dependent runtime gate. Do not manually remove another process's lock.

Unit/fake-daemon tests prove the exercised proxy behavior and strict parser boundary, not installed Docker/CLI interoperability, native upgrade status/body encoding, SQL preservation, image identity, resource adequacy, cgroup behavior, actual cleanup, or host peak. Actual current2.117.0 Docker subprocess and legacy2.39.2 direct SDK routes still need sequential coordinator preflight through this same socket and independent review before runtime. No real Docker command, CLI, pull, install or build was run while authoring this tool.
