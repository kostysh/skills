import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';

const [before, after, output] = process.argv.slice(2);
if (!before || !after || !output) throw Error('Usage: node focus-pair.mjs <received-spa> <updated-spa> <output>');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, chromiumSandbox: true });
const results = { browser: browser.version(), route: '/settings/notifications', captures: {} };

async function capture(label, directory) {
  const state = await mkdtemp(join(tmpdir(), 'notification-focus-'));
  const server = spawn(process.execPath, [resolve(directory, 'server.mjs'), '0', state], {
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const context = await browser.newContext({ viewport: { width: 780, height: 1250 }, reducedMotion: 'reduce' });
  try {
    const lines = createInterface({ input: server.stdout });
    const [first] = await once(lines, 'line');
    const page = await context.newPage();
    await page.goto(JSON.parse(first).origin + results.route);
    const button = page.getByRole('button', { name: 'Review changes', exact: true });
    await button.waitFor();
    await page.evaluate(async () => { await document.fonts.ready; });
    const rect = await button.boundingBox();
    const clip = { x: Math.floor(rect.x) - 8, y: Math.floor(rect.y) - 8, width: Math.ceil(rect.width) + 16, height: Math.ceil(rect.height) + 16 };
    const appearance = () => button.evaluate(el => {
      const css = getComputedStyle(el);
      return { tag: el.tagName, stage: el.getAttribute('data-stage'), variant: el.getAttribute('data-variant'),
        weight: css.fontWeight, foreground: css.color, background: css.backgroundColor, border: css.borderColor,
        outline: css.outline, shadow: css.boxShadow, active: document.activeElement === el, focusVisible: el.matches(':focus-visible') };
    });
    const normal = await appearance();
    await page.screenshot({ path: join(output, label + '-normal.png'), clip, animations: 'disabled' });
    const tabOrder = [];
    for (let i = 0; i < 16; i++) {
      await page.keyboard.press('Tab');
      tabOrder.push(await page.evaluate(() => {
        const el = document.activeElement;
        return { tag: el.tagName, name: el.id || el.textContent.trim().slice(0, 75) };
      }));
      if (await button.evaluate(el => el === document.activeElement)) break;
    }
    const focused = await appearance();
    assert.equal(focused.active, true);
    await button.evaluate(async el => { await Promise.all(el.getAnimations().map(animation => animation.finished)); });
    await page.screenshot({ path: join(output, label + '-focused.png'), clip, animations: 'disabled' });
    results.captures[label] = { normal, focused: await appearance(), clip, tabOrder };
  } finally {
    await context.close();
    if (server.exitCode === null && server.signalCode === null) {
      const ended = once(server, 'exit');
      server.kill('SIGTERM');
      await ended;
    }
    await rm(state, { recursive: true, force: true });
  }
}
try {
  await capture('received', before);
  await capture('updated', after);
  await writeFile(join(output, 'observations.json'), JSON.stringify(results, null, 2) + '\n');
} finally {
  await browser.close();
}
