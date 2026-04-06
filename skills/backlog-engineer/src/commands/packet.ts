import { definePlaceholderCommand } from './placeholder.ts';

export const PACKET_COMMAND = definePlaceholderCommand(
  'packet',
  'Apply a packet that adds new backlog tasks.',
);
