// services/telegramInitData.js
import crypto from "crypto";

/**
 * Parse Telegram WebApp initData string into key-value pairs.
 * @param {string} initData - Raw initData string from Telegram.WebApp.initData
 * @returns {Object} Parsed key-value pairs
 */
export function parseInitData(initData) {
  if (!initData || typeof initData !== "string") {
    return {};
  }
  const params = new URLSearchParams(initData);
  const result = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
}

/**
 * Validate Telegram WebApp initData according to official Telegram documentation.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
 * 
 * @param {string} initData - Raw initData string from Telegram.WebApp.initData
 * @param {string} botToken - Bot token for secret key derivation
 * @param {number} maxAgeSeconds - Maximum age of initData in seconds (default 300)
 * @param {number} futureToleranceSeconds - Future timestamp tolerance in seconds (default 60)
 * @returns {Object} Validation result with { ok: boolean, user: Object|null, error: string|null }
 */
export function validateInitData(initData, botToken, maxAgeSeconds = 300, futureToleranceSeconds = 60) {
  if (!initData || typeof initData !== "string") {
    return { ok: false, user: null, error: "missing_init_data" };
  }

  if (!botToken || typeof botToken !== "string") {
    return { ok: false, user: null, error: "missing_bot_token" };
  }

  const parsed = parseInitData(initData);
  const hash = parsed.hash;
  if (!hash) {
    return { ok: false, user: null, error: "missing_hash" };
  }

  // Remove hash from data-check-string
  const { hash: _removed, ...dataCheckParams } = parsed;
  
  // Sort keys alphabetically
  const sortedKeys = Object.keys(dataCheckParams).sort();
  
  // Build data-check-string: key=value joined by LF (\n)
  const dataCheckString = sortedKeys
    .map(key => `${key}=${dataCheckParams[key]}`)
    .join("\n");

  // Derive secret key: HMAC-SHA256("WebAppData", botToken)
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  
  // Calculate HMAC-SHA256 of data-check-string with secret key
  const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  
  // Timing-safe comparison
  const hashBuffer = Buffer.from(hash, "hex");
  const calculatedBuffer = Buffer.from(calculatedHash, "hex");
  
  if (hashBuffer.length !== calculatedBuffer.length || !crypto.timingSafeEqual(hashBuffer, calculatedBuffer)) {
    return { ok: false, user: null, error: "invalid_signature" };
  }

  // Validate auth_date
  const authDate = parsed.auth_date;
  if (!authDate) {
    return { ok: false, user: null, error: "missing_auth_date" };
  }
  
  const authDateInt = parseInt(authDate, 10);
  if (isNaN(authDateInt)) {
    return { ok: false, user: null, error: "invalid_auth_date" };
  }
  
  const now = Math.floor(Date.now() / 1000);
  const age = now - authDateInt;
  
  if (age > maxAgeSeconds) {
    return { ok: false, user: null, error: "expired_init_data" };
  }
  
  if (authDateInt > now + futureToleranceSeconds) {
    return { ok: false, user: null, error: "future_timestamp" };
  }

  // Parse user data
  let user = null;
  if (parsed.user) {
    try {
      user = JSON.parse(parsed.user);
      // Validate user object has required fields
      if (!user || typeof user.id === "undefined") {
        return { ok: false, user: null, error: "invalid_user_data" };
      }
    } catch {
      return { ok: false, user: null, error: "invalid_user_data" };
    }
  } else {
    return { ok: false, user: null, error: "missing_user_data" };
  }

  return { ok: true, user, error: null };
}

/**
 * Get the maximum age for initData validation from environment.
 * Default: 300 seconds (5 minutes)
 */
export function getInitDataMaxAge() {
  const env = process.env.TELEGRAM_WEBAPP_AUTH_MAX_AGE_SECONDS;
  if (!env) return 300;
  const parsed = parseInt(env, 10);
  if (isNaN(parsed) || parsed <= 0) return 300;
  return parsed;
}

/**
 * Get the future timestamp tolerance from environment.
 * Default: 60 seconds
 */
export function getInitDataFutureTolerance() {
  const env = process.env.TELEGRAM_WEBAPP_AUTH_FUTURE_TOLERANCE_SECONDS;
  if (!env) return 60;
  const parsed = parseInt(env, 10);
  if (isNaN(parsed) || parsed < 0) return 60;
  return parsed;
}