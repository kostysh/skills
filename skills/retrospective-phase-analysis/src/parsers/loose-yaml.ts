import type { LooseRecord } from '../core/types.ts';

type ListContainer = LooseRecord & { __list__?: unknown[] };

export function parseScalar(value: string): unknown {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  if (value === 'null') {
    return null;
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export function parseLooseYaml(source: string): LooseRecord {
  const result: ListContainer = {};
  const stack: Array<{ indent: number; target: ListContainer }> = [{ indent: -1, target: result }];
  const lines = source.split(/\r?\n/);

  for (const rawLine of lines) {
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) {
      continue;
    }

    const indent = rawLine.match(/^\s*/)?.[0].length ?? 0;
    const line = rawLine.trim();

    while (stack.length > 1) {
      const current = stack[stack.length - 1];
      if (!current || indent > current.indent) {
        break;
      }
      stack.pop();
    }

    const current = stack[stack.length - 1]?.target;
    if (!current) {
      continue;
    }

    if (line.startsWith('- ')) {
      current.__list__ ??= [];
      current.__list__.push(parseScalar(line.slice(2).trim()));
      continue;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      continue;
    }

    const key = line.slice(0, colonIndex).trim();
    const rawValue = line.slice(colonIndex + 1).trim();

    if (!rawValue) {
      const child: ListContainer = {};
      current[key] = child;
      stack.push({ indent, target: child });
      continue;
    }

    current[key] = parseScalar(rawValue);
  }

  function normalizeLists(input: unknown): unknown {
    if (Array.isArray(input)) {
      return input.map(normalizeLists);
    }

    if (input && typeof input === 'object') {
      const record = input as ListContainer;
      if (Array.isArray(record.__list__)) {
        return record.__list__.map(normalizeLists);
      }

      const out: LooseRecord = {};
      for (const [key, value] of Object.entries(record)) {
        if (key === '__list__') {
          continue;
        }
        out[key] = normalizeLists(value);
      }
      return out;
    }

    return input;
  }

  return normalizeLists(result) as LooseRecord;
}
