import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';

const directory = process.argv[2];
if (!directory) throw Error('Usage: node confirm-keys.mjs <spa-folder>');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const state = await mkdtemp(join(tmpdir(), 'notification-confirm-'));
const server = spawn(process.execPath, [resolve(directory, 'server.mjs'), '0', state], { stdio: ['ignore', 'pipe', 'inherit'] });
const lines = createInterface({ input: server.stdout });
const [first] = await once(lines, 'line');
const { origin } = JSON.parse(first);
const service = [];
lines.on('line', entry => service.push(JSON.parse(entry)));
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true, chromiumSandbox: true });
  const context = await browser.newContext({ viewport: { width: 780, height: 1250 } });
  const timeline = [];
  const page = await context.newPage();
  page.on('request', req => {
    if (new URL(req.url()).pathname === '/api/notification-settings') {
      timeline.push({ observed: 'request', method: req.method(), body: req.postDataJSON() });
    }
  });
  page.on('response', res => {
    if (new URL(res.url()).pathname === '/api/notification-settings') {
      timeline.push({ observed: 'response', method: res.request().method(), status: res.status() });
    }
  });
  await page.goto(origin + '/settings/notifications');
  await page.getByLabel('Email address', { exact: false }).fill('registry@example.test');
  await page.getByRole('radio', { name: 'Weekly' }).click();
  await page.getByRole('button', { name: 'Review changes' }).click();
  const cancel = page.getByRole('button', { name: 'Cancel', exact: true });
  const confirm = page.getByRole('button', { name: 'Confirm', exact: true });
  await cancel.waitFor();
  assert.equal(await cancel.evaluate(el => el === document.activeElement), true);
  await page.evaluate(() => {
    const events = [];
    window.confirmKeyEvents = events;
    for (const name of ['keydown', 'keyup', 'focusin', 'click']) {
      document.addEventListener(name, event => {
        const el = event.target;
        events.push({ event: name, key: event.key ?? null, trusted: event.isTrusted, target: el.textContent?.trim().slice(0, 75),
          tag: el.tagName, detail: name === 'click' ? event.detail : null, at: event.timeStamp });
      }, true);
    }
  });
  await page.keyboard.press('Tab');
  assert.equal(await confirm.evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Enter');
  await page.getByRole('status').getByText(/Email: registry@example.test/).waitFor();
  const dom = await page.evaluate(() => window.confirmKeyEvents);
  const includes = (event, target, key = null) => dom.some(x => x.trusted && x.event === event && x.target === target && (key === null || x.key === key));
  assert.ok(includes('keydown', 'Cancel', 'Tab') && includes('focusin', 'Confirm') && includes('keydown', 'Confirm', 'Enter'));
  assert.ok(dom.some(x => x.trusted && x.event === 'click' && x.target === 'Confirm' && x.detail === 0));
  const renewed = await context.newPage();
  await renewed.goto(origin + '/settings/notifications');
  await renewed.getByText(/Email: registry@example.test/).waitFor();
  const fresh = await renewed.getByRole('status').innerText();
  const disk = JSON.parse(await readFile(join(state, 'settings.json'), 'utf8'));
  assert.equal(disk.frequency, 'weekly');
  assert.deepEqual(service.map(x => [x.method, x.status]), [['GET',200],['PUT',204],['GET',200],['GET',200]]);
  console.log(JSON.stringify({ browser: browser.version(), route: '/settings/notifications', operations: ['Tab', 'Enter'], dom, timeline, service, disk, fresh }, null, 2));
} finally {
  await browser?.close();
  if (server.exitCode === null && server.signalCode === null) {
    const ended = once(server, 'exit');
    server.kill('SIGTERM');
    await ended;
  }
  await rm(state, { recursive: true, force: true });
}
