// services/i18n.js
import { TRANSLATIONS } from "../translations.js";

// Supported locales (must match TRANSLATIONS keys)
const SUPPORTED_LOCALES = new Set(["en", "fr", "es", "pt", "tr", "ru"]);

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

export function getUserLocale(user) {
  const attrs = (user && user.attributes) || {};
  const loc = attrs.locale || attrs.language || user?.language;
  return normalizeLocale(loc);
}

export function t(locale, key) {
  const normalized = normalizeLocale(locale);
  const dict = TRANSLATIONS[normalized] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key] || key;
}
