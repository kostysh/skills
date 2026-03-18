#!/usr/bin/env node
/**
 * sync-index.mjs
 *
 * Regenerates docs/ssot/index.md from Feature Dossier frontmatter.
 * - No external dependencies.
 * - Designed for lightweight “SSoT index” workflows.
 *
 * Usage:
 *   node scripts/sync-index.mjs
 *   node scripts/sync-index.mjs --dossiers-dir docs/features --index-file docs/ssot/index.md
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_DOSSIERS_DIR = "docs/features";
const DEFAULT_INDEX_FILE = "docs/ssot/index.md";

const parseArgs = () => {
  const args = process.argv.slice(2);
  const get = (name, fallback) => {
    const idx = args.indexOf(name);
    if (idx === -1) return fallback;
    const v = args[idx + 1];
    if (!v || v.startsWith("--")) return fallback;
    return v;
  };
  return {
    dossiersDir: get("--dossiers-dir", DEFAULT_DOSSIERS_DIR),
    indexFile: get("--index-file", DEFAULT_INDEX_FILE),
    root: get("--root", process.cwd()),
  };
};

const readText = async (filePath) => fs.readFile(filePath, "utf8");

const writeTextAtomic = async (filePath, text) => {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tmp = `${filePath}.tmp-${Date.now()}`;
  await fs.writeFile(tmp, text, "utf8");
  await fs.rename(tmp, filePath);
};

/** Minimal YAML frontmatter parser for our constrained schema. */
const parseFrontmatter = (markdown) => {
  if (!markdown.startsWith("---")) return null;
  const end = markdown.indexOf("\n---", 3);
  if (end === -1) return null;
  const raw = markdown.slice(3, end).trim();
  const lines = raw.split(/\r?\n/);

  /** @type {Record<string, unknown>} */
  const out = {};
  /** @type {string | null} */
  let currentParent = null;

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const indentMatch = line.match(/^(\s+)(.+)$/);
    if (indentMatch && currentParent) {
      // nested map: "  key: value"
      const nested = indentMatch[2];
      const kv = nested.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (!kv) continue;
      const k = kv[1];
      const v = parseYamlValue(kv[2]);
      if (typeof out[currentParent] !== "object" || out[currentParent] === null || Array.isArray(out[currentParent])) {
        out[currentParent] = {};
      }
      out[currentParent][k] = v;
      continue;
    }

    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;

    const key = kv[1];
    const valueRaw = kv[2];

    if (valueRaw === "" || valueRaw === null || valueRaw === undefined) {
      // start nested object
      currentParent = key;
      out[key] = {};
      continue;
    }

    currentParent = null;
    out[key] = parseYamlValue(valueRaw);
  }

  return out;
};

const stripQuotes = (s) => {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
};

const parseYamlValue = (raw) => {
  const t = raw.trim();
  if (t === "[]") return [];
  if (t.startsWith("[") && t.endsWith("]")) {
    const inner = t.slice(1, -1).trim();
    if (!inner) return [];
    return inner
      .split(",")
      .map((x) => stripQuotes(x))
      .map((x) => x.trim())
      .filter(Boolean);
  }
  if (t === "true") return true;
  if (t === "false") return false;
  if (/^\d+$/.test(t)) return Number(t);
  return stripQuotes(t);
};

const isDossierFile = (fileName) => /^F-\d{4}-.+\.md$/i.test(fileName) || /^F-\d{4}\.md$/i.test(fileName);

const listDossiers = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile()).map((e) => e.name).filter(isDossierFile);
  files.sort();
  return files;
};

const ensureIndexSkeleton = () => `# SSOT Index

> Single-file navigation source of truth.  
> **Do not duplicate requirements here.** Link to Feature Dossiers instead.

_Last sync: ${new Date().toISOString()}_

## Features

<!-- BEGIN GENERATED FEATURES -->
<!-- END GENERATED FEATURES -->

## Dependency graph

<!-- BEGIN GENERATED DEP_GRAPH -->
<!-- END GENERATED DEP_GRAPH -->

## Red flags

<!-- BEGIN GENERATED RED_FLAGS -->
<!-- END GENERATED RED_FLAGS -->
`;

