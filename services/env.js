// services/env.js
const MIN_ASSOC_SECRET_LENGTH = 32;

function validateAssocSecret(secret) {
  if (!secret) return { ok: false, reason: "missing" };
  if (secret.length < MIN_ASSOC_SECRET_LENGTH) {
    return { ok: false, reason: `too_short (min ${MIN_ASSOC_SECRET_LENGTH} chars)` };
  }
  // Check for basic entropy (not all same character, not simple patterns)
  const uniqueChars = new Set(secret).size;
  if (uniqueChars < 8) {
    return { ok: false, reason: "low_entropy (too few unique characters)" };
  }
  return { ok: true };
}

function validateWebAppUrl(url) {
  if (!url) return { ok: false, reason: "missing" };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && process.env.NODE_ENV === "production") {
      return { ok: false, reason: "must_be_https_in_production" };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "invalid_url" };
  }
}

export function checkEnv() {
  const missing = [];

  if (!process.env.TRACCAR_API_URL) {
    console.warn("TRACCAR_API_URL not set, using default http://traccar:8082");
  }

  const hasBasicAuth =
    process.env.TRACCAR_USERNAME && process.env.TRACCAR_PASSWORD;
  const hasApiKey = !!process.env.TRACCAR_API_KEY;

  if (!hasBasicAuth && !hasApiKey) {
    missing.push("TRACCAR_USERNAME + TRACCAR_PASSWORD or TRACCAR_API_KEY");
  }

  if (!process.env.BOT_TOKEN) missing.push("BOT_TOKEN");

  if (missing.length) {
    console.warn("Missing environment variables: " + missing.join(", "));
  }

  if (!process.env.BOT_SECRET) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "BOT_SECRET not set in production: Telegram webhook requests are rejected. Set BOT_SECRET and configure the Telegram webhook secret_token for secure operation."
      );
    } else {
      console.warn(
        "BOT_SECRET not set: Telegram webhook requests will not be validated. Set BOT_SECRET and configure the Telegram webhook secret_token for secure operation."
      );
    }
  }

  const assocSecretValidation = validateAssocSecret(process.env.ASSOC_SECRET);
  if (!assocSecretValidation.ok) {
    const msg = `ASSOC_SECRET ${assocSecretValidation.reason}`;
    if (process.env.NODE_ENV === "production") {
      console.error(`SECURITY ERROR: ${msg}. Legacy encrypted association disabled in production.`);
    } else {
      console.warn(`WARNING: ${msg}. Legacy encrypted association is disabled.`);
    }
  }

  // Validate Mini App Web App URL
  const webAppUrlValidation = validateWebAppUrl(process.env.TELEGRAM_ASSOC_WEBAPP_URL);
  if (!webAppUrlValidation.ok) {
    const msg = `TELEGRAM_ASSOC_WEBAPP_URL ${webAppUrlValidation.reason}`;
    if (process.env.NODE_ENV === "production") {
      console.error(`SECURITY ERROR: ${msg}. Mini App association disabled in production.`);
    } else {
      console.warn(`WARNING: ${msg}. Mini App association will not work.`);
    }
  }
}