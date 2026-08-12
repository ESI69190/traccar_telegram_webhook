import { test } from "node:test";
import assert from "node:assert";
import { setupTraccarNock, setupTelegramNock, cleanAll } from "./helpers/nock-helper.js";

// Controllers must be imported after setup.js has set env vars.
import { handleTrack } from "../controllers/track.js";
import { handleHistory } from "../controllers/history.js";
import { handlePositions } from "../controllers/positions.js";
import handleOrders from "../controllers/orders.js";
import { handleAssoc } from "../controllers/assoc.js";

function mockUser(scope, chatId, userId) {
  scope
    .get("/api/users")
    .reply(200, [
      {
        id: userId,
        attributes: { telegramChatId: String(chatId) },
        login: "user1",
        email: "user1@example.com",
      },
    ]);
}

function mockTwoUsers(scope, chatIdA, userIdA, chatIdB, userIdB) {
  scope
    .get("/api/users")
    .reply(200, [
      {
        id: userIdA,
        attributes: { telegramChatId: String(chatIdA) },
        login: "userA",
        email: "userA@example.com",
      },
      {
        id: userIdB,
        attributes: { telegramChatId: String(chatIdB) },
        login: "userB",
        email: "userB@example.com",
      },
    ]);
}

function mockDevices(scope) {
  scope.get("/api/devices").reply(200, [
    {
      id: 1,
      name: "car1",
      uniqueId: "UID1",
      attributes: { telegramOwner: "123", plate: "ABC123" },
    },
    {
      id: 2,
      name: "car2",
      uniqueId: "UID2",
      attributes: { telegramOwner: "999", plate: "XYZ999" },
    },
  ]).persist();
}

test("handleTrack rejects unauthorized device", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  mockDevices(traccar);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  // Should complete without throwing; no /api/positions request is made
  // because car2 is not owned by chatId 123.
  await handleTrack("123", "/track car2", "en");

  assert.ok(
    traccar.isDone(),
    `All Traccar mocks should be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleTrack allows authorized device", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  mockDevices(traccar);
  traccar
    .get("/api/positions?deviceId=1&limit=1")
    .reply(200, [
      {
        latitude: 48.8,
        longitude: 2.3,
        speed: 50,
        serverTime: "2024-01-01T00:00:00Z",
        attributes: { ignition: true, battery: 85 },
      },
    ]);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleTrack("123", "/track car1", "en");

  assert.ok(
    traccar.isDone(),
    `Expected all Traccar mocks to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleHistory caps limit at MAX_LIMIT", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  mockDevices(traccar);
  traccar
    .get("/api/positions?deviceId=1&limit=50")
    .reply(200, []);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleHistory("123", "/history car1 99999", "en");

  assert.ok(
    traccar.isDone(),
    `Expected limit=50 mock to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handlePositions caps limit at MAX_LIMIT", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  mockDevices(traccar);
  traccar
    .get("/api/positions?deviceId=1&limit=50")
    .reply(200, []);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handlePositions("123", "/positions car1 99999", "en");

  assert.ok(
    traccar.isDone(),
    `Expected limit=50 mock to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleOrders rejects path traversal in update ID", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleOrders(
    "123",
    "/orders update 123/../users/456 name desc start end",
    "en"
  );

  // All registered mocks (GET /api/users) should be consumed.
  // No PUT request was made because isPositiveIntegerId rejected the ID.
  assert.ok(
    traccar.isDone(),
    `Expected all Traccar mocks to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleOrders rejects path traversal in delete ID", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleOrders("123", "/orders delete 123/../devices/456", "en");

  assert.ok(
    traccar.isDone(),
    `Expected all Traccar mocks to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleOrders get scopes by userId in query params", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  traccar
    .get("/api/orders")
    .query({ userId: "1" })
    .reply(200, []);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleOrders("123", "/orders get", "en");

  assert.ok(
    traccar.isDone(),
    `Expected orders mock with userId=1 to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleOrders create scopes order to authenticated user", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  traccar
    .post("/api/orders", (body) => body.userId === 1)
    .reply(200, { id: 10, userId: 1 });
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleOrders("123", "/orders create name desc start end", "en");

  assert.ok(
    traccar.isDone(),
    `Expected POST /api/orders with userId=1 to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleOrders cannot update another user's order", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockTwoUsers(traccar, 123, 1, 999, 2);
  traccar
    .get("/api/orders/100")
    .reply(200, { id: 100, userId: 2, name: "orderB" });
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleOrders("123", "/orders update 100 name desc start end", "en");

  assert.ok(
    traccar.isDone(),
    `Expected GET /api/orders/100 to be consumed and no PUT. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleOrders cannot delete another user's order", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockTwoUsers(traccar, 123, 1, 999, 2);
  traccar
    .get("/api/orders/100")
    .reply(200, { id: 100, userId: 2, name: "orderB" });
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleOrders("123", "/orders delete 100", "en");

  assert.ok(
    traccar.isDone(),
    `Expected GET /api/orders/100 to be consumed and no DELETE. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleOrders update returns generic failure for nonexistent order", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  traccar.get("/api/orders/999").reply(404, {});
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleOrders("123", "/orders update 999 name desc start end", "en");

  assert.ok(
    traccar.isDone(),
    `Expected GET /api/orders/999 to be consumed and no PUT. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleAssoc contact sharing requires password when ASSOC_SECRET is set", async () => {
  process.env.ASSOC_SECRET = "assoc-secret-key";
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  // When ASSOC_SECRET is set, sharing contact does NOT look up the user;
  // it immediately enters a pending state asking for the encrypted password.
  // Therefore no Traccar request should be made.
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  const result = await handleAssoc(
    "123",
    { contact: { phone_number: "+33123456789" } },
    "en"
  );

  assert.strictEqual(result, true);
  // Verify no Traccar calls were made (nock would throw on unmatched requests).
  assert.ok(
    traccar.isDone(),
    `Expected no Traccar requests when ASSOC_SECRET is set for contact share. Pending: ${traccar.pendingMocks()}`
  );
});
