// tests/i18n.test.js
import { test } from "node:test";
import assert from "node:assert";

import { getUserLocale, normalizeLocale, t } from "../services/i18n.js";

test("getUserLocale uses Telegram locale when provided", async () => {
  // Traccar has es locale set, but Telegram provides fr
  const user = {
    attributes: { locale: "es-ES" },
    language: "es"
  };
  const locale = getUserLocale(user, "fr-FR");
  assert.strictEqual(locale, "fr");
});

test("getUserLocale falls back to Traccar locale when no Telegram locale", async () => {
  const user = {
    attributes: { locale: "es-ES" }
  };
  const locale = getUserLocale(user, null);
  assert.strictEqual(locale, "es");
});

test("getUserLocale falls back to Traccar language when no locale attributes", async () => {
  const user = {
    language: "ru"
  };
  const locale = getUserLocale(user, null);
  assert.strictEqual(locale, "ru");
});

test("getUserLocale falls back to English when no locale sources", async () => {
  const user = {};
  const locale = getUserLocale(user, null);
  assert.strictEqual(locale, "en");
});

test("normalizeLocale handles empty string", async () => {
  assert.strictEqual(normalizeLocale(""), "en");
});

test("normalizeLocale handles null", async () => {
  assert.strictEqual(normalizeLocale(null), "en");
});

test("normalizeLocale handles undefined", async () => {
  assert.strictEqual(normalizeLocale(undefined), "en");
});

test("normalizeLocale returns exact supported locale", async () => {
  assert.strictEqual(normalizeLocale("en"), "en");
  assert.strictEqual(normalizeLocale("fr"), "fr");
});

test("normalizeLocale returns base locale for regional variants", async () => {
  assert.strictEqual(normalizeLocale("en-US"), "en");
  assert.strictEqual(normalizeLocale("fr-FR"), "fr");
  assert.strictEqual(normalizeLocale("es-ES"), "es");
});

test("normalizeLocale handles different separators", async () => {
  assert.strictEqual(normalizeLocale("en_US"), "en");
  assert.strictEqual(normalizeLocale("fr_FR"), "fr");
});

test("normalizeLocale handles case variations", async () => {
  assert.strictEqual(normalizeLocale("EN-US"), "en");
  assert.strictEqual(normalizeLocale("Fr-Fr"), "fr");
});

test("normalizeLocale falls back to English for unknown locale", async () => {
  assert.strictEqual(normalizeLocale("de"), "en");
  assert.strictEqual(normalizeLocale("zh"), "en");
});

test("t() translates using correct locale", async () => {
  // Test that translation uses the provided locale
  const result = t("fr", "start_intro");
  assert.strictEqual(result, "Commandes disponibles :");
});

test("t() falls back to English for unknown locale", async () => {
  const result = t("de", "start_intro");
  assert.strictEqual(result, "Available commands:");
});

test("t() returns key if translation not found", async () => {
  const result = t("en", "nonexistent_key");
  assert.strictEqual(result, "nonexistent_key");
});

// Test for Telegram locale extraction - check that from.message.from.language_code is used
// This would be tested in router integration tests, but we'll add a simple mock test here
test("getUserLocale prioritizes Telegram language_code over Traccar stored locale", async () => {
  const user = {
    attributes: { locale: "es-ES" }
  };
  const locale = getUserLocale(user, "fr-FR");
  assert.strictEqual(locale, "fr", "Telegram locale fr-FR should take priority over Traccar es-ES");
});

test("getUserLocale falls back to Traccar locale when Telegram locale is empty string", async () => {
  const user = {
    attributes: { locale: "es-ES" }
  };
  const locale = getUserLocale(user, "");
  assert.strictEqual(locale, "es", "Empty Telegram locale should fall back to Traccar locale");
});

test("getUserLocale handles lowercase telegram locale", async () => {
  const user = {
    attributes: { locale: "es-ES" }
  };
  const locale = getUserLocale(user, "pt-BR");
  assert.strictEqual(locale, "pt", "Lowercase pt-BR should normalize to pt");
});

// --- Regression tests for unsupported Telegram locale fallback ---

test("getUserLocale: supported Telegram overrides Traccar locale", async () => {
  const user = { attributes: { locale: "es-ES" } };
  const locale = getUserLocale(user, "fr-FR");
  assert.strictEqual(locale, "fr", "Supported Telegram fr-FR should override Traccar es");
});

test("getUserLocale: unsupported Telegram falls back to Traccar attributes.locale", async () => {
  const user = { attributes: { locale: "fr-FR" } };
  const locale = getUserLocale(user, "de");
  assert.strictEqual(locale, "fr", "Unsupported Telegram de should fall back to Traccar fr");
});

test("getUserLocale: unsupported Telegram + unsupported attributes.locale falls back to attributes.language", async () => {
  const user = { attributes: { locale: "xx", language: "tr" } };
  const locale = getUserLocale(user, "de");
  assert.strictEqual(locale, "tr", "Unsupported Telegram de + unsupported xx should fall back to tr");
});

test("getUserLocale: attributes.locale takes priority over attributes.language", async () => {
  const user = { attributes: { locale: "es-ES", language: "fr" } };
  const locale = getUserLocale(user, null);
  assert.strictEqual(locale, "es", "attributes.locale es should take priority over attributes.language fr");
});

test("getUserLocale: attributes.language fallback when no attributes.locale", async () => {
  const user = { attributes: { language: "tr" } };
  const locale = getUserLocale(user, null);
  assert.strictEqual(locale, "tr", "attributes.language tr should be used when no attributes.locale");
});

test("getUserLocale: user.language fallback when no attributes", async () => {
  const user = { language: "ru" };
  const locale = getUserLocale(user, null);
  assert.strictEqual(locale, "ru", "user.language ru should be used when no attributes");
});

test("getUserLocale: everything unsupported falls back to English", async () => {
  const user = { attributes: { locale: "zh", language: "it" }, language: "nl" };
  const locale = getUserLocale(user, "de");
  assert.strictEqual(locale, "en", "All unsupported should fall back to English");
});

test("getUserLocale: pre-association with supported Telegram locale", async () => {
  const locale = getUserLocale(null, "fr-FR");
  assert.strictEqual(locale, "fr", "Pre-association with fr-FR should resolve to fr");
});

test("getUserLocale: pre-association with unsupported Telegram locale", async () => {
  const locale = getUserLocale(null, "de");
  assert.strictEqual(locale, "en", "Pre-association with unsupported de should fall back to English");
});

test("getUserLocale: empty Telegram locale falls back to Traccar", async () => {
  const user = { attributes: { locale: "es-ES" } };
  const locale = getUserLocale(user, "");
  assert.strictEqual(locale, "es", "Empty Telegram locale should fall back to Traccar es");
});
