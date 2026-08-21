import { test } from "node:test";
import assert from "node:assert";
import { setupTraccarNock, setupTelegramNock, cleanAll } from "./helpers/nock-helper.js";
import { t } from "../services/i18n.js";
import { parseCallbackData, encodeDeviceCallback, validateCallbackData, cleanDeviceId } from "../services/callbackData.js";
import { normalizeDeviceId } from "../services/permissions.js";
import { handleCallbackQuery } from "../services/callbackRouter.js";

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

// --- Central callback-data encoding/parsing ---

test("encodeDeviceCallback retains the numeric Traccar deviceId", () => {
  assert.strictEqual(encodeDeviceCallback("commands", 123), "cmd:commands:123");
  assert.strictEqual(encodeDeviceCallback("commands", 123, "custom"), "cmd:commands:123:custom");
  assert.strictEqual(encodeDeviceCallback("custom", 123, "exec:customType"), "cmd:custom:123:exec:customType");
  assert.strictEqual(encodeDeviceCallback("engine", 7, "on"), "cmd:engine:7:on");
  assert.strictEqual(encodeDeviceCallback("confirm", 7, "engine:on"), "cmd:confirm:7:engine:on");
});

test("parseCallbackData always separates deviceId from kind/type", () => {
  const parsed = parseCallbackData("cmd:commands:123:custom");
  assert.deepStrictEqual(parsed, {
    action: "cmd",
    kind: "commands",
    deviceId: 123,
    deviceIdValid: true,
    subtype: "custom",
    subtype2: ""
  });

  const parsedExec = parseCallbackData("cmd:custom:123:exec:customType");
  assert.strictEqual(parsedExec.kind, "custom");
  assert.strictEqual(parsedExec.deviceId, 123);
  assert.strictEqual(parsedExec.subtype, "exec");
  assert.strictEqual(parsedExec.subtype2, "customType");
});

test("cleanDeviceId validates numeric device ids only", () => {
  assert.strictEqual(cleanDeviceId(123), 123);
  assert.strictEqual(cleanDeviceId("123"), 123);
  assert.strictEqual(cleanDeviceId("custom"), null);
  assert.strictEqual(cleanDeviceId("engine"), null);
  assert.strictEqual(cleanDeviceId("on"), null);
  assert.strictEqual(cleanDeviceId(""), null);
  assert.strictEqual(cleanDeviceId("12.5"), null);
  assert.strictEqual(cleanDeviceId("-3"), null);
  assert.strictEqual(cleanDeviceId("0"), null);
});

test("normalizeDeviceId (permissions) mirrors the same validation", () => {
  assert.strictEqual(normalizeDeviceId(123), 123);
  assert.strictEqual(normalizeDeviceId("123"), 123);
  assert.strictEqual(normalizeDeviceId("custom"), null);
  assert.strictEqual(normalizeDeviceId("engine"), null);
  assert.strictEqual(normalizeDeviceId("command"), null);
});

// --- "custom" can never reach permission lookup as a deviceId ---

test("legacy ambiguous callback 'commands:custom:123' is rejected, never a device lookup", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 1, 1);
  // A device lookup mock is registered WITHOUT .persist(). If the router
  // incorrectly treated "custom" as a deviceId, this GET /api/devices would
  // be consumed. After the handler runs we assert it was NOT consumed.
  const devicesScope = traccar
    .get("/api/devices")
    .query({ userId: "1" })
    .reply(200, [{ id: 123, name: "other", uniqueId: "X" }]);
  telegram.post("/bot" + process.env.BOT_TOKEN + "/answerCallbackQuery").reply(200, { ok: true });
  let capturedText = null;
  telegram.post("/bot" + process.env.BOT_TOKEN + "/sendMessage", (body) => { capturedText = body.text; return true; })
    .reply(200, { ok: true });

  await handleCallbackQuery(makeUpdate("1", 11, "commands:custom:123"));

  assert.ok(capturedText, "should respond with an error message");
  assert.strictEqual(
    devicesScope.isDone(),
    false,
    "GET /api/devices must NOT be consumed - 'custom' was passed as deviceId"
  );
});

// --- Custom command flow for a valid device ---

test("custom command flow: open commands -> select device -> custom picker -> execute", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  const chatId = 1;

  // 1. Main menu -> Commands -> device selector for device 7
  mockUser(traccar, chatId, 1);
  mockDevices(traccar, 1, [
    { id: 7, name: "car1", uniqueId: "UID7" },
    { id: 8, name: "car2", uniqueId: "UID8" }
  ]);
  telegram.post("/bot" + process.env.BOT_TOKEN + "/answerCallbackQuery").reply(200, { ok: true });
  let editedMessages = [];
  telegram.post("/bot" + process.env.BOT_TOKEN + "/editMessageText", (body) => {
    editedMessages.push(body);
    return true;
  }).reply(200, { ok: true });

  // 2. Enable the command: "commands" with subtype "custom" should edit the
  // message to show the custom command picker. The picker fetches
  // /api/commands/types?deviceId=7
  traccar
    .get("/api/commands/types")
    .query({ deviceId: "7" })
    .reply(200, ["customType", "setSpeed"]);

  await handleCallbackQuery(makeUpdate(chatId, 11, "cmd:commands:7:custom"));

  assert.ok(editedMessages.length > 0, "should have edited the message to the picker");
  const pickerMessage = editedMessages[editedMessages.length - 1];
  assert.ok(pickerMessage.reply_markup, "picker should have a keyboard");
  const buttons = pickerMessage.reply_markup.inline_keyboard.flat();
  const customButton = buttons.find((b) => b.text === "customType");
  assert.ok(customButton, "picker should list the custom command type");
  assert.strictEqual(
    customButton.callback_data,
    "cmd:custom:7:exec:customType",
    "execute button must retain numeric deviceId 7"
  );
});

