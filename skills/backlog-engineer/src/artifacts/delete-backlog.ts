import type { BacklogRootPath } from '../runtime/shared.ts';
import type { OpenedDirectoryPort } from '../runtime/ports.ts';
import type { ArtifactsModuleDependencies } from './shared.ts';
import {
  AGENTS_BASENAME,
  BACKLOG_INTERNAL_DIRNAME,
  GITIGNORE_BASENAME,
  PACKETS_DIRNAME,
  PATCHES_DIRNAME,
  REPORTS_DIRNAME,
  ROOT_MARKER_BASENAME,
} from './backlog-layout.ts';
import { getManagedBacklogPaths } from './backlog-layout.ts';
import {
  writeTextAtomically,
  ensureManagedDirectoryPathSafe,
  ensureManagedFilePathSafe,
  ensureNoSymlinkAncestors,
  openManagedDirectory,
} from './store-helpers.ts';
import { stripManagedGitignoreSection } from './gitignore-store.ts';

export async function deleteBacklog(
  dependencies: ArtifactsModuleDependencies,
  root: BacklogRootPath,
): Promise<void> {
  if (!(await dependencies.fs.exists(root))) {
    return;
  }

  const rootStat = await dependencies.fs.lstat(root);
  if (!rootStat.isDirectory || rootStat.isSymbolicLink) {
    throw dependencies.errors.create('BE_INTERNAL_STATE_CORRUPT', undefined, {
      details: {
        path: root,
      },
    });
  }
  const rootDirectory = await openManagedDirectory({
    fs: dependencies.fs,
    path: dependencies.path,
    errors: dependencies.errors,
    root,
    directoryPath: root,
    errorCode: 'BE_INTERNAL_STATE_CORRUPT',
  });
  let rootParentDirectory: OpenedDirectoryPort | undefined;

  try {
    const remainingEntries = await dependencies.fs.readdir(rootDirectory.resolveEntry('.'));
    const allowedEntries = new Set([
      ROOT_MARKER_BASENAME,
      GITIGNORE_BASENAME,
      AGENTS_BASENAME,
      BACKLOG_INTERNAL_DIRNAME,
      PACKETS_DIRNAME,
      PATCHES_DIRNAME,
      REPORTS_DIRNAME,
    ]);

    const unexpectedEntries = remainingEntries.filter((entry) => !allowedEntries.has(entry));
    if (unexpectedEntries.length > 0) {
      throw dependencies.errors.create('BE_INTERNAL_STATE_CORRUPT', undefined, {
        details: {
          path: root,
          unexpected_entries: unexpectedEntries,
        },
      });
    }

    const managedPaths = getManagedBacklogPaths(dependencies.path, root);
    await ensureManagedDirectoryPathSafe({
      fs: dependencies.fs,
      path: dependencies.path,
      errors: dependencies.errors,
      root,
      directoryPath: managedPaths.internalDir,
      errorCode: 'BE_INTERNAL_STATE_CORRUPT',
    });
    await ensureManagedDirectoryPathSafe({
      fs: dependencies.fs,
      path: dependencies.path,
      errors: dependencies.errors,
      root,
      directoryPath: managedPaths.packetsDir,
      errorCode: 'BE_INTERNAL_STATE_CORRUPT',
    });
    await ensureManagedDirectoryPathSafe({
      fs: dependencies.fs,
      path: dependencies.path,
      errors: dependencies.errors,
      root,
      directoryPath: managedPaths.patchesDir,
      errorCode: 'BE_INTERNAL_STATE_CORRUPT',
    });
    await ensureManagedDirectoryPathSafe({
      fs: dependencies.fs,
      path: dependencies.path,
      errors: dependencies.errors,
      root,
      directoryPath: managedPaths.reportsDir,
      errorCode: 'BE_INTERNAL_STATE_CORRUPT',
    });
    await ensureManagedFilePathSafe({
      fs: dependencies.fs,
      path: dependencies.path,
      errors: dependencies.errors,
      root,
      filePath: managedPaths.rootMarkerPath,
      errorCode: 'BE_INTERNAL_STATE_CORRUPT',
    });
    await ensureManagedFilePathSafe({
      fs: dependencies.fs,
      path: dependencies.path,
      errors: dependencies.errors,
      root,
      filePath: managedPaths.gitignorePath,
      errorCode: 'BE_INTERNAL_STATE_CORRUPT',
    });
    await ensureManagedFilePathSafe({
      fs: dependencies.fs,
      path: dependencies.path,
      errors: dependencies.errors,
      root,
      filePath: managedPaths.agentsPath,
      errorCode: 'BE_INTERNAL_STATE_CORRUPT',
    });
    await ensureNoSymlinkAncestors({
      fs: dependencies.fs,
      path: dependencies.path,
      errors: dependencies.errors,
      targetPath: dependencies.path.dirname(root),
      errorCode: 'BE_INTERNAL_STATE_CORRUPT',
    });
    rootParentDirectory = await dependencies.fs.openDirectory(dependencies.path.dirname(root));

    const stableRootMarkerPath = rootDirectory.resolveEntry(ROOT_MARKER_BASENAME);
    const stableGitignorePath = rootDirectory.resolveEntry(GITIGNORE_BASENAME);
    const stableAgentsPath = rootDirectory.resolveEntry(AGENTS_BASENAME);
    const stableInternalDir = rootDirectory.resolveEntry(BACKLOG_INTERNAL_DIRNAME);
    const stablePacketsDir = rootDirectory.resolveEntry(PACKETS_DIRNAME);
    const stablePatchesDir = rootDirectory.resolveEntry(PATCHES_DIRNAME);
    const stableReportsDir = rootDirectory.resolveEntry(REPORTS_DIRNAME);

    if (await dependencies.fs.exists(stableGitignorePath)) {
      const gitignoreContent = await dependencies.fs.readTextNoFollow(stableGitignorePath);
      const strippedGitignore = stripManagedGitignoreSection(gitignoreContent);
      if (strippedGitignore.content.length === 0) {
        await dependencies.fs.rm(stableGitignorePath, { force: true });
      } else {
        await writeTextAtomically({
          fs: dependencies.fs,
          path: dependencies.path,
          hash: dependencies.hash,
          errors: dependencies.errors,
          root,
          targetPath: managedPaths.gitignorePath,
          content: strippedGitignore.content,
          writeErrorCode: 'BE_INTERNAL_STATE_CORRUPT',
        });
      }
    }

    await dependencies.fs.rm(stableAgentsPath, { force: true });
    await dependencies.fs.rm(stableInternalDir, { recursive: true, force: true });
    await dependencies.fs.rm(stablePacketsDir, { recursive: true, force: true });
    await dependencies.fs.rm(stablePatchesDir, { recursive: true, force: true });
    await dependencies.fs.rm(stableReportsDir, { recursive: true, force: true });
    await dependencies.fs.rm(stableRootMarkerPath, { force: true });

    const leftoverEntries = await dependencies.fs.readdir(rootDirectory.resolveEntry('.'));
    if (leftoverEntries.length === 0) {
      await dependencies.fs.rm(rootParentDirectory.resolveEntry(dependencies.path.basename(root)), {
        recursive: true,
        force: true,
      });
    }
  } finally {
    await rootParentDirectory?.close().catch(() => undefined);
    await rootDirectory.close().catch(() => undefined);
  }
}
