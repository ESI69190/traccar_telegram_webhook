import { test } from "node:test";
import assert from "node:assert";
import { setupTraccarNock, setupTelegramNock, cleanAll } from "./helpers/nock-helper.js";
import { handleAssoc } from "../controllers/assoc.js";
import { encryptAssocPassword } from "../services/security.js";
import { TRANSLATIONS } from "../translations.js";

function mockUser(scope, chatId, userId, email, phone) {
  scope
    .get("/api/users")
    .reply(200, [
      {
        id: userId,
        email,
        phone,
        login: email,
        attributes: { telegramChatId: String(chatId) }
      }
    ]);
}

test("handleAssoc contact sharing requires password when ASSOC_SECRET is set", async () => {
  process.env.ASSOC_SECRET = "assoc-secret-key";
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  const result = await handleAssoc(
    "123",
    { contact: { phone_number: "+33123456789" } },
    "en"
  );

  assert.strictEqual(result, true);
  assert.ok(
    traccar.isDone(),
    `Expected no Traccar requests when ASSOC_SECRET is set for contact share. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleAssoc verifies password via /api/session before updating", async () => {
  process.env.ASSOC_SECRET = "assoc-secret-key";
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();

  const password = "correct-password";
  const encrypted = encryptAssocPassword(password);
  mockUser(traccar, "123", 1, "user1@example.com", "+33123456789");
  traccar
    .post("/api/session", /email=user1%40example\.com&password=correct-password/)
    .reply(200, { id: 1, email: "user1@example.com" });
  traccar.get("/api/users/1").reply(200, { id: 1, email: "user1@example.com", attributes: {} });
  traccar
    .put("/api/users/1", (body) => body.attributes.telegramChatId === "123")
    .reply(200, { id: 1, email: "user1@example.com", attributes: { telegramChatId: "123" } });
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  const result = await handleAssoc(
    "123",
    { text: `/assoc +33123456789 ${encrypted}` },
    "en"
  );

  assert.strictEqual(result, true);
  assert.ok(
    traccar.isDone(),
    `Expected all Traccar mocks to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleAssoc rejects wrong password", async () => {
  process.env.ASSOC_SECRET = "assoc-secret-key";
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();

  const encrypted = encryptAssocPassword("wrong-password");
  mockUser(traccar, "123", 1, "user1@example.com", "+33123456789");
  traccar
    .post("/api/session")
    .reply(401, {});
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  const result = await handleAssoc(
    "123",
    { text: `/assoc +33123456789 ${encrypted}` },
    "en"
  );

  assert.strictEqual(result, true);
  assert.ok(
    traccar.isDone(),
    `Expected session mock to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleAssoc falls back to email when phone not found", async () => {
  process.env.ASSOC_SECRET = "assoc-secret-key";
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();

  const password = "correct-password";
  const encrypted = encryptAssocPassword(password);
  traccar.get("/api/users").reply(200, []);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .times(2)
    .reply(200, { ok: true });

  let result = await handleAssoc(
    "123",
    { text: `/assoc +33123456789 ${encrypted}` },
    "en"
  );
  assert.strictEqual(result, true);

  traccar.get("/api/users").reply(200, [
    { id: 2, email: "user2@example.com", login: "user2@example.com", attributes: {} }
  ]);
  traccar
    .post("/api/session", /email=user2%40example\.com&password=correct-password/)
    .reply(200, { id: 2, email: "user2@example.com" });
  traccar.get("/api/users/2").reply(200, { id: 2, email: "user2@example.com", attributes: {} });
  traccar
    .put("/api/users/2", (body) => body.attributes.telegramChatId === "123")
    .reply(200, { id: 2, email: "user2@example.com", attributes: { telegramChatId: "123" } });

  result = await handleAssoc("123", { text: "user2@example.com" }, "en");
  assert.strictEqual(result, true);
  assert.ok(
    traccar.isDone(),
    `Expected all Traccar mocks to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleAssoc rejects association without ASSOC_SECRET", async () => {
  const originalSecret = process.env.ASSOC_SECRET;
  delete process.env.ASSOC_SECRET;
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  const result = await handleAssoc(
    "123",
    { text: "/assoc +33123456789" },
    "en"
  );

  assert.strictEqual(result, true);
  assert.ok(
    traccar.isDone(),
    `Expected no Traccar requests without ASSOC_SECRET. Pending: ${traccar.pendingMocks()}`
  );
  process.env.ASSOC_SECRET = originalSecret;
});

// ===== REGRESSION TESTS FOR MINI APP HOTFIX =====

test("handleAssoc plain /assoc opens Mini App when configured", async () => {
  process.env.TELEGRAM_ASSOC_WEBAPP_URL = "https://example.com/miniapp";
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();

  // Capture the sent message to verify inline keyboard with web_app
  let capturedMessage = null;
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, (uri, requestBody) => {
      capturedMessage = requestBody;
      return { ok: true };
    });

  const result = await handleAssoc("123", { text: "/assoc" }, "en");

  assert.strictEqual(result, true);
  assert.ok(capturedMessage, "Expected Telegram sendMessage to be called");
  assert.ok(capturedMessage.reply_markup, "Expected reply_markup in message");
  assert.ok(capturedMessage.reply_markup.inline_keyboard, "Expected inline_keyboard");
  assert.ok(capturedMessage.reply_markup.inline_keyboard[0][0].web_app, "Expected web_app in button");
  const url = capturedMessage.reply_markup.inline_keyboard[0][0].web_app.url;
  assert.ok(url.includes("lang=en"), `Expected URL to contain lang=en, got: ${url}`);
  assert.ok(url.startsWith("https://example.com/miniapp"), `Expected URL to start with base URL, got: ${url}`);
  // sendPlainText escapes MarkdownV2, so the period is escaped
  assert.strictEqual(capturedMessage.text, "Tap the button below to securely connect your Traccar account via Telegram Mini App\\.");
  // Ensure no legacy pending state was created
  assert.ok(traccar.isDone(), "Expected no Traccar requests for Mini App flow");
});

test("handleAssoc /assoc telegram opens Mini App when configured", async () => {
  process.env.TELEGRAM_ASSOC_WEBAPP_URL = "https://example.com/miniapp";
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();

  let capturedMessage = null;
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, (uri, requestBody) => {
      capturedMessage = requestBody;
      return { ok: true };
    });

  const result = await handleAssoc("123", { text: "/assoc telegram" }, "en");

  assert.strictEqual(result, true);
  assert.ok(capturedMessage, "Expected Telegram sendMessage to be called");
  assert.ok(capturedMessage.reply_markup, "Expected reply_markup in message");
  assert.ok(capturedMessage.reply_markup.inline_keyboard, "Expected inline_keyboard");
  assert.ok(capturedMessage.reply_markup.inline_keyboard[0][0].web_app, "Expected web_app in button");
  const url = capturedMessage.reply_markup.inline_keyboard[0][0].web_app.url;
  assert.ok(url.includes("lang=en"), `Expected URL to contain lang=en, got: ${url}`);
  assert.ok(url.startsWith("https://example.com/miniapp"), `Expected URL to start with base URL, got: ${url}`);
  // sendPlainText escapes MarkdownV2, so the period is escaped
  assert.strictEqual(capturedMessage.text, "Tap the button below to securely connect your Traccar account via Telegram Mini App\\.");
  // Ensure no legacy pending state was created
  assert.ok(traccar.isDone(), "Expected no Traccar requests for Mini App flow");
});

