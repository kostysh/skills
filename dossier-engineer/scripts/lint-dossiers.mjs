#!/usr/bin/env node
/**
 * lint-dossiers.mjs
 *
 * Validates Feature Dossiers and (optionally) updates the "Red flags" block
 * in docs/ssot/index.md so humans and agents can see what’s missing at a glance.
 *
 * Usage:
 *   node scripts/lint-dossiers.mjs
 *   node scripts/lint-dossiers.mjs --dossiers-dir docs/features --index-file docs/ssot/index.md
 *   node scripts/lint-dossiers.mjs --no-update-index
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_DOSSIERS_DIR = "docs/features";
const DEFAULT_INDEX_FILE = "docs/ssot/index.md";

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
    dossiersDir: get("--dossiers-dir", DEFAULT_DOSSIERS_DIR),
    indexFile: get("--index-file", DEFAULT_INDEX_FILE),
    root: get("--root", process.cwd()),
    updateIndex: !has("--no-update-index"),
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
      currentParent = key;
      out[key] = {};
      continue;
    }

    currentParent = null;
    out[key] = parseYamlValue(valueRaw);
  }

  return out;
};

const isDossierFile = (fileName) => /^F-\d{4}-.+\.md$/i.test(fileName) || /^F-\d{4}\.md$/i.test(fileName);

const listDossiers = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isFile()).map((e) => e.name).filter(isDossierFile).sort();
};

const STATUS = new Set(["proposed", "shaped", "planned", "in_progress", "done", "parked"]);

const extractFeatureNumericId = (featureId) => {
  // "F-0001" -> "0001"
  const m = String(featureId).match(/^F-(\d{4})$/);
  return m ? m[1] : null;
};

const extractAcIds = (markdown) => {
  // Accept both "AC-F0001-01" and "AC-F0001-1" (normalize to 2 digits where possible)
  const ids = new Set();
  const re = /\bAC-F(\d{4})-(\d{1,2})\b/g;
  for (;;) {
    const m = re.exec(markdown);
    if (!m) break;
    const num = m[1];
    const ac = m[2].padStart(2, "0");
    ids.add(`AC-F${num}-${ac}`);
  }
  return [...ids].sort();
};

const extractCoverageAcIds = (markdown) => {
  // Try to detect a markdown table row: "| AC-F0001-01 |"
  const ids = new Set();
  const re = /^\|\s*(AC-F\d{4}-\d{1,2})\s*\|/gm;
  for (;;) {
    const m = re.exec(markdown);
    if (!m) break;
    const id = m[1].replace(/-(\d{1,2})$/, (_, x) => `-${String(x).padStart(2, "0")}`);
    ids.add(id);
  }
  return [...ids].sort();
};

const hasChangeLogEntry = (markdown) => /##\s+.*Change log|##\s+Change log/i.test(markdown);

const replaceBlock = (content, beginMarker, endMarker, block) => {
  const begin = content.indexOf(beginMarker);
  const end = content.indexOf(endMarker);
  if (begin === -1 || end === -1 || end < begin) return content;
  const before = content.slice(0, begin + beginMarker.length);
  const after = content.slice(end);
  return `${before}\n${block}\n${after}`;
};

const main = async () => {
  const { dossiersDir, indexFile, root, updateIndex } = parseArgs();
  const absDossiers = path.resolve(root, dossiersDir);
  const absIndex = path.resolve(root, indexFile);

  let files = [];
  try {
    files = await listDossiers(absDossiers);
  } catch (err) {
    console.error(`[lint-dossiers] ERROR: cannot read dossiers directory: ${absDossiers}`);
    console.error(err?.stack ?? String(err));
    process.exit(1);
  }

  /** @type {{ level: "error" | "warn", feature?: string, message: string }[]} */
  const findings = [];
  /** @type {Set<string>} */
  const featureIds = new Set();

  for (const file of files) {
    const abs = path.join(absDossiers, file);
    const md = await readText(abs);
    const fm = parseFrontmatter(md);

    if (!fm) {
      findings.push({ level: "error", feature: file, message: "Missing or invalid YAML frontmatter (must start with --- and end with ---)." });
      continue;
    }

    const id = fm.id;
    const title = fm.title;
    const status = fm.status;
    const area = fm.area;
    const owners = fm.owners;
    const created = fm.created;
    const updated = fm.updated;

    const required = [
      ["id", id],
      ["title", title],
      ["status", status],
      ["area", area],
      ["owners", owners],
      ["created", created],
      ["updated", updated],
    ];
    for (const [k, v] of required) {
      if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
        findings.push({ level: "error", feature: String(id ?? file), message: `Missing required frontmatter key: ${k}` });
      }
    }

    if (typeof id !== "string" || !/^F-\d{4}$/.test(id)) {
      findings.push({ level: "error", feature: String(id ?? file), message: `Invalid feature id "${String(id)}" (expected F-0001).` });
    } else {
      if (featureIds.has(id)) {
        findings.push({ level: "error", feature: id, message: `Duplicate feature id across dossiers: ${id}` });
      }
      featureIds.add(id);
    }

    if (typeof status !== "string" || !STATUS.has(status)) {
      findings.push({ level: "error", feature: String(id ?? file), message: `Invalid status "${String(status)}" (allowed: ${[...STATUS].join(", ")}).` });
    }

    if (!Array.isArray(owners) || owners.length === 0) {
      findings.push({ level: "error", feature: String(id ?? file), message: `owners must be a non-empty array (e.g., owners: ["@you"]).` });
    }

    // Accept YYYY-MM-DD only (simple)
    for (const [k, v] of [["created", created], ["updated", updated]]) {
      if (typeof v === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        findings.push({ level: "warn", feature: String(id ?? file), message: `${k} should be YYYY-MM-DD (got "${v}").` });
      }
    }

    const acIds = extractAcIds(md);
    if (acIds.length === 0) {
      findings.push({ level: "error", feature: String(id ?? file), message: `No acceptance criteria IDs found. Add at least one AC-F....-.. entry.` });
    }

    // Validate AC numeric part matches feature numeric id
    const featureNum = extractFeatureNumericId(id);
    if (featureNum) {
      for (const ac of acIds) {
        if (!ac.startsWith(`AC-F${featureNum}-`)) {
          findings.push({ level: "error", feature: id, message: `AC ID "${ac}" does not match feature numeric id ${featureNum}.` });
        }
      }
    }

    // Coverage checks: required once planned or in progress/done
    const coverageIds = extractCoverageAcIds(md);
    const needsCoverage = ["planned", "in_progress", "done"].includes(String(status));
    if (needsCoverage) {
      if (coverageIds.length === 0) {
        findings.push({ level: "error", feature: id, message: `Missing Coverage map table (expected rows like "| AC-F....-.. |").` });
      } else {
        const missing = acIds.filter((x) => !coverageIds.includes(x));
        if (missing.length) {
          findings.push({ level: "error", feature: id, message: `Coverage map is missing AC rows: ${missing.join(", ")}` });
        }
      }
    } else {
      if (coverageIds.length === 0) {
        findings.push({ level: "warn", feature: id, message: `Coverage map is recommended even for early statuses (planned/in_progress requires it).` });
      }
    }

    if (!hasChangeLogEntry(md)) {
      findings.push({ level: needsCoverage ? "warn" : "warn", feature: id, message: `Missing Change log section. Add at least an initial entry for traceability.` });
    }

    // Dependency existence
    const deps = Array.isArray(fm.depends_on) ? fm.depends_on : [];
    for (const dep of deps) {
      if (typeof dep !== "string" || !/^F-\d{4}$/.test(dep)) {
        findings.push({ level: "error", feature: id, message: `Invalid depends_on entry "${String(dep)}" (expected F-0002).` });
      }
    }
  }

  // Cross-feature dependency existence check (after collecting ids)
  // (We only check format earlier; now check existence.)
  for (const file of files) {
    const abs = path.join(absDossiers, file);
    const md = await readText(abs);
    const fm = parseFrontmatter(md);
    if (!fm || typeof fm.id !== "string") continue;
    const id = fm.id;
    const deps = Array.isArray(fm.depends_on) ? fm.depends_on : [];
    for (const dep of deps) {
      if (typeof dep === "string" && /^F-\d{4}$/.test(dep) && !featureIds.has(dep)) {
        findings.push({ level: "error", feature: id, message: `depends_on references missing dossier: ${dep}` });
      }
    }
  }

  // Summarize
  const errors = findings.filter((f) => f.level === "error");
  const warns = findings.filter((f) => f.level === "warn");

  const byFeature = new Map();
  for (const f of findings) {
    const k = f.feature ?? "global";
    if (!byFeature.has(k)) byFeature.set(k, []);
    byFeature.get(k).push(f);
  }

  const lines = [];
  lines.push(`Found ${errors.length} error(s), ${warns.length} warning(s) across ${files.length} dossier(s).`);
  for (const [feature, items] of [...byFeature.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])))) {
    for (const it of items) {
      lines.push(`- [${it.level.toUpperCase()}] ${feature}: ${it.message}`);
    }
  }

  console.log(lines.join("\n"));

  // Optionally update index red flags block
  if (updateIndex) {
    try {
      const idxText = await readText(absIndex);
      const redFlags = findings.length
        ? findings
            .map((f) => `- **${f.level.toUpperCase()}** ${f.feature ?? "global"} — ${f.message}`)
            .join("\n")
        : "- ✅ No red flags detected.";

      const updated = replaceBlock(idxText, "<!-- BEGIN GENERATED RED_FLAGS -->", "<!-- END GENERATED RED_FLAGS -->", redFlags);
      await writeTextAtomic(absIndex, updated);
      console.log(`[lint-dossiers] Updated Red flags block in ${indexFile}.`);
    } catch (err) {
      console.warn(`[lint-dossiers] WARN: Could not update index red flags block (${indexFile}).`);
    }
  }

  if (errors.length) process.exit(2);
};

main().catch((err) => {
  console.error("[lint-dossiers] FATAL:", err?.stack ?? String(err));
  process.exit(1);
});
