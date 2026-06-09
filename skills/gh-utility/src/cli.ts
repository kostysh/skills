import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

type CommandResult = {
  cmd: string[];
  returncode: number;
  stdout: string;
  stderr: string;
  durationSeconds: number;
};

type ParsedArgs = {
  positionals: string[];
  flags: Map<string, string[]>;
  booleans: Set<string>;
};

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const SCOPE_HINTS = new Map([
  ['project', 'GitHub Projects: gh auth refresh -s project'],
  ['workflow', 'Actions workflow edits/dispatch: gh auth refresh -s workflow'],
  ['repo', 'Private repo operations: gh auth refresh -s repo'],
  ['read:org', 'Organization/team visibility: gh auth refresh -s read:org'],
  ['admin:org', 'Organization admin/secrets/rulesets: gh auth refresh -s admin:org'],
  ['gist', 'Gist operations: gh auth refresh -s gist'],
  ['codespace', 'Codespaces operations: gh auth refresh -s codespace'],
]);

const TOKEN_PATTERNS: RegExp[] = [
  /(authorization:\s*(?:bearer|token)\s+)[A-Za-z0-9._-]+/gi,
  /((?:token|password|secret|private[_-]?key)\s*[=:]\s*)[^\s'"]+/gi,
  /gh[pousr]_[A-Za-z0-9_]{20,}/g,
  /github_pat_[A-Za-z0-9_]{20,}/g,
];

export function redact(text: string): string {
  let out = text;
  for (const pattern of TOKEN_PATTERNS) {
    out = out.replace(pattern, (...matches: unknown[]) => {
      const maybePrefix = matches.length > 3 ? matches[1] : undefined;
      return typeof maybePrefix === 'string' ? `${maybePrefix}<redacted>` : '<redacted-token>';
    });
  }
  return out;
}

function printJson(value: JsonValue): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function jsonText(value: JsonValue | undefined): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function parseJsonObject(text: string): JsonValue | null {
  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    return null;
  }
}

function run(cmd: string[], options: { input?: string; timeoutMs?: number } = {}): CommandResult {
  const started = performance.now();
  const result = spawnSync(cmd[0] ?? '', cmd.slice(1), {
    encoding: 'utf8',
    input: options.input,
    timeout: options.timeoutMs ?? 60_000,
    env: { ...process.env, GH_PROMPT_DISABLED: process.env.GH_PROMPT_DISABLED ?? '1' },
  });

  return {
    cmd,
    returncode: typeof result.status === 'number' ? result.status : 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? (result.error ? String(result.error.message) : ''),
    durationSeconds: Number(((performance.now() - started) / 1000).toFixed(3)),
  };
}

function redactedResult(result: CommandResult): JsonObject {
  return {
    cmd: result.cmd.map((part) => redact(part)),
    returncode: result.returncode,
    stdout: redact(result.stdout),
    stderr: redact(result.stderr),
    durationSeconds: result.durationSeconds,
  };
}

function hasTool(tool: string): boolean {
  return (
    spawnSync('sh', ['-lc', `command -v ${shellQuote(tool)}`], { encoding: 'utf8' }).status === 0
  );
}

function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags = new Map<string, string[]>();
  const booleans = new Set<string>();

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg) {
      continue;
    }
    if (!arg.startsWith('-') || arg === '-') {
      positionals.push(arg);
      continue;
    }
    const eq = arg.indexOf('=');
    if (eq > 0) {
      const key = arg.slice(0, eq);
      const value = arg.slice(eq + 1);
      flags.set(key, [...(flags.get(key) ?? []), value]);
      continue;
    }
    const next = argv[i + 1];
    if (next && !next.startsWith('-')) {
      flags.set(arg, [...(flags.get(arg) ?? []), next]);
      i += 1;
      continue;
    }
    booleans.add(arg);
  }

  return { positionals, flags, booleans };
}

function flag(args: ParsedArgs, ...names: string[]): string | undefined {
  for (const name of names) {
    const values = args.flags.get(name);
    if (values?.[0]) {
      return values.at(-1);
    }
  }
  return undefined;
}

function flagAll(args: ParsedArgs, ...names: string[]): string[] {
  return names.flatMap((name) => args.flags.get(name) ?? []);
}

function bool(args: ParsedArgs, ...names: string[]): boolean {
  return names.some((name) => args.booleans.has(name));
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(value)) {
    return value;
  }
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function fail(message: string, code = 1, jsonMode = false, details?: JsonValue): never {
  if (jsonMode) {
    printJson({ ok: false, error: message, ...(details === undefined ? {} : { details }) });
  } else {
    process.stderr.write(`ERROR: ${message}\n`);
    if (details !== undefined) {
      process.stderr.write(`${redact(JSON.stringify(details, null, 2))}\n`);
    }
  }
  process.exit(code);
}

function repoFromArg(repo: string | undefined): string | undefined {
  if (repo && repo !== '.') {
    return repo;
  }
  const result = run(['gh', 'repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], {
    timeoutMs: 30_000,
  });
  return result.returncode === 0 && result.stdout.trim() ? result.stdout.trim() : undefined;
}

