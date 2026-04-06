import type { BacklogRootPath } from '../runtime/shared.ts';
import type { ArtifactsModuleDependencies } from './shared.ts';
import {
  AGENTS_BASENAME,
  BACKLOG_INTERNAL_DIRNAME,
  PACKETS_DIRNAME,
  PATCHES_DIRNAME,
  REPORTS_DIRNAME,
  ROOT_MARKER_BASENAME,
} from './backlog-layout.ts';
import { getManagedBacklogPaths } from './backlog-layout.ts';

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

  const remainingEntries = await dependencies.fs.readdir(root);
  const allowedEntries = new Set([
    ROOT_MARKER_BASENAME,
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
  await dependencies.fs.rm(managedPaths.rootMarkerPath, { force: true });
  await dependencies.fs.rm(managedPaths.agentsPath, { force: true });
  await dependencies.fs.rm(managedPaths.internalDir, { recursive: true, force: true });
  await dependencies.fs.rm(managedPaths.packetsDir, { recursive: true, force: true });
  await dependencies.fs.rm(managedPaths.patchesDir, { recursive: true, force: true });
  await dependencies.fs.rm(managedPaths.reportsDir, { recursive: true, force: true });
  await dependencies.fs.rm(root, { recursive: true, force: true });
}
