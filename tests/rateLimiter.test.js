import { afterEach, test } from "node:test";
import assert from "node:assert";
import http from "node:http";
import { createApp } from "../index.js";

function startAppServer() {
  const server = http.createServer(createApp());
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolve(server);
    });
  });
}

function stopServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function postJson(port, path, body, headers = {}) {
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(payload),
          ...headers
        }
      },
      (response) => {
        let responseBody = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          responseBody += chunk;
        });
        response.on("end", () => {
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            body: responseBody
          });
        });
      }
    );
    request.on("error", reject);
    request.end(payload);
  });
}

// The in-memory store of express-rate-limit is shared per limiter instance.
// createApp() creates fresh limiter instances per call, so each test that
// starts a new server starts with fresh counters. Tear down between tests to
// close keep-alive connections deterministically.
let server = null;
afterEach(async () => {
  if (server) {
    await stopServer(server);
    server = null;
  }
});

test("Mini App normal requests below limit are accepted with request-body validation", async () => {
  process.env.RATE_LIMIT_MAX_REQUESTS = "10";
  process.env.RATE_LIMIT_WINDOW_MS = "60000";
  process.env.BOT_SECRET = "test-secret";
  delete process.env.NODE_ENV;

  server = await startAppServer();
  const port = server.address().port;

  // Three normal (but invalid-body) requests land on handler validation (400),
  // not the rate limiter (429).
  for (let i = 0; i < 3; i++) {
    const resp = await postJson(port, "/api/associate/miniapp", {});
    assert.strictEqual(resp.statusCode, 400);
  }
});

test("Mini App rate limit exceeded returns HTTP 429 with Retry-After", async () => {
  process.env.RATE_LIMIT_MAX_REQUESTS = "2";
  process.env.RATE_LIMIT_WINDOW_MS = "60000";
  process.env.BOT_SECRET = "test-secret";
  delete process.env.NODE_ENV;

  server = await startAppServer();
  const port = server.address().port;

  const first = await postJson(port, "/api/associate/miniapp", {});
  const second = await postJson(port, "/api/associate/miniapp", {});
  const limited = await postJson(port, "/api/associate/miniapp", {});

  assert.strictEqual(first.statusCode, 400);
  assert.strictEqual(second.statusCode, 400);
  assert.strictEqual(limited.statusCode, 429);

  const parsed = JSON.parse(limited.body);
  assert.strictEqual(parsed.ok, false);
  assert.strictEqual(parsed.error, "rate_limited");
  assert.ok(Number.isInteger(parsed.retryAfter) && parsed.retryAfter >= 1);

  // express-rate-limit emits Retry-After (legacy headers enabled).
  assert.ok(
    limited.headers["retry-after"] !== undefined,
    "expected Retry-After header on 429 responses"
  );
});

test("Telegram webhook normal requests below the limit are accepted", async () => {
  process.env.TELEGRAM_RATE_LIMIT_MAX_REQUESTS = "5";
  process.env.TELEGRAM_RATE_LIMIT_WINDOW_MS = "60000";
  process.env.BOT_SECRET = "test-secret";
  delete process.env.NODE_ENV;

  server = await startAppServer();
  const port = server.address().port;

  for (let i = 0; i < 5; i++) {
    const resp = await postJson(
      port,
      "/telegram/webhook",
      {},
      { "x-telegram-bot-api-secret-token": "test-secret" }
    );
    assert.strictEqual(resp.statusCode, 200);
  }
});

test("Telegram webhook rate limit exceeded returns HTTP 429", async () => {
  process.env.TELEGRAM_RATE_LIMIT_MAX_REQUESTS = "2";
  process.env.TELEGRAM_RATE_LIMIT_WINDOW_MS = "60000";
  process.env.BOT_SECRET = "test-secret";
  delete process.env.NODE_ENV;

  server = await startAppServer();
  const port = server.address().port;

  const first = await postJson(
    port,
    "/telegram/webhook",
    {},
    { "x-telegram-bot-api-secret-token": "test-secret" }
  );
  const second = await postJson(
    port,
    "/telegram/webhook",
    {},
    { "x-telegram-bot-api-secret-token": "test-secret" }
  );
  const limited = await postJson(
    port,
    "/telegram/webhook",
    {},
    { "x-telegram-bot-api-secret-token": "test-secret" }
  );

  assert.strictEqual(first.statusCode, 200);
  assert.strictEqual(second.statusCode, 200);
  assert.strictEqual(limited.statusCode, 429);
});

