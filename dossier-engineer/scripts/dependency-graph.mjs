#!/usr/bin/env node
/**
 * dependency-graph.mjs
 *
 * Outputs a Mermaid dependency graph from dossier frontmatter.
 *
 * Usage:
 *   node scripts/dependency-graph.mjs
 *   node scripts/dependency-graph.mjs --dossiers-dir docs/features
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_DOSSIERS_DIR = "docs/features";

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
    root: get("--root", process.cwd()),
    dossiersDir: get("--dossiers-dir", DEFAULT_DOSSIERS_DIR),
  };
};

const readText = async (filePath) => fs.readFile(filePath, "utf8");

const parseYamlValue = (raw) => {
  const t = raw.trim();
  if (t === "[]") return [];
  if (t.startsWith("[") && t.endsWith("]")) {
    const inner = t.slice(1, -1).trim();
    if (!inner) return [];
    return inner
      .split(",")
      .map((x) => x.trim())
      .map((x) => x.replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
  }
  return t.replace(/^['"]|['"]$/g, "");
};

const parseFrontmatter = (markdown) => {
  if (!markdown.startsWith("---")) return null;
  const end = markdown.indexOf("\n---", 3);
  if (end === -1) return null;
  const raw = markdown.slice(3, end).trim();
  const lines = raw.split(/\r?\n/);

  /** @type {Record<string, unknown>} */
  const out = {};
  for (const line of lines) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) continue;
    out[m[1]] = parseYamlValue(m[2]);
  }
  return out;
};

const isDossierFile = (fileName) => /^F-\d{4}-.+\.md$/i.test(fileName) || /^F-\d{4}\.md$/i.test(fileName);

const listDossiers = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isFile()).map((e) => e.name).filter(isDossierFile).sort();
};

const escapeQuotes = (s) => String(s).replace(/"/g, '\\"');

const main = async () => {
  const { root, dossiersDir } = parseArgs();
  const absDir = path.resolve(root, dossiersDir);
  const files = await listDossiers(absDir);

  const dossiers = [];
  for (const f of files) {
    const md = await readText(path.join(absDir, f));
    const fm = parseFrontmatter(md);
    if (!fm || typeof fm.id !== "string") continue;
    dossiers.push(fm);
  }

  const nodes = dossiers.map((d) => {
    const nodeId = String(d.id).replace("-", "");
    const label = `${d.id} ${d.title ?? ""}`.trim();
    return `  ${nodeId}["${escapeQuotes(label)}"]`;
  });

  const edges = [];
  for (const d of dossiers) {
    const from = String(d.id).replace("-", "");
    const deps = Array.isArray(d.depends_on) ? d.depends_on : [];
    for (const dep of deps) {
      const to = String(dep).replace("-", "");
      edges.push(`  ${from} --> ${to}`);
    }
  }

  console.log(["```mermaid", "graph TD", ...nodes, ...edges, "```"].join("\n"));
};

main().catch((err) => {
  console.error("[dependency-graph] FATAL:", err?.stack ?? String(err));
  process.exit(1);
});
