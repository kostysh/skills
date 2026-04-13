import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { SessionDiscoveryMode } from './types.ts';

export interface SessionTraceResolution {
  session: string | undefined;
  sessionId: string | null;
  discoveryMode: SessionDiscoveryMode;
}

function codexHomeDir(): string {
  return process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
}

function sessionsRootDir(): string {
  return path.join(codexHomeDir(), 'sessions');
}

function findSessionTraceCandidates(sessionId: string, rootDir: string): string[] {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const matches: string[] = [];

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const nextPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(nextPath);
        continue;
      }

      if (
        entry.isFile() &&
        entry.name.endsWith('.jsonl') &&
        (entry.name.includes(sessionId) || nextPath.includes(sessionId))
      ) {
        matches.push(nextPath);
      }
    }
  }

  walk(rootDir);
  return matches.sort();
}

export function resolveSessionTrace(
  session: string | undefined,
  sessionId: string | undefined,
): SessionTraceResolution {
  if (session) {
    return {
      session,
      sessionId: sessionId ?? null,
      discoveryMode: 'explicit_session_file',
    };
  }

  if (!sessionId) {
    return {
      session: undefined,
      sessionId: null,
      discoveryMode: 'missing',
    };
  }

  const sessionsRoot = sessionsRootDir();
  const matches = findSessionTraceCandidates(sessionId, sessionsRoot);
  if (matches.length === 0) {
    throw new Error(
      `Could not resolve session trace for session_id ${sessionId} under ${sessionsRoot}.`,
    );
  }

  if (matches.length > 1) {
    throw new Error(
      `Multiple session trace candidates were found for session_id ${sessionId}: ${matches.join(', ')}`,
    );
  }

  return {
    session: matches[0],
    sessionId,
    discoveryMode: 'explicit_session_id',
  };
}

export function resolveStandardEvidenceDir(
  projectRoot: string | null,
  relativeDir: string,
): string | undefined {
  if (!projectRoot) {
    return undefined;
  }

  const absoluteDir = path.join(projectRoot, relativeDir);
  return fs.existsSync(absoluteDir) ? absoluteDir : undefined;
}
