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
  assert.strictEqual(normalizeLocale("nl"), "en");
  assert.strictEqual(normalizeLocale("xx"), "en");
});

test("t() translates using correct locale", async () => {
  // Test that translation uses the provided locale
  const result = t("fr", "start_intro");
  assert.strictEqual(result, "Commandes disponibles :");
});

test("t() falls back to English for unknown locale", async () => {
  const result = t("nl", "start_intro");
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
  const locale = getUserLocale(user, "nl");
  assert.strictEqual(locale, "fr", "Unsupported Telegram nl should fall back to Traccar fr");
});

test("getUserLocale: unsupported Telegram + unsupported attributes.locale falls back to attributes.language", async () => {
  const user = { attributes: { locale: "xx", language: "tr" } };
  const locale = getUserLocale(user, "nl");
  assert.strictEqual(locale, "tr", "Unsupported Telegram nl + unsupported xx should fall back to tr");
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
  const user = { attributes: { locale: "xx", language: "yy" }, language: "zz" };
  const locale = getUserLocale(user, "nl");
  assert.strictEqual(locale, "en", "All unsupported should fall back to English");
});

test("getUserLocale: pre-association with supported Telegram locale", async () => {
  const locale = getUserLocale(null, "fr-FR");
  assert.strictEqual(locale, "fr", "Pre-association with fr-FR should resolve to fr");
});

test("getUserLocale: pre-association with unsupported Telegram locale", async () => {
  const locale = getUserLocale(null, "nl");
  assert.strictEqual(locale, "en", "Pre-association with unsupported nl should fall back to English");
});

test("getUserLocale: empty Telegram locale falls back to Traccar", async () => {
  const user = { attributes: { locale: "es-ES" } };
  const locale = getUserLocale(user, "");
  assert.strictEqual(locale, "es", "Empty Telegram locale should fall back to Traccar es");
});

// --- New locale normalization tests ---

test("normalizeLocale: German regional variants", async () => {
  assert.strictEqual(normalizeLocale("de-DE"), "de");
  assert.strictEqual(normalizeLocale("de_AT"), "de");
  assert.strictEqual(normalizeLocale("de-CH"), "de");
});

test("normalizeLocale: Italian regional variants", async () => {
  assert.strictEqual(normalizeLocale("it-IT"), "it");
});

test("normalizeLocale: Japanese regional variants", async () => {
  assert.strictEqual(normalizeLocale("ja-JP"), "ja");
});

test("normalizeLocale: Korean regional variants", async () => {
  assert.strictEqual(normalizeLocale("ko-KR"), "ko");
});

test("normalizeLocale: Chinese regional variants", async () => {
  assert.strictEqual(normalizeLocale("zh-CN"), "zh");
  assert.strictEqual(normalizeLocale("zh-SG"), "zh");
  assert.strictEqual(normalizeLocale("zh-Hans"), "zh");
  assert.strictEqual(normalizeLocale("zh_Hans"), "zh");
});

// --- Telegram priority with new locales ---

test("getUserLocale: Telegram de-DE overrides Traccar fr", async () => {
  const user = { attributes: { locale: "fr-FR" } };
  const locale = getUserLocale(user, "de-DE");
  assert.strictEqual(locale, "de", "Telegram de-DE should override Traccar fr");
});

test("getUserLocale: Telegram ja-JP overrides Traccar en", async () => {
  const user = { attributes: { locale: "en" } };
  const locale = getUserLocale(user, "ja-JP");
  assert.strictEqual(locale, "ja", "Telegram ja-JP should override Traccar en");
});

test("getUserLocale: Telegram ko-KR overrides Traccar fr", async () => {
  const user = { attributes: { locale: "fr-FR" } };
  const locale = getUserLocale(user, "ko-KR");
  assert.strictEqual(locale, "ko", "Telegram ko-KR should override Traccar fr");
});

test("getUserLocale: Telegram it-IT overrides Traccar es", async () => {
  const user = { attributes: { locale: "es-ES" } };
  const locale = getUserLocale(user, "it-IT");
  assert.strictEqual(locale, "it", "Telegram it-IT should override Traccar es");
});

test("getUserLocale: Telegram zh-CN overrides Traccar en", async () => {
  const user = { attributes: { locale: "en" } };
  const locale = getUserLocale(user, "zh-CN");
  assert.strictEqual(locale, "zh", "Telegram zh-CN should override Traccar en");
});

// --- Traccar fallback with new locales ---

test("getUserLocale: unsupported Telegram falls back to Traccar de", async () => {
  const user = { attributes: { locale: "de-DE" } };
  const locale = getUserLocale(user, "nl");
  assert.strictEqual(locale, "de", "Unsupported Telegram nl should fall back to Traccar de");
});

