import { execFileSync } from 'node:child_process';
import path from 'node:path';

const normalizeGitPath = (filePath) => String(filePath).split('/').join(path.sep);

const splitLines = (text) =>
  String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

export const runGit = (root, args, { allowFailure = false } = {}) => {
  try {
    return execFileSync('git', ['-C', root, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    if (allowFailure) return null;
    const stderr = error?.stderr?.toString?.().trim?.();
    throw new Error(stderr || error?.message || `git ${args.join(' ')} failed`, {
      cause: error,
    });
  }
};

export const inGitRepo = (root) =>
  Boolean(runGit(root, ['rev-parse', '--show-toplevel'], { allowFailure: true }));

export const getHeadRef = (root) =>
  runGit(root, ['rev-parse', '--verify', 'HEAD'], { allowFailure: true });

export const resolveBaseRef = (root, explicitBase) => {
  if (explicitBase) return explicitBase;

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
};

export const getMergeBase = (root, baseRef) => {
  if (!baseRef) return null;
  return runGit(root, ['merge-base', 'HEAD', baseRef], { allowFailure: true });
};

export const getChangedFiles = (root, baseRef) => {
  const files = new Set();
  const addLines = (text) => {
    for (const file of splitLines(text)) files.add(normalizeGitPath(file));
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
      runGit(root, ['diff', '--name-only', '--diff-filter=ACMR', 'HEAD'], {
        allowFailure: true,
      }),
    );
  }

  addLines(runGit(root, ['diff', '--name-only', '--diff-filter=ACMR'], { allowFailure: true }));
  addLines(
    runGit(root, ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
      allowFailure: true,
    }),
  );
  addLines(
    runGit(root, ['ls-files', '--others', '--exclude-standard'], {
      allowFailure: true,
    }),
  );

  return [...files].sort();
};

export const getChangedFilesBetween = (root, fromRef, toRef = 'HEAD') => {
  const files = runGit(root, ['diff', '--name-only', '--diff-filter=ACMR', fromRef, toRef], {
    allowFailure: true,
  });
  return splitLines(files).map((filePath) => normalizeGitPath(filePath));
};

export const getDiffText = (root, args) =>
  runGit(root, ['diff', '--no-ext-diff', ...args], { allowFailure: true }) || '';

export const getCurrentCommit = (root) =>
  runGit(root, ['rev-parse', '--verify', 'HEAD'], { allowFailure: true });

export const getDirtyPaths = (root) => {
  const status = runGit(root, ['status', '--short'], { allowFailure: true }) || '';
  return splitLines(status)
    .map((line) => line.slice(3).trim())
    .filter(Boolean)
    .map((filePath) => normalizeGitPath(filePath));
};

export const hasDirtyWorktree = (root) => getDirtyPaths(root).length > 0;

export const normalizeRepoPath = (root, filePath) => path.resolve(root, normalizeGitPath(filePath));

export const toRepoRelativePath = (root, filePath) =>
  path.relative(root, filePath).split(path.sep).join('/');
