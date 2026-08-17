import { test } from "node:test";
import assert from "node:assert";
import { setupTraccarNock, setupTelegramNock, cleanAll } from "./helpers/nock-helper.js";

// Controllers must be imported after setup.js has set env vars.
import { handleTrack } from "../controllers/track.js";
import { handleHistory } from "../controllers/history.js";
import { handlePositions } from "../controllers/positions.js";
import { handleStatus } from "../controllers/status.js";
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

test("handleTrack escapes MarkdownV2 hash and hyphens in static template", async () => {
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
        name: "Test#Device",
        uniqueId: "UID1",
        attributes: {
          plate: "AB-123-CD"
        }
      }
    ])
    .persist();
  traccar
    .get("/api/positions")
    .query((query) => String(query.deviceId) === "1" && query.from && query.to)
    .reply(200, [
      {
        latitude: -33.8688,
        longitude: 151.2093,
        speed: 50,
        serverTime: "2024-01-01T00:00:00Z",
        attributes: { ignition: true, battery: 85 }
      }
    ]);
  let capturedText;
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage", (body) => {
      capturedText = body.text;
      return true;
    })
    .reply(200, { ok: true });

  await handleTrack("123", "/track Test#Device", "en");

  assert.ok(
    traccar.isDone(),
    `Expected all Traccar mocks to be consumed. Pending: ${traccar.pendingMocks()}`
  );
  // Verify # is escaped in static template (not in dynamic value)
  assert.ok(capturedText.includes("\\#"), "Hash in static template should be escaped");
  // Verify leading hyphens are escaped
  assert.ok(capturedText.includes("\\- Date:"), "Leading hyphen in Date should be escaped");
  assert.ok(capturedText.includes("\\- Coordinates:"), "Leading hyphen in Coordinates should be escaped");
  assert.ok(capturedText.includes("\\- Speed:"), "Leading hyphen in Speed should be escaped");
  assert.ok(capturedText.includes("\\- State:"), "Leading hyphen in State should be escaped");
  assert.ok(capturedText.includes("\\- Battery:"), "Leading hyphen in Battery should be escaped");
  // Verify dynamic value with # is escaped
  assert.ok(capturedText.includes("Test\\#Device"), "Dynamic value with # should be escaped");
  // Verify Google Maps link with negative coordinates works
  assert.ok(capturedText.includes("https://www.google.com/maps/search/?api=1&query="), "Google Maps link should be present");
  assert.ok(capturedText.includes("-33\\.8688,151\\.2093"), "Negative coordinates should be escaped in link label");
});

test("handleHistory escapes MarkdownV2 hash and hyphens", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  mockDevicesForUser(traccar, 1);
  traccar
    .get("/api/positions")
    .query((query) => String(query.deviceId) === "1" && query.from && query.to)
    .reply(200, [
      {
        latitude: 45.6997,
        longitude: 4.8631,
        serverTime: "2024-01-01T00:00:00Z"
      },
      {
        latitude: -33.8688,
        longitude: -151.2093,
        serverTime: "2024-01-02T00:00:00Z"
      }
    ]);
  let capturedText;
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage", (body) => {
      capturedText = body.text;
      return true;
    })
    .reply(200, { ok: true });

  await handleHistory("123", "/history car1 2", "en");

  assert.ok(
    traccar.isDone(),
    `Expected positions mock to be consumed. Pending: ${traccar.pendingMocks()}`
  );
  // Verify # is escaped in position numbering
  assert.ok(capturedText.includes("\\#1"), "Position number #1 should be escaped");
  assert.ok(capturedText.includes("\\#2"), "Position number #2 should be escaped");
  // Verify leading hyphens are escaped
  assert.ok(capturedText.includes("\\- Date:"), "Leading hyphen in Date should be escaped");
  assert.ok(capturedText.includes("\\- Coordinates:"), "Leading hyphen in Coordinates should be escaped");
  // Verify Google Maps links with negative coordinates
  assert.ok(capturedText.includes("45\\.6997,4\\.8631"), "Positive coordinates should be escaped in link label");
  assert.ok(capturedText.includes("\\-33\\.8688,\\-151\\.2093"), "Negative coordinates should be escaped in link label");
});

