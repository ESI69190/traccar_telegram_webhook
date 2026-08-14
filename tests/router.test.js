import { test } from "node:test";
import assert from "node:assert";
import { setupTraccarNock, setupTelegramNock, cleanAll } from "./helpers/nock-helper.js";

// Modules must be imported AFTER setup.js has set env vars.
// node --import ./tests/setup.js ensures BOT_TOKEN and TRACCAR_API_URL are set first.
import { handleTelegramUpdate } from "../router/telegram.js";

function mockUser(scope, chatId, userId) {
  scope
    .get("/api/users")
    .reply(200, [
      {
        id: userId,
        attributes: { telegramChatId: String(chatId) },
        login: "user1",
        email: "user1@example.com"
      }
    ]);
}

test("webhook rejects request without secret token when BOT_SECRET is set", async () => {
  process.env.BOT_SECRET = "test-secret";
  cleanAll();

  let statusCode;
  const res = {
    sendStatus: (code) => {
      statusCode = code;
    }
  };

  await handleTelegramUpdate(
    {
      headers: {},
      body: {
        message: { chat: { id: 123, type: "private" }, text: "/start" }
      }
    },
    res
  );

  assert.strictEqual(statusCode, 401);
});

test("webhook accepts request with correct secret token", async () => {
  process.env.BOT_SECRET = "test-secret";
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  let statusCode;
  const res = {
    sendStatus: (code) => {
      statusCode = code;
    }
  };

  await handleTelegramUpdate(
    {
      headers: { "x-telegram-bot-api-secret-token": "test-secret" },
      body: {
        message: { chat: { id: 123, type: "private" }, text: "/start" }
      }
    },
    res
  );

  assert.strictEqual(statusCode, 200);
  assert.ok(
    traccar.isDone(),
    `Expected Traccar mocks to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("webhook ignores group chats even with valid secret", async () => {
  process.env.BOT_SECRET = "test-secret";
  cleanAll();

  let statusCode;
  const res = {
    sendStatus: (code) => {
      statusCode = code;
    }
  };

  await handleTelegramUpdate(
    {
      headers: { "x-telegram-bot-api-secret-token": "test-secret" },
      body: {
        message: { chat: { id: -123, type: "group" }, text: "/start" }
      }
    },
    res
  );

  assert.strictEqual(statusCode, 200);
});

test("webhook allows request when BOT_SECRET is not set", async () => {
  delete process.env.BOT_SECRET;
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  let statusCode;
  const res = {
    sendStatus: (code) => {
      statusCode = code;
    }
  };

  await handleTelegramUpdate(
    {
      headers: {},
      body: {
        message: { chat: { id: 123, type: "private" }, text: "/start" }
      }
    },
    res
  );

  assert.strictEqual(statusCode, 200);
  assert.ok(
    traccar.isDone(),
    `Expected Traccar mocks to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("webhook rejects request with wrong secret token", async () => {
  process.env.BOT_SECRET = "test-secret";
  cleanAll();

  let statusCode;
  const res = {
    sendStatus: (code) => {
      statusCode = code;
    }
  };

  await handleTelegramUpdate(
    {
      headers: { "x-telegram-bot-api-secret-token": "wrong-secret" },
      body: {
        message: { chat: { id: 123, type: "private" }, text: "/start" }
      }
    },
    res
  );

  assert.strictEqual(statusCode, 401);
});

test("webhook rejects request without secret token in production", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  delete process.env.BOT_SECRET;
  cleanAll();

  let statusCode;
  const res = {
    sendStatus: (code) => {
      statusCode = code;
    }
  };

  await handleTelegramUpdate(
    {
      headers: {},
      body: {
        message: { chat: { id: 123, type: "private" }, text: "/start" }
      }
    },
    res
  );

  assert.strictEqual(statusCode, 401);

  process.env.NODE_ENV = previousNodeEnv;
});

test("webhook rejects non-private chats", async () => {
  delete process.env.BOT_SECRET;
  cleanAll();

  let statusCode;
  const res = {
    sendStatus: (code) => {
      statusCode = code;
    }
  };

  await handleTelegramUpdate(
    {
      headers: {},
      body: {
        message: { chat: { id: -123, type: "channel" }, text: "/start" }
      }
    },
    res
  );

  assert.strictEqual(statusCode, 200);
});