function splitRepo(repo: string): [string, string] {
  if (repo.startsWith('https://') || repo.startsWith('git@')) {
    throw new Error('Expected OWNER/REPO, not a URL');
  }
  const [owner, name, extra] = repo.split('/');
  if (!owner || !name || extra !== undefined) {
    throw new Error('Expected OWNER/REPO');
  }
  return [owner, name];
}

function clipLines(text: string, maxLines: number): string {
  const lines = text.split(/\r?\n/);
  if (lines.length <= maxLines) {
    return lines.join('\n');
  }
  const head = Math.floor(maxLines / 2);
  const tail = maxLines - head;
  return [
    ...lines.slice(0, head),
    `... <${lines.length - maxLines} lines omitted> ...`,
    ...lines.slice(-tail),
  ].join('\n');
}

export function routeGitHubInput(input: string): JsonObject {
  const original = input.trim();
  const result: JsonObject = { input: original, kind: 'unknown', commands: [], notes: [] };
  const repoRe = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

  if (repoRe.test(original)) {
    result.kind = 'repo';
    const [owner, repo] = original.split('/');
    result.owner = owner ?? '';
    result.repo = repo ?? '';
    result.commands = [`gh repo view ${shellQuote(original)}`];
    return result;
  }

  let url: URL;
  try {
    url = new URL(original);
  } catch {
    result.notes = ['Input is not a recognized GitHub URL or OWNER/REPO value.'];
    return result;
  }

  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split('/').filter(Boolean);

  if (host === 'gist.github.com') {
    const gist = parts.at(-1) ?? '';
    result.kind = 'gist';
    result.gist = gist;
    result.commands = [`gh gist view ${shellQuote(gist)}`];
    return result;
  }

  if (host === 'raw.githubusercontent.com' && parts.length >= 4) {
    const [owner, repo, ref, ...pathParts] = parts;
    const path = pathParts.join('/');
    result.kind = 'raw-file';
    result.owner = owner ?? '';
    result.repo = repo ?? '';
    result.ref = ref ?? '';
    result.path = path;
    result.commands = [
      `gh repo clone ${shellQuote(`${owner}/${repo}`)} <tmp-dir> -- --depth 1 --branch ${shellQuote(ref ?? '')}`,
      `sed -n '1,220p' <tmp-dir>/${shellQuote(path)}`,
    ];
    result.notes = [
      'Prefer a shallow clone over unauthenticated raw.githubusercontent.com fetches when repository access matters.',
    ];
    return result;
  }

  if (host === 'api.github.com') {
    const endpoint = parts.join('/');
    result.kind = 'api';
    result.endpoint = endpoint;
    result.commands = [`node scripts/gh-utility.mjs safe-api ${shellQuote(endpoint)} -X GET`];
    return result;
  }

  if (!host.endsWith('github.com') || parts.length < 2) {
    result.notes = ['Host is not recognized as GitHub repository data.'];
    return result;
  }

  const [owner, repo, area, id, ...rest] = parts;
  const fullRepo = `${owner}/${repo}`;
  result.owner = owner ?? '';
  result.repo = repo ?? '';

  switch (area) {
    case undefined:
      result.kind = 'repo';
      result.commands = [`gh repo view ${shellQuote(fullRepo)}`];
      break;
    case 'issues':
      result.kind = 'issue';
      result.issue = id ?? '';
      result.commands = [`gh issue view ${shellQuote(id ?? '')} --repo ${shellQuote(fullRepo)}`];
      break;
    case 'pull':
      result.kind = 'pull-request';
      result.pr = id ?? '';
      result.commands = [`gh pr view ${shellQuote(id ?? '')} --repo ${shellQuote(fullRepo)}`];
      break;
    case 'actions':
      result.kind = 'actions';
      result.commands =
        id === 'runs' && rest[0]
          ? [`gh run view ${shellQuote(rest[0])} --repo ${shellQuote(fullRepo)}`]
          : [`gh run list --repo ${shellQuote(fullRepo)}`];
      break;
    case 'releases':
      result.kind = 'release';
      result.commands =
        id === 'tag' && rest[0]
          ? [`gh release view ${shellQuote(rest[0])} --repo ${shellQuote(fullRepo)}`]
          : [`gh release list --repo ${shellQuote(fullRepo)}`];
      break;
    case 'blob':
    case 'tree': {
      const ref = id ?? '';
      const filePath = rest.join('/');
      result.kind = area === 'blob' ? 'file' : 'tree';
      result.ref = ref;
      result.path = filePath;
      result.commands = [
        `gh repo clone ${shellQuote(fullRepo)} <tmp-dir> -- --depth 1 --branch ${shellQuote(ref)}`,
        area === 'blob'
          ? `sed -n '1,220p' <tmp-dir>/${shellQuote(filePath)}`
          : `find <tmp-dir>/${shellQuote(filePath)} -maxdepth 2 -type f`,
      ];
      break;
    }
    default:
      result.kind = 'repo-path';
      result.path = [area, id, ...rest].filter(Boolean).join('/');
      result.commands = [`gh repo view ${shellQuote(fullRepo)}`];
      result.notes = [
        'Inspect the repository first, then choose the narrow gh command for this path.',
      ];
  }

  return result;
}

