import { test } from "node:test";
import assert from "node:assert";
import { validateInitData, parseInitData } from "../services/telegramInitData.js";
import crypto from "crypto";

function createValidInitData(botToken, userData, authDate = Math.floor(Date.now() / 1000)) {
  const params = {
    user: JSON.stringify(userData),
    auth_date: String(authDate),
    query_id: "test_query_id"
  };

  // Build data-check-string
  const sortedKeys = Object.keys(params).sort();
  const dataCheckString = sortedKeys.map(key => `${key}=${params[key]}`).join("\n");

  // Derive secret key
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();

  // Calculate hash
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  // Build initData string
  const initDataParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    initDataParams.append(key, value);
  }
  initDataParams.append("hash", hash);

  return initDataParams.toString();
}

test("validateInitData rejects missing initData", async () => {
  const result = validateInitData("", "test_token");
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.error, "missing_init_data");
});

test("validateInitData rejects missing bot token", async () => {
  const result = validateInitData("user=%7B%7D&auth_date=1234567890", "");
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.error, "missing_bot_token");
});

test("validateInitData rejects missing hash", async () => {
  const result = validateInitData("user=%7B%7D&auth_date=1234567890", "test_token");
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.error, "missing_hash");
});

test("validateInitData rejects invalid signature", async () => {
  const initData = "user=%7B%7D&auth_date=1234567890&hash=invalid_hash";
  const result = validateInitData(initData, "test_token");
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.error, "invalid_signature");
});

test("validateInitData rejects expired initData", async () => {
  const oldAuthDate = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
  const initData = createValidInitData("test_token", { id: 123, first_name: "Test" }, oldAuthDate);
  const result = validateInitData(initData, "test_token", 300); // 5 min max age
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.error, "expired_init_data");
});

test("validateInitData rejects future timestamp beyond tolerance", async () => {
  const futureAuthDate = Math.floor(Date.now() / 1000) + 120; // 2 minutes in future
  const initData = createValidInitData("test_token", { id: 123, first_name: "Test" }, futureAuthDate);
  const result = validateInitData(initData, "test_token", 300, 60); // 60 sec tolerance
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.error, "future_timestamp");
});

test("validateInitData accepts valid initData within max age", async () => {
  const initData = createValidInitData("test_token", { id: 123, first_name: "Test" });
  const result = validateInitData(initData, "test_token", 300, 60);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.user.id, 123);
  assert.strictEqual(result.user.first_name, "Test");
  assert.strictEqual(result.error, null);
});

test("validateInitData accepts future timestamp within tolerance", async () => {
  const futureAuthDate = Math.floor(Date.now() / 1000) + 30; // 30 seconds in future (within 60s tolerance)
  const initData = createValidInitData("test_token", { id: 123, first_name: "Test" }, futureAuthDate);
  const result = validateInitData(initData, "test_token", 300, 60);
  assert.strictEqual(result.ok, true);
});

test("validateInitData rejects invalid user data", async () => {
  const params = {
    user: "not_valid_json",
    auth_date: String(Math.floor(Date.now() / 1000)),
    query_id: "test"
  };
  const sortedKeys = Object.keys(params).sort();
  const dataCheckString = sortedKeys.map(key => `${key}=${params[key]}`).join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update("test_token").digest();
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  
  const initDataParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    initDataParams.append(key, value);
  }
  initDataParams.append("hash", hash);

  const result = validateInitData(initDataParams.toString(), "test_token");
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.error, "invalid_user_data");
});

test("validateInitData rejects user data missing id", async () => {
  const params = {
    user: JSON.stringify({ first_name: "Test" }),
    auth_date: String(Math.floor(Date.now() / 1000)),
    query_id: "test"
  };
  const sortedKeys = Object.keys(params).sort();
  const dataCheckString = sortedKeys.map(key => `${key}=${params[key]}`).join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update("test_token").digest();
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  
  const initDataParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    initDataParams.append(key, value);
  }
  initDataParams.append("hash", hash);

  const result = validateInitData(initDataParams.toString(), "test_token");
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.error, "invalid_user_data");
});

test("parseInitData parses key-value pairs correctly", async () => {
  const initData = "user=%7B%22id%22%3A123%7D&auth_date=1234567890&hash=abc";
  const parsed = parseInitData(initData);
  assert.strictEqual(parsed.user, '{"id":123}');
  assert.strictEqual(parsed.auth_date, "1234567890");
  assert.strictEqual(parsed.hash, "abc");
});

test("parseInitData handles empty string", async () => {
  const parsed = parseInitData("");
  assert.deepStrictEqual(parsed, {});
});

test("parseInitData handles null/undefined", async () => {
  const parsed1 = parseInitData(null);
  const parsed2 = parseInitData(undefined);
  assert.deepStrictEqual(parsed1, {});
  assert.deepStrictEqual(parsed2, {});
});