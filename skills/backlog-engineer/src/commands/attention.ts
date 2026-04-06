import { definePlaceholderCommand } from './placeholder.js';

export const ATTENTION_COMMAND = definePlaceholderCommand(
  'attention',
  'Return tasks that require review or re-checking.',
);
