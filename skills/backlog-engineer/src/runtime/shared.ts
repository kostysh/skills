export const COMMAND_NAMES = [
  'init',
  'register-source',
  'list-sources',
  'update-source-path',
  'remove-source',
  'template',
  'packet',
  'patch-item',
  'remove-item',
  'refresh',
  'status',
  'report',
  'items',
  'search',
  'gaps',
  'queue',
  'attention',
  'delete-backlog',
] as const;

export type CommandName = (typeof COMMAND_NAMES)[number];
export type AbsoluteFsPath = string;
export type BacklogRootPath = AbsoluteFsPath;
