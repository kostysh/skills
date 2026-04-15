import { readText } from '../core/shared.ts';

export interface JsonlParseResult {
  events: unknown[];
  eventLines: number[];
  errors: Array<{ line: number; message: string }>;
  sourceLineCount: number;
}

export function parseJsonl(filePath: string): JsonlParseResult {
  const content = readText(filePath);
  const lines = content.split(/\r?\n/);
  const sourceLineCount =
    lines.at(-1)?.trim() === '' ? Math.max(lines.length - 1, 0) : lines.length;
  const events: unknown[] = [];
  const eventLines: number[] = [];
  const errors: Array<{ line: number; message: string }> = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNumber = index + 1;
    if (!line || line.trim().length === 0) {
      continue;
    }

    try {
      events.push(JSON.parse(line));
      eventLines.push(lineNumber);
    } catch (error) {
      errors.push({
        line: lineNumber,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { events, eventLines, errors, sourceLineCount };
}
