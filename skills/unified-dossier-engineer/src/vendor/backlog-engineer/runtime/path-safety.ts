import type { AbsoluteFsPath, BacklogRootPath } from './shared.ts';
import type { PathPort } from './ports.ts';

type RootRelativePath = {
  platformRelativePath: string;
  posixRelativePath: string;
};

function isWindowsDriveRootEscape(relativePath: string): boolean {
  return /^[A-Za-z]:\\/.test(relativePath);
}

function isUncRootEscape(relativePath: string): boolean {
  return relativePath.startsWith('\\\\');
}

export function resolvePathRelativeToRoot(payload: {
  path: PathPort;
  root: BacklogRootPath;
  target: AbsoluteFsPath;
}): RootRelativePath | null {
  const resolvedRoot = payload.path.resolve(payload.root);
  const resolvedTarget = payload.path.resolve(payload.target);
  const platformRelativePath = payload.path.relative(resolvedRoot, resolvedTarget);

  if (platformRelativePath.length === 0) {
    return {
      platformRelativePath,
      posixRelativePath: '',
    };
  }

  if (isWindowsDriveRootEscape(platformRelativePath) || isUncRootEscape(platformRelativePath)) {
    return null;
  }

  const posixRelativePath = platformRelativePath.replaceAll('\\', '/');
  if (posixRelativePath === '..' || posixRelativePath.startsWith('../')) {
    return null;
  }

  return {
    platformRelativePath,
    posixRelativePath,
  };
}

export function isPathInsideRoot(payload: {
  path: PathPort;
  root: BacklogRootPath;
  target: AbsoluteFsPath;
}): boolean {
  return resolvePathRelativeToRoot(payload) !== null;
}