test("Mini App and Telegram webhook counters are independent", async () => {
  process.env.RATE_LIMIT_MAX_REQUESTS = "1";
  process.env.RATE_LIMIT_WINDOW_MS = "60000";
  process.env.TELEGRAM_RATE_LIMIT_MAX_REQUESTS = "1";
  process.env.TELEGRAM_RATE_LIMIT_WINDOW_MS = "60000";
  process.env.BOT_SECRET = "test-secret";
  delete process.env.NODE_ENV;

  server = await startAppServer();
  const port = server.address().port;

  // Exhaust the Mini App limit.
  const miniAppFirst = await postJson(port, "/api/associate/miniapp", {});
  const miniAppLimited = await postJson(port, "/api/associate/miniapp", {});
  assert.strictEqual(miniAppFirst.statusCode, 400);
  assert.strictEqual(miniAppLimited.statusCode, 429);

  // Telegram dedicated counter is still fresh.
  const webhookFirst = await postJson(
    port,
    "/telegram/webhook",
    {},
    { "x-telegram-bot-api-secret-token": "test-secret" }
  );
  assert.strictEqual(webhookFirst.statusCode, 200);

  const webhookLimited = await postJson(
    port,
    "/telegram/webhook",
    {},
    { "x-telegram-bot-api-secret-token": "test-secret" }
  );
  assert.strictEqual(webhookLimited.statusCode, 429);
});

test("independent configuration variables control each endpoint", async () => {
  process.env.RATE_LIMIT_MAX_REQUESTS = "100";
  process.env.RATE_LIMIT_WINDOW_MS = "60000";
  process.env.TELEGRAM_RATE_LIMIT_MAX_REQUESTS = "1";
  process.env.TELEGRAM_RATE_LIMIT_WINDOW_MS = "60000";
  process.env.BOT_SECRET = "test-secret";
  delete process.env.NODE_ENV;

  server = await startAppServer();
  const port = server.address().port;

  // Mini App permits many requests; Telegram is limited to 1.
  for (let i = 0; i < 3; i++) {
    const resp = await postJson(port, "/api/associate/miniapp", {});
    assert.strictEqual(resp.statusCode, 400);
  }

  const webhookFirst = await postJson(
    port,
    "/telegram/webhook",
    {},
    { "x-telegram-bot-api-secret-token": "test-secret" }
  );
  assert.strictEqual(webhookFirst.statusCode, 200);

  const webhookLimited = await postJson(
    port,
    "/telegram/webhook",
    {},
    { "x-telegram-bot-api-secret-token": "test-secret" }
  );
  assert.strictEqual(webhookLimited.statusCode, 429);
});

test("BOT_SECRET validation and production enforcement remain intact", async () => {
  // Keep this endpoint well below any rate limit so BOT_SECRET handling is
  // exercised. (The limiter emits 429 before the handler would emit 401.)
  process.env.TELEGRAM_RATE_LIMIT_MAX_REQUESTS = "100";
  process.env.TELEGRAM_RATE_LIMIT_WINDOW_MS = "60000";
  process.env.BOT_SECRET = "test-secret";
  delete process.env.NODE_ENV;

  server = await startAppServer();
  const port = server.address().port;

  const valid = await postJson(
    port,
    "/telegram/webhook",
    {},
    { "x-telegram-bot-api-secret-token": "test-secret" }
  );
  assert.strictEqual(valid.statusCode, 200);

  const invalid = await postJson(
    port,
    "/telegram/webhook",
    {},
    { "x-telegram-bot-api-secret-token": "wrong-secret" }
  );
  assert.strictEqual(invalid.statusCode, 401);

  process.env.NODE_ENV = "production";
  delete process.env.BOT_SECRET;
  const missingProductionSecret = await postJson(port, "/telegram/webhook", {});
  assert.strictEqual(missingProductionSecret.statusCode, 401);
});

test("request-body size limit remains active on /api/associate/miniapp", async () => {
  process.env.RATE_LIMIT_MAX_REQUESTS = "10";
  process.env.RATE_LIMIT_WINDOW_MS = "60000";

  server = await startAppServer();
  const port = server.address().port;

  // Payload larger than 256kb tests express.json limit (413).
  const oversized = { initData: "x".repeat(300 * 1024) };
  const payload = JSON.stringify(oversized);
  const response = await new Promise((resolve, reject) => {
    const request = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/associate/miniapp",
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(payload)
        }
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ statusCode: res.statusCode, body }));
      }
    );
    request.on("error", reject);
    request.end(payload);
  });

  assert.strictEqual(response.statusCode, 413);
});
