import { readFileSync, writeFileSync } from 'node:fs';

export function loadCatalog(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
    .map(card => ({ ...card, pinned: Boolean(card.pinned) }));
}

export function setPinned(cards, id, pinned) {
  if (!cards.some(card => card.id === id)) throw new Error(`Unknown card: ${id}`);
  return cards.map(card => card.id === id ? { ...card, pinned: Boolean(pinned) } : card);
}

export function saveCatalog(path, cards) {
  const records = cards.map(({ id, title }) => ({ id, title }));
  writeFileSync(path, JSON.stringify(records, null, 2));
}

export function pinnedTitles(cards) {
  return cards.filter(card => card.pinned === true).map(card => card.title);
}
