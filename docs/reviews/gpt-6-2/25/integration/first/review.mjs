import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import { once } from "node:events";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { chromium } from "../scratch/tools/package/index.mjs";

const viewport = { width: 390, height: 844 };
const writeDelay = 1200;
const route = "/settings/notifications";
const api = "/api/notification-settings";
await mkdir("scratch", { recursive: true });
const run = await mkdtemp("scratch/review-");
const state = resolve(run, "state");
const profile = resolve(run, "chrome");
const journal = createWriteStream("observations/journal.jsonl");
const log = (event, data = {}) => journal.write(JSON.stringify({ event, ...data }) + "\n");
const server = spawn(process.execPath, ["app/server.mjs", "0", state], {
  env: { ...process.env, NOTIFICATION_WRITE_DELAY_MS: String(writeDelay) },
  stdio: ["ignore", "pipe", "inherit"],
});
const lines = createInterface({ input: server.stdout });
let context;
let pendingMoved = false;
const pending = resolve(state, "pending");
const held = resolve(state, "pending.held");
const requests = [];
const shots = resolve("scratch", "screenshots");
await mkdir(shots, { recursive: true });

try {
  const [line] = await once(lines, "line");
  const { origin } = JSON.parse(line);
  lines.on("line", (entry) => log("service", JSON.parse(entry)));
  log("run", { origin, route, viewport, writeDelay, playwright: "1.65.1" });
  context = await chromium.launchPersistentContext(profile, {
    channel: "chrome", headless: true, viewport, deviceScaleFactor: 1, colorScheme: "light",
    env: { ...process.env, TMPDIR: resolve(run), XDG_CONFIG_HOME: resolve(run, "config"), XDG_CACHE_HOME: resolve(run, "cache") },
  });
  const [page] = context.pages();
  page.setDefaultTimeout(5000);
  page.on("pageerror", error => log("page-error", { message: error.message }));
  page.on("dialog", async prompt => {
    log("browser-dialog", { type: prompt.type(), message: prompt.message() });
    await prompt.accept();
  });
  page.on("request", request => {
    if (new URL(request.url()).pathname !== api) return;
    const entry = { method: request.method(), submitted: request.postDataJSON() };
    requests.push(entry);
    log("request", entry);
  });
  page.on("response", response => {
    if (new URL(response.url()).pathname === api) log("response", { method: response.request().method(), status: response.status() });
  });

  const keyboard = page.keyboard;
  const email = page.getByRole("textbox", { name: /Email address/ });
  const dialog = page.getByRole("dialog");
  const review = page.getByRole("button", { name: "Review changes" });
  const result = page.getByRole("status");
  const waitForAPI = (method, status) => page.waitForResponse(response =>
    new URL(response.url()).pathname === api &&
    response.request().method() === method && response.status() === status);
  const snap = async (step, screenshot = false) => {
    if (screenshot) await page.waitForTimeout(170);
    const snapshot = await page.evaluate(() => {
      const element = document.activeElement;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const bounds = ({ x, y, width, height }) => [x, y, width, height].map(Math.round);
      const box = document.querySelector('[role="dialog"]');
      const review = document.querySelector('button[aria-haspopup="dialog"]');
      const input = document.querySelector("#email");
      const status = document.querySelector('[role="status"]');
      return {
        path: location.pathname,
        viewport: [innerWidth, innerHeight],
        scrollY: Math.round(scrollY),
        pageHeight: document.documentElement.scrollHeight,
        pageWidth: document.documentElement.scrollWidth,
        focus: {
          element: element.id || element.getAttribute("role") || element.tagName,
          text: element === document.body ? "" : element.innerText?.trim(),
          visibleSelector: element.matches(":focus-visible"),
          rect: bounds(rect),
          outline: [style.outlineStyle, style.outlineWidth, style.outlineColor, style.outlineOffset],
          shadow: style.boxShadow,
        },
        fields: {
          email: input?.value, invalid: input?.getAttribute("aria-invalid"), describedBy: input?.getAttribute("aria-describedby"),
          enabled: document.querySelector("#notifications")?.getAttribute("aria-checked"),
          frequency: document.querySelector('[role="radio"][aria-checked="true"]')?.id,
        },
        error: document.querySelector("#email-error")?.innerText,
        errorRole: document.querySelector("#email-error")?.getAttribute("role"),
        review: { disabled: review?.disabled, busy: review?.getAttribute("aria-busy"), rect: review && bounds(review.getBoundingClientRect()) },
        dialog: box && {
          text: box.innerText, rect: bounds(box.getBoundingClientRect()),
          buttons: [...box.querySelectorAll("button")].map(button => ({
            text: button.innerText, disabled: button.disabled,
            busy: button.getAttribute("aria-busy"), rect: bounds(button.getBoundingClientRect()),
          })),
        },
        status: { text: status?.innerText, rect: status && bounds(status.getBoundingClientRect()), atomic: status?.getAttribute("aria-atomic") },
        saveBridge: typeof window.notificationSettings?.save,
        chrome: navigator.userAgent,
      };
    });
    log("state", { step, ...snapshot });
    if (screenshot) await page.screenshot({ path: resolve(shots, step + ".png") });
  };
  const press = async (...keys) => {
    log("keys", { keys });
    for (const key of keys) await keyboard.press(key);
  };
  const typeEmail = async (value) => {
    assert.equal(await email.evaluate(element => element === document.activeElement), true);
    await press("Control+a");
    log("type", { value });
    await keyboard.type(value, { delay: 0 });
  };
  const tabTo = async (target) => {
    for (let i = 0; i < 12; i++) {
      if (await target.evaluate(element => element === document.activeElement)) return;
      await press("Tab");
    }
    throw new Error("Tab did not reach " + target);
  };
  const openReview = async () => {
    await tabTo(review);
    await press("Enter");
    await dialog.getByRole("button", { name: "Cancel" }).waitFor();
  };
  const confirm = async () => {
    await tabTo(dialog.getByRole("button", { name: "Confirm" }));
    await press("Enter");
  };
  const closeWait = () => dialog.waitFor({ state: "hidden" });
  const settleFocus = () => page.waitForFunction(() =>
    document.activeElement?.matches('[role="status"], button[aria-haspopup="dialog"]'));
  const writes = () => requests.filter(request => request.method === "PUT").length;
  const load = async (url) => {
    log("open", { url });
    await page.goto(origin + url);
    await email.waitFor();
  };

  await load(route);
  await snap("01-initial");
  await tabTo(review);
  await press("Enter");
  await snap("02-empty");
  await typeEmail("broken@");
  await tabTo(review);
  await press("Enter");
  await snap("03-invalid", true);
  await typeEmail("weekly@example.com");
  await tabTo(page.getByRole("radio", { name: "Daily" }));
  await press("ArrowRight");
  await page.waitForTimeout(150);
  await snap("frequency-arrow-right", true);
  await press("Space");
  await snap("frequency-space", true);
  await openReview();
  await snap("04-preview", true);
  await press("Tab");
  await snap("05-confirm-focus", true);
  await press("Tab");
  await snap("06-focus-wrap");
  await press("Shift+Tab");
  await snap("06b-reverse-wrap");
  await press("Tab", "Enter");
  await closeWait();
  await settleFocus();
  await snap("07-cancel", true);
  await openReview();
  await press("Escape");
  await closeWait();
  await settleFocus();
  await snap("08-escape-preview");
  await page.waitForTimeout(2000);
  await snap("08b-unconfirmed-after-wait");
  assert.equal(writes(), 0);
  log("reload");
  await page.reload();
  await email.waitFor();
  await snap("09-reloaded-draft");

  await tabTo(email);
  await typeEmail("weekly@example.com");
  await tabTo(page.getByRole("radio", { name: "Daily" }));
  await press("ArrowRight");
  await page.waitForTimeout(150);
  await press("Space");
  await openReview();
  const firstPut = waitForAPI("PUT", 204);
  const firstRead = waitForAPI("GET", 200);
  await confirm();
  await dialog.getByRole("button", { name: "Close" }).waitFor();
  await snap("10-pending-dialog", true);
  await press("Enter");
  await closeWait();
  await settleFocus();
  await snap("11-close-pending", true);
  await firstPut;
  await firstRead;
  await result.getByText("Settings applied").waitFor();
  await snap("12-close-success", true);

  await tabTo(email);
  await typeEmail("escape@example.com");
  await tabTo(page.locator('[role="radio"][aria-checked="true"]'));
  await press("ArrowLeft");
  await page.waitForTimeout(150);
  await snap("frequency-arrow-left");
  await press("Space");
  await page.waitForTimeout(150);
  await snap("frequency-space-left");
  await openReview();
  const escapePut = waitForAPI("PUT", 204);
  const escapeRead = waitForAPI("GET", 200);
  await confirm();
  await dialog.getByRole("button", { name: "Close" }).waitFor();
  await press("Escape");
  await closeWait();
  await settleFocus();
  await snap("13-escape-pending", true);
  await escapePut;
  await escapeRead;
  await result.getByText("Email: escape@example.com.", { exact: false }).waitFor();
  await snap("14-escape-success", true);

  await tabTo(email);
  await typeEmail("retry@example.com");
  await tabTo(page.getByRole("switch", { name: "Email notifications" }));
  await press("Space");
  await openReview();
  await rename(pending, held);
  pendingMoved = true;
  log("service-control", { action: "rename pending to pending.held" });
  const failedPut = waitForAPI("PUT", 503);
  await confirm();
  await dialog.getByRole("button", { name: "Close" }).waitFor();
  await press("Escape");
  await closeWait();
  await settleFocus();
  await failedPut;
  await result.getByText("Settings could not be saved.", { exact: false }).waitFor();
  await snap("15-rejected", true);
  const checkPage = await context.newPage();
  const checkRead = checkPage.waitForResponse(response => new URL(response.url()).pathname === api && response.request().method() === "GET");
  await checkPage.goto(origin + route);
  const persisted = await checkRead;
  await checkPage.getByText("Email: escape@example.com.", { exact: false }).waitFor();
  log("read-from-separate-page-after-rejection", { status: persisted.status(), body: await persisted.json() });
  await checkPage.close();
  await page.bringToFront();
  await rename(held, pending);
  pendingMoved = false;
  log("service-control", { action: "restore pending" });
  await page.waitForTimeout(writeDelay + 100);
  assert.equal(writes(), 3);
  await snap("16-no-auto-retry");

  await openReview();
  await snap("17-retry-preview");
  const retryPut = waitForAPI("PUT", 204);
  const retryRead = waitForAPI("GET", 200);
  await confirm();
  await retryPut;
  await retryRead;
  await result.getByText("Email: retry@example.com.", { exact: false }).waitFor();
  await closeWait();
  await settleFocus();
  await snap("18-retry-success", true);
  await press("PageDown");
  await snap("18b-retry-result-scrolled", true);

  await tabTo(page.getByRole("link", { name: "Preferences" }));
  await press("Enter");
  const link = page.getByRole("link", { name: "Notification settings" });
  await link.waitFor();
  await tabTo(link);
  const reopenRead = waitForAPI("GET", 200);
  await press("Enter");
  await reopenRead;
  await email.waitFor();
  await snap("19-reopened", true);
  await press("PageDown");
  await snap("19b-reopened-result-scrolled", true);
  await load(route);
  await snap("20-direct-reopen");
  assert.equal(writes(), 4);
  log("complete");
} finally {
  if (pendingMoved) await rename(held, pending);
  await context?.close();
  server.kill();
  await once(server, "exit");
  journal.end();
  await once(journal, "finish");
  await rm(run, { recursive: true, force: true });
}
