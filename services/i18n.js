// services/i18n.js
import { TRANSLATIONS } from "../translations.js";

// Supported locales (must match TRANSLATIONS keys)
const SUPPORTED_LOCALES = new Set(["en", "fr", "es", "pt", "tr", "ru", "zh", "ja", "de", "ko", "it"]);

/**
 * Normalize a locale string to a supported base locale.
 * Handles regional codes (en-US, fr-FR, es-ES, pt-BR, tr-TR, ru-RU)
 * with various separators (-, _) and case variations.
 * Falls back to 'en' for unknown locales.
 */
export function normalizeLocale(locale) {
  if (!locale) return "en";
  const base = String(locale).toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.has(base) ? base : "en";
}

/**
 * Get supported locale from a candidate, or null if unsupported/missing.
 * Does not fall back to English - returns null to allow caller to try next source.
 */
function getSupportedLocale(locale) {
  if (!locale) return null;
  const base = String(locale).toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.has(base) ? base : null;
}

export function getUserLocale(user, telegramLanguageCode) {
  const attrs = (user && user.attributes) || {};

  // Priority: Telegram locale -> Traccar attributes.locale -> Traccar attributes.language -> user.language -> English
  return (
    getSupportedLocale(telegramLanguageCode) ||
    getSupportedLocale(attrs.locale) ||
    getSupportedLocale(attrs.language) ||
    getSupportedLocale(user?.language) ||
    "en"
  );
}

export function t(locale, key, params) {
  const normalized = normalizeLocale(locale);
  const dict = TRANSLATIONS[normalized] || TRANSLATIONS.en;
  let text = dict[key] || TRANSLATIONS.en[key] || key;
  if (params && typeof params === "object") {
    for (const [name, value] of Object.entries(params)) {
      text = text.split("{" + name + "}").join(String(value));
    }
  }
  return text;
}
