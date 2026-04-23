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
import type { PhaseBoundary } from './types.ts';

interface SessionBoundaryOptions {
  artifactUntilTs?: string;
  untilLine?: number;
  untilTs?: string;
}

function createFullTraceBoundary(): PhaseBoundary {
  return {
    mode: 'full_trace',
    until_line: null,
    until_ts: null,
    reason: 'No explicit phase boundary was provided; the full trace was analyzed.',
    excluded_events_count: 0,
  };
}

function applyBoundary(
  events: unknown[],
  eventLines: number[],
  parseErrors: Array<{ line: number; message: string }>,
  sourceLineCount: number,
  options: SessionBoundaryOptions,
): {
  events: unknown[];
  eventLines: number[];
  parseErrors: Array<{ line: number; message: string }>;
  phaseBoundary: PhaseBoundary;
} {
  if (options.untilLine !== undefined) {
    const untilLine = options.untilLine;
    if (!Number.isInteger(untilLine) || untilLine < 1) {
      throw new Error('--until-line must be a positive integer');
    }
    if (untilLine > sourceLineCount) {
      throw new Error(
        `--until-line ${untilLine} exceeds the session trace length of ${sourceLineCount} line(s)`,
      );
    }

    const boundedEvents = events.filter((_, index) => (eventLines[index] ?? 0) <= untilLine);
    const boundedEventLines = eventLines.filter((line) => line <= untilLine);
    return {
      events: boundedEvents,
      eventLines: boundedEventLines,
      parseErrors: parseErrors.filter((error) => error.line <= untilLine),
      phaseBoundary: {
        mode: 'until_line',
        until_line: untilLine,
        until_ts: null,
        reason: 'Operator supplied --until-line to exclude later events from the analyzed phase.',
        excluded_events_count: events.length - boundedEvents.length,
      },
    };
  }

  if (options.untilTs !== undefined) {
    const boundaryDate = tryParseDate(options.untilTs);
    if (!boundaryDate) {
      throw new Error('--until-ts must be a valid ISO-like timestamp');
    }

    const boundedEvents: unknown[] = [];
    const boundedEventLines: number[] = [];
    let boundaryReached = false;
    for (const [index, event] of events.entries()) {
      if (boundaryReached) {
        continue;
      }

      const timestamp = extractTimestamp(event);
      const eventDate = timestamp ? tryParseDate(timestamp) : null;
      if (eventDate && eventDate.valueOf() > boundaryDate.valueOf()) {
        boundaryReached = true;
        continue;
      }

      boundedEvents.push(event);
      boundedEventLines.push(eventLines[index] ?? 0);
    }

    return {
      events: boundedEvents,
      eventLines: boundedEventLines,
      parseErrors,
      phaseBoundary: {
        mode: 'until_ts',
        until_line: null,
        until_ts: boundaryDate.toISOString(),
        reason: 'Operator supplied --until-ts to exclude later events from the analyzed phase.',
        excluded_events_count: events.length - boundedEvents.length,
      },
    };
  }

  if (options.artifactUntilTs !== undefined) {
    const boundaryDate = tryParseDate(options.artifactUntilTs);
    if (!boundaryDate) {
      throw new Error('artifact-derived phase boundary must be a valid ISO-like timestamp');
    }

    const boundedEvents: unknown[] = [];
    const boundedEventLines: number[] = [];
    let boundaryReached = false;
    for (const [index, event] of events.entries()) {
      if (boundaryReached) {
        continue;
      }

      const timestamp = extractTimestamp(event);
      const eventDate = timestamp ? tryParseDate(timestamp) : null;
      if (eventDate && eventDate.valueOf() > boundaryDate.valueOf()) {
        boundaryReached = true;
        continue;
      }

      boundedEvents.push(event);
      boundedEventLines.push(eventLines[index] ?? 0);
    }

    return {
      events: boundedEvents,
      eventLines: boundedEventLines,
      parseErrors,
      phaseBoundary: {
        mode: 'artifact_derived',
        until_line: null,
        until_ts: boundaryDate.toISOString(),
        reason:
          'Derived from linked stage/closure artifact timestamps to exclude later same-session work.',
        excluded_events_count: events.length - boundedEvents.length,
      },
    };
  }

  return {
    events,
    eventLines,
    parseErrors,
    phaseBoundary: createFullTraceBoundary(),
  };
}

export function summarizeSession(
  filePath?: string,
  options: SessionBoundaryOptions = {},
): SessionSummary {
  if (!filePath || !fs.existsSync(filePath)) {
    return {
      filePath,
      sessionId: null,
      projectRoot: null,
      exists: false,
      phaseBoundary: createFullTraceBoundary(),
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
      eventLines: [],
    };
  }

  if (
    [options.untilLine, options.untilTs, options.artifactUntilTs].filter(
      (value) => value !== undefined,
    ).length > 1
  ) {
    throw new Error('Use only one phase boundary source');
  }

  const { events: parsedEvents, eventLines, errors, sourceLineCount } = parseJsonl(filePath);
  const {
    events,
    eventLines: boundedEventLines,
    parseErrors,
    phaseBoundary,
  } = applyBoundary(parsedEvents, eventLines, errors, sourceLineCount, options);
  const toolCounts = new Map<string, number>();
  let sessionId: string | null = null;
  let projectRoot: string | null = null;
  let firstTimestamp: string | null = null;
  let lastTimestamp: string | null = null;
  let abortedTurns = 0;
  let longGaps = 0;
  let previousDate: Date | null = null;

  for (const event of events) {
    if (
      event &&
      typeof event === 'object' &&
      (event as Record<string, unknown>).type === 'session_meta'
    ) {
      const payload = (event as Record<string, unknown>).payload;
      if (payload && typeof payload === 'object') {
        const meta = payload as Record<string, unknown>;
        if (typeof meta.id === 'string' && meta.id.length > 0) {
          sessionId = meta.id;
        }
        if (typeof meta.cwd === 'string' && meta.cwd.length > 0) {
          projectRoot = meta.cwd;
        }
      }
    }

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
    sessionId,
    projectRoot,
    exists: true,
    phaseBoundary,
    eventCount: events.length,
    parseErrors,
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
    eventLines: boundedEventLines,
  };
}