test("full custom command execution sends POST /api/commands/send with the SAME numeric device", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  const chatId = 1;
  mockUser(traccar, chatId, 1);
  mockDevices(traccar, 1, [{ id: 7, name: "car1", uniqueId: "UID7" }]);
  let sentCmd = null;
  traccar.post("/api/commands/send", (body) => { sentCmd = body; return true; }).reply(200, {});

  telegram.post("/bot" + process.env.BOT_TOKEN + "/answerCallbackQuery").reply(200, { ok: true });
  telegram.post("/bot" + process.env.BOT_TOKEN + "/sendMessage").reply(200, { ok: true });

  await handleCallbackQuery(makeUpdate(chatId, 1, "cmd:custom:7:exec:customCommand"));

  assert.ok(sentCmd, "expected a Traccar command POST");
  assert.strictEqual(sentCmd.deviceId, 7);
  assert.strictEqual(sentCmd.type, "customCommand");
  assert.ok(traccar.isDone(), "no dangling device or command mocks");
});

test("custom command executes only on the SAME selected device (IDOR unchanged)", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  const chatId = 1;
  mockUser(traccar, chatId, 1);
  // User 1 only owns device 7. Trying to execute on device 999 must be rejected.
  mockDevices(traccar, 1, [{ id: 7, name: "car1", uniqueId: "UID7" }]);
  const cmdScope = traccar.post("/api/commands/send").reply(200, {});
  telegram.post("/bot" + process.env.BOT_TOKEN + "/answerCallbackQuery").reply(200, { ok: true });
  telegram.post("/bot" + process.env.BOT_TOKEN + "/sendMessage").reply(200, { ok: true });

  await handleCallbackQuery(makeUpdate(chatId, 1, "cmd:custom:999:exec:customCommand"));

  assert.strictEqual(
    cmdScope.isDone(),
    false,
    "no POST /api/commands/send should happen (unauthorized device)"
  );
});

// --- Malformed callback_data is rejected safely ---

test("malformed callback_data is rejected safely", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, "1", 1);
  telegram.post("/bot" + process.env.BOT_TOKEN + "/answerCallbackQuery").reply(200, { ok: true });
  let capturedText = null;
  telegram.post("/bot" + process.env.BOT_TOKEN + "/sendMessage", (body) => { capturedText = body.text; return true; })
    .reply(200, { ok: true });

  await handleCallbackQuery(makeUpdate("1", 1, "cmd:commands:banana:custom"));

  assert.ok(capturedText, "malformed callback should produce a response");
  assert.ok(capturedText.length > 0);
});

test("deviceId with zero / negative / empty segments rejected", () => {
  assert.strictEqual(parseCallbackData("cmd:commands:0").deviceIdValid, false);
  assert.strictEqual(parseCallbackData("cmd:commands:-1").deviceIdValid, false);
  assert.strictEqual(parseCallbackData("cmd:commands:").deviceIdValid, false);
  const parsed = parseCallbackData("cmd:commands:0");
  assert.strictEqual(validateCallbackData(parsed), true); // kind is valid
});

test("validateCallbackData rejects empty / missing data", () => {
  assert.strictEqual(validateCallbackData(parseCallbackData("")), false);
  assert.strictEqual(validateCallbackData(null), false);
});

// --- Sibling command types still work ---

test("engine confirm via cmd:schema still executes with numeric device", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 1, 1);
  mockDevices(traccar, 1, [{ id: 7, name: "car1", uniqueId: "UID7" }]);
  traccar.post("/api/commands/send", (body) => body.deviceId === 7 && body.type === "engineResume").reply(200, {});
  telegram.post("/bot" + process.env.BOT_TOKEN + "/answerCallbackQuery").reply(200, { ok: true });
  telegram.post("/bot" + process.env.BOT_TOKEN + "/sendMessage").reply(200, { ok: true });

  await handleCallbackQuery(makeUpdate("1", 11, "cmd:confirm:7:engine:on"));

  assert.ok(traccar.isDone(), "engineResume should be sent. Pending: " + traccar.pendingMocks());
  assert.ok(telegram.isDone(), "telegram mocks. Pending: " + telegram.pendingMocks());
});

// --- i18n keys resolve through the translation layer ---

test("commands_choose_type resolves through i18n (not raw key)", () => {
  assert.notStrictEqual(t("en", "commands_choose_type"), "commands_choose_type");
  assert.notStrictEqual(t("fr", "commands_choose_type"), "commands_choose_type");
  assert.ok(t("fr", "commands_choose_type").includes("commande"));
  assert.ok(t("en", "commands_choose_type").includes("command"));
});

test("btn_custom_command resolves through i18n (not raw key)", () => {
  assert.notStrictEqual(t("en", "btn_custom_command"), "btn_custom_command");
  assert.notStrictEqual(t("fr", "btn_custom_command"), "btn_custom_command");
  assert.ok(t("fr", "btn_custom_command").toLowerCase().includes("commande"));
  assert.ok(t("en", "btn_custom_command").toLowerCase().includes("custom"));
});

test("new i18n keys exist in every supported locale", async () => {
  const { TRANSLATIONS } = await import("../translations.js");
  const locales = Object.keys(TRANSLATIONS);
  for (const loc of locales) {
    assert.ok(TRANSLATIONS[loc].commands_choose_type, loc + " missing commands_choose_type");
    assert.ok(TRANSLATIONS[loc].btn_custom_command, loc + " missing btn_custom_command");
  }
});