export function parseSecretEnv(text: string): JsonObject[] {
  const items: JsonObject[] = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const stripped = line.trim();
    if (!stripped || stripped.startsWith('#')) {
      continue;
    }
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(stripped);
    if (!match) {
      items.push({ line: index + 1, error: 'not_key_value', rawPreview: stripped.slice(0, 40) });
      continue;
    }
    const [, name = '', rawValue = ''] = match;
    let value = rawValue.trim();
    if (value.length >= 2 && value[0] === value.at(-1) && (value[0] === '"' || value[0] === "'")) {
      value = value.slice(1, -1);
    }
    items.push({ line: index + 1, name, valueLength: value.length, empty: value === '' });
  }
  return items;
}

function secretCommand(name: string, args: ParsedArgs): string {
  const kind = flag(args, '--kind') ?? 'secret';
  const envVar = name.replace(/[^A-Za-z0-9_]/g, '_');
  const target = ['gh', kind, 'set', name];
  const repo = flag(args, '--repo');
  const org = flag(args, '--org');
  const env = flag(args, '--env');
  const app = flag(args, '--app');
  const visibility = flag(args, '--visibility');
  if (repo) target.push('--repo', repo);
  if (org) target.push('--org', org);
  if (env) target.push('--env', env);
  if (bool(args, '--user')) target.push('--user');
  if (app) target.push('--app', app);
  if (visibility) target.push('--visibility', visibility);
  return `printf '%s' "$${envVar}" | ${target.map(shellQuote).join(' ')}`;
}

export function validateSkillFolder(skillDir: string): JsonObject {
  const errors: string[] = [];
  const warnings: string[] = [];
  const skillPath = `${skillDir.replace(/\/$/, '')}/SKILL.md`;
  if (!existsSync(skillPath)) {
    return { ok: false, errors: ['Missing SKILL.md'], warnings: [] };
  }
  const text = readFileSync(skillPath, 'utf8');
  if (!text.startsWith('---\n')) {
    errors.push('SKILL.md must start with YAML frontmatter delimited by ---');
  }
  const end = text.indexOf('\n---', 4);
  if (end === -1) {
    errors.push('SKILL.md frontmatter is not closed with ---');
  }
  const frontmatter = end === -1 ? '' : text.slice(4, end);
  const body = end === -1 ? text : text.slice(end + 4);
  const name = /^name:\s*"?([^"\n]+)"?\s*$/m.exec(frontmatter)?.[1]?.trim();
  const description = /^description:\s*(.+)$/m.exec(frontmatter)?.[1]?.trim();
  if (!name) {
    errors.push('Frontmatter missing name');
  } else if (!/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(name)) {
    errors.push(`Invalid skill name: ${name}`);
  }
  if (!description) {
    errors.push('Frontmatter missing description');
  }
  for (const match of body.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1] ?? '';
    if (/^[a-z]+:\/\//i.test(target) || target.startsWith('#')) {
      continue;
    }
    const clean = target.split('#')[0]?.trim() ?? '';
    if (clean && !existsSync(`${skillDir.replace(/\/$/, '')}/${clean}`)) {
      warnings.push(`Linked local path does not exist: ${clean}`);
    }
  }
  return {
    ok: errors.length === 0,
    name: name ?? null,
    errors,
    warnings,
    files: {
      references: existsSync(`${skillDir}/references`),
      assets: existsSync(`${skillDir}/assets`),
      scripts: existsSync(`${skillDir}/scripts/gh-utility.mjs`),
    },
  };
}

function ensureGh(jsonMode: boolean): void {
  if (!hasTool('gh')) {
    fail('GitHub CLI (`gh`) not found on PATH.', 127, jsonMode);
  }
}

function commandRoute(argv: string[]): number {
  const args = parseArgs(argv);
  const input = args.positionals[0];
  if (!input) fail('route requires a GitHub URL or OWNER/REPO value', 2, bool(args, '--json'));
  const result = routeGitHubInput(input);
  if (bool(args, '--json')) {
    printJson(result);
  } else {
    process.stdout.write(`Kind: ${jsonText(result.kind)}\n`);
    const commands = Array.isArray(result.commands) ? result.commands : [];
    for (const command of commands) {
      process.stdout.write(`- ${jsonText(command)}\n`);
    }
    const notes = Array.isArray(result.notes) ? result.notes : [];
    for (const note of notes) {
      process.stdout.write(`Note: ${jsonText(note)}\n`);
    }
  }
  return 0;
}

