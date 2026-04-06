import { definePlaceholderCommand } from './placeholder.ts';

export const REPORT_COMMAND = definePlaceholderCommand(
  'report',
  'Generate a human-readable backlog report on disk.',
);
