#!/usr/bin/env node
/**
 * debt-audit.mjs
 *
 * Checks for explicit unresolved debt markers in the repo.
 * This is a guardrail, not a replacement for human debt review.
 *
 * Usage:
 *   node scripts/debt-audit.mjs
 *   node scripts/debt-audit.mjs --changed-only
 *   node scripts/debt-audit.mjs --changed-only --base origin/main
 *   node scripts/debt-audit.mjs --paths scripts/debt-audit.mjs,test/platform
 */

import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_SCAN_ROOTS = [
  "src",
  "apps",
  "packages",
  "infra",
  "scripts",
  "test",
  "docs",
  ".github",
  "AGENTS.md",
  "README.md",
  "package.json",
  "pnpm-workspace.yaml",
  "tsconfig.json",
  "tsconfig.base.json",
  "tsconfig.typecheck.json",
  "tsconfig.eslint.json",
  "biome.json",
  "eslint.config.js",
];

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".turbo",
  ".cache",
  "workspace",
  "models",
  "data",
]);

const MARKER_PATTERN = /\b(TODO|FIXME|HACK|XXX)\b/;
const MARKDOWN_MARKER_PATTERN = /^\s*(?:>\s*)?(?:[-*+]|\d+\.)?\s*(TODO|FIXME|HACK|XXX)\b/;
const COMMENT_MARKER_PATTERN = /(?:^|\s)(?:\/\/|#|\/\*|\*|<!--|;|--\s).*\b(TODO|FIXME|HACK|XXX)\b/;

const parseArgs = () => {
  const args = process.argv.slice(2);
  const has = (name) => args.includes(name);
  const get = (name, fallback) => {
    const idx = args.indexOf(name);
    if (idx === -1) return fallback;
    const value = args[idx + 1];
    if (!value || value.startsWith("--")) return fallback;
    return value;
  };

  const rawPaths = get("--paths", "");

  return {
    root: get("--root", process.cwd()),
    changedOnly: has("--changed-only"),
    base: get("--base", null),
    paths: rawPaths
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  };
};

const isMarkdownLike = (filePath) => /\.(md|mdx|txt)$/i.test(filePath);

const splitLines = (text) =>
  String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const walk = async (dir, files = []) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      await walk(path.join(dir, entry.name), files);
      continue;
    }

    if (entry.isFile()) {
      files.push(path.join(dir, entry.name));
    }
  }

  return files;
};

const runGit = (root, args, { allowFailure = false } = {}) => {
  try {
    return execFileSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    if (allowFailure) return null;
    const stderr = error?.stderr?.toString?.().trim?.();
    throw new Error(stderr || error?.message || `git ${args.join(" ")} failed`, {
      cause: error,
    });
  }
};

const normalizeGitPath = (filePath) => filePath.split("/").join(path.sep);

const getHeadRef = (root) =>
  runGit(root, ["rev-parse", "--verify", "HEAD"], { allowFailure: true });

const resolveBaseRef = (root, explicitBase) => {
  if (explicitBase) return explicitBase;

  const envBase =
    process.env.GITHUB_BASE_REF ||
    process.env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME ||
    process.env.CHANGE_TARGET;

  if (envBase) {
    for (const candidate of [envBase, `origin/${envBase}`]) {
      if (runGit(root, ["rev-parse", "--verify", candidate], { allowFailure: true })) {
        return candidate;
      }
    }
  }

  const originHead = runGit(
    root,
    ["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"],
    { allowFailure: true },
  );

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
    const mergeBase = runGit(root, ["merge-base", "HEAD", baseRef], {
      allowFailure: true,
    });
    if (!mergeBase) {
      throw new Error(`Could not resolve merge base for HEAD and "${baseRef}".`);
    }
    addLines(
      runGit(root, ["diff", "--name-only", "--diff-filter=ACMR", mergeBase, "HEAD"], {
        allowFailure: true,
      }),
    );
  } else if (headExists) {
    addLines(
      runGit(root, ["diff", "--name-only", "--diff-filter=ACMR", "HEAD"], {
        allowFailure: true,
      }),
    );
  }

  addLines(runGit(root, ["diff", "--name-only", "--diff-filter=ACMR"], { allowFailure: true }));
  addLines(
    runGit(root, ["diff", "--cached", "--name-only", "--diff-filter=ACMR"], {
      allowFailure: true,
    }),
  );
  addLines(
    runGit(root, ["ls-files", "--others", "--exclude-standard"], {
      allowFailure: true,
    }),
  );

  return [...files].sort();
};