function commandSecretManifest(argv: string[]): number {
  const args = parseArgs(argv);
  const path = args.positionals[0];
  const jsonMode = bool(args, '--json');
  if (!path) fail('secret-manifest requires a dotenv file path', 2, jsonMode);
  if (!existsSync(path)) fail(`dotenv file not found: ${path}`, 2, jsonMode);
  const items = parseSecretEnv(readFileSync(path, 'utf8'));
  const emitCommands = bool(args, '--emit-commands');
  const planned = items.map((item) => {
    if (typeof item.name === 'string' && emitCommands) {
      return { ...item, command: secretCommand(item.name, args) };
    }
    return item;
  });
  const result: JsonObject = {
    ok: !planned.some((item) => typeof item.error === 'string'),
    kind: flag(args, '--kind') ?? 'secret',
    target: {
      repo: flag(args, '--repo') ?? null,
      org: flag(args, '--org') ?? null,
      env: flag(args, '--env') ?? null,
      user: bool(args, '--user'),
      app: flag(args, '--app') ?? null,
    },
    items: planned,
  };
  if (jsonMode) {
    printJson(result);
  } else {
    for (const item of planned) {
      if (typeof item.name === 'string') {
        process.stdout.write(
          `${item.name}: ${jsonText(item.valueLength ?? 0)} chars${item.empty ? ' (empty)' : ''}\n`,
        );
        if (typeof item.command === 'string') process.stdout.write(`  ${item.command}\n`);
      } else {
        process.stdout.write(`line ${jsonText(item.line)}: ${jsonText(item.error)}\n`);
      }
    }
  }
  return result.ok ? 0 : 1;
}

function commandValidateSkill(argv: string[]): number {
  const args = parseArgs(argv);
  const dir = args.positionals[0] ?? '.';
  const result = validateSkillFolder(dir);
  if (bool(args, '--json')) {
    printJson(result);
  } else {
    process.stdout.write(`${result.ok ? 'OK' : 'FAIL'} ${dir}\n`);
    for (const error of Array.isArray(result.errors) ? result.errors : [])
      process.stdout.write(`ERROR: ${jsonText(error)}\n`);
    for (const warning of Array.isArray(result.warnings) ? result.warnings : [])
      process.stdout.write(`WARN: ${jsonText(warning)}\n`);
  }
  return result.ok ? 0 : 1;
}

function commandSafeApi(argv: string[]): number {
  const args = parseArgs(argv);
  const endpoint = args.positionals[0];
  const jsonMode = bool(args, '--json');
  if (!endpoint) fail('safe-api requires an endpoint', 2, jsonMode);
  const method = (flag(args, '-X', '--method') ?? 'GET').toUpperCase();
  if (MUTATING_METHODS.has(method) && !bool(args, '--confirm-mutation')) {
    fail(`Refusing ${method} without --confirm-mutation`, 2, jsonMode);
  }
  const cmd = ['gh', 'api', '-X', method];
  const hostname = flag(args, '--hostname');
  if (hostname) cmd.push('--hostname', hostname);
  if (bool(args, '--paginate')) cmd.push('--paginate');
  for (const preview of flagAll(args, '--preview')) cmd.push('--preview', preview);
  for (const raw of flagAll(args, '-f', '--raw-field')) cmd.push('-f', raw);
  for (const field of flagAll(args, '-F', '--field')) cmd.push('-F', field);
  const input = flag(args, '--input');
  if (input) cmd.push('--input', input);
  const jq = flag(args, '--jq');
  if (jq) cmd.push('--jq', jq);
  cmd.push(endpoint);
  if (bool(args, '--dry-run')) {
    const dryRun = cmd.map(shellQuote).join(' ');
    if (jsonMode) printJson({ ok: true, dryRun });
    else process.stdout.write(`${dryRun}\n`);
    return 0;
  }
  ensureGh(jsonMode);
  const result = run(cmd, { timeoutMs: 120_000 });
  if (jsonMode) {
    printJson({
      ok: result.returncode === 0,
      result: redactedResult(result),
      json: parseJsonObject(result.stdout),
    });
  } else {
    process.stdout.write(redact(result.stdout));
    process.stderr.write(redact(result.stderr));
  }
  return result.returncode;
}

function parseScopes(statusText: string): string[] {
  const scopes = new Set<string>();
  for (const line of statusText.split(/\r?\n/)) {
    if (!line.toLowerCase().includes('scope')) continue;
    for (const token of line
      .replaceAll("'", '')
      .replaceAll('"', '')
      .split(/[,\s]+/)) {
      const clean = token.trim().replace(/[.;:[\]()]/g, '');
      if (SCOPE_HINTS.has(clean)) scopes.add(clean);
    }
  }
  return [...scopes].sort();
}

