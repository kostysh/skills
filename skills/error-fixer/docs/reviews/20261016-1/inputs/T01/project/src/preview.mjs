export function previewReady(items) {
  return items
    .filter(item => item.ready && item.id)
    .map(item => ({ id: item.id, title: item.title }));
}
