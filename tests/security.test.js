import { test } from "node:test";
import assert from "node:assert";
import {
  normalizePhone,
  isPositiveIntegerId,
  redactPhone,
  MAX_LIMIT,
  isValidEmail,
  escapeMarkdown,
  encryptAssocPassword,
  decryptAssocPassword,
  markdownLink
} from "../services/security.js";
import { sendPlainText } from "../services/telegram.js";

test("normalizePhone strips surrounding quotes", () => {
  assert.strictEqual(normalizePhone('"+33123456789"'), "+33123456789");
  assert.strictEqual(normalizePhone("' +33 1 23 45 67 89 '"), "+33123456789");
});

test("normalizePhone removes separators and handles international prefixes", () => {
  assert.strictEqual(normalizePhone(" +1 (202)-555 0123 "), "+12025550123");
  assert.strictEqual(normalizePhone("0033 (1) 23-45-67-89"), "+33123456789");
  assert.strictEqual(normalizePhone("+33 1 23 45 67 89"), "+33123456789");
  assert.strictEqual(normalizePhone("01 23 45 67 89"), "0123456789");
});

test("normalizePhone handles long quote sequences and malicious input linearly", () => {
  const quotes = "'".repeat(100000);
  assert.strictEqual(
    normalizePhone(`${quotes}+33 1 23 45 67 89${quotes}`),
    "+33123456789"
  );
  assert.strictEqual(normalizePhone("x".repeat(100000)), "");
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

test("isValidEmail accepts normal valid emails", () => {
  assert.strictEqual(isValidEmail("user@example.com"), true);
  assert.strictEqual(isValidEmail("a.b+tag@sub.example.co"), true);
});

test("isValidEmail rejects malformed and unsafe input", () => {
  assert.strictEqual(isValidEmail("invalid"), false);
  assert.strictEqual(isValidEmail("userexample.com"), false);
  assert.strictEqual(isValidEmail("user@example@other.com"), false);
  assert.strictEqual(isValidEmail("@example.com"), false);
  assert.strictEqual(isValidEmail("user@"), false);
  assert.strictEqual(isValidEmail("user@example"), false);
  assert.strictEqual(isValidEmail("user@.example.com"), false);
  assert.strictEqual(isValidEmail("user@example..com"), false);
  assert.strictEqual(isValidEmail(" user@example.com"), false);
  assert.strictEqual(isValidEmail("user@example.com "), false);
  assert.strictEqual(isValidEmail(null), false);
});

test("isValidEmail rejects overlong and regex-backtracking payloads", () => {
  assert.strictEqual(isValidEmail("a".repeat(255) + "@example.com"), false);
  assert.strictEqual(isValidEmail("a".repeat(100000) + "@example.com"), false);
});

test("escapeMarkdown escapes MarkdownV2 reserved characters", () => {
  assert.strictEqual(escapeMarkdown("_"), "\\_");
  assert.strictEqual(escapeMarkdown("*"), "\\*");
  assert.strictEqual(escapeMarkdown("["), "\\[");
  assert.strictEqual(escapeMarkdown("]"), "\\]");
  assert.strictEqual(escapeMarkdown("("), "\\(");
  assert.strictEqual(escapeMarkdown(")"), "\\)");
  assert.strictEqual(escapeMarkdown("~"), "\\~");
  assert.strictEqual(escapeMarkdown("`"), "\\`");
  assert.strictEqual(escapeMarkdown(">"), "\\>");
  assert.strictEqual(escapeMarkdown("#"), "\\#");
  assert.strictEqual(escapeMarkdown("+"), "\\+");
  assert.strictEqual(escapeMarkdown("-"), "\\-");
  assert.strictEqual(escapeMarkdown("="), "\\=");
  assert.strictEqual(escapeMarkdown("|"), "\\|");
  assert.strictEqual(escapeMarkdown("{"), "\\{");
  assert.strictEqual(escapeMarkdown("}"), "\\}");
  assert.strictEqual(escapeMarkdown("."), "\\.");
  assert.strictEqual(escapeMarkdown("!"), "\\!");
});

test("escapeMarkdown preserves normal and Unicode text", () => {
  assert.strictEqual(escapeMarkdown("car1"), "car1");
  assert.strictEqual(escapeMarkdown("Véhicule_1"), "Véhicule\\_1");
  assert.strictEqual(escapeMarkdown("Camion [rouge]"), "Camion \\[rouge\\]");
  assert.strictEqual(escapeMarkdown("50.5"), "50\\.5");
  assert.strictEqual(escapeMarkdown("2024-01-01 12:00:00"), "2024\\-01\\-01 12:00:00");
});

test("escapeMarkdown handles backslashes without double-escaping raw text", () => {
  assert.strictEqual(escapeMarkdown("\\"), "\\\\");
  assert.strictEqual(escapeMarkdown("\\\\"), "\\\\\\\\");
  assert.strictEqual(
    escapeMarkdown("\\_*[]()"),
    "\\\\\\_\\*\\[\\]\\(\\)"
  );
});

test("escapeMarkdown handles null, plain, and Unicode text", () => {
  assert.strictEqual(escapeMarkdown(null), "");
  assert.strictEqual(escapeMarkdown(undefined), "");
  assert.strictEqual(escapeMarkdown("plain text"), "plain text");
  assert.strictEqual(escapeMarkdown("Camion 🚛 déjà vu"), "Camion 🚛 déjà vu");
});

test("markdownLink escapes label and URL according to their contexts", () => {
  const link = markdownLink("Paris, France", "https://example.com?q=paris");
  assert.ok(link.startsWith("[Paris, France]"));
  assert.ok(link.includes("https://example.com?q=paris"));

  const linkWithClosingParenthesis = markdownLink(
    "A ) label",
    "https://example.com/path)segment"
  );
  assert.strictEqual(
    linkWithClosingParenthesis,
    "[A \\) label](https://example.com/path%29segment)"
  );

  const linkWithBackslash = markdownLink(
    "safe label",
    "https://example.com/path\\segment"
  );
  assert.ok(linkWithBackslash.includes("path\\\\segment"));
});

test("sendPlainText escapes start_commands help text", async () => {
  const text =
    "Available commands:\n\n" +
    "/assoc - associate phone and Telegram chat_id (secure confirmation required)\n" +
    "/assoc telegram - show contact share button\n" +
    "/track - list devices in your group\n" +
    "/track <id> - show device";
  const escaped = escapeMarkdown(text);
  assert.ok(escaped.includes("\\-"), "hyphens must be escaped");
  assert.ok(escaped.includes("\\_"), "underscores must be escaped");
  assert.ok(escaped.includes("\\("), "parentheses must be escaped");
  assert.ok(escaped.includes("\\>"), "greater-than must be escaped");
});

test("sendPlainText escapes assoc_no_phone prompt", async () => {
  const text = 'Send /assoc <international_phone> or press the "Share contact" button.';
  const escaped = escapeMarkdown(text);
  assert.ok(escaped.includes("\\>"), "greater-than must be escaped");
  assert.ok(escaped.includes('"Share contact"'), "double quotes must be preserved");
});

test("sendPlainText escapes device list with hyphens and parentheses", async () => {
  const text = "Devices in your group:\n- BMW E90 (id:2)\n- iPhone (id:1)";
  const escaped = escapeMarkdown(text);
  assert.ok(escaped.includes("\\- BMW"), "leading hyphen must be escaped");
  assert.ok(escaped.includes("\\(id:2\\)"), "parentheses must be escaped");
  assert.ok(escaped.includes("\\(id:1\\)"), "parentheses must be escaped");
});

test("sendPlainText preserves intentional Markdown formatting when not used", () => {
  const label = "Paris, France";
  const url = "https://example.com?q=paris";
  const link = markdownLink(label, url);
  assert.ok(link.startsWith("[Paris, France]"));
  assert.ok(link.includes("(https://example.com?q=paris)"));
});

test("encryptAssocPassword round-trips with decryptAssocPassword", () => {
  const plain = "my-secret-password";
  const encrypted = encryptAssocPassword(plain);
  assert.ok(encrypted);
  assert.notStrictEqual(encrypted, plain);
  const decrypted = decryptAssocPassword(encrypted);
  assert.strictEqual(decrypted, plain);
});

test("decryptAssocPassword returns null for invalid input", () => {
  assert.strictEqual(decryptAssocPassword("not-valid-base64!!!"), null);
  assert.strictEqual(decryptAssocPassword(""), null);
});

test("decryptAssocPassword returns null when ASSOC_SECRET is missing", () => {
  const original = process.env.ASSOC_SECRET;
  delete process.env.ASSOC_SECRET;
  assert.strictEqual(encryptAssocPassword("x"), null);
  assert.strictEqual(decryptAssocPassword("abc"), null);
  process.env.ASSOC_SECRET = original;
});
