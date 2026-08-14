// services/security.js
import crypto from "crypto";

const ASSOC_SALT_BYTES = 16;
const ASSOC_IV_BYTES = 16;
const ASSOC_TAG_BYTES = 16;
const ASSOC_ITERATIONS = 100000;

function getAssocSecret() {
  return process.env.ASSOC_SECRET || null;
}

function deriveKey(secret, salt) {
  return crypto.pbkdf2Sync(
    String(secret),
    salt,
    ASSOC_ITERATIONS,
    32,
    "sha256"
  );
}

export const MAX_LIMIT = 50;

export function normalizePhone(phone) {
  if (!phone) return "";
  let s = String(phone).trim();
  s = s.replace(/[\s\-\(\)]/g, "");
  s = s.replace(/^["']+|["']+$/g, "");
  if (s.indexOf("00") === 0) {
    s = "+" + s.slice(2);
  }
  if (s.indexOf("+") === 0) {
    const digits = s.slice(1).replace(/\D/g, "");
    return "+" + digits;
  }
  const digitsOnly = s.replace(/\D/g, "");
  if (digitsOnly.length === 10 && digitsOnly.indexOf("0") === 0) {
    return "+33" + digitsOnly.slice(1);
  }
  if (digitsOnly.length > 10) {
    return "+" + digitsOnly;
  }
  return digitsOnly;
}

export function isValidEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).trim());
}

export function isPositiveIntegerId(value) {
  if (value === undefined || value === null || value === "") return false;
  return /^\d+$/.test(String(value));
}

export function encryptAssocPassword(plainText) {
  const secret = getAssocSecret();
  if (!secret) return null;
  try {
    const salt = crypto.randomBytes(ASSOC_SALT_BYTES);
    const iv = crypto.randomBytes(ASSOC_IV_BYTES);
    const key = deriveKey(secret, salt);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([
      cipher.update(String(plainText), "utf8"),
      cipher.final()
    ]);
    const tag = cipher.getAuthTag();
    const combined = Buffer.concat([salt, iv, tag, encrypted]);
    return combined.toString("base64");
  } catch (e) {
    console.error("encryptAssocPassword error:", e?.toString());
    return null;
  }
}

export function decryptAssocPassword(encryptedBase64) {
  const secret = getAssocSecret();
  if (!secret) return null;
  try {
    const raw = Buffer.from(encryptedBase64, "base64");
    const minLength = ASSOC_SALT_BYTES + ASSOC_IV_BYTES + ASSOC_TAG_BYTES + 1;
    if (raw.length < minLength) return null;

    let offset = 0;
    const salt = raw.slice(offset, (offset += ASSOC_SALT_BYTES));
    const iv = raw.slice(offset, (offset += ASSOC_IV_BYTES));
    const tag = raw.slice(offset, (offset += ASSOC_TAG_BYTES));
    const cipherText = raw.slice(offset);

    const key = deriveKey(secret, salt);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(cipherText),
      decipher.final()
    ]);
    return decrypted.toString("utf8");
  } catch (e) {
    console.error("decryptAssocPassword error:", e?.toString());
    return null;
  }
}

export function formatDate(iso) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleString("fr-FR");
  } catch (e) {
    return String(iso);
  }
}

export function redactPhone(phone) {
  if (!phone) return "";
  const s = String(phone);
  if (s.length <= 4) return "****";
  return "****" + s.slice(-4);
}

/**
 * Escape characters reserved by Telegram MarkdownV2.
 * Only dynamic/user-controlled values should be passed through this helper;
 * intentional Markdown formatting in static templates must remain unescaped.
 *
 * Reserved characters: _ * [ ] ( ) ~ ` > # + - = | { } . !
 */
export function escapeMarkdown(text) {
  if (text === undefined || text === null) return "";
  return String(text)
    .replace(/([_\*\[\]\(\)~`>#+=|{}\.!-])/g, "\\$1");
}

/**
 * Build a Telegram MarkdownV2 link whose label and URL are escaped safely.
 * The label is escaped for MarkdownV2; the URL only encodes unsafe URL chars
 * so Telegram can parse it.
 */
export function markdownLink(label, url) {
  const safeLabel = escapeMarkdown(label);
  const safeUrl = String(url || "")
    .replace(/\\/g, "")
    .replace(/\)/g, "%29");
  return `[${safeLabel}](${safeUrl})`;
}