function commandAuthDoctor(argv: string[]): number {
  const args = parseArgs(argv);
  const jsonMode = bool(args, '--json');
  const host = flag(args, '--host');
  const repoArg = flag(args, '--repo') ?? '.';
  const report: JsonObject = {
    ok: true,
    gh: {},
    auth: {},
    repo: { input: repoArg },
    api: {},
    scopeHints: [],
  };
  if (!hasTool('gh')) {
    report.ok = false;
    report.gh = { ok: false, error: 'gh not found on PATH' };
    printJson(report);
    return 127;
  }
  report.gh = {
    ok: true,
    version: redactedResult(run(['gh', '--version'], { timeoutMs: 30_000 })),
  };
  const authCmd = ['gh', 'auth', 'status'];
  if (host) authCmd.push('--hostname', host);
  const auth = run(authCmd, { timeoutMs: 30_000 });
  const scopes = parseScopes(`${auth.stdout}\n${auth.stderr}`);
  report.auth = { ok: auth.returncode === 0, result: redactedResult(auth), scopes };
  if (auth.returncode !== 0) report.ok = false;
  const repo = repoFromArg(repoArg);
  report.repo = { input: repoArg, resolved: repo ?? null };
  const userCmd = ['gh', 'api'];
  if (host) userCmd.push('--hostname', host);
  userCmd.push('user', '--jq', '.login');
  const user = run(userCmd, { timeoutMs: 30_000 });
  const rateCmd = ['gh', 'api'];
  if (host) rateCmd.push('--hostname', host);
  rateCmd.push('rate_limit');
  const rate = run(rateCmd, { timeoutMs: 30_000 });
  report.api = {
    user: redactedResult(user),
    rateLimit: {
      ok: rate.returncode === 0,
      data: rate.returncode === 0 ? parseJsonObject(rate.stdout) : null,
      error: redact(rate.stderr.trim()),
    },
  };
  if (user.returncode !== 0 || rate.returncode !== 0) report.ok = false;
  const needed = flagAll(args, '--need-scope');
  report.scopeHints = needed
    .filter((scope) => !scopes.includes(scope))
    .map((scope) => SCOPE_HINTS.get(scope) ?? `Refresh gh auth for scope: ${scope}`);
  if (jsonMode) {
    printJson(report);
  } else {
    process.stdout.write(report.ok ? 'gh auth doctor: OK\n' : 'gh auth doctor: problems found\n');
    if (repo) process.stdout.write(`Repo: ${repo}\n`);
    const hints = report.scopeHints;
    if (Array.isArray(hints) && hints.length) {
      process.stdout.write(
        `Scope hints:\n${hints.map((hint) => `- ${jsonText(hint)}`).join('\n')}\n`,
      );
    }
  }
  return report.ok ? 0 : 1;
}

function resolvePrNumber(pr: string | undefined, repo: string | undefined): string | undefined {
  if (pr) {
    if (/^\d+$/.test(pr)) return pr;
    if (pr.includes('/pull/')) return pr.replace(/\/$/, '').split('/pull/')[1]?.split('/')[0];
  }
  const cmd = ['gh', 'pr', 'view', '--json', 'number', '-q', '.number'];
  if (repo) cmd.push('--repo', repo);
  const result = run(cmd, { timeoutMs: 30_000 });
  return result.returncode === 0 && /^\d+$/.test(result.stdout.trim())
    ? result.stdout.trim()
    : undefined;
}

function commandPrChecks(argv: string[]): number {
  const args = parseArgs(argv);
  const jsonMode = bool(args, '--json');
  ensureGh(jsonMode);
  const repo = repoFromArg(flag(args, '--repo') ?? '.');
  const pr = resolvePrNumber(flag(args, '--pr'), repo);
  if (!pr) fail('Could not resolve PR number', 2, jsonMode);
  const maxLines = Number(flag(args, '--max-lines') ?? '120');
  const fields = 'name,state,conclusion,startedAt,completedAt,link,bucket,workflow';
  const checks = run(
    ['gh', 'pr', 'checks', pr, ...(repo ? ['--repo', repo] : []), '--json', fields],
    { timeoutMs: 60_000 },
  );
  const parsed = checks.returncode === 0 ? parseJsonObject(checks.stdout) : null;
  const data = Array.isArray(parsed) ? parsed : [];
  const failures = data.filter(isJsonObject).filter((record) => {
    return ['state', 'conclusion', 'bucket'].some((key) =>
      [
        'fail',
        'failing',
        'failure',
        'failed',
        'error',
        'cancelled',
        'timed_out',
        'timedout',
        'action_required',
      ].includes(jsonText(record[key]).toLowerCase()),
    );
  });
  const snippets = failures.flatMap((record) => {
    const link = typeof record.link === 'string' ? record.link : '';
    const runId = /\/actions\/runs\/(\d+)/.exec(link)?.[1];
    if (!runId) return [];
    const log = run(
      ['gh', 'run', 'view', runId, ...(repo ? ['--repo', repo] : []), '--log-failed'],
      { timeoutMs: 120_000 },
    );
    return [
      {
        runId,
        ok: log.returncode === 0,
        snippet: clipLines(redact(log.stdout || log.stderr), maxLines),
      },
    ];
  });
  const result: JsonObject = {
    ok: checks.returncode === 0,
    repo: repo ?? null,
    pr,
    checks: data,
    failures,
    snippets,
    rawError: checks.returncode === 0 ? '' : redact(checks.stderr || checks.stdout),
  };
  if (jsonMode) {
    printJson(result);
  } else {
    process.stdout.write(`PR #${pr}: ${failures.length} failing check(s)\n`);
    for (const failure of failures)
      process.stdout.write(`- ${jsonText(failure.name) || 'unknown'}\n`);
  }
  return failures.length > 0 ? 1 : 0;
}

