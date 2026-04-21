import assert from "node:assert/strict";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import packageJson from "../package.json" with { type: "json" };

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, "..");
const CLI_PATH = path.join(SKILL_DIR, "scripts", "skill-source-compiler.mjs");
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

function runBuiltCli(
  args: string[],
  options: { cwd?: string } = {},
): SpawnSyncReturns<string> {
  const result = spawnSync("node", [CLI_PATH, ...args], {
    cwd: options.cwd ?? SKILL_DIR,
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

void test("built CLI exposes help, command help, and version", () => {
  const help = runBuiltCli(["--help"]);
  assert.equal(help.status, 0);
  assert.equal(help.stderr, "");
  assert.match(help.stdout, /skill-source-compiler CLI v/u);
  assert.match(help.stdout, /compile-all/u);

  const commandHelp = runBuiltCli(["help", "compile"]);
  assert.equal(commandHelp.status, 0);
  assert.equal(commandHelp.stderr, "");
  assert.match(commandHelp.stdout, /^compile - Compile one source bundle/mu);
  assert.match(commandHelp.stdout, /node scripts\/skill-source-compiler\.mjs compile <source-dir> --out-dir <skills-dir>/u);

  const version = runBuiltCli(["--version"]);
  assert.equal(version.status, 0);
  assert.equal(version.stderr, "");
  assert.match(version.stdout, new RegExp(`^${escapeRegExp(packageJson.version)}\\n$`, "u"));
});

void test("built CLI lint, compile, and check succeed for the self-hosted bundle", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "skill-source-cli-"));

  try {
    const lint = runBuiltCli(["lint", SKILL_DIR]);
    assert.equal(lint.status, 0, lint.stderr);
    assert.equal(lint.stderr, "");
    assert.match(lint.stdout, /^OK /mu);

    const compile = runBuiltCli(["compile", SKILL_DIR, "--out-dir", tempRoot]);
    assert.equal(compile.status, 0, compile.stderr);
    assert.equal(compile.stderr, "");
    assert.match(compile.stdout, /Compiled .* -> .*skill-source-compiler/u);

    const compiledDir = path.join(tempRoot, "skill-source-compiler");
    const compiledSkill = await readFile(path.join(compiledDir, "SKILL.md"), "utf8");
    assert.match(compiledSkill, /## Runnable commands/u);
    assert.match(compiledSkill, /metadata:\n(?:.+\n)*\s+source-version: 0\.1\.0/u);
    assert.match(compiledSkill, /test\/cli\.test\.ts/u);
    assert.match(compiledSkill, /references\/maintenance\.md/u);
    assert.match(compiledSkill, /references\/authoring-guidelines\.md/u);
    assert.match(compiledSkill, /look for it under <skill-root>\/scripts/u);

    const check = runBuiltCli(["check", compiledDir]);
    assert.equal(check.status, 0, check.stderr);
    assert.equal(check.stderr, "");
    assert.match(check.stdout, /^OK /mu);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test("built CLI compile-all processes direct child bundles", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "skill-source-cli-all-"));
  const sourcesRoot = path.join(tempRoot, "sources");
  const bundleDir = path.join(sourcesRoot, "skill-source-compiler");
  const outDir = path.join(tempRoot, "out");

  try {
    await cp(SKILL_DIR, bundleDir, { recursive: true });

    const result = runBuiltCli(["compile-all", sourcesRoot, "--out-dir", outDir]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
    assert.match(result.stdout, /Compiled 1 source bundle\(s\)\./u);
    assert.match(result.stdout, /skill-source-compiler/u);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test("built CLI surfaces a warning when generated SKILL.md exceeds the recommended size", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "skill-source-cli-size-"));
  const sourceRoot = path.join(tempRoot, "source");

  try {
    await cp(SKILL_DIR, sourceRoot, { recursive: true });

    const manifestPath = path.join(sourceRoot, "skill.yaml");
    const manifest = await readFile(manifestPath, "utf8");
    await writeFile(
      manifestPath,
      manifest.replace("recommended-skill-md-max-bytes: 20000", "recommended-skill-md-max-bytes: 128"),
      "utf8",
    );

    const compile = runBuiltCli(["compile", sourceRoot, "--out-dir", tempRoot]);
    assert.equal(compile.status, 0, compile.stderr);
    assert.equal(compile.stderr, "");
    assert.match(compile.stdout, /Warnings:/u);
    assert.match(compile.stdout, /recommended maximum 128 bytes/u);
    assert.match(compile.stdout, /Move detailed guidance into references\/\*/u);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test("built CLI returns usage error for unknown command", () => {
  const result = runBuiltCli(["unknown-command"]);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Unknown command: unknown-command/u);
  assert.match(result.stderr, /Run `skill-source-compiler --help` for usage\./u);
});
