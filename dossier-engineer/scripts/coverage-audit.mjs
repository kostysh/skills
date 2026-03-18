#!/usr/bin/env node
/**
 * coverage-audit.mjs
 *
 * Checks that each acceptance criterion ID (AC-Fdddd-nn) is referenced in tests.
 * - Test reference can be in test name or a comment: // Covers: AC-...
 * - No external dependencies.
 *
 * Usage:
 *   node scripts/coverage-audit.mjs --dossier docs/features/F-0001-foo.md
 *   node scripts/coverage-audit.mjs --dossiers-dir docs/features   # audits all dossiers
 *   node scripts/coverage-audit.mjs --changed-only --base origin/main
 */

import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_DOSSIERS_DIR = "docs/features";

const parseArgs = () => {
  const args = process.argv.slice(2);
  const has = (name) => args.includes(name);
  const get = (name, fallback) => {
    const idx = args.indexOf(name);
    if (idx === -1) return fallback;
    const v = args[idx + 1];
    if (!v || v.startsWith("--")) return fallback;
    return v;
  };
  return {
    root: get("--root", process.cwd()),
    dossier: get("--dossier", null),
    dossiersDir: get("--dossiers-dir", DEFAULT_DOSSIERS_DIR),
    changedOnly: has("--changed-only"),
    base: get("--base", null),
  };
};

const readText = async (filePath) => fs.readFile(filePath, "utf8");

const isIgnoredDir = (name) => new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo", ".cache"]).has(name);

const isTestFile = (filePath) =>
  /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath) ||
  filePath.split(path.sep).includes("test") ||
  filePath.split(path.sep).includes("tests");

const walk = async (dir, files = []) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (isIgnoredDir(e.name)) continue;
      await walk(abs, files);
    } else if (e.isFile()) {
      if (isTestFile(abs)) files.push(abs);
    }
  }
  return files;
};

const extractAcIds = (markdown) => {
  const ids = new Set();
  const re = /\bAC-F(\d{4})-(\d{1,2})\b/g;
  for (;;) {
    const m = re.exec(markdown);
    if (!m) break;
    ids.add(`AC-F${m[1]}-${m[2].padStart(2, "0")}`);
  }
  return [...ids].sort();
};

const listDossierFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((n) => /^F-\d{4}-.+\.md$/i.test(n) || /^F-\d{4}\.md$/i.test(n))
    .sort();
};

const normalizeGitPath = (filePath) => filePath.split("/").join(path.sep);

