import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp } from "node:fs/promises";
import { createInterface } from "node:readline";
import { chromium } from "../scratch/tools/package/index.mjs";

const viewport = { width: 390, height: 844 };
const emailAddress = "notification-review@example.test";
const apiPath = "/api/notification-settings";
const runDir = await mkdtemp("scratch/notification-review-");
const server = spawn(process.execPath, ["app/server.mjs", "0", runDir], {
  env: { ...process.env, NOTIFICATION_WRITE_DELAY_MS: "1200" },
  stdio: ["ignore", "pipe", "inherit"],
});
const serverLog = createInterface({ input: server.stdout });
serverLog.on("line", (line) => console.log("API server:", line));
const log = (event, data) => console.log(JSON.stringify({ event, ...data }));
const isApiResponse = (response, method) =>
  new URL(response.url()).pathname === apiPath && response.request().method() === method;

let browser;
try {
  const [ready] = await Promise.race([
    once(serverLog, "line"),
    once(server, "exit").then(([code]) => { throw new Error(`Server exited: ${code}`); }),
  ]);
  const { origin } = JSON.parse(ready);
  browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ viewport });
  page.setDefaultTimeout(8000);
  await page.goto(`${origin}/settings/notifications`);
  await page.getByRole("heading", { name: "Notification settings" }).waitFor();
  assert.deepEqual(await page.evaluate(() => ({
    width: innerWidth, height: innerHeight,
  })), viewport);
  log("environment", { browser: browser.version(), viewport, url: page.url() });

  const email = page.getByRole("textbox", { name: /Email address/ });
  const initial = await email.inputValue();
  await email.click();
  await email.pressSequentially(emailAddress);
  const draft = await email.inputValue();
  assert.notEqual(draft, initial);
  assert.equal(draft, emailAddress);
  const activated = await page.evaluate(() => navigator.userActivation.hasBeenActive);
  assert.equal(activated, true);

  const dialogTypes = [];
  let staySelected = false;
  const handleDialog = async (dialog) => {
    dialogTypes.push(dialog.type());
    await dialog.dismiss();
    staySelected = dialog.type() === "beforeunload";
  };
  page.on("dialog", handleDialog);
  let reloadError;
  const reload = await page.reload({ timeout: 5000 }).catch((error) => {
    reloadError = error;
    return null;
  });
  page.off("dialog", handleDialog);
  if (reloadError && !staySelected) throw reloadError;
  const after = await email.inputValue();
  log("reload", {
    initial, draft, activated, dialogTypes, staySelected, reloadStatus: reload?.status() ?? null,
    navigationType: await page.evaluate(() => performance.getEntriesByType("navigation")[0].type),
    after, passed: staySelected && reload === null && draft === after,
  });
  await page.screenshot({ path: "observations/after-reload.png" });

  await email.fill(emailAddress);
  await page.getByRole("button", { name: "Review changes" }).click();
  const dialog = page.getByRole("dialog");
  const confirm = dialog.getByRole("button", { name: "Confirm", exact: true });
  await confirm.waitFor();
  const originalButton = await confirm.elementHandle();
  let responseReceived = false;
  const putResponse = page.waitForResponse((response) => isApiResponse(response, "PUT"))
    .then((response) => {
      responseReceived = true;
      return response;
    });
  await confirm.click();
  const applying = dialog.getByRole("button", { name: "Applying…", exact: true });
  await applying.waitFor();
  const button = await originalButton.evaluate((element) => ({
    tag: element.tagName,
    text: element.textContent,
    disabled: element.disabled,
    ariaBusy: element.getAttribute("aria-busy"),
  }));
  assert.equal(button.text, "Applying…");
  assert.equal(responseReceived, false);
  log("pending", { button, responseReceived, passed: button.ariaBusy === "true" });
  await page.screenshot({ path: "observations/applying.png" });

  const response = await putResponse;
  assert.equal(response.status(), 204);
  assert.equal(response.request().postDataJSON().email, emailAddress);
  await page.getByRole("heading", { name: "Settings applied", exact: true }).waitFor();
  await page.getByText(`Email: ${emailAddress}.`, { exact: false }).waitFor();
  log("completed", { putStatus: response.status(), displayedEmail: emailAddress });
} finally {
  try {
    await browser?.close();
  } finally {
    server.kill();
  }
}
