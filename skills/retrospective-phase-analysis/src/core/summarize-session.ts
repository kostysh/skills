import fs from 'node:fs';

import { parseJsonl } from '../parsers/jsonl.ts';
import type { SessionSummary } from './types.ts';
import {
  diffMinutes,
  extractEventType,
  extractTimestamp,
  extractToolNames,
  tryParseDate,
} from './shared.ts';

export function summarizeSession(filePath?: string): SessionSummary {
  if (!filePath || !fs.existsSync(filePath)) {
    return {
      filePath,
      exists: false,
      eventCount: 0,
      parseErrors: [],
      firstTimestamp: null,
      lastTimestamp: null,
      durationMinutes: null,
      abortedTurns: 0,
      longGaps: 0,
      tools: {},
      sampleEventTypes: [],
      events: [],
    };
  }

  const { events, errors } = parseJsonl(filePath);
  const toolCounts = new Map<string, number>();
  let firstTimestamp: string | null = null;
  let lastTimestamp: string | null = null;
  let abortedTurns = 0;
  let longGaps = 0;
  let previousDate: Date | null = null;

  for (const event of events) {
    const timestamp = extractTimestamp(event);
    if (timestamp) {
      firstTimestamp ??= timestamp;
      lastTimestamp = timestamp;

      const currentDate = tryParseDate(timestamp);
      if (previousDate && currentDate) {
        const gapMinutes = diffMinutes(previousDate.toISOString(), currentDate.toISOString());
        if (gapMinutes !== null && gapMinutes >= 10) {
          longGaps += 1;
        }
      }

      if (currentDate) {
        previousDate = currentDate;
      }
    }

    const eventType = extractEventType(event).toLowerCase();
    const eventText = JSON.stringify(event).toLowerCase();
    if (
      eventType.includes('abort') ||
      eventText.includes('aborted turn') ||
      eventText.includes('"aborted":true')
    ) {
      abortedTurns += 1;
    }

    for (const toolName of extractToolNames(event)) {
      toolCounts.set(toolName, (toolCounts.get(toolName) ?? 0) + 1);
    }
  }

  return {
    filePath,
    exists: true,
    eventCount: events.length,
    parseErrors: errors,
    firstTimestamp,
    lastTimestamp,
    durationMinutes:
      firstTimestamp && lastTimestamp ? diffMinutes(firstTimestamp, lastTimestamp) : null,
    abortedTurns,
    longGaps,
    tools: Object.fromEntries(
      Array.from(toolCounts.entries()).sort((left, right) => right[1] - left[1]),
    ),
    sampleEventTypes: Array.from(new Set(events.map((event) => extractEventType(event)))).slice(
      0,
      25,
    ),
    events,
  };
}
