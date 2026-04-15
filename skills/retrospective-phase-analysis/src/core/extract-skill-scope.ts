import fs from 'node:fs';
import path from 'node:path';

import { parseLooseYaml } from '../parsers/loose-yaml.ts';
import { extractEventType, sortUnique, stringFromUnknown } from './shared.ts';
import type {
  LogMetrics,
  SessionSummary,
  SkillCatalogEntry,
  SkillEvidence,
  SkillSummary,
  SkillTraceSummary,
} from './types.ts';

interface OperationalFragment {
  line: number;
  eventType: string;
  field: string;
  text: string;
}

interface SkillScopeInputs {
  sessionSummary: SessionSummary;
  skillsDir?: string;
  logMetrics: LogMetrics;
}

function collectStrings(input: unknown, depth = 0): string[] {
  if (depth > 8 || input === null || input === undefined) {
    return [];
  }

  if (typeof input === 'string') {
    return [input];
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => collectStrings(item, depth + 1));
  }

  if (typeof input !== 'object') {
    return [];
  }

  return Object.values(input).flatMap((value) => collectStrings(value, depth + 1));
}

function fieldValue(input: unknown, field: string): unknown {
  if (!input || typeof input !== 'object') {
    return undefined;
  }
  return (input as Record<string, unknown>)[field];
}

function objectValue(input: unknown): Record<string, unknown> | null {
  return input && typeof input === 'object' ? (input as Record<string, unknown>) : null;
}

function compactExcerpt(value: string): string {
  const compacted = value.trim().replaceAll(/\s+/gu, ' ');
  return compacted.length > 220 ? `${compacted.slice(0, 217)}...` : compacted;
}

function pathNameFromSkillFile(skillFile: string | null): string | null {
  if (!skillFile) {
    return null;
  }

  const basename = path.basename(skillFile);
  if (basename !== 'SKILL.md') {
    return null;
  }

  const parent = path.basename(path.dirname(skillFile));
  return parent.length > 0 ? parent : null;
}

function normalizeAliases(values: string[]): string[] {
  return sortUnique(values.map((value) => value.trim()).filter((value) => value.length > 0));
}

function parseAvailableSkillsFromText(text: string): SkillCatalogEntry[] {
  const markerIndex = text.indexOf('### Available skills');
  if (markerIndex === -1) {
    return [];
  }

  const lines = text.slice(markerIndex).split(/\r?\n/u).slice(1);
  const entries: SkillCatalogEntry[] = [];
  for (const line of lines) {
    if (/^###\s+/u.test(line)) {
      break;
    }

    const match = line.match(/^-\s+([^:\n]+):\s*(.*)$/u);
    if (!match?.[1]) {
      continue;
    }

    const displayName = match[1].trim();
    const rawDescription = match[2] ?? '';
    const fileMatch = rawDescription.match(/\(file:\s*([^)]+?SKILL\.md)\)/u);
    const skillFile = fileMatch?.[1]?.trim() ?? null;
    const pathName = pathNameFromSkillFile(skillFile);
    const name = pathName ?? displayName;
    const description = rawDescription.replace(/\s*\(file:\s*[^)]+?SKILL\.md\)\s*$/u, '').trim();

    entries.push({
      name,
      display_name: displayName,
      path_name: pathName,
      aliases: normalizeAliases([name, displayName, pathName ?? '']),
      skillFile,
      description,
    });
  }

  return entries;
}

function mergeCatalogEntries(entries: readonly SkillCatalogEntry[]): SkillCatalogEntry[] {
  const byName = new Map<string, SkillCatalogEntry>();

  for (const entry of entries) {
    const existing = byName.get(entry.name);
    const skillFile = existing?.skillFile ?? entry.skillFile;
    const pathName = existing?.path_name ?? entry.path_name ?? pathNameFromSkillFile(skillFile);
    const name = pathName ?? entry.name;
    const aliases = normalizeAliases([
      ...(existing?.aliases ?? []),
      ...entry.aliases,
      entry.name,
      entry.display_name,
      pathName ?? '',
    ]);
    const next: SkillCatalogEntry = {
      name,
      display_name: existing?.display_name ?? entry.display_name,
      path_name: pathName,
      aliases,
      skillFile,
      description: existing?.description || entry.description,
    };
    byName.set(name, next);
  }

  return Array.from(byName.values()).sort((left, right) => left.name.localeCompare(right.name));
}

