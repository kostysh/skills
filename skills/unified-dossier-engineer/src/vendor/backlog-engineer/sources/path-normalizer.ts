import { fromZodError } from '../errors/index.ts';
import type { BacklogRootPath } from '../runtime/shared.ts';
import type { NormalizedFsPath, SourceLabel, SourceRelativePosixPath } from '../schemas/index.ts';
import type { PathPort } from '../runtime/ports.ts';
import { SourceRelativePosixPathSchema as SourceRelativePosixPathValueSchema } from '../schemas/index.ts';

function toPosixRelativePath(relativePath: string): SourceRelativePosixPath {
  return relativePath.replaceAll('\\', '/');
}

function createSourceLabel(relativePath: SourceRelativePosixPath): SourceLabel {
  return relativePath;
}

export function normalizeSourcePath(payload: {
  path: PathPort;
  backlogRoot: BacklogRootPath;
  inputPath: NormalizedFsPath;
}): {
  absolute_path: NormalizedFsPath;
  relative_path: SourceRelativePosixPath;
  source_label: SourceLabel;
} {
  const absolutePath = payload.path.resolve(payload.inputPath);
  const relativePath = toPosixRelativePath(
    payload.path.relative(payload.backlogRoot, absolutePath),
  );
  const parsedRelativePath = SourceRelativePosixPathValueSchema.safeParse(relativePath);
  if (!parsedRelativePath.success) {
    throw fromZodError(parsedRelativePath.error, {
      path: absolutePath,
      relative_path: relativePath,
    });
  }

  return {
    absolute_path: absolutePath,
    relative_path: parsedRelativePath.data,
    source_label: createSourceLabel(parsedRelativePath.data),
  };
}

export function sortSourceLabels<T extends { source_label: string; source_id?: string }>(
  values: readonly T[],
): T[] {
  return [...values].sort((left, right) => {
    const labelCompare = left.source_label.localeCompare(right.source_label);
    if (labelCompare !== 0) {
      return labelCompare;
    }

    return (left.source_id ?? '').localeCompare(right.source_id ?? '');
  });
}
