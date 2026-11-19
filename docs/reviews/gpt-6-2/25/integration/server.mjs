import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] ?? 0);
const state = resolve(process.argv[3] ?? join(root, "state"));
const delayMs = Number(process.env.NOTIFICATION_WRITE_DELAY_MS ?? 0);
const pending = join(state, "pending");
const file = join(state, "settings.json");
await mkdir(pending, { recursive: true });
const api = "/api/notification-settings";

function valid(settings) {
  return settings && typeof settings.email === "string" && settings.email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email) &&
    typeof settings.enabled === "boolean" && ["daily", "weekly"].includes(settings.frequency) &&
    Object.keys(settings).length === 3;
}

const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  const reply = (status, body = "", type = "application/json") => {
    res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(body);
    if (path === api) {
      const data = body ? JSON.parse(body) : undefined;
      console.log(JSON.stringify({ method: req.method, path, status, body: data }));
    }
  };
  if (path === api) {
    if (req.method === "GET") {
      try {
        reply(200, await readFile(file, "utf8"));
      } catch (error) {
        if (error.code === "ENOENT") reply(200, "null");
        else reply(503, JSON.stringify({ error: "read_unavailable" }));
      }
      return;
    }
    if (req.method !== "PUT") return reply(405);
    if (req.headers["content-type"]?.split(";")[0] !== "application/json") return reply(415);
    let raw = "";
    for await (const chunk of req) {
      raw += chunk;
      if (Buffer.byteLength(raw) > 4096) return reply(413);
    }
    let settings;
    try {
      settings = JSON.parse(raw);
    } catch {
      return reply(400);
    }
    if (!valid(settings)) return reply(422);
    const temporary = join(pending, randomUUID() + ".json");
    try {
      if (delayMs) await delay(delayMs);
      await writeFile(temporary, JSON.stringify(settings) + "\n", { flag: "wx" });
      await rename(temporary, file);
      reply(204);
    } catch {
      reply(503, JSON.stringify({ error: "write_unavailable" }));
    } finally {
      await rm(temporary, { force: true }).catch(() => {});
    }
    return;
  }
  if (req.method === "GET") {
    const page = path === "/" || path === "/settings/notifications";
    const asset = /^\/assets\/[\w.-]+$/.test(path);
    if (page || asset) {
      const name = page ? "index.html" : path.slice(1);
      const type = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2" }[extname(name)];
      try {
        return reply(200, await readFile(join(root, "project/dist", name)), type);
      } catch {
        return reply(404);
      }
    }
  }
  reply(404);
});
server.listen(port, "127.0.0.1", () => console.log(JSON.stringify({ origin: "http://127.0.0.1:" + server.address().port })));
