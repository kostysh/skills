import type { ErrorModule } from '../errors/index.ts';
import type { NormalizedFsPath } from '../schemas/index.ts';
import type { FileSystemPort, HashPort } from '../runtime/ports.ts';

export async function hashSourceFile(payload: {
  fs: FileSystemPort;
  hash: HashPort;
  errors: ErrorModule;
  filePath: NormalizedFsPath;
}): Promise<string> {
  let content: string;
  try {
    content = await payload.fs.readText(payload.filePath);
  } catch (error) {
    throw payload.errors.create('BE_SOURCE_FILE_MISSING', undefined, {
      details: {
        path: payload.filePath,
      },
      cause: error,
    });
  }

  return payload.hash.sha256Text(content);
}
