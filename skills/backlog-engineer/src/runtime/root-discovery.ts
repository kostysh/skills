import type { FileSystemPort, PathPort } from './ports.ts';
import type { BacklogRootPath, CommandName } from './shared.ts';

export const ROOT_MARKER_BASENAME = '.backlog.json';

function rootMarkerPath(pathPort: PathPort, root: BacklogRootPath): string {
  return pathPort.join(root, ROOT_MARKER_BASENAME);
}

export async function findBacklogRoot(
  fsPort: FileSystemPort,
  pathPort: PathPort,
  startPath: string,
): Promise<BacklogRootPath | undefined> {
  let cursor = pathPort.resolve(startPath);

  while (true) {
    const markerPath = rootMarkerPath(pathPort, cursor);
    if (await fsPort.exists(markerPath)) {
      const markerStat = await fsPort.stat(markerPath);
      if (markerStat.isFile) {
        return cursor;
      }
    }

    const parent = pathPort.dirname(cursor);
    if (parent === cursor) {
      return undefined;
    }

    cursor = parent;
  }
}

export async function resolveCommandBacklogRoot(payload: {
  command: CommandName;
  cwd: string;
  fs: FileSystemPort;
  path: PathPort;
}): Promise<BacklogRootPath | undefined> {
  return findBacklogRoot(payload.fs, payload.path, payload.cwd);
}
