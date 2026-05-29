// services/i18n.js
import { TRANSLATIONS } from "../translations.js";

export function getUserLocale(user) {
  const attrs = (user && user.attributes) || {};
  const loc = attrs.locale || attrs.language || user?.language;
  if (loc && TRANSLATIONS[loc]) return loc;
  return "en";
}

export function t(locale, key) {
  const dict = TRANSLATIONS[locale] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key] || key;
}
