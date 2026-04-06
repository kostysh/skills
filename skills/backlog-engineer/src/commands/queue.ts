import { definePlaceholderCommand } from './placeholder.js';

export const QUEUE_COMMAND = definePlaceholderCommand(
  'queue',
  'Return ordered chains of tasks that can be taken next.',
);
