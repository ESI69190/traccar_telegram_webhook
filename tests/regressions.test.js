import { test } from "node:test";
import assert from "node:assert";
import { setupTraccarNock, setupTelegramNock, cleanAll } from "./helpers/nock-helper.js";
import { t } from "../services/i18n.js";
import { handleEngine, executeEngineAction } from "../controllers/engine.js";
import { handleCallbackQuery } from "../services/callbackRouter.js";
import { editMessageText } from "../services/telegram.js";

function mockUser(scope, chatId, userId) {
  scope
    .get("/api/users")
    .reply(200, [{ id: userId, attributes: { telegramChatId: String(chatId) }, login: "u" }]);
}

function mockDevices(scope, userId, devices) {
  scope
    .get("/api/devices")
    .query({ userId: String(userId) })
    .reply(200, devices)
    .persist();
}

function mockPositions(scope, deviceId) {
  return scope
    .get("/api/positions")
    .query((q) => String(q.deviceId) === String(deviceId) && q.from && q.to)
    .reply(200, [
      { latitude: 45.764043, longitude: 4.835659, speed: 12.5, serverTime: "2024-01-01T00:00:00Z" }
    ]);
}

function makeUpdate(chatId, messageId, data) {
  return {
    callback_query: {
      id: "cq1",
      from: { id: 999, language_code: "en" },
      message: { chat: { id: Number(chatId) }, message_id: messageId },
      data
    }
  };
}

test("t() interpolates {action} and {device} placeholders", async () => {
  const result = t("en", "confirm_engine_action", { action: "ON", device: "BMW" });
  assert.ok(result.includes("ON"));
  assert.ok(result.includes("BMW"));
  assert.ok(!result.includes("{action}"));
  assert.ok(!result.includes("{device}"));
});

test("executeEngineAction rejects anything other than on/off", async () => {
  cleanAll();
  assert.deepStrictEqual(await executeEngineAction(1, "banana"), { valid: false, action: "banana" });
  assert.deepStrictEqual(await executeEngineAction(1, "START"), { valid: false, action: "start" });
});

test("/engine BMW E90 banana returns validation and NO POST", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  mockDevices(traccar, 1, [{ id: 1, name: "BMW E90", uniqueId: "UID1" }]);
  // If the handler incorrectly sent a command, this mock would be consumed.
  const cmdScope = traccar.post("/api/commands/send").reply(200, {});
  let captured = null;
  telegram.post("/bot" + process.env.BOT_TOKEN + "/sendMessage", (body) => { captured = body.text; return true; })
    .reply(200, { ok: true });

  await handleEngine("123", "/engine BMW E90 banana", "en");

  assert.ok(captured && captured.length > 0, "Should send a validation/usage response");
  assert.strictEqual(cmdScope.isDone(), false, "POST /api/commands/send must NOT be called");
});

test("/engine BMW E90 on maps by name and sends engineResume", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  mockDevices(traccar, 1, [{ id: 1, name: "BMW E90", uniqueId: "UID1" }]);
  traccar.post("/api/commands/send", (body) => body.deviceId === 1 && body.type === "engineResume").reply(200, {});
  telegram.post("/bot" + process.env.BOT_TOKEN + "/sendMessage").reply(200, { ok: true });

  await handleEngine("123", "/engine BMW E90 on", "en");

  assert.ok(traccar.isDone(), `Pending: ${traccar.pendingMocks()}`);
});

test("confirm:engine:on:<authorizedId> executes engineResume without TypeError", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  const chatId = 123;
  mockUser(traccar, chatId, 1);
  mockDevices(traccar, 1, [{ id: 7, name: "car1", uniqueId: "UID7" }]);
  traccar.post("/api/commands/send", (body) => body.deviceId === 7 && body.type === "engineResume").reply(200, {});
  // callback answer + command sent message
  telegram.post("/bot" + process.env.BOT_TOKEN + "/answerCallbackQuery").reply(200, { ok: true });
  telegram.post("/bot" + process.env.BOT_TOKEN + "/sendMessage").reply(200, { ok: true });

  await handleCallbackQuery(makeUpdate(chatId, 11, "confirm:engine:on:7"));

  assert.ok(traccar.isDone(), `command should be sent. Pending: ${traccar.pendingMocks()}`);
  assert.ok(telegram.isDone(), `telegram mocks. Pending: ${telegram.pendingMocks()}`);
});