function bootstrapCatalogStrings(event: unknown): string[] {
  const record = objectValue(event);
  if (!record) {
    return [];
  }

  const eventType = extractEventType(event);
  const payload = objectValue(record.payload);
  const payloadType = stringFromUnknown(payload?.type, '');

  if (eventType === 'response_item' && payloadType === 'message') {
    const role = stringFromUnknown(payload?.role, '');
    return role === 'developer' || role === 'system' ? collectStrings(payload?.content) : [];
  }

  return eventType === 'turn_context' ? collectStrings(event) : [];
}

function extractAvailableSkillCatalog(sessionSummary: SessionSummary): SkillCatalogEntry[] {
  const rawEntries = sessionSummary.events.flatMap((event) =>
    bootstrapCatalogStrings(event).flatMap((text) => parseAvailableSkillsFromText(text)),
  );
  return mergeCatalogEntries(rawEntries);
}

function addFragment(
  out: OperationalFragment[],
  input: {
    line: number;
    eventType: string;
    field: string;
    value: unknown;
  },
): void {
  for (const text of collectStrings(input.value)) {
    if (text.trim().length > 0) {
      out.push({
        line: input.line,
        eventType: input.eventType,
        field: input.field,
        text,
      });
    }
  }
}

function collectParsedCommandFragments(
  out: OperationalFragment[],
  input: { line: number; eventType: string; parsedCommands: unknown },
): void {
  if (!Array.isArray(input.parsedCommands)) {
    return;
  }

  for (const [index, command] of input.parsedCommands.entries()) {
    const record = objectValue(command);
    if (!record) {
      continue;
    }

    addFragment(out, {
      line: input.line,
      eventType: input.eventType,
      field: `event_msg.payload.parsed_cmd[${index}].path`,
      value: record.path,
    });
    addFragment(out, {
      line: input.line,
      eventType: input.eventType,
      field: `event_msg.payload.parsed_cmd[${index}].cmd`,
      value: record.cmd,
    });
  }
}

function operationalFragments(sessionSummary: SessionSummary): OperationalFragment[] {
  const out: OperationalFragment[] = [];

  for (const [index, event] of sessionSummary.events.entries()) {
    const record = objectValue(event);
    if (!record) {
      continue;
    }

    const line = sessionSummary.eventLines[index] ?? index + 1;
    const eventType = extractEventType(event);
    if (eventType === 'session_meta' || eventType === 'turn_context' || eventType === 'compacted') {
      continue;
    }

    const payload = objectValue(record.payload);
    const payloadType = stringFromUnknown(payload?.type, '');

    if (eventType === 'response_item') {
      if (payloadType === 'message') {
        const role = stringFromUnknown(payload?.role, '');
        if (role === 'user' || role === 'assistant') {
          addFragment(out, {
            line,
            eventType,
            field: 'response_item.payload.content',
            value: payload?.content,
          });
        }
        continue;
      }

      if (payloadType === 'function_call') {
        addFragment(out, {
          line,
          eventType,
          field: 'response_item.payload.arguments',
          value: payload?.arguments,
        });
        continue;
      }

      continue;
    }

    if (eventType === 'event_msg' && payload) {
      if (payloadType === 'user_message' || payloadType === 'agent_message') {
        addFragment(out, {
          line,
          eventType,
          field: 'event_msg.payload.message',
          value: payload.message,
        });
        continue;
      }

      if (payloadType === 'exec_command_end') {
        addFragment(out, {
          line,
          eventType,
          field: 'event_msg.payload.command',
          value: payload.command,
        });
        collectParsedCommandFragments(out, {
          line,
          eventType,
          parsedCommands: payload.parsed_cmd,
        });
        continue;
      }

      continue;
    }

    if (eventType === 'assistant' || eventType === 'user') {
      addFragment(out, {
        line,
        eventType,
        field: `${eventType}.content`,
        value: fieldValue(record, 'content') ?? fieldValue(record, 'message'),
      });
      continue;
    }

    if (eventType === 'tool_call') {
      addFragment(out, {
        line,
        eventType,
        field: 'tool_call.command',
        value: fieldValue(record, 'command'),
      });
      addFragment(out, {
        line,
        eventType,
        field: 'tool_call.patch',
        value: fieldValue(record, 'patch'),
      });
      continue;
    }

    if (eventType === 'tool_result') {
      addFragment(out, {
        line,
        eventType,
        field: 'tool_result.notes',
        value: fieldValue(record, 'notes'),
      });
    }
  }

  return out;
}