test("handleAssoc plain /assoc shows config error when TELEGRAM_ASSOC_WEBAPP_URL missing", async () => {
  const originalUrl = process.env.TELEGRAM_ASSOC_WEBAPP_URL;
  delete process.env.TELEGRAM_ASSOC_WEBAPP_URL;
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();

  let capturedMessage = null;
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, (uri, requestBody) => {
      capturedMessage = requestBody;
      return { ok: true };
    });

  const result = await handleAssoc("123", { text: "/assoc" }, "en");

  assert.strictEqual(result, true);
  assert.ok(capturedMessage, "Expected Telegram sendMessage to be called");
  // Should show config error, not contact keyboard (sendPlainText escapes MarkdownV2)
  assert.strictEqual(capturedMessage.text, "Configuration error\\. Please contact administrator\\.");
  assert.ok(!capturedMessage.reply_markup?.keyboard, "Should NOT have contact keyboard");
  assert.ok(!capturedMessage.reply_markup?.inline_keyboard, "Should NOT have inline keyboard");
  assert.ok(traccar.isDone(), "Expected no Traccar requests");
  process.env.TELEGRAM_ASSOC_WEBAPP_URL = originalUrl;
});

test("handleAssoc /assoc telegram shows config error when TELEGRAM_ASSOC_WEBAPP_URL missing", async () => {
  const originalUrl = process.env.TELEGRAM_ASSOC_WEBAPP_URL;
  delete process.env.TELEGRAM_ASSOC_WEBAPP_URL;
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();

  let capturedMessage = null;
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, (uri, requestBody) => {
      capturedMessage = requestBody;
      return { ok: true };
    });

  const result = await handleAssoc("123", { text: "/assoc telegram" }, "en");

  assert.strictEqual(result, true);
  assert.ok(capturedMessage, "Expected Telegram sendMessage to be called");
  // Should show config error, not contact keyboard (sendPlainText escapes MarkdownV2)
  assert.strictEqual(capturedMessage.text, "Configuration error\\. Please contact administrator\\.");
  assert.ok(!capturedMessage.reply_markup?.keyboard, "Should NOT have contact keyboard");
  assert.ok(!capturedMessage.reply_markup?.inline_keyboard, "Should NOT have inline keyboard");
  assert.ok(traccar.isDone(), "Expected no Traccar requests");
  process.env.TELEGRAM_ASSOC_WEBAPP_URL = originalUrl;
});

