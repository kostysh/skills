import { definePlaceholderCommand } from './placeholder.js';

export const REMOVE_ITEM_COMMAND = definePlaceholderCommand(
  'remove-item',
  'Apply a patch that removes obsolete tasks.',
);
