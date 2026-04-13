export function parseMarkdownSections(body: string): Record<string, string> {
  const lines = body.split(/\r?\n/);
  const sections: Record<string, string[]> = { intro: [] };
  let current = 'intro';

  for (const line of lines) {
    const heading = line.match(/^##+\s+(.+?)\s*$/u);
    if (heading) {
      current = heading[1] ?? 'intro';
      sections[current] = [];
      continue;
    }

    const bucket = sections[current];
    if (bucket) {
      bucket.push(line);
    }
  }

  return Object.fromEntries(
    Object.entries(sections).map(([key, value]) => [key, value.join('\n').trim()]),
  );
}

export function splitBulletish(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*]\s*/, '').trim())
    .filter(Boolean);
}
