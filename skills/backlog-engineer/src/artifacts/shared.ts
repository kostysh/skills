import type { ErrorModule } from '../errors/index.ts';
import type { HashPort, FileSystemPort, PathPort } from '../runtime/ports.ts';
import type { SchemaModule } from '../schemas/index.ts';

export type ArtifactsModuleDependencies = {
  fs: FileSystemPort;
  path: PathPort;
  hash: HashPort;
  schemas: SchemaModule;
  errors: ErrorModule;
};
