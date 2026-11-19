import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { appendFileSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { chromium } from "../scratch/tools/package/index.mjs";

const output = "observations";
await mkdir("scratch", { recursive: true });
const state = await mkdtemp("scratch/state-");
const journal = join(output, "browser.ndjson");
const serviceLog = join(output, "service.ndjson");
await writeFile(journal, "");
await writeFile(serviceLog, "");
const start = performance.now();
const service = spawn(process.execPath, ["app/server.mjs", "0", state], {
  env: { ...process.env, NOTIFICATION_WRITE_DELAY_MS: "1200" },
});
const lines = createInterface({ input: service.stdout });
lines.on("line", (line) => appendFileSync(serviceLog, line + "\n"));
service.stderr.pipe(process.stderr);
const log = (entry) => appendFileSync(journal, JSON.stringify({
  ms: Math.round(performance.now() - start), ...entry,
}) + "\n");

let browser;
try {
  const { origin } = await Promise.race([
    once(lines, "line").then(([line]) => JSON.parse(line)),
    once(service, "exit").then(([code]) => { throw Error("Service exited: " + code); }),
  ]);
  const route = "/settings/notifications";
  const bundle = "app/project/dist/assets/index-BbT2wSLy.js";
  browser = await chromium.launch({ channel: "chrome", downloadsPath: "scratch" });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "light" });
  const page = await context.newPage();
  page.setDefaultTimeout(4000);
  log({ origin, route, state, browser: browser.version(), viewport: page.viewportSize(),
    artificialWriteDelayMs: 1200, bundle, sha256: createHash("sha256").update(await readFile(bundle)).digest("hex") });

  const requests = [];
  page.on("request", (request) => {
    if (request.url() !== origin + "/api/notification-settings") return;
    const method = request.method();
    requests.push(method);
    log({ request: method, id: requests.length, body: request.postDataJSON() });
  });
  page.on("response", (response) => {
    if (response.url() === origin + "/api/notification-settings") {
      log({ response: response.request().method(), status: response.status() });
    }
  });
  page.on("pageerror", (error) => log({ pageError: error.message }));

  const email = page.getByRole("textbox", { name: /Email address/ });
  const review = page.getByRole("button", { name: "Review changes" });
  const dialog = page.getByRole("dialog");
  const focus = () => page.evaluate(() => {
    const el = document.activeElement;
    const style = getComputedStyle(el);
    const { x, y, width, height } = el.getBoundingClientRect();
    const covers = document.elementFromPoint(x + width / 2, y + height / 2);
    return {
      tag: el.tagName, id: el.id, role: el.getAttribute("role"),
      text: el === document.body ? "" : el.textContent.trim(),
      focusVisible: el.matches(":focus-visible"), outline: style.outline,
      outlineOffset: style.outlineOffset, shadow: style.boxShadow, border: style.borderColor,
      rect: { x, y, width, height },
      inViewport: x >= 0 && y >= 0 && x + width <= innerWidth && y + height <= innerHeight,
      centerExposed: el.contains(covers), scrollY,
    };
  });
  async function key(value) {
    await page.keyboard.press(value);
    log({ key: value, focus: await focus() });
  }
  async function tabTo(locator) {
    for (let attempt = 0; attempt < 12; attempt++) {
      if (await locator.evaluate((el) => document.activeElement === el)) return;
      await key("Tab");
    }
    assert.fail("Tab did not reach " + locator);
  }
  async function selectFrequency(from, to, arrow) {
    await tabTo(page.getByRole("radio", { name: from }));
    await page.keyboard.down(arrow);
    try {
      await page.getByRole("radio", { name: to, checked: true }).waitFor();
    } finally {
      await page.keyboard.up(arrow);
    }
    log({ key: arrow });
    log({ selectedFrequency: to, focus: await focus() });
  }
  async function typeEmail(value) {
    await tabTo(email);
    await key("Control+a");
    await page.keyboard.type(value);
    log({ typed: value });
  }
  async function snap(step, capture = false) {
    if (capture) {
      await page.evaluate(async () => {
        await new Promise(requestAnimationFrame);
        await Promise.allSettled(document.getAnimations().map((animation) => animation.finished));
      });
    }
    const snapshot = await page.evaluate(() => {
      const dialog = document.querySelector("[role=dialog]");
      return {
        url: location.pathname, width: innerWidth, height: innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        email: document.querySelector("#email")?.value,
        nativeEmailValid: document.querySelector("#email")?.validity.valid,
        invalid: document.querySelector("#email")?.getAttribute("aria-invalid"),
        emailDescribedBy: document.querySelector("#email")?.getAttribute("aria-describedby"),
        error: document.querySelector("#email-error")?.innerText,
        notifications: document.querySelector("#notifications")?.getAttribute("aria-checked"),
        frequency: document.querySelector("[role=radio][aria-checked=true]")?.id,
        reviewDisabled: document.querySelector("button[type=submit]")?.disabled,
        dialog: dialog?.innerText,
        buttons: Array.from(dialog?.querySelectorAll("button") ?? [], (button) => ({
          text: button.innerText, disabled: button.disabled, y: button.getBoundingClientRect().y,
        })),
        status: document.querySelector("[role=status]")?.innerText,
        atomic: document.querySelector("[role=status]")?.getAttribute("aria-atomic"),
        alert: document.querySelector("[role=alert]")?.innerText,
      };
    });
    log({ step, ...snapshot, focus: await focus(),
      aria: await page.locator("body").ariaSnapshot(),
    });
    if (capture) await page.screenshot({ path: join(output, step + ".png"), timeout: 2000 });
    return snapshot;
  }
  async function openReview() {
    await tabTo(review);
    await key("Enter");
    await dialog.waitFor();
    await page.waitForFunction(() => document.activeElement.textContent.trim() === "Cancel");
  }
  async function closed() {
    await dialog.waitFor({ state: "detached" });
    await page.waitForFunction(() => document.activeElement !== document.body);
  }
  async function confirm() {
    await tabTo(dialog.getByRole("button", { name: "Confirm" }));
    await key("Enter");
    await dialog.getByRole("heading", { name: "Applying changes" }).waitFor();
  }
  function apiResponse(method) {
    return page.waitForResponse((response) =>
      response.url() === origin + "/api/notification-settings" && response.request().method() === method);
  }
  async function save(label, dismiss, expectedCode) {
    const response = apiResponse("PUT");
    await confirm();
    await snap(label + "-dialog", label === "06-close");
    assert.equal((await focus()).text, "Close");
    await key(dismiss);
    await closed();
    const pending = await snap(label + "-pending", ["06-close", "09-escape"].includes(label));
    assert.equal(pending.reviewDisabled, true);
    assert.match(pending.status, /Applying changes/);
    assert.equal((await response).status(), expectedCode);
    await page.waitForFunction(() => !document.querySelector("button[type=submit]").disabled);
    const result = await snap(label + "-result", true);
    assert.match(result.status, expectedCode === 204 ? /^Settings applied/ : /could not be saved/);
    return result;
  }
  async function reopen(label) {
    await tabTo(page.getByRole("link", { name: "Preferences" }));
    await key("Enter");
    await page.waitForURL(origin + "/");
    await tabTo(page.getByRole("link", { name: "Notification settings" }));
    await key("Enter");
    await email.waitFor();
    return snap(label, true);
  }

  await page.goto(origin + route);
  await email.waitFor();
  await page.evaluate(() => document.fonts.ready);
  await snap("01-fresh");

  await tabTo(review);
  await key("Enter");
  assert.match((await snap("02-empty")).error, /Enter your email address/);
  assert.equal((await focus()).id, "email");
  await typeEmail("broken");
  await tabTo(review);
  await key("Enter");
  const invalid = await snap("03-invalid", true);
  assert.match(invalid.error, /valid email/);
  assert.equal((await focus()).id, "email");
  assert.equal(invalid.dialog, undefined);
  await typeEmail("weekly@example.com");
  await selectFrequency("Daily", "Weekly", "ArrowDown");
  await openReview();
  await snap("04-preview", true);
  await key("Tab");
  await key("Tab");
  await key("Shift+Tab");
  await key("Shift+Tab");
  assert.equal((await focus()).text, "Cancel");
  await key("Enter");
  await closed();
  const cancel = await snap("04-cancel", true);
  assert.deepEqual([cancel.email, cancel.notifications, cancel.frequency], ["weekly@example.com", "true", "weekly"]);
  await openReview();
  await key("Escape");
  await closed();
  await snap("04-preview-escape");
  await new Promise((resolve) => setTimeout(resolve, 1300));
  const retained = await snap("04-draft-after-wait");
  assert.equal(retained.status, "");
  assert.equal(retained.email, "weekly@example.com");
  assert.deepEqual(requests, ["GET"]);

  log({ action: "reload after cancellation" });
  await page.reload();
  await email.waitFor();
  const reset = await snap("05-draft-reload", true);
  assert.deepEqual([reset.email, reset.notifications, reset.frequency], ["", "true", "daily"]);

  await typeEmail("x@y");
  await openReview();
  const inputMismatch = await snap("05a-accepted-by-form");
  assert.equal(inputMismatch.nativeEmailValid, true);
  const rejection = apiResponse("PUT");
  await tabTo(dialog.getByRole("button", { name: "Confirm" }));
  await key("Enter");
  assert.equal((await rejection).status(), 422);
  await closed();
  const noWrite = await snap("05a-rejected-by-service", true);
  assert.match(noWrite.status, /could not be saved/);
  assert.equal(noWrite.email, "x@y");
  assert.doesNotMatch(noWrite.status, /Settings applied/i);
  await key("PageDown");
  await page.waitForFunction(() => document.querySelector("[role=status]").getBoundingClientRect().bottom <= innerHeight);
  await snap("05a-rejected-by-service-scrolled", true);

  await typeEmail("weekly@example.com");
  await selectFrequency("Daily", "Weekly", "ArrowDown");
  await openReview();
  await save("06-close", "Enter", 204);
  await key("PageDown");
  await page.waitForFunction(() => document.querySelector("[role=status]").getBoundingClientRect().bottom <= innerHeight);
  await snap("06-close-result-scrolled", true);
  const saved = await reopen("08-reopen-after-close");
  assert.deepEqual([saved.email, saved.notifications, saved.frequency], ["weekly@example.com", "true", "weekly"]);

  await typeEmail("escape@example.com");
  await selectFrequency("Weekly", "Daily", "ArrowUp");
  await tabTo(page.getByRole("switch", { name: "Email notifications" }));
  await snap("09-switch-focus", true);
  await key("Space");
  await openReview();
  await save("09-escape", "Escape", 204);
  const afterEscape = await reopen("10-reopen-after-escape");
  assert.deepEqual([afterEscape.email, afterEscape.notifications, afterEscape.frequency], ["escape@example.com", "false", "daily"]);

  await typeEmail("retry@example.com");
  await tabTo(page.getByRole("switch", { name: "Email notifications" }));
  await key("Space");
  await selectFrequency("Daily", "Weekly", "ArrowDown");
  await openReview();
  const pending = join(state, "pending");
  const moved = join(state, "pending-disabled");
  await rename(pending, moved);
  log({ action: "temporarily renamed pending" });
  try {
    const failed = await save("11-write-failure", "Enter", 503);
    assert.match(failed.status, /could not be saved/);
    assert.deepEqual([failed.email, failed.notifications, failed.frequency], ["retry@example.com", "true", "weekly"]);
    log({ afterFailedWrite: JSON.parse(await readFile(join(state, "settings.json"), "utf8")) });
  } finally {
    await rename(moved, pending);
    log({ action: "restored pending" });
  }
  const preRetry = requests.length;
  // Observe the restored service before the user initiates a new write.
  await new Promise((resolve) => setTimeout(resolve, 1300));
  await tabTo(review);
  assert.equal(requests.length, preRetry);
  await openReview();
  await save("12-manual-write-retry", "Enter", 204);
  const final = await reopen("13-reopen-after-retry");
  assert.deepEqual([final.email, final.notifications, final.frequency], ["retry@example.com", "true", "weekly"]);
  assert.deepEqual(requests, ["GET", "GET", "PUT", "PUT", "GET", "GET",
    "PUT", "GET", "GET", "PUT", "PUT", "GET", "GET"]);
  log({ finished: true, requestMethods: requests });
} catch (error) {
  log({ failure: error.message });
  throw error;
} finally {
  await browser?.close();
  service.kill();
}