const runGit = (root, args, { allowFailure = false } = {}) => {
  try {
    return execFileSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (err) {
    if (allowFailure) return null;
    const stderr = err?.stderr?.toString?.().trim?.();
    throw new Error(stderr || err?.message || `git ${args.join(" ")} failed`);
  }
};

const splitLines = (text) =>
  String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const getHeadRef = (root) => runGit(root, ["rev-parse", "--verify", "HEAD"], { allowFailure: true });

const resolveBaseRef = (root, explicitBase) => {
  if (explicitBase) return explicitBase;

  const envBase = process.env.GITHUB_BASE_REF || process.env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME || process.env.CHANGE_TARGET;
  if (envBase) {
    for (const candidate of [envBase, `origin/${envBase}`]) {
      if (runGit(root, ["rev-parse", "--verify", candidate], { allowFailure: true })) {
        return candidate;
      }
    }
  }

  const originHead = runGit(root, ["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"], {
    allowFailure: true,
  });
  if (originHead && runGit(root, ["rev-parse", "--verify", originHead], { allowFailure: true })) {
    return originHead;
  }

  return null;
};

const getChangedFiles = (root, baseRef) => {
  const files = new Set();
  const addLines = (text) => {
    for (const file of splitLines(text)) files.add(normalizeGitPath(file));
  };

  const headExists = Boolean(getHeadRef(root));

  if (baseRef) {
    const mergeBase = runGit(root, ["merge-base", "HEAD", baseRef], { allowFailure: true });
    if (!mergeBase) {
      throw new Error(`Could not resolve merge base for HEAD and "${baseRef}".`);
    }
    addLines(runGit(root, ["diff", "--name-only", "--diff-filter=ACMR", mergeBase, "HEAD"], { allowFailure: true }));
  } else if (headExists) {
    addLines(runGit(root, ["diff", "--name-only", "--diff-filter=ACMR", "HEAD"], { allowFailure: true }));
  }

  addLines(runGit(root, ["diff", "--name-only", "--diff-filter=ACMR"], { allowFailure: true }));
  addLines(runGit(root, ["diff", "--cached", "--name-only", "--diff-filter=ACMR"], { allowFailure: true }));
  addLines(runGit(root, ["ls-files", "--others", "--exclude-standard"], { allowFailure: true }));

  return [...files].sort();
};

const extractFeatureIdFromAc = (acId) => {
  const match = String(acId).match(/^AC-F(\d{4})-\d{2}$/);
  return match ? `F-${match[1]}` : null;
};

const matchesFeatureFile = (featureId, filePath) => {
  const name = path.basename(filePath);
  return name === `${featureId}.md` || name.startsWith(`${featureId}-`);
};

const selectChangedDossiers = async ({ absRoot, dossiersDir, baseRef }) => {
  if (!runGit(absRoot, ["rev-parse", "--show-toplevel"], { allowFailure: true })) {
    throw new Error("--changed-only requires a git repository.");
  }

  const dossierDirAbs = path.resolve(absRoot, dossiersDir);
  const dossierFiles = await listDossierFiles(dossierDirAbs);
  const dossierAbsPaths = dossierFiles.map((file) => path.join(dossierDirAbs, file));
  const selected = new Set();

  const changedFiles = getChangedFiles(absRoot, baseRef);
  const changedAbsPaths = changedFiles.map((file) => path.resolve(absRoot, normalizeGitPath(file)));

  for (const absPath of changedAbsPaths) {
    if (dossierAbsPaths.includes(absPath)) {
      selected.add(absPath);
    }
  }

  for (const absPath of changedAbsPaths) {
    if (!isTestFile(absPath)) continue;

    let content = "";
    try {
      content = await readText(absPath);
    } catch {
      continue;
    }

    for (const acId of extractAcIds(content)) {
      const featureId = extractFeatureIdFromAc(acId);
      if (!featureId) continue;
      for (const dossierPath of dossierAbsPaths) {
        if (matchesFeatureFile(featureId, dossierPath)) {
          selected.add(dossierPath);
        }
      }
    }
  }

  return [...selected].sort();
};

const main = async () => {
  const { root, dossier, dossiersDir, changedOnly, base } = parseArgs();
  const absRoot = path.resolve(root);

  const dossiers = [];
  if (dossier && changedOnly) {
    throw new Error("--dossier and --changed-only cannot be used together.");
  }

  if (dossier) {
    dossiers.push(path.resolve(absRoot, dossier));
  } else if (changedOnly) {
    const selected = await selectChangedDossiers({
      absRoot,
      dossiersDir,
      baseRef: resolveBaseRef(absRoot, base),
    });

    if (selected.length === 0) {
      console.log("Coverage audit: 0 dossier(s) selected by --changed-only.");
      console.log("Nothing to audit.");
      return;
    }

    dossiers.push(...selected);
  } else {
    const absDir = path.resolve(absRoot, dossiersDir);
    const files = await listDossierFiles(absDir);
    for (const f of files) dossiers.push(path.join(absDir, f));
  }

  const testFiles = await walk(absRoot);
  /** @type {Map<string, string>} */
  const testContent = new Map();
  for (const f of testFiles) {
    try {
      testContent.set(f, await readText(f));
    } catch {
      // ignore unreadable files
    }
  }

  /** @type {{ dossier: string, missing: string[], found: Map<string, string[]> }[]} */
  const results = [];

  for (const d of dossiers) {
    const md = await readText(d);
    const acIds = extractAcIds(md);
    if (acIds.length === 0) {
      results.push({ dossier: d, missing: [], found: new Map() });
      continue;
    }

    const found = new Map();
    const missing = [];
    for (const ac of acIds) {
      const hits = [];
      for (const [file, content] of testContent.entries()) {
        if (content.includes(ac)) hits.push(path.relative(absRoot, file));
      }
      if (hits.length === 0) missing.push(ac);
      else found.set(ac, hits);
    }

    results.push({ dossier: path.relative(absRoot, d), missing, found });
  }

  // Orphan AC references: AC IDs found in tests but not present in any audited dossier
  const allDossierAcs = new Set(results.flatMap((r) => [...r.found.keys(), ...r.missing]));
  const orphan = new Map(); // ac -> [files]
  const re = /\bAC-F(\d{4})-(\d{1,2})\b/g;
  for (const [file, content] of testContent.entries()) {
    for (;;) {
      const m = re.exec(content);
      if (!m) break;
      const ac = `AC-F${m[1]}-${m[2].padStart(2, "0")}`;
      if (!allDossierAcs.has(ac)) {
        const rel = path.relative(absRoot, file);
        if (!orphan.has(ac)) orphan.set(ac, new Set());
        orphan.get(ac).add(rel);
      }
    }
  }

  let totalMissing = 0;
  for (const r of results) totalMissing += r.missing.length;

  console.log(`Coverage audit: ${results.length} dossier(s), ${testFiles.length} test file(s) scanned.`);
  for (const r of results) {
    console.log(`\n== ${r.dossier} ==`);
    if (r.missing.length === 0) {
      console.log("✅ All AC IDs referenced in tests.");
    } else {
      console.log(`❌ Missing ${r.missing.length} AC reference(s) in tests:`);
      for (const ac of r.missing) console.log(`- ${ac}`);
    }
  }

  if (orphan.size) {
    console.log("\n== Orphan AC references found in tests (no matching dossier AC) ==");
    for (const [ac, files] of orphan.entries()) {
      console.log(`- ${ac}: ${[...files].join(", ")}`);
    }
  }

  if (totalMissing > 0) process.exit(3);
};

main().catch((err) => {
  console.error("[coverage-audit] FATAL:", err?.stack ?? String(err));
  process.exit(1);
});
