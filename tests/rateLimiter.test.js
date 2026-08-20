import { afterEach, test } from "node:test";
import assert from "node:assert";
import http from "node:http";
import { createApp } from "../index.js";
import {
  createRateLimiter,
  getRateLimiterStoreSize,
  resetRateLimiter
} from "../services/rateLimiter.js";

afterEach(() => {
  resetRateLimiter();
});

function invoke(middleware, ip) {
  const response = {
    statusCode: 200,
    headers: {},
    body: null,
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
  let nextCalled = false;

  middleware({ ip }, response, () => {
    nextCalled = true;
  });

  return { response, nextCalled };
}

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

test("Mini App and Telegram webhook use independent endpoint rate limits", async () => {
  const previousValues = {
    max: process.env.RATE_LIMIT_MAX_REQUESTS,
    window: process.env.RATE_LIMIT_WINDOW_MS,
    telegramMax: process.env.TELEGRAM_RATE_LIMIT_MAX_REQUESTS,
    telegramWindow: process.env.TELEGRAM_RATE_LIMIT_WINDOW_MS,
    botSecret: process.env.BOT_SECRET,
    nodeEnv: process.env.NODE_ENV
  };

  process.env.RATE_LIMIT_MAX_REQUESTS = "2";
  process.env.RATE_LIMIT_WINDOW_MS = "60000";
  process.env.TELEGRAM_RATE_LIMIT_MAX_REQUESTS = "3";
  process.env.TELEGRAM_RATE_LIMIT_WINDOW_MS = "60000";
  process.env.BOT_SECRET = "test-secret";
  delete process.env.NODE_ENV;

  const server = await startAppServer();
  const port = server.address().port;

  try {
    const miniAppFirst = await postJson(port, "/api/associate/miniapp", {});
    const miniAppSecond = await postJson(port, "/api/associate/miniapp", {});
    const miniAppLimited = await postJson(port, "/api/associate/miniapp", {});

    assert.strictEqual(miniAppFirst.statusCode, 400);
    assert.strictEqual(miniAppSecond.statusCode, 400);
    assert.strictEqual(miniAppLimited.statusCode, 429);

    const validWebhook = await postJson(
      port,
      "/telegram/webhook",
      {},
      { "x-telegram-bot-api-secret-token": "test-secret" }
    );
    assert.strictEqual(validWebhook.statusCode, 200);

    const invalidWebhook = await postJson(
      port,
      "/telegram/webhook",
      {},
      { "x-telegram-bot-api-secret-token": "wrong-secret" }
    );
    assert.strictEqual(invalidWebhook.statusCode, 401);

    process.env.NODE_ENV = "production";
    delete process.env.BOT_SECRET;
    const missingProductionSecret = await postJson(port, "/telegram/webhook", {});
    assert.strictEqual(missingProductionSecret.statusCode, 401);

    process.env.BOT_SECRET = "test-secret";
    const webhookLimited = await postJson(
      port,
      "/telegram/webhook",
      {},
      { "x-telegram-bot-api-secret-token": "test-secret" }
    );
    assert.strictEqual(webhookLimited.statusCode, 429);
  } finally {
    await stopServer(server);

    for (const [name, value] of Object.entries(previousValues)) {
      if (value === undefined) delete process.env[name === "max" ? "RATE_LIMIT_MAX_REQUESTS" :
        name === "window" ? "RATE_LIMIT_WINDOW_MS" :
        name === "telegramMax" ? "TELEGRAM_RATE_LIMIT_MAX_REQUESTS" :
        name === "telegramWindow" ? "TELEGRAM_RATE_LIMIT_WINDOW_MS" :
        name === "botSecret" ? "BOT_SECRET" : "NODE_ENV"];
      else if (name === "max") process.env.RATE_LIMIT_MAX_REQUESTS = value;
      else if (name === "window") process.env.RATE_LIMIT_WINDOW_MS = value;
      else if (name === "telegramMax") process.env.TELEGRAM_RATE_LIMIT_MAX_REQUESTS = value;
      else if (name === "telegramWindow") process.env.TELEGRAM_RATE_LIMIT_WINDOW_MS = value;
      else if (name === "botSecret") process.env.BOT_SECRET = value;
      else process.env.NODE_ENV = value;
    }
  }
});

test("rate limiter keeps separate counters for different prefixes and clients", () => {
  const miniAppLimiter = createRateLimiter({
    keyPrefix: "miniapp_assoc",
    maxRequests: 1,
    windowMs: 60000
  });
  const telegramLimiter = createRateLimiter({
    keyPrefix: "telegram_webhook",
    maxRequests: 1,
    windowMs: 60000
  });

  assert.strictEqual(invoke(miniAppLimiter, "198.51.100.10").nextCalled, true);
  assert.strictEqual(invoke(miniAppLimiter, "198.51.100.10").response.statusCode, 429);

  // The same IP has a separate Telegram counter.
  assert.strictEqual(invoke(telegramLimiter, "198.51.100.10").nextCalled, true);

  // A different client has its own Mini App counter.
  assert.strictEqual(invoke(miniAppLimiter, "198.51.100.11").nextCalled, true);
});

test("expired rate-limit records are eventually removed without another request", async () => {
  const limiter = createRateLimiter({
    keyPrefix: "cleanup_test",
    maxRequests: 1,
    windowMs: 20
  });

  invoke(limiter, "198.51.100.20");
  assert.strictEqual(getRateLimiterStoreSize(), 1);

  await new Promise((resolve) => setTimeout(resolve, 1200));
  assert.strictEqual(getRateLimiterStoreSize(), 0);
});