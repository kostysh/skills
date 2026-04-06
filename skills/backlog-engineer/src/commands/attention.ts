import { definePlaceholderCommand } from './placeholder.ts';

export const ATTENTION_COMMAND = definePlaceholderCommand(
  'attention',
  'Return tasks that require review or re-checking.',
);
