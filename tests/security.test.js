import { test } from "node:test";
import assert from "node:assert";
import {
  normalizePhone,
  isPositiveIntegerId,
  redactPhone,
  MAX_LIMIT,
  isValidEmail,
} from "../services/security.js";

test("normalizePhone strips surrounding quotes", () => {
  assert.strictEqual(normalizePhone('"+33123456789"'), "+33123456789");
  assert.strictEqual(normalizePhone("' +33 1 23 45 67 89 '"), "+33123456789");
});

test("isPositiveIntegerId accepts positive integers", () => {
  assert.strictEqual(isPositiveIntegerId("123"), true);
  assert.strictEqual(isPositiveIntegerId("0"), true);
  assert.strictEqual(isPositiveIntegerId(42), true);
});

test("isPositiveIntegerId rejects path traversal and non-numeric", () => {
  assert.strictEqual(isPositiveIntegerId("123abc"), false);
  assert.strictEqual(isPositiveIntegerId("../users/456"), false);
  assert.strictEqual(isPositiveIntegerId("123/456"), false);
  assert.strictEqual(isPositiveIntegerId(""), false);
  assert.strictEqual(isPositiveIntegerId(null), false);
  assert.strictEqual(isPositiveIntegerId(undefined), false);
  assert.strictEqual(isPositiveIntegerId("-1"), false);
  assert.strictEqual(isPositiveIntegerId("1.5"), false);
});

test("redactPhone masks all but last 4 digits", () => {
  assert.strictEqual(redactPhone("+33123456789"), "****6789");
  assert.strictEqual(redactPhone("1234"), "****");
  assert.strictEqual(redactPhone(""), "");
});

test("MAX_LIMIT is 50", () => {
  assert.strictEqual(MAX_LIMIT, 50);
});

test("isValidEmail accepts valid emails", () => {
  assert.strictEqual(isValidEmail("user@example.com"), true);
  assert.strictEqual(isValidEmail("a.b@c.co"), true);
});

test("isValidEmail rejects invalid emails", () => {
  assert.strictEqual(isValidEmail("invalid"), false);
  assert.strictEqual(isValidEmail(""), false);
  assert.strictEqual(isValidEmail("user@"), false);
  assert.strictEqual(isValidEmail(null), false);
});
