import { parse as parseYaml } from 'yaml';

function countIndent(line: string): number {
  let index = 0;
  while (index < line.length && line[index] === ' ') {
    index += 1;
  }
  return index;
}

function stripQuotes(value: string): string {
  const text = String(value).trim();
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }
  return text;
}

function splitInlineCollection(inner: string): string[] {
  const parts: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < inner.length; index += 1) {
    const char = inner[index];
    if (quote) {
      current += char;
      if (char === quote && inner[index - 1] !== '\\') {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }

    if (char === ',') {
      parts.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }
  return parts;
}

function parseScalar(raw: string | null | undefined): unknown {
  const text = String(raw ?? '').trim();
  if (text === '') {
    return '';
  }
  if (text === 'null' || text === '~') {
    return null;
  }
  if (text === 'true') {
    return true;
  }
  if (text === 'false') {
    return false;
  }
  if (/^-?\d+$/.test(text)) {
    return Number(text);
  }
  if (/^-?\d+\.\d+$/.test(text)) {
    return Number(text);
  }

  if (text.startsWith('[') && text.endsWith(']')) {
    const inner = text.slice(1, -1).trim();
    if (!inner) {
      return [];
    }
    return splitInlineCollection(inner)
      .map((part) => parseScalar(part))
      .filter((value) => value !== '');
  }

  if (text.startsWith('{') && text.endsWith('}')) {
    const inner = text.slice(1, -1).trim();
    if (!inner) {
      return {};
    }
    const out: Record<string, unknown> = {};
    for (const part of splitInlineCollection(inner)) {
      const separatorIndex = part.indexOf(':');
      if (separatorIndex === -1) {
        continue;
      }
      const key = stripQuotes(part.slice(0, separatorIndex));
      const value = parseScalar(part.slice(separatorIndex + 1));
      out[key] = value;
    }
    return out;
  }

  return stripQuotes(text);
}

function nextSignificantLineIndex(lines: string[], startIndex: number): number {
  for (let index = startIndex; index < lines.length; index += 1) {
    const trimmed = lines[index]?.trim() ?? '';
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    return index;
  }
  return -1;
}

function parseBlock(
  lines: string[],
  startIndex: number,
  indent: number,
  mode: 'array' | 'object',
): { nextIndex: number; value: unknown[] | Record<string, unknown> } {
  if (mode === 'array') {
    const container: unknown[] = [];
    let index = startIndex;

    while (index < lines.length) {
      const rawLine = lines[index] ?? '';
      const trimmed = rawLine.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        index += 1;
        continue;
      }

      const currentIndent = countIndent(rawLine);
      if (currentIndent < indent) {
        break;
      }
      if (currentIndent > indent) {
        throw new Error(`Unexpected indentation near frontmatter line: ${rawLine}`);
      }
      if (!trimmed.startsWith('- ')) {
        break;
      }

      const valuePart = trimmed.slice(2).trim();
      if (valuePart === '') {
        const nextIndex = nextSignificantLineIndex(lines, index + 1);
        if (nextIndex === -1 || countIndent(lines[nextIndex] ?? '') <= currentIndent) {
          container.push('');
          index += 1;
          continue;
        }
        const childIndent = countIndent(lines[nextIndex] ?? '');
        const childMode = (lines[nextIndex] ?? '').trim().startsWith('- ') ? 'array' : 'object';
        const child = parseBlock(lines, nextIndex, childIndent, childMode);
        container.push(child.value);
        index = child.nextIndex;
        continue;
      }

      const mappingMatch = valuePart.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (mappingMatch) {
        const key = mappingMatch[1];
        const item: Record<string, unknown> = {};
        if (key) {
          item[key] = parseScalar(mappingMatch[2]);
        }
        container.push(item);
      } else {
        container.push(parseScalar(valuePart));
      }

      index += 1;
    }

    return { value: container, nextIndex: index };
  }

  const container: Record<string, unknown> = {};
  let index = startIndex;

  while (index < lines.length) {
    const rawLine = lines[index] ?? '';
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      index += 1;
      continue;
    }

    const currentIndent = countIndent(rawLine);
    if (currentIndent < indent) {
      break;
    }
    if (currentIndent > indent) {
      throw new Error(`Unexpected indentation near frontmatter line: ${rawLine}`);
    }

    const keyValueMatch = trimmed.match(/^([A-Za-z0-9_-]+):(?:\s+(.*)|\s*)$/);
    if (!keyValueMatch) {
      throw new Error(`Invalid frontmatter line: ${rawLine}`);
    }

    const [, key, inlineValue = ''] = keyValueMatch;
    if (!key) {
      throw new Error(`Invalid frontmatter line: ${rawLine}`);
    }
    if (inlineValue !== '') {
      container[key] = parseScalar(inlineValue);
      index += 1;
      continue;
    }

    const nextIndex = nextSignificantLineIndex(lines, index + 1);
    if (nextIndex === -1 || countIndent(lines[nextIndex] ?? '') <= currentIndent) {
      container[key] = '';
      index += 1;
      continue;
    }

    const childIndent = countIndent(lines[nextIndex] ?? '');
    const childMode = (lines[nextIndex] ?? '').trim().startsWith('- ') ? 'array' : 'object';
    const child = parseBlock(lines, nextIndex, childIndent, childMode);
    container[key] = child.value;
    index = child.nextIndex;
  }

  return { value: container, nextIndex: index };
}

function parseWithFallback(raw: string): Record<string, unknown> {
  const lines = String(raw)
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/);
  return parseBlock(lines, 0, 0, 'object').value as Record<string, unknown>;
}

export function extractFrontmatter(markdown: string | null | undefined): {
  body: string;
  raw: string;
} | null {
  const source = String(markdown ?? '');
  if (!source.startsWith('---')) {
    return null;
  }
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return null;
  }
  return {
    raw: match[1] ?? '',
    body: source.slice(match[0].length),
  };
}

export function parseFrontmatter(
  markdown: string | null | undefined,
): Record<string, unknown> | null {
  const extracted = extractFrontmatter(markdown);
  if (!extracted) {
    return null;
  }

  try {
    const parsed: unknown = parseYaml(extracted.raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Fall through to the constrained parser.
  }

  return parseWithFallback(extracted.raw);
}

export const parseFrontmatterFromFileText = parseFrontmatter;
