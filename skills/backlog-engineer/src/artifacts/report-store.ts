import type { BacklogRelativePosixPath, CliPathInput, NormalizedFsPath } from '../schemas/index.ts';
import type { AbsoluteFsPath } from '../runtime/shared.ts';
import type { BacklogRootPath } from '../runtime/shared.ts';
import type { ArtifactsModuleDependencies } from './shared.ts';
import {
  getReportGraphPath,
  getReportMarkdownPath,
  resolveTemplateOutputPath,
  toBacklogRelativePosixPath,
} from './backlog-layout.ts';
import { writeTextAtomically } from './store-helpers.ts';

export async function writeReportFiles(
  dependencies: ArtifactsModuleDependencies,
  payload: { root: BacklogRootPath; markdown: string; mermaid: string },
): Promise<{
  reportPath: BacklogRelativePosixPath;
  graphPath: BacklogRelativePosixPath;
}> {
  const reportPath = getReportMarkdownPath(dependencies.path, payload.root);
  const graphPath = getReportGraphPath(dependencies.path, payload.root);

  await writeTextAtomically({
    fs: dependencies.fs,
    path: dependencies.path,
    hash: dependencies.hash,
    errors: dependencies.errors,
    root: payload.root,
    targetPath: reportPath,
    content: payload.markdown,
    writeErrorCode: 'BE_REPORT_WRITE_FAILED',
  });
  await writeTextAtomically({
    fs: dependencies.fs,
    path: dependencies.path,
    hash: dependencies.hash,
    errors: dependencies.errors,
    root: payload.root,
    targetPath: graphPath,
    content: payload.mermaid,
    writeErrorCode: 'BE_REPORT_WRITE_FAILED',
  });

  return {
    reportPath: toBacklogRelativePosixPath(dependencies.path, payload.root, reportPath),
    graphPath: toBacklogRelativePosixPath(dependencies.path, payload.root, graphPath),
  };
}

export async function writeTemplateOutput(
  dependencies: ArtifactsModuleDependencies,
  payload: {
    cwd: AbsoluteFsPath;
    out: CliPathInput;
    defaultBasename: string;
    content: string;
  },
): Promise<NormalizedFsPath> {
  const targetPath = await resolveTemplateOutputPath({
    fs: dependencies.fs,
    path: dependencies.path,
    errors: dependencies.errors,
    cwd: payload.cwd,
    out: payload.out,
    defaultBasename: payload.defaultBasename,
  });

  await writeTextAtomically({
    fs: dependencies.fs,
    path: dependencies.path,
    hash: dependencies.hash,
    errors: dependencies.errors,
    targetPath,
    content: payload.content,
    writeErrorCode: 'BE_TEMPLATE_OUTPUT_INVALID',
  });

  return targetPath;
}