test("handleStatus escapes MarkdownV2 hyphens in static template", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  mockDevicesForUser(traccar, 1);
  traccar
    .get("/api/positions")
    .query((query) => String(query.deviceId) === "1" && query.from && query.to)
    .reply(200, [
      {
        latitude: 33.8688,
        longitude: -151.2093,
        speed: 60,
        serverTime: "2024-01-01T00:00:00Z",
        attributes: { ignition: true, battery: 90 }
      }
    ]);
  let capturedText;
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage", (body) => {
      capturedText = body.text;
      return true;
    })
    .reply(200, { ok: true });

  await handleStatus("123", "/status car1", "en");

  assert.ok(
    traccar.isDone(),
    `Expected positions mock to be consumed. Pending: ${traccar.pendingMocks()}`
  );
  // Verify leading hyphens are escaped
  assert.ok(capturedText.includes("\\- Last update:"), "Leading hyphen in Last update should be escaped");
  assert.ok(capturedText.includes("\\- State:"), "Leading hyphen in State should be escaped");
  assert.ok(capturedText.includes("\\- Speed:"), "Leading hyphen in Speed should be escaped");
  assert.ok(capturedText.includes("\\- Battery:"), "Leading hyphen in Battery should be escaped");
});

test("handlePositions escapes MarkdownV2 hash and hyphens", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  mockDevicesForUser(traccar, 1);
  traccar
    .get("/api/positions")
    .query((query) => String(query.deviceId) === "1" && query.from && query.to)
    .reply(200, [
      {
        latitude: -33.8688,
        longitude: 151.2093,
        speed: 45,
        serverTime: "2024-01-01T00:00:00Z"
      }
    ]);
  let capturedText;
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage", (body) => {
      capturedText = body.text;
      return true;
    })
    .reply(200, { ok: true });

  await handlePositions("123", "/positions car1 1", "en");

  assert.ok(
    traccar.isDone(),
    `Expected positions mock to be consumed. Pending: ${traccar.pendingMocks()}`
  );
  // Verify # is escaped in position numbering
  assert.ok(capturedText.includes("\\#1"), "Position number #1 should be escaped");
  // Verify leading hyphens are escaped
  assert.ok(capturedText.includes("\\- Date:"), "Leading hyphen in Date should be escaped");
  assert.ok(capturedText.includes("\\- Coordinates:"), "Leading hyphen in Coordinates should be escaped");
  assert.ok(capturedText.includes("\\- Speed:"), "Leading hyphen in Speed should be escaped");
  // Verify Google Maps link with negative coordinates
  assert.ok(capturedText.includes("-33\\.8688,151\\.2093"), "Negative coordinates should be escaped in link label");
});

test("handleReports escapes MarkdownV2 hash and hyphens", async () => {
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
    .reply(200, [
      { latitude: 45.6997, longitude: 4.8631, speed: 50 },
      { latitude: -33.8688, longitude: -151.2093, speed: 60 }
    ]);
  let capturedText;
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage", (body) => {
      capturedText = body.text;
      return true;
    })
    .reply(200, { ok: true });

  await handleReports("123", "/reports route car1 1", "en");

  assert.ok(
    traccar.isDone(),
    `Expected reports/route mock to be consumed. Pending: ${traccar.pendingMocks()}`
  );
  // Verify # is escaped in row numbering
  assert.ok(capturedText.includes("\\#1"), "Row number #1 should be escaped");
  assert.ok(capturedText.includes("\\#2"), "Row number #2 should be escaped");
  // Verify leading hyphens are escaped
  assert.ok(capturedText.includes("\\- latitude:"), "Leading hyphen in latitude should be escaped");
  assert.ok(capturedText.includes("\\- longitude:"), "Leading hyphen in longitude should be escaped");
  assert.ok(capturedText.includes("\\- speed:"), "Leading hyphen in speed should be escaped");
});

test("handleOrders get escapes MarkdownV2 hash and hyphens", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  traccar
    .get("/api/orders")
    .query({ userId: "1" })
    .reply(200, [
      { id: 1, uniqueId: "ORD#1", description: "Test order", fromAddress: "A", toAddress: "B" }
    ]);
  let capturedText;
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage", (body) => {
      capturedText = body.text;
      return true;
    })
    .reply(200, { ok: true });

  await handleOrders("123", "/orders get", "en");

  assert.ok(
    traccar.isDone(),
    `Expected orders mock to be consumed. Pending: ${traccar.pendingMocks()}`
  );
  // Verify # is escaped in order numbering
  assert.ok(capturedText.includes("\\#1"), "Order number #1 should be escaped");
  // Verify leading hyphens are escaped
  assert.ok(capturedText.includes("\\- ID:"), "Leading hyphen in ID should be escaped");
  assert.ok(capturedText.includes("\\- Unique ID:"), "Leading hyphen in Unique ID should be escaped");
  assert.ok(capturedText.includes("\\- Description:"), "Leading hyphen in Description should be escaped");
  assert.ok(capturedText.includes("\\- From:"), "Leading hyphen in From should be escaped");
  assert.ok(capturedText.includes("\\- To:"), "Leading hyphen in To should be escaped");
  // Verify dynamic value with # is escaped
  assert.ok(capturedText.includes("ORD\\#1"), "Dynamic value with # should be escaped");
});