function aliasPattern(alias: string): RegExp {
  const escaped = alias
    .trim()
    .split(/\s+/u)
    .map((part) => part.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&'))
    .join('\\s+');
  return new RegExp(`(^|[^A-Za-z0-9_-])(${escaped})(?![A-Za-z0-9_-])`, 'iu');
}

function findSkillEvidence(
  skill: SkillCatalogEntry,
  fragments: readonly OperationalFragment[],
): SkillEvidence[] {
  const evidence: SkillEvidence[] = [];

  for (const fragment of fragments) {
    for (const alias of skill.aliases) {
      if (!aliasPattern(alias).test(fragment.text)) {
        continue;
      }

      evidence.push({
        line: fragment.line,
        event_type: fragment.eventType,
        field: fragment.field,
        excerpt: compactExcerpt(fragment.text),
        matched_alias: alias,
      });
      break;
    }
  }

  return evidence;
}

function logMetricFragments(logMetrics: LogMetrics): OperationalFragment[] {
  return Object.keys(logMetrics.skillsReferenced).map((skill) => ({
    line: 0,
    eventType: 'stage_log',
    field: 'stageLogs.metrics.skillsReferenced',
    text: skill,
  }));
}

function safeSkillDirectoryName(value: string): boolean {
  return /^[A-Za-z0-9._-]+$/u.test(value) && value !== '.' && value !== '..';
}

function readLocalSkillSummary(skillFile: string): SkillSummary | null {
  if (!fs.existsSync(skillFile)) {
    return null;
  }

  const content = fs.readFileSync(skillFile, 'utf8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/u);
  const frontmatter = frontmatterMatch ? parseLooseYaml(frontmatterMatch[1] ?? '') : {};

  return {
    skillFile,
    name:
      typeof frontmatter.name === 'string'
        ? frontmatter.name
        : path.basename(path.dirname(skillFile)),
    description: typeof frontmatter.description === 'string' ? frontmatter.description : '',
  };
}

function candidateLocalSkillFiles(skillsDir: string, skill: SkillCatalogEntry): string[] {
  return normalizeAliases([skill.name, skill.path_name ?? '', ...skill.aliases])
    .filter(safeSkillDirectoryName)
    .map((alias) => path.join(skillsDir, alias, 'SKILL.md'));
}

function enrichReferencedSkill(skill: SkillCatalogEntry, skillsDir?: string): SkillCatalogEntry {
  if (!skillsDir || !fs.existsSync(skillsDir)) {
    return skill;
  }

  const localSkill = candidateLocalSkillFiles(skillsDir, skill)
    .map((skillFile) => readLocalSkillSummary(skillFile))
    .find((candidate): candidate is SkillSummary => candidate !== null);

  if (!localSkill) {
    return skill;
  }

  const pathName = skill.path_name ?? pathNameFromSkillFile(localSkill.skillFile);
  return {
    ...skill,
    name: pathName ?? skill.name,
    path_name: pathName,
    aliases: normalizeAliases([...skill.aliases, localSkill.name, pathName ?? '']),
    skillFile: localSkill.skillFile,
    description: skill.description || localSkill.description,
  };
}

export function extractSkillTraceSummary({
  sessionSummary,
  skillsDir,
  logMetrics,
}: SkillScopeInputs): SkillTraceSummary {
  const available = extractAvailableSkillCatalog(sessionSummary);
  if (available.length === 0) {
    return { available: [], referenced: [], unreferenced_count: 0 };
  }

  const fragments = [...operationalFragments(sessionSummary), ...logMetricFragments(logMetrics)];
  const referencedEntries = available
    .map((skill) => ({
      skill,
      evidence: findSkillEvidence(skill, fragments),
    }))
    .filter((entry) => entry.evidence.length > 0);
  const referencedNames = new Set(referencedEntries.map(({ skill }) => skill.name));
  const referenced = referencedEntries.map(({ skill, evidence }) => ({
    ...enrichReferencedSkill(skill, skillsDir),
    evidence,
  }));

  return {
    available,
    referenced,
    unreferenced_count: available.filter((skill) => !referencedNames.has(skill.name)).length,
  };
}
