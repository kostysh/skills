import fs from 'node:fs';
import path from 'node:path';

export function readText(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

export function listFilesRecursive(targetDir: string): string[] {
  const out: string[] = [];

  function walk(current: string): void {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const nextPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(nextPath);
      } else {
        out.push(nextPath);
      }
    }
  }

  walk(targetDir);
  return out;
}

export function safeMkdirForFile(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function isIsoLike(value: unknown): value is string {
  return typeof value === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
}

export function tryParseDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value;
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

export function diffMinutes(startValue: unknown, endValue: unknown): number | null {
  const start = tryParseDate(startValue);
  const end = tryParseDate(endValue);
  if (!start || !end) {
    return null;
  }

  return Math.round(((end.valueOf() - start.valueOf()) / 60000) * 100) / 100;
}

export function coalesce<T>(...values: T[]): T | undefined {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

export function getDeepValues(
  input: unknown,
  predicate: (value: unknown, key?: string) => boolean,
  depth = 0,
): unknown[] {
  if (depth > 8 || input === null || input === undefined) {
    return [];
  }

  const values: unknown[] = [];
  if (predicate(input)) {
    values.push(input);
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      values.push(...getDeepValues(item, predicate, depth + 1));
    }
    return values;
  }

  if (typeof input === 'object') {
    for (const [key, value] of Object.entries(input)) {
      if (predicate(value, key)) {
        values.push(value);
      }
      values.push(...getDeepValues(value, predicate, depth + 1));
    }
  }

  return values;
}

export function extractTimestamp(event: unknown): string | null {
  if (!event || typeof event !== 'object') {
    return null;
  }

  const directKeys = ['ts', 'timestamp', 'created_at', 'time', 'occurred_at', 'start_ts', 'end_ts'];
  for (const key of directKeys) {
    const candidate = (event as Record<string, unknown>)[key];
    const date = tryParseDate(candidate);
    if (date) {
      return date.toISOString();
    }
  }

  const nested = getDeepValues(event, (value) => isIsoLike(value));
  const first = nested.map((value) => tryParseDate(value)).find(Boolean);
  return first ? first.toISOString() : null;
}

export function extractEventType(event: unknown): string {
  if (!event || typeof event !== 'object') {
    return 'unknown';
  }

  const direct = coalesce(
    (event as Record<string, unknown>).type,
    (event as Record<string, unknown>).event_type,
    (event as Record<string, unknown>).kind,
    (event as Record<string, unknown>).event,
    (event as Record<string, unknown>).name,
  );
  return typeof direct === 'string' ? direct : 'unknown';
}

export function extractToolNames(event: unknown): string[] {
  const out = new Set<string>();

  function maybeAdd(value: unknown, key?: string): void {
    if (typeof value !== 'string') {
      return;
    }

    const normalizedKey = String(key ?? '').toLowerCase();
    if (
      normalizedKey.includes('tool') ||
      normalizedKey === 'recipient' ||
      normalizedKey === 'namespace'
    ) {
      out.add(value);
      return;
    }

    if (/^[a-z_]+\.[a-z_]+$/i.test(value) || /^[A-Z][A-Za-z0-9_-]*$/u.test(value)) {
      out.add(value);
    }
  }

  function walk(input: unknown, depth = 0): void {
    if (depth > 6 || input === null || input === undefined) {
      return;
    }

    if (Array.isArray(input)) {
      for (const item of input) {
        walk(item, depth + 1);
      }
      return;
    }

    if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        maybeAdd(value, key);
        walk(value, depth + 1);
      }
    }
  }

  walk(event);
  return Array.from(out).filter((name) => name !== 'user' && name !== 'assistant');
}

export function topEntries(obj: Record<string, number>, limit = 10): Array<[string, number]> {
  return Object.entries(obj)
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit);
}

export function formatList(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '- none';
}

export function stringFromUnknown(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}