const collectExplicitPaths = async (root, relPaths) => {
  const files = [];

  for (const relPath of relPaths) {
    const absPath = path.resolve(root, relPath);
    const stat = await fs.stat(absPath);
    if (stat.isDirectory()) {
      await walk(absPath, files);
      continue;
    }

    if (stat.isFile()) {
      files.push(absPath);
    }
  }

  return [...new Set(files)].sort();
};

const collectDefaultFiles = async (root) => {
  const files = [];

  for (const relPath of DEFAULT_SCAN_ROOTS) {
    const absPath = path.resolve(root, relPath);
    try {
      const stat = await fs.stat(absPath);
      if (stat.isDirectory()) {
        await walk(absPath, files);
      } else if (stat.isFile()) {
        files.push(absPath);
      }
    } catch {
      // Ignore missing optional paths.
    }
  }

  return [...new Set(files)].sort();
};

const shouldFlagLine = (filePath, line) => {
  if (!MARKER_PATTERN.test(line)) return false;

  if (isMarkdownLike(filePath)) {
    return MARKDOWN_MARKER_PATTERN.test(line);
  }

  return COMMENT_MARKER_PATTERN.test(line);
};

const main = async () => {
  const { root, changedOnly, base, paths } = parseArgs();
  const absRoot = path.resolve(root);

  if (changedOnly && paths.length > 0) {
    throw new Error("--changed-only and --paths cannot be used together.");
  }

  let filesToScan;
  if (paths.length > 0) {
    filesToScan = await collectExplicitPaths(absRoot, paths);
  } else if (changedOnly) {
    if (!runGit(absRoot, ["rev-parse", "--show-toplevel"], { allowFailure: true })) {
      throw new Error("--changed-only requires a git repository.");
    }

    const baseRef = resolveBaseRef(absRoot, base);
    filesToScan = getChangedFiles(absRoot, baseRef).map((filePath) =>
      path.resolve(absRoot, filePath),
    );
  } else {
    filesToScan = await collectDefaultFiles(absRoot);
  }

  /** @type {Array<{ file: string, line: number, marker: string, text: string }>} */
  const findings = [];

  for (const filePath of filesToScan) {
    let content;
    try {
      content = await fs.readFile(filePath, "utf8");
    } catch {
      continue;
    }

    const relPath = path.relative(absRoot, filePath) || path.basename(filePath);
    const lines = content.split(/\r?\n/);

    for (const [index, line] of lines.entries()) {
      if (!shouldFlagLine(filePath, line)) continue;

      const markerMatch = line.match(MARKER_PATTERN);
      findings.push({
        file: relPath,
        line: index + 1,
        marker: markerMatch?.[1] ?? "MARKER",
        text: line.trim(),
      });
    }
  }

  console.log(`Debt audit: ${filesToScan.length} file(s) scanned.`);

  if (findings.length === 0) {
    console.log(
      "No unresolved debt markers found. This augments, but does not replace, human debt review.",
    );
    return;
  }

  console.error(`Found ${findings.length} unresolved debt marker(s):`);
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.marker}] ${finding.text}`);
  }

  process.exitCode = 2;
};

main().catch((error) => {
  console.error(`[debt-audit] ERROR: ${error?.message ?? String(error)}`);
  if (error?.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
