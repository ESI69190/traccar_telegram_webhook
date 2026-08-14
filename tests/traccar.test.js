import { test } from "node:test";
import assert from "node:assert";
import { setupTraccarNock, cleanAll } from "./helpers/nock-helper.js";
import {
  traccarRequest,
  verifySession,
  findUserByChatId,
  getUserById,
  findUserByPhone,
  findUserByEmail,
  updateUserPhoneAndChat,
  getLastPositions,
  getOrderById
} from "../services/traccar.js";

test("traccarRequest uses TRACCAR_API_URL", async () => {
  cleanAll();
  const scope = setupTraccarNock();
  scope
    .get("/api/server")
    .reply(200, { version: "6.13.3" });

  const resp = await traccarRequest("get", "/api/server");
  assert.strictEqual(resp.status, 200);
  assert.strictEqual(resp.data.version, "6.13.3");
  assert.ok(scope.isDone());
});

test("traccarRequest sends Authorization Bearer header when TRACCAR_API_KEY is set", async () => {
  cleanAll();
  const scope = setupTraccarNock();
  scope
    .get("/api/server")
    .matchHeader("authorization", "Bearer service-api-key")
    .reply(200, { version: "6.13.3" });

  const resp = await traccarRequest("get", "/api/server");
  assert.strictEqual(resp.status, 200);
  assert.ok(scope.isDone());
});

test("verifySession posts email and password as form data", async () => {
  cleanAll();
  const scope = setupTraccarNock();
  scope
    .post("/api/session", /email=user%40example\.com&password=pass123/)
    .matchHeader("content-type", /application\/x-www-form-urlencoded/)
    .reply(200, { id: 1, email: "user@example.com" });

  const resp = await verifySession("user@example.com", "pass123");
  assert.strictEqual(resp.status, 200);
  assert.strictEqual(resp.data.id, 1);
  assert.ok(scope.isDone());
});

test("findUserByChatId returns matching user", async () => {
  cleanAll();
  const scope = setupTraccarNock();
  scope.get("/api/users").reply(200, [
    { id: 1, email: "a@example.com", attributes: { telegramChatId: "123" } },
    { id: 2, email: "b@example.com", attributes: { telegramChatId: "456" } }
  ]);

  const user = await findUserByChatId("123");
  assert.strictEqual(user.id, 1);
  assert.ok(scope.isDone());
});

test("getUserById fetches user by ID", async () => {
  cleanAll();
  const scope = setupTraccarNock();
  scope.get("/api/users/7").reply(200, { id: 7, email: "u@example.com" });

  const user = await getUserById(7);
  assert.strictEqual(user.id, 7);
  assert.ok(scope.isDone());
});

test("findUserByPhone matches normalized phone", async () => {
  cleanAll();
  const scope = setupTraccarNock();
  scope.get("/api/users").reply(200, [
    { id: 1, email: "a@example.com", phone: "+33123456789" },
    { id: 2, email: "b@example.com", phone: "+33987654321" }
  ]);

  const user = await findUserByPhone("+33123456789");
  assert.strictEqual(user.id, 1);
  assert.ok(scope.isDone());
});

test("findUserByEmail matches case-insensitively", async () => {
  cleanAll();
  const scope = setupTraccarNock();
  scope.get("/api/users").reply(200, [
    { id: 1, email: "User@Example.com" }
  ]);

  const user = await findUserByEmail("user@example.com");
  assert.strictEqual(user.id, 1);
  assert.ok(scope.isDone());
});

test("updateUserPhoneAndChat updates user", async () => {
  cleanAll();
  const scope = setupTraccarNock();
  scope.get("/api/users/5").reply(200, { id: 5, email: "u@example.com", attributes: {} });
  scope
    .put("/api/users/5", (body) => body.phone === "+33123456789" && body.attributes.telegramChatId === "123")
    .reply(200, { id: 5, email: "u@example.com", phone: "+33123456789", attributes: { telegramChatId: "123" } });

  const result = await updateUserPhoneAndChat(5, "+33123456789", "123");
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.user.attributes.telegramChatId, "123");
  assert.ok(scope.isDone());
});

test("getLastPositions queries with from and to", async () => {
  cleanAll();
  const scope = setupTraccarNock();
  scope
    .get("/api/positions")
    .query({ deviceId: "1", from: /.+/, to: /.+/ })
    .reply(200, [{ id: 10, latitude: 48.8, longitude: 2.3 }]);

  const positions = await getLastPositions(1, "2024-01-01T00:00:00.000Z", "2024-01-02T00:00:00.000Z");
  assert.strictEqual(positions.length, 1);
  assert.strictEqual(positions[0].id, 10);
  assert.ok(scope.isDone());
});

test("getOrderById returns order data", async () => {
  cleanAll();
  const scope = setupTraccarNock();
  scope.get("/api/orders/99").reply(200, { id: 99, uniqueId: "ORD-99" });

  const order = await getOrderById(99);
  assert.strictEqual(order.id, 99);
  assert.ok(scope.isDone());
});
