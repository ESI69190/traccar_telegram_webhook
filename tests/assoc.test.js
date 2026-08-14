import { test } from "node:test";
import assert from "node:assert";
import { setupTraccarNock, setupTelegramNock, cleanAll } from "./helpers/nock-helper.js";
import { handleAssoc } from "../controllers/assoc.js";
import { encryptAssocPassword } from "../services/security.js";

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
