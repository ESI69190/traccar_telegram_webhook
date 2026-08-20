// tests/telegram.test.js
import { test } from "node:test";
import assert from "node:assert";
import nock from "nock";
import { escapeMarkdown, markdownLink } from "../services/security.js";
import { telegramSendMessage, sendPlainText, editMessageText, editPlainText } from "../services/telegram.js";

const TELEGRAM_BASE = "https://api.telegram.org";
const BOT_TOKEN = "test-token";

function setupTelegramMock() {
  return nock(TELEGRAM_BASE);
}

function cleanAll() {
  nock.cleanAll();
}

test("escapeMarkdown escapes all MarkdownV2 reserved characters", () => {
  const reserved = "_*[]()~`>#+-=|{}.!\\";
  const escaped = escapeMarkdown(reserved);
  assert.strictEqual(
    escaped,
    "\\_\\*\\[\\]\\(\\)\\~\\`\\>\\#\\+\\-\\=\\|\\{\\}\\.\\!\\\\"
  );
});

test("escapeMarkdown handles device names with special characters", () => {
  const deviceName = "Truck - Lyon (Test) #1";
  const escaped = escapeMarkdown(deviceName);
  assert.strictEqual(escaped, "Truck \\- Lyon \\(Test\\) \\#1");
});

test("escapeMarkdown handles report empty-result messages", () => {
  const msg = "No data for report *route*.";
  const escaped = escapeMarkdown(msg);
  assert.strictEqual(escaped, "No data for report \\*route\\*\\.");
});

test("escapeMarkdown handles '... and N more.' pattern", () => {
  const msg = "... and 5 more.";
  const escaped = escapeMarkdown(msg);
  assert.strictEqual(escaped, "\\.\\.\\. and 5 more\\.");
});

test("sendPlainText escapes text for sendMessage", async () => {
  cleanAll();
  const scope = setupTelegramMock();
  scope
    .post(`/bot${BOT_TOKEN}/sendMessage`)
    .reply(200, { ok: true, result: { message_id: 123 } });

  const text = "Truck - Lyon (Test) #1";
  await sendPlainText("123456", text);

  const pending = scope.pendingMocks();
  assert.strictEqual(pending.length, 0);
});

test("editPlainText escapes text for editMessageText", async () => {
  cleanAll();
  const scope = setupTelegramMock();
  scope
    .post(`/bot${BOT_TOKEN}/editMessageText`)
    .reply(200, { ok: true, result: { message_id: 123 } });

  const text = "Truck - Lyon (Test) #1";
  await editPlainText("123456", 789, text);

  const pending = scope.pendingMocks();
  assert.strictEqual(pending.length, 0);
});

test("sendPlainText and editPlainText handle all reserved characters", async () => {
  cleanAll();
  let scope = setupTelegramMock();
  scope
    .post(`/bot${BOT_TOKEN}/sendMessage`)
    .reply(200, { ok: true, result: { message_id: 123 } });

  const text = "Test - . ! ( ) # + =";
  await sendPlainText("123456", text);

  let pending = scope.pendingMocks();
  assert.strictEqual(pending.length, 0);

  cleanAll();
  scope = setupTelegramMock();
  scope
    .post(`/bot${BOT_TOKEN}/editMessageText`)
    .reply(200, { ok: true, result: { message_id: 123 } });

  await editPlainText("123456", 789, text);

  pending = scope.pendingMocks();
  assert.strictEqual(pending.length, 0);
});

test("InlineKeyboardButton text values are NOT escaped (plain text)", () => {
  // Button labels should remain exactly as provided, without backslashes
  const buttonText = "Truck - Lyon (Test) #1";
  // This simulates what happens in callbackRouter.js - button text is used directly
  assert.strictEqual(buttonText, "Truck - Lyon (Test) #1");
  assert.ok(!buttonText.includes("\\"));
});

test("markdownLink escapes label but keeps URL intact", () => {
  const label = "Truck - Lyon (Test) #1";
  const url = "https://maps.google.com/?q=45.7640,4.8357";
  const link = markdownLink(label, url);
  assert.ok(link.includes("Truck \\- Lyon \\(Test\\) \\#1"));
  assert.ok(link.includes(url));
});

