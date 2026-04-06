import { definePlaceholderCommand } from './placeholder.ts';

export const QUEUE_COMMAND = definePlaceholderCommand(
  'queue',
  'Return ordered chains of tasks that can be taken next.',
);
