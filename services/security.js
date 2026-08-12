// services/security.js
import crypto from "crypto";

function getAssocSecret() {
  return process.env.ASSOC_SECRET || null;
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

export function decryptAssocPassword(encryptedBase64) {
  const secret = getAssocSecret();
  if (!secret) return null;
  try {
    const raw = Buffer.from(encryptedBase64, "base64");
    if (raw.length <= 16) return null;
    const iv = raw.slice(0, 16);
    const cipherText = raw.slice(16);
    const key = crypto
      .createHash("sha256")
      .update(String(secret))
      .digest();
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
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
 * Escape characters that have special meaning in Telegram's legacy Markdown mode.
 * Only dynamic/user-controlled values should be passed through this helper;
 * intentional Markdown formatting in static templates must remain unescaped.
 *
 * Legacy Markdown special characters: _ * [ ] ( ) ` \n (and unclosed entities)
 * We escape _ * [ ] ( ) ` to prevent broken entities.
 */
export function escapeMarkdown(text) {
  if (text === undefined || text === null) return "";
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/_/g, "\\_")
    .replace(/\*/g, "\\*")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/`/g, "\\`");
}