test("handleAssoc explicit legacy /assoc <phone> <encryptedPassword> still works", async () => {
  process.env.ASSOC_SECRET = "assoc-secret-key";
  process.env.TELEGRAM_ASSOC_WEBAPP_URL = "https://example.com/miniapp";
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();

  const password = "correct-password";
  const encrypted = encryptAssocPassword(password);
  mockUser(traccar, "123", 1, "user1@example.com", "+33123456789");
  traccar
    .post("/api/session", /email=user1%40example\.com&password=correct-password/)
    .reply(200, { id: 1, email: "user1@example.com" });
  traccar.get("/api/users/1").reply(200, { id: 1, email: "user1@example.com", attributes: {} });
  traccar
    .put("/api/users/1", (body) => body.attributes.telegramChatId === "123")
    .reply(200, { id: 1, email: "user1@example.com", attributes: { telegramChatId: "123" } });
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  const result = await handleAssoc(
    "123",
    { text: `/assoc +33123456789 ${encrypted}` },
    "en"
  );

  assert.strictEqual(result, true);
  assert.ok(
    traccar.isDone(),
    `Expected all Traccar mocks to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleAssoc plain /assoc does NOT create legacy pending state", async () => {
  process.env.TELEGRAM_ASSOC_WEBAPP_URL = "https://example.com/miniapp";
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();

  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleAssoc("123", { text: "/assoc" }, "en");

  // The pendingChats map is internal, but we can verify no legacy flow was triggered
  // by ensuring no contact keyboard was sent and no Traccar requests were made
  assert.ok(traccar.isDone(), "Expected no Traccar requests for Mini App flow");
});

// ===== REGRESSION TESTS FOR MINI APP LOCALE PROPAGATION =====

test("handleAssoc plain /assoc propagates locale to Mini App URL (fr)", async () => {
  process.env.TELEGRAM_ASSOC_WEBAPP_URL = "https://example.com/miniapp.html";
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();

  let capturedMessage = null;
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, (uri, requestBody) => {
      capturedMessage = requestBody;
      return { ok: true };
    });

  const result = await handleAssoc("123", { text: "/assoc" }, "fr");

  assert.strictEqual(result, true);
  assert.ok(capturedMessage, "Expected Telegram sendMessage to be called");
  assert.ok(capturedMessage.reply_markup, "Expected reply_markup in message");
  assert.ok(capturedMessage.reply_markup.inline_keyboard, "Expected inline_keyboard");
  assert.ok(capturedMessage.reply_markup.inline_keyboard[0][0].web_app, "Expected web_app in button");
  
  const url = capturedMessage.reply_markup.inline_keyboard[0][0].web_app.url;
  assert.ok(url.includes("lang=fr"), `Expected URL to contain lang=fr, got: ${url}`);
  assert.ok(url.startsWith("https://example.com/miniapp.html"), `Expected URL to start with base URL, got: ${url}`);
});

test("handleAssoc plain /assoc propagates locale to Mini App URL with existing query params (de)", async () => {
  process.env.TELEGRAM_ASSOC_WEBAPP_URL = "https://example.com/miniapp.html?backend=https%3A%2F%2Fapi.example.com";
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();

  let capturedMessage = null;
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, (uri, requestBody) => {
      capturedMessage = requestBody;
      return { ok: true };
    });

  const result = await handleAssoc("123", { text: "/assoc" }, "de");

  assert.strictEqual(result, true);
  assert.ok(capturedMessage, "Expected Telegram sendMessage to be called");
  
  const url = capturedMessage.reply_markup.inline_keyboard[0][0].web_app.url;
  assert.ok(url.includes("backend=https%3A%2F%2Fapi.example.com"), `Expected URL to preserve backend param, got: ${url}`);
  assert.ok(url.includes("lang=de"), `Expected URL to contain lang=de, got: ${url}`);
  // Ensure no duplicate lang parameter
  const langCount = (url.match(/lang=/g) || []).length;
  assert.strictEqual(langCount, 1, `Expected exactly one lang parameter, got ${langCount}: ${url}`);
});

test("handleAssoc plain /assoc replaces existing lang parameter (fr)", async () => {
  process.env.TELEGRAM_ASSOC_WEBAPP_URL = "https://example.com/miniapp.html?lang=en";
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();

  let capturedMessage = null;
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, (uri, requestBody) => {
      capturedMessage = requestBody;
      return { ok: true };
    });

  const result = await handleAssoc("123", { text: "/assoc" }, "fr");

  assert.strictEqual(result, true);
  assert.ok(capturedMessage, "Expected Telegram sendMessage to be called");
  
  const url = capturedMessage.reply_markup.inline_keyboard[0][0].web_app.url;
  assert.ok(url.includes("lang=fr"), `Expected URL to contain lang=fr, got: ${url}`);
  // Ensure no duplicate lang parameter
  const langCount = (url.match(/lang=/g) || []).length;
  assert.strictEqual(langCount, 1, `Expected exactly one lang parameter, got ${langCount}: ${url}`);
});

test("handleAssoc plain /assoc propagates locale to Mini App URL (ja)", async () => {
  process.env.TELEGRAM_ASSOC_WEBAPP_URL = "https://example.com/miniapp.html";
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();

  let capturedMessage = null;
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, (uri, requestBody) => {
      capturedMessage = requestBody;
      return { ok: true };
    });

  const result = await handleAssoc("123", { text: "/assoc" }, "ja");

  assert.strictEqual(result, true);
  assert.ok(capturedMessage, "Expected Telegram sendMessage to be called");
  
  const url = capturedMessage.reply_markup.inline_keyboard[0][0].web_app.url;
  assert.ok(url.includes("lang=ja"), `Expected URL to contain lang=ja, got: ${url}`);
});

test("handleAssoc plain /assoc propagates locale to Mini App URL (zh)", async () => {
  process.env.TELEGRAM_ASSOC_WEBAPP_URL = "https://example.com/miniapp.html";
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();

  let capturedMessage = null;
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, (uri, requestBody) => {
      capturedMessage = requestBody;
      return { ok: true };
    });

  const result = await handleAssoc("123", { text: "/assoc" }, "zh");

  assert.strictEqual(result, true);
  assert.ok(capturedMessage, "Expected Telegram sendMessage to be called");
  
  const url = capturedMessage.reply_markup.inline_keyboard[0][0].web_app.url;
  assert.ok(url.includes("lang=zh"), `Expected URL to contain lang=zh, got: ${url}`);
});

// ===== REGRESSION TESTS FOR ALL 11 LOCALES =====

const SUPPORTED_LOCALES = ["en", "fr", "es", "pt", "tr", "ru", "zh", "ja", "de", "ko", "it"];

for (const locale of SUPPORTED_LOCALES) {
  test(`handleAssoc plain /assoc opens Mini App with correct locale (${locale})`, async () => {
    process.env.TELEGRAM_ASSOC_WEBAPP_URL = "https://example.com/miniapp";
    cleanAll();
    const traccar = setupTraccarNock();
    const telegram = setupTelegramNock();

    let capturedMessage = null;
    telegram
      .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
      .reply(200, (uri, requestBody) => {
        capturedMessage = requestBody;
        return { ok: true };
      });

    const result = await handleAssoc("123", { text: "/assoc" }, locale);

    assert.strictEqual(result, true);
    assert.ok(capturedMessage, `Expected Telegram sendMessage to be called for locale ${locale}`);
    assert.ok(capturedMessage.reply_markup, `Expected reply_markup in message for locale ${locale}`);
    assert.ok(capturedMessage.reply_markup.inline_keyboard, `Expected inline_keyboard for locale ${locale}`);
    assert.ok(capturedMessage.reply_markup.inline_keyboard[0][0].web_app, `Expected web_app in button for locale ${locale}`);
    const url = capturedMessage.reply_markup.inline_keyboard[0][0].web_app.url;
    assert.ok(url.includes(`lang=${locale}`), `Expected URL to contain lang=${locale}, got: ${url}`);
    assert.ok(url.startsWith("https://example.com/miniapp"), `Expected URL to start with base URL, got: ${url}`);
    // Verify the text is the localized miniapp_open_prompt (escaped by sendPlainText)
    // We can't easily check the exact escaped text without knowing the translation,
    // but we can verify it's not the legacy message
    assert.ok(!capturedMessage.text.includes("international_phone"), `Should NOT contain legacy phone prompt for locale ${locale}`);
    assert.ok(!capturedMessage.text.includes("encrypted"), `Should NOT contain encrypted password prompt for locale ${locale}`);
    assert.ok(!capturedMessage.text.includes("Share contact"), `Should NOT contain contact sharing prompt for locale ${locale}`);
    assert.ok(traccar.isDone(), `Expected no Traccar requests for Mini App flow in locale ${locale}`);
  });

  test(`handleAssoc /assoc telegram opens Mini App with correct locale (${locale})`, async () => {
    process.env.TELEGRAM_ASSOC_WEBAPP_URL = "https://example.com/miniapp";
    cleanAll();
    const traccar = setupTraccarNock();
    const telegram = setupTelegramNock();

    let capturedMessage = null;
    telegram
      .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
      .reply(200, (uri, requestBody) => {
        capturedMessage = requestBody;
        return { ok: true };
      });

    const result = await handleAssoc("123", { text: "/assoc telegram" }, locale);

    assert.strictEqual(result, true);
    assert.ok(capturedMessage, `Expected Telegram sendMessage to be called for locale ${locale}`);
    assert.ok(capturedMessage.reply_markup, `Expected reply_markup in message for locale ${locale}`);
    assert.ok(capturedMessage.reply_markup.inline_keyboard, `Expected inline_keyboard for locale ${locale}`);
    assert.ok(capturedMessage.reply_markup.inline_keyboard[0][0].web_app, `Expected web_app in button for locale ${locale}`);
    const url = capturedMessage.reply_markup.inline_keyboard[0][0].web_app.url;
    assert.ok(url.includes(`lang=${locale}`), `Expected URL to contain lang=${locale}, got: ${url}`);
    assert.ok(url.startsWith("https://example.com/miniapp"), `Expected URL to start with base URL, got: ${url}`);
    assert.ok(!capturedMessage.text.includes("international_phone"), `Should NOT contain legacy phone prompt for locale ${locale}`);
    assert.ok(!capturedMessage.text.includes("encrypted"), `Should NOT contain encrypted password prompt for locale ${locale}`);
    assert.ok(!capturedMessage.text.includes("Share contact"), `Should NOT contain contact sharing prompt for locale ${locale}`);
    assert.ok(traccar.isDone(), `Expected no Traccar requests for Mini App flow in locale ${locale}`);
  });

  test(`handleAssoc plain /assoc shows config error when TELEGRAM_ASSOC_WEBAPP_URL missing (${locale})`, async () => {
    const originalUrl = process.env.TELEGRAM_ASSOC_WEBAPP_URL;
    delete process.env.TELEGRAM_ASSOC_WEBAPP_URL;
    cleanAll();
    const traccar = setupTraccarNock();
    const telegram = setupTelegramNock();

    let capturedMessage = null;
    telegram
      .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
      .reply(200, (uri, requestBody) => {
        capturedMessage = requestBody;
        return { ok: true };
      });

    const result = await handleAssoc("123", { text: "/assoc" }, locale);

    assert.strictEqual(result, true);
    assert.ok(capturedMessage, `Expected Telegram sendMessage to be called for locale ${locale}`);
    // Should show config error (escaped by sendPlainText) - use the actual translation
    const expectedError = TRANSLATIONS[locale]?.miniapp_error_config || "Configuration error. Please contact administrator.";
    // sendPlainText escapes MarkdownV2 special characters (including .)
    // Check for the first word of the error message (before any escaped punctuation)
    const firstWord = expectedError.split(/[\s.]+/)[0];
    assert.ok(capturedMessage.text.includes(firstWord), `Should contain config error for locale ${locale}: ${capturedMessage.text}`);
    assert.ok(!capturedMessage.reply_markup?.keyboard, `Should NOT have contact keyboard for locale ${locale}`);
    assert.ok(!capturedMessage.reply_markup?.inline_keyboard, `Should NOT have inline keyboard for locale ${locale}`);
    assert.ok(traccar.isDone(), `Expected no Traccar requests for locale ${locale}`);
    process.env.TELEGRAM_ASSOC_WEBAPP_URL = originalUrl;
  });
}