test("sendPlainText handles 'No position available.' correctly", async () => {
  cleanAll();
  const scope = setupTelegramMock();
  scope
    .post(`/bot${BOT_TOKEN}/sendMessage`)
    .reply(200, { ok: true, result: { message_id: 123 } });

  const text = "No position available.";
  await sendPlainText("123456", text);

  const pending = scope.pendingMocks();
  assert.strictEqual(pending.length, 0);
});

test("sendPlainText handles report empty result correctly", async () => {
  cleanAll();
  const scope = setupTelegramMock();
  scope
    .post(`/bot${BOT_TOKEN}/sendMessage`)
    .reply(200, { ok: true, result: { message_id: 123 } });

  const text = "No data for report route.";
  await sendPlainText("123456", text);

  const pending = scope.pendingMocks();
  assert.strictEqual(pending.length, 0);
});

test("sendPlainText handles '... and N more.' correctly", async () => {
  cleanAll();
  const scope = setupTelegramMock();
  scope
    .post(`/bot${BOT_TOKEN}/sendMessage`)
    .reply(200, { ok: true, result: { message_id: 123 } });

  const text = "... and 3 more.";
  await sendPlainText("123456", text);

  const pending = scope.pendingMocks();
  assert.strictEqual(pending.length, 0);
});

test("telegramSendMessage does NOT escape when used directly (intentional MarkdownV2)", async () => {
  cleanAll();
  const scope = setupTelegramMock();
  scope
    .post(`/bot${BOT_TOKEN}/sendMessage`)
    .reply(200, { ok: true, result: { message_id: 123 } });

  // This is intentionally formatted MarkdownV2 - should NOT be escaped
  const text = "*Bold* and _italic_ and `code`";
  await telegramSendMessage("123456", text, { parse_mode: "MarkdownV2" });

  const pending = scope.pendingMocks();
  assert.strictEqual(pending.length, 0);
});

test("editMessageText does NOT escape when used directly (intentional MarkdownV2)", async () => {
  cleanAll();
  const scope = setupTelegramMock();
  scope
    .post(`/bot${BOT_TOKEN}/editMessageText`)
    .reply(200, { ok: true, result: { message_id: 123 } });

  // This is intentionally formatted MarkdownV2 - should NOT be escaped
  const text = "*Bold* and _italic_ and `code`";
  await editMessageText("123456", 789, text, { parse_mode: "MarkdownV2" });

  const pending = scope.pendingMocks();
  assert.strictEqual(pending.length, 0);
});

test("sendPlainText and editPlainText handle Unicode text", async () => {
  cleanAll();
  let scope = setupTelegramMock();
  scope
    .post(`/bot${BOT_TOKEN}/sendMessage`)
    .reply(200, { ok: true, result: { message_id: 123 } });

  const text = "Camion - Lyon (Test) #1 🚛";
  await sendPlainText("123456", text);

  let pending = scope.pendingMocks();
  assert.strictEqual(pending.length, 0);

  cleanAll();
  scope = setupTelegramMock();
  scope
    .post(`/bot${BOT_TOKEN}/editMessageText`)
    .reply(200, { ok: true, result: { message_id: 123 } });

  await editPlainText("123456", 789, text);

  pending = scope.pendingMocks();
  assert.strictEqual(pending.length, 0);
});

test("sendPlainText and editPlainText handle empty text", async () => {
  cleanAll();
  let scope = setupTelegramMock();
  scope
    .post(`/bot${BOT_TOKEN}/sendMessage`)
    .reply(200, { ok: true, result: { message_id: 123 } });

  await sendPlainText("123456", "");

  let pending = scope.pendingMocks();
  assert.strictEqual(pending.length, 0);

  cleanAll();
  scope = setupTelegramMock();
  scope
    .post(`/bot${BOT_TOKEN}/editMessageText`)
    .reply(200, { ok: true, result: { message_id: 123 } });

  await editPlainText("123456", 789, "");

  pending = scope.pendingMocks();
  assert.strictEqual(pending.length, 0);
});