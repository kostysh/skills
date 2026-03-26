import { execFileSync } from 'node:child_process';
import path from 'node:path';

function normalizeGitPath(filePath: string): string {
  return String(filePath).split('/').join(path.sep);
}

function splitLines(text: string | null | undefined): string[] {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function runGit(
  root: string,
  args: string[],
  { allowFailure = false }: { allowFailure?: boolean } = {},
): string | null {
  try {
    return execFileSync('git', ['-C', root, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    if (allowFailure) {
      return null;
    }

    const stderr =
      error instanceof Error && 'stderr' in error
        ? String(
            (error as { stderr?: { toString?: () => string } }).stderr?.toString?.() ?? '',
          ).trim()
        : '';
    throw new Error(
      stderr || (error instanceof Error ? error.message : `git ${args.join(' ')} failed`),
      {
        cause: error,
      },
    );
  }
}

export function inGitRepo(root: string): boolean {
  return Boolean(runGit(root, ['rev-parse', '--show-toplevel'], { allowFailure: true }));
}

export function getHeadRef(root: string): string | null {
  return runGit(root, ['rev-parse', '--verify', 'HEAD'], { allowFailure: true });
}

export function resolveBaseRef(root: string, explicitBase: string | null): string | null {
  if (explicitBase) {
    return explicitBase;
  }

  const envBase =
    process.env.GITHUB_BASE_REF ||
    process.env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME ||
    process.env.CHANGE_TARGET;

  if (envBase) {
    for (const candidate of [envBase, `origin/${envBase}`]) {
      if (runGit(root, ['rev-parse', '--verify', candidate], { allowFailure: true })) {
        return candidate;
      }
    }
  }

  const originHead = runGit(
    root,
    ['symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD'],
    {
      allowFailure: true,
    },
  );
  if (originHead && runGit(root, ['rev-parse', '--verify', originHead], { allowFailure: true })) {
    return originHead;
  }

  return null;
}

export function getMergeBase(root: string, baseRef: string | null): string | null {
  if (!baseRef) {
    return null;
  }
  return runGit(root, ['merge-base', 'HEAD', baseRef], { allowFailure: true });
}

export function getChangedFiles(root: string, baseRef: string | null): string[] {
  const files = new Set<string>();
  const addLines = (text: string | null) => {
    for (const file of splitLines(text)) {
      files.add(normalizeGitPath(file));
    }
  };

  const headExists = Boolean(getHeadRef(root));

  if (baseRef) {
    const mergeBase = getMergeBase(root, baseRef);
    if (!mergeBase) {
      throw new Error(`Could not resolve merge base for HEAD and "${baseRef}".`);
    }
    addLines(
      runGit(root, ['diff', '--name-only', '--diff-filter=ACMR', mergeBase, 'HEAD'], {
        allowFailure: true,
      }),
    );
  } else if (headExists) {
    addLines(
      runGit(root, ['diff', '--name-only', '--diff-filter=ACMR', 'HEAD'], { allowFailure: true }),
    );
  }

  addLines(runGit(root, ['diff', '--name-only', '--diff-filter=ACMR'], { allowFailure: true }));
  addLines(
    runGit(root, ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], { allowFailure: true }),
  );
  addLines(runGit(root, ['ls-files', '--others', '--exclude-standard'], { allowFailure: true }));

  return [...files].sort();
}

export function getChangedFilesBetween(root: string, fromRef: string, toRef = 'HEAD'): string[] {
  const files = runGit(root, ['diff', '--name-only', '--diff-filter=ACMR', fromRef, toRef], {
    allowFailure: true,
  });
  return splitLines(files).map((filePath) => normalizeGitPath(filePath));
}

export function getDiffText(root: string, args: string[]): string {
  return runGit(root, ['diff', '--no-ext-diff', ...args], { allowFailure: true }) || '';
}

export function getCurrentCommit(root: string): string | null {
  return runGit(root, ['rev-parse', '--verify', 'HEAD'], { allowFailure: true });
}

export function getDirtyPaths(root: string): string[] {
  const status = runGit(root, ['status', '--short'], { allowFailure: true }) || '';
  return splitLines(status)
    .map((line) => line.slice(3).trim())
    .filter(Boolean)
    .map((filePath) => normalizeGitPath(filePath));
}

export function hasDirtyWorktree(root: string): boolean {
  return getDirtyPaths(root).length > 0;
}

export function normalizeRepoPath(root: string, filePath: string): string {
  return path.resolve(root, normalizeGitPath(filePath));
}

export function toRepoRelativePath(root: string, filePath: string): string {
  return path.relative(root, filePath).split(path.sep).join('/');
}
