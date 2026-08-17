import { test } from "node:test";
import assert from "node:assert";
import { setupTraccarNock, setupTelegramNock, cleanAll } from "./helpers/nock-helper.js";
import { handleMiniAppAssociate } from "../router/miniapp.js";
import { validateInitData, getInitDataMaxAge, getInitDataFutureTolerance } from "../services/telegramInitData.js";
import crypto from "crypto";

function mockUser(scope, userId, email, phone, chatId = null) {
  const user = {
    id: userId,
    email,
    phone,
    attributes: chatId ? { telegramChatId: String(chatId) } : {}
  };
  scope
    .get("/api/users")
    .reply(200, [user]);
  // Note: /api/users/${userId} is mocked by mockGetUserById to ensure correct attributes
}

function mockGetUserById(scope, userId, email, phone, chatId = null) {
  const user = {
    id: userId,
    email,
    phone,
    attributes: chatId ? { telegramChatId: String(chatId) } : {}
  };
  // Called twice: once by getUserById in handler, once by updateUserPhoneAndChat
  scope
    .get(`/api/users/${userId}`)
    .reply(200, user)
    .persist();
}

function mockSessionVerify(scope, status = 200) {
  scope
    .post("/api/session")
    .reply(status, { ok: true });
}

function mockUpdateUser(scope, userId, status = 200) {
  scope
    .put(`/api/users/${userId}`)
    .reply(status, { id: userId, ok: true });
}

function createValidInitData(botToken, userData, authDate = Math.floor(Date.now() / 1000)) {
  const params = {
    user: JSON.stringify(userData),
    auth_date: String(authDate),
    query_id: "test_query_id"
  };

  const sortedKeys = Object.keys(params).sort();
  const dataCheckString = sortedKeys.map(key => `${key}=${params[key]}`).join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const initDataParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    initDataParams.append(key, value);
  }
  initDataParams.append("hash", hash);

  return initDataParams.toString();
}

const BOT_TOKEN = "test-token";
process.env.BOT_TOKEN = BOT_TOKEN;

test("handleMiniAppAssociate validates content-type", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  
  const req = {
    headers: { "content-type": "text/plain" },
    body: { initData: "test", identifier: "test@example.com", password: "pass" }
  };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };

  await handleMiniAppAssociate(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error, "invalid_content_type");
});

test("handleMiniAppAssociate rejects missing initData", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  
  const req = {
    headers: { "content-type": "application/json" },
    body: { identifier: "test@example.com", password: "pass" }
  };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };

  await handleMiniAppAssociate(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error, "missing_init_data");
});

test("handleMiniAppAssociate rejects invalid initData signature", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  
  const req = {
    headers: { "content-type": "application/json" },
    body: { initData: "invalid=data&hash=wrong", identifier: "test@example.com", password: "pass" }
  };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };

  await handleMiniAppAssociate(req, res);
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.error, "invalid_telegram_session");
});

test("handleMiniAppAssociate accepts valid initData and authenticates user", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  
  mockUser(traccar, 1, "user@example.com", "+33123456789");
  mockGetUserById(traccar, 1, "user@example.com", "+33123456789");
  mockSessionVerify(traccar, 200);
  mockUpdateUser(traccar, 1, 200);
  
  // Mock Telegram sendMessage for success notification
  telegram
    .post("/bot" + BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });
  
  const initData = createValidInitData(BOT_TOKEN, { id: 12345, first_name: "Test" });
  
  const req = {
    headers: { "content-type": "application/json" },
    body: { initData, identifier: "user@example.com", password: "correct_password" }
  };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };

  await handleMiniAppAssociate(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.ok, true);
  assert.strictEqual(res.body.message, "association_successful");
  assert.ok(traccar.isDone());
});

test("handleMiniAppAssociate rejects wrong password", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  
  mockUser(traccar, 1, "user@example.com", "+33123456789");
  mockGetUserById(traccar, 1, "user@example.com", "+33123456789");
  mockSessionVerify(traccar, 401);
  
  const initData = createValidInitData(BOT_TOKEN, { id: 12345, first_name: "Test" });
  
  const req = {
    headers: { "content-type": "application/json" },
    body: { initData, identifier: "user@example.com", password: "wrong_password" }
  };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };

  await handleMiniAppAssociate(req, res);
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.error, "authentication_failed");
});

