import { test } from "node:test";
import assert from "node:assert";
import { setupTraccarNock, setupTelegramNock, cleanAll } from "./helpers/nock-helper.js";

// Controllers must be imported after setup.js has set env vars.
import { handleTrack } from "../controllers/track.js";
import { handleHistory } from "../controllers/history.js";
import { handlePositions } from "../controllers/positions.js";
import handleOrders from "../controllers/orders.js";
import { handleAssoc } from "../controllers/assoc.js";
import { handleReports } from "../controllers/reports.js";

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

function mockTwoUsers(scope, chatIdA, userIdA, chatIdB, userIdB) {
  scope
    .get("/api/users")
    .reply(200, [
      {
        id: userIdA,
        attributes: { telegramChatId: String(chatIdA) },
        login: "userA",
        email: "userA@example.com"
      },
      {
        id: userIdB,
        attributes: { telegramChatId: String(chatIdB) },
        login: "userB",
        email: "userB@example.com"
      }
    ]);
}

function mockDevicesForUser(scope, userId, extraDevices = []) {
  const devices = [
    {
      id: 1,
      name: "car1",
      uniqueId: "UID1",
      attributes: { plate: "ABC123" }
    }
  ];
  scope
    .get("/api/devices")
    .query({ userId: String(userId) })
    .reply(200, devices.concat(extraDevices))
    .persist();
}

function mockPositions(scope, deviceId) {
  return scope
    .get("/api/positions")
    .query((query) => String(query.deviceId) === String(deviceId) && query.from && query.to)
    .reply(200, [
      {
        latitude: 48.8,
        longitude: 2.3,
        speed: 50,
        serverTime: "2024-01-01T00:00:00Z",
        attributes: { ignition: true, battery: 85 }
      }
    ]);
}

test("handleTrack rejects unauthorized device", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  mockDevicesForUser(traccar, 1);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

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
  mockDevicesForUser(traccar, 1);
  mockPositions(traccar, 1);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleTrack("123", "/track car1", "en");

  assert.ok(
    traccar.isDone(),
    `Expected all Traccar mocks to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleTrack escapes MarkdownV2 in device name and attributes", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  traccar
    .get("/api/devices")
    .query({ userId: "1" })
    .reply(200, [
      {
        id: 1,
        name: "Vehicle_01",
        uniqueId: "UID1",
        attributes: {
          plate: "AB-123-CD",
          note: "has _special_ *chars*"
        }
      }
    ])
    .persist();
  mockPositions(traccar, 1);
  let capturedText;
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage", (body) => {
      capturedText = body.text;
      return true;
    })
    .reply(200, { ok: true });

  await handleTrack("123", "/track Vehicle_01", "en");

  assert.ok(
    traccar.isDone(),
    `Expected all Traccar mocks to be consumed. Pending: ${traccar.pendingMocks()}`
  );
  assert.ok(capturedText.includes("Vehicle\\_01"), "Device name should be escaped");
  assert.ok(capturedText.includes("has \\_special\\_ \\*chars\\*"), "Attribute value should be escaped");
  assert.ok(capturedText.includes("*Device*"), "Intentional Markdown bold should remain");
  assert.ok(capturedText.includes("48\\.8,2\\.3"), "Link label should contain escaped coordinates");
  assert.ok(capturedText.includes("https://www.google.com/maps/search/?api=1&query="), "Link URL should contain Google Maps query");
});

test("handleHistory caps limit at MAX_LIMIT", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  mockDevicesForUser(traccar, 1);
  traccar
    .get("/api/positions")
    .query((query) => String(query.deviceId) === "1" && query.from && query.to)
    .reply(200, []);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleHistory("123", "/history car1 99999", "en");

  assert.ok(
    traccar.isDone(),
    `Expected positions mock to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handlePositions caps limit at MAX_LIMIT", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  mockDevicesForUser(traccar, 1);
  traccar
    .get("/api/positions")
    .query((query) => String(query.deviceId) === "1" && query.from && query.to)
    .reply(200, []);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handlePositions("123", "/positions car1 99999", "en");

  assert.ok(
    traccar.isDone(),
    `Expected positions mock to be consumed. Pending: ${traccar.pendingMocks()}`
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

test("handleOrders create posts openapi Order schema", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  traccar
    .post("/api/orders", (body) =>
      body.uniqueId === "ORD-1" &&
      body.description === "desc" &&
      body.fromAddress === "from" &&
      body.toAddress === "to"
    )
    .reply(200, { id: 10, uniqueId: "ORD-1" });
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleOrders("123", "/orders create ORD-1 desc from to", "en");

  assert.ok(
    traccar.isDone(),
    `Expected POST /api/orders with correct schema to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleOrders update fetches order and uses openapi schema", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  traccar
    .get("/api/orders/100")
    .reply(200, { id: 100, uniqueId: "ORD-100", description: "old", fromAddress: "a", toAddress: "b", attributes: {} });
  traccar
    .put("/api/orders/100", (body) =>
      body.id === 100 &&
      body.uniqueId === "ORD-NEW" &&
      body.description === "desc" &&
      body.fromAddress === "from" &&
      body.toAddress === "to"
    )
    .reply(200, { id: 100, uniqueId: "ORD-NEW" });
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleOrders("123", "/orders update 100 ORD-NEW desc from to", "en");

  assert.ok(
    traccar.isDone(),
    `Expected GET and PUT /api/orders/100 to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleOrders delete fetches order before deleting", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  traccar
    .get("/api/orders/100")
    .reply(200, { id: 100, uniqueId: "ORD-100" });
  traccar
    .delete("/api/orders/100")
    .reply(204);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleOrders("123", "/orders delete 100", "en");

  assert.ok(
    traccar.isDone(),
    `Expected GET and DELETE /api/orders/100 to be consumed. Pending: ${traccar.pendingMocks()}`
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

test("handleReports rejects unauthorized device", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  mockDevicesForUser(traccar, 1);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleReports("123", "/reports route unknown-device", "en");

  assert.ok(
    traccar.isDone(),
    `Expected device authorization mock to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleReports requests route report with from/to", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  mockDevicesForUser(traccar, 1);
  traccar
    .get("/api/reports/route")
    .query((query) =>
      String(query.deviceId) === "1" &&
      query.from &&
      query.to
    )
    .reply(200, [{ latitude: 48.8, longitude: 2.3 }]);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleReports("123", "/reports route car1", "en");

  assert.ok(
    traccar.isDone(),
    `Expected reports/route mock to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});
