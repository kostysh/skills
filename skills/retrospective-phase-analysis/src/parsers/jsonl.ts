import { readText } from '../core/shared.ts';

export interface JsonlParseResult {
  events: unknown[];
  errors: Array<{ line: number; message: string }>;
}

export function parseJsonl(filePath: string): JsonlParseResult {
  const content = readText(filePath);
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const events: unknown[] = [];
  const errors: Array<{ line: number; message: string }> = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) {
      continue;
    }

    try {
      events.push(JSON.parse(line));
    } catch (error) {
      errors.push({
        line: index + 1,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { events, errors };
}
