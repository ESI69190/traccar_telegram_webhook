// services/security.js
import crypto from "crypto";

const ASSOC_SECRET = process.env.ASSOC_SECRET || null;

export function normalizePhone(phone) {
  if (!phone) return "";
  let s = String(phone).trim();
  s = s.replace(/[\s\-\(\)]/g, "");
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

export function decryptAssocPassword(encryptedBase64) {
  if (!ASSOC_SECRET) return null;
  try {
    const raw = Buffer.from(encryptedBase64, "base64");
    if (raw.length <= 16) return null;
    const iv = raw.slice(0, 16);
    const cipherText = raw.slice(16);
    const key = crypto
      .createHash("sha256")
      .update(String(ASSOC_SECRET))
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
