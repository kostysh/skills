import type { BacklogRootPath } from '../runtime/shared.ts';
import type { ArtifactsModuleDependencies } from './shared.ts';
import { getGitignorePath } from './backlog-layout.ts';
import { writeTextAtomically } from './store-helpers.ts';

const MANAGED_SECTION_START = '# backlog-engineer managed start';
const MANAGED_SECTION_END = '# backlog-engineer managed end';
const MANAGED_SECTION_LINES = ['/.backlog/mutation.lock'];

function normalizeTrailingNewline(content: string): string {
  return content.endsWith('\n') ? content : `${content}\n`;
}

function renderManagedSection(): string {
  return `${MANAGED_SECTION_START}\n${MANAGED_SECTION_LINES.join('\n')}\n${MANAGED_SECTION_END}\n`;
}

function stripManagedSections(content: string): { content: string; removedBlockCount: number } {
  const normalized = normalizeTrailingNewline(content);
  let result = '';
  let cursor = 0;
  let removedBlockCount = 0;

  while (cursor < normalized.length) {
    const startIndex = normalized.indexOf(MANAGED_SECTION_START, cursor);
    if (startIndex === -1) {
      result += normalized.slice(cursor);
      break;
    }

    const endIndex = normalized.indexOf(
      MANAGED_SECTION_END,
      startIndex + MANAGED_SECTION_START.length,
    );
    if (endIndex === -1) {
      result += normalized.slice(cursor);
      break;
    }

    result += normalized.slice(cursor, startIndex);
    cursor = endIndex + MANAGED_SECTION_END.length;
    if (normalized.charAt(cursor) === '\n') {
      cursor += 1;
    }
    removedBlockCount += 1;
  }

  return {
    content: normalizeTrailingNewline(result),
    removedBlockCount,
  };
}

export function renderManagedGitignoreContent(content: string): string {
  const managedSection = renderManagedSection();
  const trimmed = stripManagedSections(content).content.trimEnd();
  return [...(trimmed.length > 0 ? [trimmed] : []), managedSection.trimEnd(), ''].join('\n');
}

export function stripManagedGitignoreSection(content: string): {
  content: string;
  hadManagedSection: boolean;
} {
  const stripped = stripManagedSections(content);
  return {
    content: stripped.content.trim().length > 0 ? `${stripped.content.trimEnd()}\n` : '',
    hadManagedSection: stripped.removedBlockCount > 0,
  };
}

export async function writeManagedGitignore(
  dependencies: ArtifactsModuleDependencies,
  payload: {
    root: BacklogRootPath;
    existingContent?: string;
  },
): Promise<void> {
  const gitignorePath = getGitignorePath(dependencies.path, payload.root);
  const content = renderManagedGitignoreContent(payload.existingContent ?? '');
  await writeTextAtomically({
    fs: dependencies.fs,
    path: dependencies.path,
    hash: dependencies.hash,
    errors: dependencies.errors,
    root: payload.root,
    targetPath: gitignorePath,
    content,
    writeErrorCode: 'BE_INTERNAL_STATE_CORRUPT',
  });
}