const THREAD_QUERY = `query($owner: String!, $repo: String!, $number: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      number
      title
      url
      reviewDecision
      mergeStateStatus
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          startLine
          comments(first: 20) {
            nodes { id databaseId author { login } body createdAt url }
          }
        }
      }
    }
  }
}`;

function commandPrThreads(argv: string[]): number {
  const args = parseArgs(argv);
  const jsonMode = bool(args, '--json');
  ensureGh(jsonMode);
  const repo = repoFromArg(flag(args, '--repo') ?? '.');
  if (!repo) fail('Could not resolve repository', 2, jsonMode);
  const pr = resolvePrNumber(flag(args, '--pr'), repo);
  if (!pr) fail('Could not resolve PR number', 2, jsonMode);
  const replyThreadId = flag(args, '--reply-thread-id');
  const resolveThreadId = flag(args, '--resolve-thread-id');
  if ((replyThreadId || resolveThreadId) && !bool(args, '--confirm-mutation')) {
    fail('Refusing review-thread mutation without --confirm-mutation', 2, jsonMode);
  }
  if (replyThreadId) {
    const bodyFile = flag(args, '--reply-body-file');
    const body =
      flag(args, '--reply-body') ?? (bodyFile ? readFileSync(bodyFile, 'utf8') : undefined);
    if (!body) fail('Reply requires --reply-body or --reply-body-file', 2, jsonMode);
    const mutation =
      'mutation($thread:ID!,$body:String!){addPullRequestReviewThreadReply(input:{pullRequestReviewThreadId:$thread,body:$body}){comment{id,url}}}';
    const result = run(
      [
        'gh',
        'api',
        'graphql',
        '-f',
        `query=${mutation}`,
        '-F',
        `thread=${replyThreadId}`,
        '-F',
        `body=${body}`,
      ],
      { timeoutMs: 60_000 },
    );
    if (jsonMode) printJson({ ok: result.returncode === 0, result: redactedResult(result) });
    else process.stdout.write(redact(result.stdout || result.stderr));
    return result.returncode;
  }
  if (resolveThreadId) {
    const mutation =
      'mutation($thread:ID!){resolveReviewThread(input:{threadId:$thread}){thread{id,isResolved}}}';
    const result = run(
      ['gh', 'api', 'graphql', '-f', `query=${mutation}`, '-F', `thread=${resolveThreadId}`],
      { timeoutMs: 60_000 },
    );
    if (jsonMode) printJson({ ok: result.returncode === 0, result: redactedResult(result) });
    else process.stdout.write(redact(result.stdout || result.stderr));
    return result.returncode;
  }
  const [owner, name] = splitRepo(repo);
  const fetched = run(
    [
      'gh',
      'api',
      'graphql',
      '-f',
      `query=${THREAD_QUERY}`,
      '-F',
      `owner=${owner}`,
      '-F',
      `repo=${name}`,
      '-F',
      `number=${pr}`,
    ],
    { timeoutMs: 90_000 },
  );
  const parsed = parseJsonObject(fetched.stdout);
  const prObject =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (((parsed.data as JsonObject | undefined)?.repository as JsonObject | undefined)
          ?.pullRequest as JsonObject | undefined)
      : undefined;
  const threadNodes = (
    ((prObject?.reviewThreads as JsonObject | undefined)?.nodes as JsonValue[] | undefined) ?? []
  ).filter(
    (thread) =>
      bool(args, '--all') ||
      (thread &&
        typeof thread === 'object' &&
        !Array.isArray(thread) &&
        thread.isResolved !== true),
  );
  const result: JsonObject = {
    ok: fetched.returncode === 0,
    repo,
    pr,
    pullRequest: prObject ?? null,
    threads: threadNodes,
  };
  if (jsonMode) {
    printJson(result);
  } else {
    process.stdout.write(`PR #${pr}: ${threadNodes.length} review thread(s)\n`);
    for (const thread of threadNodes) {
      const record = thread as JsonObject;
      process.stdout.write(
        `- ${jsonText(record.path)}:${jsonText(record.line)} ${jsonText(record.id)}\n`,
      );
    }
  }
  return fetched.returncode;
}