test("handleTrack handles special characters in dynamic device name", async () => {
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
        name: "Device-Test#1",
        uniqueId: "UID1",
        attributes: {
          note: "John's (GPS) [Test] A+B=C!"
        }
      }
    ])
    .persist();
  traccar
    .get("/api/positions")
    .query((query) => String(query.deviceId) === "1" && query.from && query.to)
    .reply(200, [
      {
        latitude: 48.8,
        longitude: 2.3,
        speed: 50,
        serverTime: "2024-01-01T00:00:00Z",
        attributes: { ignition: true, battery: 85 }
      }
    ]);
  let capturedText;
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage", (body) => {
      capturedText = body.text;
      return true;
    })
    .reply(200, { ok: true });

  await handleTrack("123", "/track Device-Test#1", "en");

  assert.ok(
    traccar.isDone(),
    `Expected all Traccar mocks to be consumed. Pending: ${traccar.pendingMocks()}`
  );
  // Verify all special characters in dynamic device name are escaped
  assert.ok(capturedText.includes("Device\\-Test\\#1"), "Special chars in device name should be escaped");
  // Verify attribute value special chars are escaped (apostrophe is NOT a MarkdownV2 reserved char)
  assert.ok(capturedText.includes("John's \\(GPS\\) \\[Test\\] A\\+B\\=C\\!"), "Special chars in attribute should be escaped");
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
    .get("/api/orders")
    .query({ userId: "1" })
    .reply(200, [{ id: 100, uniqueId: "ORD-100" }]);
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
    `Expected GET /api/orders?userId=1, GET and PUT /api/orders/100 to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleOrders delete fetches order before deleting", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  traccar
    .get("/api/orders")
    .query({ userId: "1" })
    .reply(200, [{ id: 100, uniqueId: "ORD-100" }]);
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
    `Expected GET /api/orders?userId=1, GET and DELETE /api/orders/100 to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleOrders update returns generic failure for nonexistent order", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  traccar
    .get("/api/orders")
    .query({ userId: "1" })
    .reply(200, []); // User has no orders, so ownership check fails
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleOrders("123", "/orders update 999 name desc start end", "en");

  assert.ok(
    traccar.isDone(),
    `Expected GET /api/orders?userId=1 to be consumed and no PUT. Pending: ${traccar.pendingMocks()}`
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

// IDOR authorization tests for orders
test("handleOrders update rejects other user's order (IDOR)", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  // Two users: userA (chatId 111, userId 1) and userB (chatId 222, userId 2)
  mockTwoUsers(traccar, 111, 1, 222, 2);
  // UserA's orders only
  traccar
    .get("/api/orders")
    .query({ userId: "1" })
    .reply(200, [{ id: 100, uniqueId: "ORD-100" }]); // UserA owns order 100
  // UserA tries to update UserB's order (order 200)
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleOrders("111", "/orders update 200 ORD-200 desc from to", "en");

  assert.ok(
    traccar.isDone(),
    `Expected ownership check to fail, no PUT to /api/orders/200. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleOrders delete rejects other user's order (IDOR)", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockTwoUsers(traccar, 111, 1, 222, 2);
  // UserA's orders only
  traccar
    .get("/api/orders")
    .query({ userId: "1" })
    .reply(200, [{ id: 100, uniqueId: "ORD-100" }]); // UserA owns order 100
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleOrders("111", "/orders delete 200", "en");

  assert.ok(
    traccar.isDone(),
    `Expected ownership check to fail, no DELETE to /api/orders/200. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleOrders get returns only user's own orders", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockTwoUsers(traccar, 111, 1, 222, 2);
  // UserA's orders
  traccar
    .get("/api/orders")
    .query({ userId: "1" })
    .reply(200, [{ id: 100, uniqueId: "ORD-100" }]);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleOrders("111", "/orders get", "en");

  assert.ok(
    traccar.isDone(),
    `Expected GET /api/orders?userId=1 to be consumed. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleOrders update with malformed order ID is rejected", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleOrders("123", "/orders update abc name desc from to", "en");

  assert.ok(
    traccar.isDone(),
    `Expected malformed ID to be rejected before any Traccar call. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleOrders update with negative order ID is rejected", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleOrders("123", "/orders update -1 name desc from to", "en");

  assert.ok(
    traccar.isDone(),
    `Expected negative ID to be rejected before any Traccar call. Pending: ${traccar.pendingMocks()}`
  );
});

test("handleOrders update is rejected", async () => {
  cleanAll();
  const traccar = setupTraccarNock();
  const telegram = setupTelegramNock();
  mockUser(traccar, 123, 1);
  telegram
    .post("/bot" + process.env.BOT_TOKEN + "/sendMessage")
    .reply(200, { ok: true });

  await handleOrders("123", "/orders update", "en");

  assert.ok(
    traccar.isDone(),
    `Expected missing ID to be rejected. Pending: ${traccar.pendingMocks()}`
  );
});