const replaceBlock = (content, beginMarker, endMarker, block) => {
  const begin = content.indexOf(beginMarker);
  const end = content.indexOf(endMarker);
  if (begin === -1 || end === -1 || end < begin) {
    // if missing markers, append at end
    return `${content.trim()}\n\n${beginMarker}\n${block}\n${endMarker}\n`;
  }
  const before = content.slice(0, begin + beginMarker.length);
  const after = content.slice(end);
  return `${before}\n${block}\n${after}`;
};

const featureRow = (d) => {
  const depends = Array.isArray(d.depends_on) && d.depends_on.length ? d.depends_on.join(", ") : "—";
  const impacts = Array.isArray(d.impacts) && d.impacts.length ? d.impacts.join(",") : "—";
  const relPath = d.__relPath;
  return `| ${d.id} | ${escapePipe(d.title ?? "")} | ${d.status ?? ""} | ${d.area ?? ""} | ${depends} | ${impacts} | \`${relPath}\` |`;
};

const escapePipe = (s) => String(s).replace(/\|/g, "\\|");

const buildMermaidGraph = (dossiers) => {
  const nodes = dossiers.map((d) => {
    const nodeId = d.id.replace("-", "");
    const label = `${d.id} ${d.title ?? ""}`.trim();
    return `  ${nodeId}["${escapeQuotes(label)}"]`;
  });

  const edges = [];
  for (const d of dossiers) {
    const from = d.id.replace("-", "");
    const deps = Array.isArray(d.depends_on) ? d.depends_on : [];
    for (const dep of deps) {
      const to = String(dep).replace("-", "");
      edges.push(`  ${from} --> ${to}`);
    }
  }

  const body = ["```mermaid", "graph TD", ...nodes, ...edges, "```"].join("\n");
  return body;
};

const escapeQuotes = (s) => String(s).replace(/"/g, '\\"');

const main = async () => {
  const { dossiersDir, indexFile, root } = parseArgs();
  const absDossiers = path.resolve(root, dossiersDir);
  const absIndex = path.resolve(root, indexFile);

  let dossierFiles = [];
  try {
    dossierFiles = await listDossiers(absDossiers);
  } catch (err) {
    console.error(`[sync-index] ERROR: cannot read dossiers directory: ${absDossiers}`);
    console.error(err?.stack ?? String(err));
    process.exit(1);
  }

  const dossiers = [];
  for (const file of dossierFiles) {
    const abs = path.join(absDossiers, file);
    const md = await readText(abs);
    const fm = parseFrontmatter(md);
    if (!fm) {
      console.warn(`[sync-index] WARN: missing/invalid frontmatter: ${path.join(dossiersDir, file)}`);
      continue;
    }
    const relPath = path.relative(path.dirname(absIndex), abs).split(path.sep).join("/");
    dossiers.push({ ...fm, __file: file, __abs: abs, __relPath: relPath });
  }

  dossiers.sort((a, b) => String(a.id).localeCompare(String(b.id)));

  const tableHeader = [
    "| ID | Title | Status | Area | Depends on | Impacts | Dossier |",
    "|---|---|---|---|---|---|---|",
  ].join("\n");
  const rows = dossiers.map(featureRow).join("\n");
  const featuresBlock = `${tableHeader}\n${rows || "| — | — | — | — | — | — | — |"}`;

  const graphBlock = buildMermaidGraph(dossiers);

  let content = "";
  try {
    content = await readText(absIndex);
  } catch {
    content = ensureIndexSkeleton();
  }

  content = replaceBlock(content, "<!-- BEGIN GENERATED FEATURES -->", "<!-- END GENERATED FEATURES -->", featuresBlock);
  content = replaceBlock(content, "<!-- BEGIN GENERATED DEP_GRAPH -->", "<!-- END GENERATED DEP_GRAPH -->", graphBlock);

  // Keep RED_FLAGS block intact; it's filled by lint-dossiers if desired.
  content = content.replace(/_Last sync: .*?_\n/, `_Last sync: ${new Date().toISOString()}_\n`);

  await writeTextAtomic(absIndex, content);
  console.log(`[sync-index] Updated ${indexFile} from ${dossierFiles.length} dossier(s).`);
};

main().catch((err) => {
  console.error("[sync-index] FATAL:", err?.stack ?? String(err));
  process.exit(1);
});