function commandReleaseState(argv: string[]): number {
  const args = parseArgs(argv);
  const jsonMode = bool(args, '--json');
  ensureGh(jsonMode);
  const repo = repoFromArg(flag(args, '--repo') ?? '.');
  const limit = flag(args, '--limit') ?? '20';
  const result: JsonObject = { ok: true, repo: repo ?? null, git: {}, github: {}, comparison: {} };
  if (bool(args, '--fetch-tags')) {
    result.git = {
      fetchTags: redactedResult(run(['git', 'fetch', '--tags', '--prune'], { timeoutMs: 120_000 })),
    };
  }
  result.git = {
    ...(result.git as JsonObject),
    tags: redactedResult(run(['git', 'tag', '--sort=-creatordate'], { timeoutMs: 30_000 })),
  };
  const releases = run(
    [
      'gh',
      'release',
      'list',
      ...(repo ? ['--repo', repo] : []),
      '--limit',
      limit,
      '--json',
      'tagName,name,isDraft,isPrerelease,createdAt,publishedAt,url',
    ],
    { timeoutMs: 60_000 },
  );
  result.github = {
    releases: releases.returncode === 0 ? parseJsonObject(releases.stdout) : null,
    error: redact(releases.stderr),
  };
  const tag = flag(args, '--tag');
  if (tag) {
    const release = run(
      [
        'gh',
        'release',
        'view',
        tag,
        ...(repo ? ['--repo', repo] : []),
        '--json',
        'tagName,name,isDraft,isPrerelease,createdAt,publishedAt,url',
      ],
      { timeoutMs: 60_000 },
    );
    result.github = {
      ...(isJsonObject(result.github) ? result.github : {}),
      release: release.returncode === 0 ? parseJsonObject(release.stdout) : null,
      releaseError: redact(release.stderr),
    };
  }
  const base = flag(args, '--base');
  if (base && tag) {
    result.comparison = {
      log: redactedResult(
        run(['git', 'log', '--oneline', `${base}..${tag}`], { timeoutMs: 60_000 }),
      ),
    };
  }
  if (jsonMode) printJson(result);
  else process.stdout.write(JSON.stringify(result, null, 2));
  return result.ok ? 0 : 1;
}

function commandProjectSnapshot(argv: string[]): number {
  const args = parseArgs(argv);
  const jsonMode = bool(args, '--json');
  ensureGh(jsonMode);
  const owner = flag(args, '--owner');
  const project = flag(args, '--project');
  if (!owner || !project) fail('project-snapshot requires --owner and --project', 2, jsonMode);
  const limit = flag(args, '--limit') ?? '100';
  const result: JsonObject = { ok: true, owner, project };
  for (const [key, cmd] of [
    ['view', ['view', project, '--owner', owner]],
    ['fields', ['field-list', project, '--owner', owner]],
    ['items', ['item-list', project, '--owner', owner, '--limit', limit]],
  ] as const) {
    const res = run(['gh', 'project', ...cmd, '--format', 'json'], { timeoutMs: 120_000 });
    result[key] = {
      ok: res.returncode === 0,
      data: res.returncode === 0 ? parseJsonObject(res.stdout) : null,
      error: redact(res.stderr || res.stdout),
    };
    if (res.returncode !== 0) result.ok = false;
  }
  if (jsonMode) printJson(result);
  else process.stdout.write(JSON.stringify(result, null, 2));
  return result.ok ? 0 : 1;
}

function commandCodespaceSnapshot(argv: string[]): number {
  const args = parseArgs(argv);
  const jsonMode = bool(args, '--json');
  ensureGh(jsonMode);
  const codespace = flag(args, '--codespace', '-c');
  const fields = 'name,displayName,repository,state,machineName,createdAt,updatedAt,lastUsedAt';
  const result: JsonObject = { ok: true };
  const listed = run(['gh', 'codespace', 'list', '--json', fields], { timeoutMs: 60_000 });
  result.list = {
    ok: listed.returncode === 0,
    data: listed.returncode === 0 ? parseJsonObject(listed.stdout) : null,
    error: redact(listed.stderr),
  };
  if (listed.returncode !== 0) result.ok = false;
  if (codespace) {
    const view = run(
      [
        'gh',
        'codespace',
        'view',
        '--codespace',
        codespace,
        '--json',
        `${fields},gitStatus,devcontainerPath`,
      ],
      { timeoutMs: 60_000 },
    );
    result.view = {
      ok: view.returncode === 0,
      data: view.returncode === 0 ? parseJsonObject(view.stdout) : null,
      error: redact(view.stderr),
    };
    if (bool(args, '--ports')) {
      const ports = run(
        [
          'gh',
          'codespace',
          'ports',
          '--codespace',
          codespace,
          '--json',
          'label,sourcePort,visibility,protocol',
        ],
        { timeoutMs: 60_000 },
      );
      result.ports = {
        ok: ports.returncode === 0,
        data: ports.returncode === 0 ? parseJsonObject(ports.stdout) : null,
        error: redact(ports.stderr),
      };
    }
    if (bool(args, '--logs')) {
      const maxLines = Number(flag(args, '--max-lines') ?? '120');
      const logs = run(['gh', 'codespace', 'logs', '--codespace', codespace], {
        timeoutMs: 120_000,
      });
      result.logs = {
        ok: logs.returncode === 0,
        snippet: clipLines(redact(logs.stdout || logs.stderr), maxLines),
      };
    }
  }
  if (jsonMode) printJson(result);
  else process.stdout.write(JSON.stringify(result, null, 2));
  return result.ok ? 0 : 1;
}