test("callback engine uses findDeviceByIdForUser (IDOR): unauthorized device => no POST", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  const chatId = 1;
  mockUser(traccar, chatId, 1);
  mockDevices(traccar, 1, [{ id: 7, name: "car1", uniqueId: "UID7" }]); // user1 owns only device 7
  telegram.post("/bot" + process.env.BOT_TOKEN + "/answerCallbackQuery").reply(200, { ok: true });
  telegram.post("/bot" + process.env.BOT_TOKEN + "/sendMessage").reply(200, { ok: true });

  await handleCallbackQuery(makeUpdate("1", 11, "confirm:engine:on:999"));

  assert.ok(traccar.isDone(), `No /api/commands/send should be made (unauthorized). Pending: ${traccar.pendingMocks()}`);
});

test("confirm:engine invalid action produces no Traccar command", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 1, 1);
  telegram.post("/bot" + process.env.BOT_TOKEN + "/answerCallbackQuery").reply(200, { ok: true });
  telegram.post("/bot" + process.env.BOT_TOKEN + "/sendMessage").reply(200, { ok: true });

  await handleCallbackQuery(makeUpdate("1", 11, "confirm:engine:banana:7"));

  assert.ok(traccar.isDone(), "No POST should be made. Pending: " + traccar.pendingMocks());
});

test("history:range result double-escaping (MarkdownV2)", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 1, 1);
  mockDevices(traccar, 1, [{ id: 7, name: "car1", uniqueId: "UID7" }]);
  mockPositions(traccar, 7);
  telegram.post("/bot" + process.env.BOT_TOKEN + "/answerCallbackQuery").reply(200, { ok: true });
  let capturedText = null;
  telegram.post("/bot" + process.env.BOT_TOKEN + "/editMessageText", (body) => { capturedText = body.text; return true; })
    .reply(200, { ok: true });

  await handleCallbackQuery(makeUpdate("1", 5, "history:24h:7"));

  assert.ok(capturedText, "should edit text");
  // exactly one backslash before the decimal point:
  assert.ok(capturedText.includes("45\\.764043"), "should have single backslash escaping; got " + JSON.stringify(capturedText));
  assert.ok(!capturedText.includes("\\\\."), "must not double-escape the dot");
});

test("positions: send positions without double-escaping", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 1, 1);
  mockDevices(traccar, 1, [{ id: 7, name: "car1", uniqueId: "UID7" }]);
  mockPositions(traccar, 7);
  telegram.post("/bot" + process.env.BOT_TOKEN + "/answerCallbackQuery").reply(200, { ok: true });
  let capturedText = null;
  telegram.post("/bot" + process.env.BOT_TOKEN + "/editMessageText", (body) => { capturedText = body.text; return true; })
    .reply(200, { ok: true });

  await handleCallbackQuery(makeUpdate("1", 5, "positions:7"));

  assert.ok(capturedText, "should edit text message");
  assert.ok(capturedText.includes("45\\.764043"), "expected single backslash dot; got " + JSON.stringify(capturedText));
  assert.ok(!capturedText.includes("\\\\."), "must not contain double escape");
});

test("editMessageText treats 'message is not modified' as benign", async () => {
  cleanAll();
  const telegram = setupTelegramNock();
  telegram.post("/bot" + process.env.BOT_TOKEN + "/editMessageText")
    .reply(400, { ok: false, description: "Bad Request: message is not modified: specified new message content and reply markup are exactly the same as current content and reply markup" });

  const result = await editMessageText(1, 5, "same text", { parse_mode: "MarkdownV2" });

  assert.deepStrictEqual(result, { ok: true, unchanged: true });
});