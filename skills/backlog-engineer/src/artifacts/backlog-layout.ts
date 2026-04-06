import type { AbsoluteFsPath, BacklogRootPath } from '../runtime/shared.ts';
import type { BacklogRelativePosixPath, CliPathInput, NormalizedFsPath } from '../schemas/index.ts';
import type { ErrorModule } from '../errors/index.ts';
import type { FileSystemPort, PathPort } from '../runtime/ports.ts';
import { ensureManagedDirectoryPathSafe, ensureNoSymlinkAncestors } from './store-helpers.ts';

export const ROOT_MARKER_BASENAME = '.backlog.json';
export const BACKLOG_INTERNAL_DIRNAME = '.backlog';
export const PACKETS_DIRNAME = 'packets';
export const PATCHES_DIRNAME = 'patches';
export const REPORTS_DIRNAME = 'reports';
export const AGENTS_BASENAME = 'AGENTS.md';
export const SOURCES_REGISTRY_BASENAME = 'sources.json';
export const APPLIED_REGISTRY_BASENAME = 'applied.json';
export const STATE_BASENAME = 'state.json';
export const REPORT_MARKDOWN_BASENAME = 'backlog-report.md';
export const REPORT_GRAPH_BASENAME = 'backlog-graph.mmd';

type LayoutDirectories = {
  internalDir: AbsoluteFsPath;
  packetsDir: AbsoluteFsPath;
  patchesDir: AbsoluteFsPath;
  reportsDir: AbsoluteFsPath;
};

export type ManagedBacklogPaths = LayoutDirectories & {
  rootMarkerPath: AbsoluteFsPath;
  agentsPath: AbsoluteFsPath;
};

export function getLayoutDirectories(path: PathPort, root: BacklogRootPath): LayoutDirectories {
  return {
    internalDir: path.join(root, BACKLOG_INTERNAL_DIRNAME),
    packetsDir: path.join(root, PACKETS_DIRNAME),
    patchesDir: path.join(root, PATCHES_DIRNAME),
    reportsDir: path.join(root, REPORTS_DIRNAME),
  };
}

export function getManagedBacklogPaths(path: PathPort, root: BacklogRootPath): ManagedBacklogPaths {
  return {
    ...getLayoutDirectories(path, root),
    rootMarkerPath: getRootMarkerPath(path, root),
    agentsPath: getAgentsPath(path, root),
  };
}

export async function createBacklogDirectories(
  fs: FileSystemPort,
  path: PathPort,
  errors: ErrorModule,
  root: BacklogRootPath,
): Promise<void> {
  const { internalDir, packetsDir, patchesDir, reportsDir } = getLayoutDirectories(path, root);

  for (const directoryPath of [root, internalDir, packetsDir, patchesDir, reportsDir]) {
    await ensureManagedDirectoryPathSafe({
      fs,
      path,
      errors,
      root,
      directoryPath,
      errorCode: 'BE_INTERNAL_STATE_CORRUPT',
    });
  }

  await fs.mkdir(root, { recursive: true });
  await fs.mkdir(internalDir, { recursive: true });
  await fs.mkdir(packetsDir, { recursive: true });
  await fs.mkdir(patchesDir, { recursive: true });
  await fs.mkdir(reportsDir, { recursive: true });
}

export function getRootMarkerPath(path: PathPort, root: BacklogRootPath): AbsoluteFsPath {
  return path.join(root, ROOT_MARKER_BASENAME);
}

export function getAgentsPath(path: PathPort, root: BacklogRootPath): AbsoluteFsPath {
  return path.join(root, AGENTS_BASENAME);
}

export function getSourceRegistryPath(path: PathPort, root: BacklogRootPath): AbsoluteFsPath {
  return path.join(root, BACKLOG_INTERNAL_DIRNAME, SOURCES_REGISTRY_BASENAME);
}

export function getAppliedRegistryPath(path: PathPort, root: BacklogRootPath): AbsoluteFsPath {
  return path.join(root, BACKLOG_INTERNAL_DIRNAME, APPLIED_REGISTRY_BASENAME);
}