function ghJsonCall(cmd: string[]): JsonObject {
  const result = run(cmd, { timeoutMs: 90_000 });
  return {
    ok: result.returncode === 0,
    data: result.returncode === 0 ? parseJsonObject(result.stdout) : null,
    error: result.returncode === 0 ? '' : redact(result.stderr || result.stdout),
    cmd,
  };
}

function commandRepoAudit(argv: string[]): number {
  const args = parseArgs(argv);
  const jsonMode = bool(args, '--json');
  ensureGh(jsonMode);
  const repo = repoFromArg(flag(args, '--repo') ?? '.');
  if (!repo) fail('Could not resolve repository', 2, jsonMode);
  const result: JsonObject = {
    ok: true,
    repo,
    view: ghJsonCall([
      'gh',
      'repo',
      'view',
      repo,
      '--json',
      'nameWithOwner,defaultBranchRef,viewerPermission,visibility,isArchived,isFork,description,url,repositoryTopics',
    ]),
    labels: ghJsonCall(['gh', 'label', 'list', '--repo', repo, '--json', 'name,color,description']),
  };
  if (bool(args, '--include-rulesets'))
    result.rulesets = ghJsonCall([
      'gh',
      'ruleset',
      'list',
      '--repo',
      repo,
      '--json',
      'id,name,source,type,enforcement',
    ]);
  if (bool(args, '--include-workflows'))
    result.workflows = ghJsonCall([
      'gh',
      'workflow',
      'list',
      '--repo',
      repo,
      '--json',
      'id,name,state,path',
    ]);
  if (bool(args, '--include-variables'))
    result.variables = ghJsonCall([
      'gh',
      'variable',
      'list',
      '--repo',
      repo,
      '--json',
      'name,updatedAt',
    ]);
  if (bool(args, '--include-secrets'))
    result.secrets = ghJsonCall([
      'gh',
      'secret',
      'list',
      '--repo',
      repo,
      '--json',
      'name,updatedAt',
    ]);
  result.ok = Object.values(result).every((value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value) || !('ok' in value))
      return true;
    return value.ok === true;
  });
  if (jsonMode) printJson(result);
  else process.stdout.write(JSON.stringify(result, null, 2));
  return result.ok ? 0 : 1;
}

const HELP = `gh-utility

Usage:
  node scripts/gh-utility.mjs <command> [options]

Commands:
  auth-doctor          Diagnose gh installation, auth, host, repo context, API reachability.
  route                Translate a GitHub URL or OWNER/REPO into preferred gh commands.
  safe-api             Wrap gh api with explicit method, dry-run, and mutation confirmation.
  pr-threads           Fetch PR review threads; reply/resolve only with confirmation.
  pr-checks            Inspect PR checks and GitHub Actions failure snippets.
  release-state        Inspect release/tag state and compare tags.
  project-snapshot     Export GitHub Project view/fields/items snapshot.
  secret-manifest      Parse dotenv files into redacted secret/variable plans.
  codespace-snapshot   Read-only Codespaces list/view/ports/log snippets.
  repo-audit           Read-only repo metadata, labels, and optional admin surfaces.
  validate-skill       Validate Agent Skill frontmatter, links, and built runtime presence.
  help                 Show this help.

Use --json on commands that support structured output. Mutating subcommands require
--confirm-mutation; secret-manifest never prints secret values.
`;

function dispatch(command: string, argv: string[]): number {
  switch (command) {
    case 'auth-doctor':
      return commandAuthDoctor(argv);
    case 'route':
      return commandRoute(argv);
    case 'safe-api':
      return commandSafeApi(argv);
    case 'pr-threads':
      return commandPrThreads(argv);
    case 'pr-checks':
      return commandPrChecks(argv);
    case 'release-state':
      return commandReleaseState(argv);
    case 'project-snapshot':
      return commandProjectSnapshot(argv);
    case 'secret-manifest':
      return commandSecretManifest(argv);
    case 'codespace-snapshot':
      return commandCodespaceSnapshot(argv);
    case 'repo-audit':
      return commandRepoAudit(argv);
    case 'validate-skill':
      return commandValidateSkill(argv);
    case 'help':
    case '--help':
    case '-h':
      process.stdout.write(HELP);
      return 0;
    default:
      process.stderr.write(`Unknown command: ${command}\n\n${HELP}`);
      return 2;
  }
}

export function main(argv = process.argv.slice(2)): number {
  const command = argv[0] ?? 'help';
  if (basename(process.argv[1] ?? '') === 'cli.ts' && command === 'test-import') {
    return 0;
  }
  return dispatch(command, argv.slice(1));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main());
}