test("getUserLocale: unsupported Telegram falls back to Traccar ja", async () => {
  const user = { attributes: { locale: "ja-JP" } };
  const locale = getUserLocale(user, "nl");
  assert.strictEqual(locale, "ja", "Unsupported Telegram nl should fall back to Traccar ja");
});

test("getUserLocale: unsupported Telegram falls back to Traccar ko", async () => {
  const user = { attributes: { locale: "ko-KR" } };
  const locale = getUserLocale(user, "nl");
  assert.strictEqual(locale, "ko", "Unsupported Telegram nl should fall back to Traccar ko");
});

test("getUserLocale: unsupported Telegram falls back to Traccar it", async () => {
  const user = { attributes: { locale: "it-IT" } };
  const locale = getUserLocale(user, "nl");
  assert.strictEqual(locale, "it", "Unsupported Telegram nl should fall back to Traccar it");
});

test("getUserLocale: unsupported Telegram falls back to Traccar zh", async () => {
  const user = { attributes: { locale: "zh-CN" } };
  const locale = getUserLocale(user, "nl");
  assert.strictEqual(locale, "zh", "Unsupported Telegram nl should fall back to Traccar zh");
});

// --- Translation completeness tests ---

test("translation keys: zh has all required keys", async () => {
  const { TRANSLATIONS } = await import("../translations.js");
  const enKeys = Object.keys(TRANSLATIONS.en).sort();
  const zhKeys = Object.keys(TRANSLATIONS.zh).sort();
  assert.deepStrictEqual(zhKeys, enKeys, "Chinese should have all translation keys");
});

test("translation keys: ja has all required keys", async () => {
  const { TRANSLATIONS } = await import("../translations.js");
  const enKeys = Object.keys(TRANSLATIONS.en).sort();
  const jaKeys = Object.keys(TRANSLATIONS.ja).sort();
  assert.deepStrictEqual(jaKeys, enKeys, "Japanese should have all translation keys");
});

test("translation keys: de has all required keys", async () => {
  const { TRANSLATIONS } = await import("../translations.js");
  const enKeys = Object.keys(TRANSLATIONS.en).sort();
  const deKeys = Object.keys(TRANSLATIONS.de).sort();
  assert.deepStrictEqual(deKeys, enKeys, "German should have all translation keys");
});

test("translation keys: ko has all required keys", async () => {
  const { TRANSLATIONS } = await import("../translations.js");
  const enKeys = Object.keys(TRANSLATIONS.en).sort();
  const koKeys = Object.keys(TRANSLATIONS.ko).sort();
  assert.deepStrictEqual(koKeys, enKeys, "Korean should have all translation keys");
});

test("translation keys: it has all required keys", async () => {
  const { TRANSLATIONS } = await import("../translations.js");
  const enKeys = Object.keys(TRANSLATIONS.en).sort();
  const itKeys = Object.keys(TRANSLATIONS.it).sort();
  assert.deepStrictEqual(itKeys, enKeys, "Italian should have all translation keys");
});

// --- Verify translations are not English placeholders ---

test("translations: zh values differ from English", async () => {
  const { TRANSLATIONS } = await import("../translations.js");
  const sampleKeys = ["start_intro", "miniapp_assoc_title", "miniapp_button_submit"];
  for (const key of sampleKeys) {
    assert.notStrictEqual(TRANSLATIONS.zh[key], TRANSLATIONS.en[key], `Chinese ${key} should be translated`);
  }
});

test("translations: ja values differ from English", async () => {
  const { TRANSLATIONS } = await import("../translations.js");
  const sampleKeys = ["start_intro", "miniapp_assoc_title", "miniapp_button_submit"];
  for (const key of sampleKeys) {
    assert.notStrictEqual(TRANSLATIONS.ja[key], TRANSLATIONS.en[key], `Japanese ${key} should be translated`);
  }
});

test("translations: de values differ from English", async () => {
  const { TRANSLATIONS } = await import("../translations.js");
  const sampleKeys = ["start_intro", "miniapp_assoc_title", "miniapp_button_submit"];
  for (const key of sampleKeys) {
    assert.notStrictEqual(TRANSLATIONS.de[key], TRANSLATIONS.en[key], `German ${key} should be translated`);
  }
});

test("translations: ko values differ from English", async () => {
  const { TRANSLATIONS } = await import("../translations.js");
  const sampleKeys = ["start_intro", "miniapp_assoc_title", "miniapp_button_submit"];
  for (const key of sampleKeys) {
    assert.notStrictEqual(TRANSLATIONS.ko[key], TRANSLATIONS.en[key], `Korean ${key} should be translated`);
  }
});

test("translations: it values differ from English", async () => {
  const { TRANSLATIONS } = await import("../translations.js");
  const sampleKeys = ["start_intro", "miniapp_assoc_title", "miniapp_button_submit"];
  for (const key of sampleKeys) {
    assert.notStrictEqual(TRANSLATIONS.it[key], TRANSLATIONS.en[key], `Italian ${key} should be translated`);
  }
});