export function getStatePath(path: PathPort, root: BacklogRootPath): AbsoluteFsPath {
  return path.join(root, BACKLOG_INTERNAL_DIRNAME, STATE_BASENAME);
}

export function getReportMarkdownPath(path: PathPort, root: BacklogRootPath): AbsoluteFsPath {
  return path.join(root, REPORTS_DIRNAME, REPORT_MARKDOWN_BASENAME);
}

export function getReportGraphPath(path: PathPort, root: BacklogRootPath): AbsoluteFsPath {
  return path.join(root, REPORTS_DIRNAME, REPORT_GRAPH_BASENAME);
}

export function toBacklogRelativePosixPath(
  path: PathPort,
  root: BacklogRootPath,
  target: AbsoluteFsPath,
): BacklogRelativePosixPath {
  return path.relative(root, target).replaceAll('\\', '/');
}

export function createCanonicalImportFilename(
  sha256: string,
  canonicalBasename: string,
  errors: ErrorModule,
): string {
  const trimmedBasename = canonicalBasename.trim();
  if (
    trimmedBasename.length === 0 ||
    trimmedBasename.includes('/') ||
    trimmedBasename.includes('\\') ||
    trimmedBasename === '.' ||
    trimmedBasename === '..'
  ) {
    throw errors.create('BE_CANONICAL_WRITE_FAILED', undefined, {
      details: {
        canonical_basename: canonicalBasename,
      },
      hint: 'Canonical import basenames must be plain filenames without path separators.',
    });
  }

  return `${sha256.slice(0, 12)}--${trimmedBasename}`;
}

export async function resolveTemplateOutputPath(payload: {
  fs: FileSystemPort;
  path: PathPort;
  errors: ErrorModule;
  cwd: AbsoluteFsPath;
  out: CliPathInput;
  defaultBasename: string;
  collisionBasename?: string;
}): Promise<NormalizedFsPath> {
  const { fs, path, errors, cwd, out, defaultBasename, collisionBasename } = payload;
  const absoluteTarget = path.resolve(cwd, out);
  const explicitDirectory = out.endsWith('/') || out.endsWith('\\');

  async function resolveDirectoryTarget(directoryPath: AbsoluteFsPath): Promise<NormalizedFsPath> {
    const primaryTarget = path.join(directoryPath, defaultBasename);
    if (!(await fs.exists(primaryTarget))) {
      return primaryTarget;
    }

    if (collisionBasename) {
      return path.join(directoryPath, collisionBasename);
    }

    return primaryTarget;
  }

  await ensureNoSymlinkAncestors({
    fs,
    path,
    errors,
    targetPath: absoluteTarget,
    errorCode: 'BE_TEMPLATE_OUTPUT_INVALID',
  });

  if (await fs.exists(absoluteTarget)) {
    const stat = await fs.lstat(absoluteTarget);
    if (stat.isSymbolicLink) {
      throw errors.create('BE_TEMPLATE_OUTPUT_INVALID', undefined, {
        details: {
          out,
        },
      });
    }
    if (stat.isDirectory) {
      return resolveDirectoryTarget(absoluteTarget);
    }

    if (stat.isFile) {
      if (explicitDirectory) {
        throw errors.create('BE_TEMPLATE_OUTPUT_INVALID', undefined, {
          details: {
            out,
          },
          hint: 'A trailing slash requires an existing directory or a creatable directory path.',
        });
      }
      return absoluteTarget;
    }
  }

  if (explicitDirectory) {
    try {
      await fs.mkdir(absoluteTarget, { recursive: true });
    } catch (error) {
      throw errors.create('BE_TEMPLATE_OUTPUT_INVALID', undefined, {
        details: {
          out,
        },
        cause: error,
      });
    }
    return resolveDirectoryTarget(absoluteTarget);
  }

  const basename = path.basename(absoluteTarget);
  if (basename.trim().length === 0) {
    throw errors.create('BE_TEMPLATE_OUTPUT_INVALID', undefined, {
      details: {
        out,
      },
    });
  }

  return absoluteTarget;
}