test("handleMiniAppAssociate rejects reassociation with different Telegram user", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  
  // User already associated with chatId 999
  mockUser(traccar, 1, "user@example.com", "+33123456789", 999);
  mockGetUserById(traccar, 1, "user@example.com", "+33123456789", 999);
  mockSessionVerify(traccar, 200);
  
  // But initData has different user.id = 12345
  const initData = createValidInitData(BOT_TOKEN, { id: 12345, first_name: "Test" });
  
  const req = {
    headers: { "content-type": "application/json" },
    body: { initData, identifier: "user@example.com", password: "correct_password" }
  };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };

  await handleMiniAppAssociate(req, res);
  assert.strictEqual(res.statusCode, 409);
  assert.strictEqual(res.body.error, "already_associated");
});

test("handleMiniAppAssociate allows idempotent reassociation with same Telegram user", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  
  // User already associated with chatId 12345 (same as initData)
  // Use userId 2 to avoid potential mock leakage from previous tests
  mockUser(traccar, 2, "user2@example.com", "+33123456789", 12345);
  mockGetUserById(traccar, 2, "user2@example.com", "+33123456789", 12345);
  mockSessionVerify(traccar, 200); // Should not be called, but mock to prevent leakage
  
  // Mock Telegram sendMessage for success notification
  telegram
    .post("/bot" + BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });
  
  const initData = createValidInitData(BOT_TOKEN, { id: 12345, first_name: "Test" });
  
  const req = {
    headers: { "content-type": "application/json" },
    body: { initData, identifier: "user2@example.com", password: "correct_password" }
  };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };

  await handleMiniAppAssociate(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.ok, true);
  assert.strictEqual(res.body.message, "already_associated_idempotent");
});

test("handleMiniAppAssociate resolves identifier by phone", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  
  mockUser(traccar, 1, "user@example.com", "+33123456789");
  mockGetUserById(traccar, 1, "user@example.com", "+33123456789");
  mockSessionVerify(traccar, 200);
  mockUpdateUser(traccar, 1, 200);
  
  const initData = createValidInitData(BOT_TOKEN, { id: 12345, first_name: "Test" });
  
  const req = {
    headers: { "content-type": "application/json" },
    body: { initData, identifier: "+33123456789", password: "correct_password" }
  };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };

  await handleMiniAppAssociate(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.ok, true);
});

test("handleMiniAppAssociate prevents account enumeration with generic error", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  
  // No user found for this email
  mockUser(traccar, 1, "other@example.com", "+33123456789");
  mockSessionVerify(traccar, 200);
  
  const initData = createValidInitData(BOT_TOKEN, { id: 12345, first_name: "Test" });
  
  const req = {
    headers: { "content-type": "application/json" },
    body: { initData, identifier: "nonexistent@example.com", password: "any_password" }
  };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };

  await handleMiniAppAssociate(req, res);
  // Should return generic authentication_failed, not user_not_found
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.error, "authentication_failed");
});

test("handleMiniAppAssociate rejects expired initData", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  
  const oldAuthDate = Math.floor(Date.now() / 1000) - 600;
  const initData = createValidInitData(BOT_TOKEN, { id: 12345, first_name: "Test" }, oldAuthDate);
  
  const req = {
    headers: { "content-type": "application/json" },
    body: { initData, identifier: "user@example.com", password: "pass" }
  };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };

  await handleMiniAppAssociate(req, res);
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.error, "invalid_telegram_session");
});

test("handleMiniAppAssociate rejects future timestamp beyond tolerance", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  
  const futureAuthDate = Math.floor(Date.now() / 1000) + 120;
  const initData = createValidInitData(BOT_TOKEN, { id: 12345, first_name: "Test" }, futureAuthDate);
  
  const req = {
    headers: { "content-type": "application/json" },
    body: { initData, identifier: "user@example.com", password: "pass" }
  };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };

  await handleMiniAppAssociate(req, res);
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.error, "invalid_telegram_session");
});

test("handleMiniAppAssociate validates field lengths", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  
  const initData = createValidInitData(BOT_TOKEN, { id: 12345, first_name: "Test" });
  const longString = "x".repeat(300);
  
  const req = {
    headers: { "content-type": "application/json" },
    body: { initData, identifier: longString, password: "pass" }
  };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };

  await handleMiniAppAssociate(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error, "identifier_too_long");
});