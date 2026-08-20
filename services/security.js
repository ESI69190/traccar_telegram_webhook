// services/security.js
import crypto from "crypto";

const ASSOC_SALT_BYTES = 16;
const ASSOC_IV_BYTES = 16;
const ASSOC_TAG_BYTES = 16;
const DEFAULT_ITERATIONS = 100000;
const MIN_ITERATIONS = 10000; // Minimum safe iteration count

function getAssocSecret() {
  return process.env.ASSOC_SECRET || null;
}

function getIterations() {
  const envIter = process.env.ASSOC_PBKDF2_ITERATIONS;
  if (!envIter) return DEFAULT_ITERATIONS;
  const parsed = parseInt(envIter, 10);
  if (isNaN(parsed) || parsed < MIN_ITERATIONS) {
    console.warn(`ASSOC_PBKDF2_ITERATIONS (${envIter}) below minimum ${MIN_ITERATIONS}, using ${MIN_ITERATIONS}`);
    return MIN_ITERATIONS;
  }
  return parsed;
}

function deriveKey(secret, salt, iterations) {
  return crypto.pbkdf2Sync(
    String(secret),
    salt,
    iterations,
    32,
    "sha256"
  );
}

// Current payload format version
const PAYLOAD_VERSION = 1;

export const MAX_LIMIT = 50;

function isAsciiLetterOrDigit(character) {
  const code = character.charCodeAt(0);
  return (
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122)
  );
}

function digitsOnly(value) {
  const digits = [];
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code >= 48 && code <= 57) digits.push(character);
  }
  return digits.join("");
}

export function normalizePhone(phone) {
  if (!phone) return "";

  let s = String(phone).trim();
  const withoutSeparators = [];
  for (const character of s) {
    if (character === "-" || character === "(" || character === ")" || character.trim() === "") {
      continue;
    }
    withoutSeparators.push(character);
  }
  s = withoutSeparators.join("");

  let start = 0;
  let end = s.length;
  while (start < end && (s[start] === '"' || s[start] === "'")) start += 1;
  while (end > start && (s[end - 1] === '"' || s[end - 1] === "'")) end -= 1;
  s = s.slice(start, end);

  if (s.indexOf("00") === 0) {
    s = "+" + s.slice(2);
  }
  if (s.indexOf("+") === 0) {
    return "+" + digitsOnly(s.slice(1));
  }

  const normalized = digitsOnly(s);
  // No country assumption - if it looks like a local number without country code,
  // return as-is (caller should provide international format)
  // For backward compatibility, if >10 digits assume it includes country code
  if (normalized.length > 10) {
    return "+" + normalized;
  }
  return normalized;
}

const MAX_EMAIL_LENGTH = 254;
const MAX_EMAIL_LOCAL_LENGTH = 64;
const MAX_EMAIL_DOMAIN_LABEL_LENGTH = 63;

function containsWhitespace(value) {
  for (const character of value) {
    if (character.trim() === "") return true;
  }
  return false;
}

function isValidLocalPart(localPart) {
  if (
    !localPart ||
    localPart.length > MAX_EMAIL_LOCAL_LENGTH ||
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..")
  ) {
    return false;
  }

  const allowedSpecials = new Set("!#$%&'*+-/=?^_`{|}~.");
  for (const character of localPart) {
    if (isAsciiLetterOrDigit(character) || allowedSpecials.has(character)) continue;
    return false;
  }
  return true;
}

function isValidDomain(domain) {
  if (!domain || domain.length > 253 || !domain.includes(".")) return false;

  const labels = domain.split(".");
  if (labels.length < 2 || labels[labels.length - 1].length < 2) return false;

  for (const label of labels) {
    if (
      !label ||
      label.length > MAX_EMAIL_DOMAIN_LABEL_LENGTH ||
      label.startsWith("-") ||
      label.endsWith("-")
    ) {
      return false;
    }

    for (const character of label) {
      if (!isAsciiLetterOrDigit(character) && character !== "-") return false;
    }
  }

  return true;
}

export function isValidEmail(email) {
  if (email === undefined || email === null) return false;

  const value = String(email);
  if (!value || value.length > MAX_EMAIL_LENGTH || containsWhitespace(value)) return false;

  const atIndex = value.indexOf("@");
  if (atIndex <= 0 || atIndex !== value.lastIndexOf("@") || atIndex === value.length - 1) {
    return false;
  }

  return isValidLocalPart(value.slice(0, atIndex)) &&
    isValidDomain(value.slice(atIndex + 1));
}

export function isPositiveIntegerId(value) {
  if (value === undefined || value === null || value === "") return false;
  return /^\d+$/.test(String(value));
}

export function encryptAssocPassword(plainText) {
  const secret = getAssocSecret();
  if (!secret) return null;
  try {
    const iterations = getIterations();
    const salt = crypto.randomBytes(ASSOC_SALT_BYTES);
    const iv = crypto.randomBytes(ASSOC_IV_BYTES);
    const key = deriveKey(secret, salt, iterations);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([
      cipher.update(String(plainText), "utf8"),
      cipher.final()
    ]);
    const tag = cipher.getAuthTag();
    // Versioned payload format: version(1) + iterations(4) + salt + iv + tag + ciphertext
    const versionBuf = Buffer.alloc(1);
    versionBuf.writeUInt8(PAYLOAD_VERSION, 0);
    const iterBuf = Buffer.alloc(4);
    iterBuf.writeUInt32BE(iterations, 0);
    const combined = Buffer.concat([versionBuf, iterBuf, salt, iv, tag, encrypted]);
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
    // Legacy format (no version/iterations): minLength = salt + iv + tag + 1
    const legacyMinLength = ASSOC_SALT_BYTES + ASSOC_IV_BYTES + ASSOC_TAG_BYTES + 1;
    // New format: version(1) + iterations(4) + salt + iv + tag + 1
    const newMinLength = 1 + 4 + ASSOC_SALT_BYTES + ASSOC_IV_BYTES + ASSOC_TAG_BYTES + 1;
    if (raw.length < legacyMinLength) return null;

    let offset = 0;
    let iterations = DEFAULT_ITERATIONS;
    let version = 0;

    // Check if new format (first byte is version)
    if (raw.length >= newMinLength) {
      const firstByte = raw[0];
      // If first byte looks like a version (1), parse new format
      if (firstByte === PAYLOAD_VERSION && raw.length >= newMinLength) {
        version = firstByte;
        offset = 1;
        iterations = raw.readUInt32BE(offset);
        offset += 4;
      }
    }

    const salt = raw.slice(offset, (offset += ASSOC_SALT_BYTES));
    const iv = raw.slice(offset, (offset += ASSOC_IV_BYTES));
    const tag = raw.slice(offset, (offset += ASSOC_TAG_BYTES));
    const cipherText = raw.slice(offset);

    const key = deriveKey(secret, salt, iterations);
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

// Map base locales to Intl-compatible locale strings for date formatting
const LOCALE_TO_INTL = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  pt: "pt-PT",
  tr: "tr-TR",
  ru: "ru-RU"
};

export function formatDate(iso, locale = "en") {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    const intlLocale = LOCALE_TO_INTL[locale] || "en-US";
    return d.toLocaleString(intlLocale);
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
 * Reserved characters: _ * [ ] ( ) ~ ` > # + - = | { } . ! \
 */
const MARKDOWN_V2_RESERVED_CHARACTERS = new Set([
  "_", "*", "[", "]", "(", ")", "~", "`", ">", "#", "+", "-", "=",
  "|", "{", "}", ".", "!", "\\"
]);

export function escapeMarkdown(text) {
  if (text === undefined || text === null) return "";

  const escaped = [];
  for (const character of String(text)) {
    if (MARKDOWN_V2_RESERVED_CHARACTERS.has(character)) escaped.push("\\");
    escaped.push(character);
  }
  return escaped.join("");
}

/**
 * Build a Telegram MarkdownV2 link whose label and URL are escaped safely.
 * The label is escaped for MarkdownV2; the URL only encodes unsafe URL chars
 * so Telegram can parse it.
 */
export function markdownLink(label, url) {
  const safeLabel = escapeMarkdown(label);
  const safeUrl = [];
  for (const character of String(url || "")) {
    if (character === "\\") {
      safeUrl.push("\\\\");
    } else if (character === ")") {
      // Percent-encoding keeps a literal ')' from closing the MarkdownV2 link.
      safeUrl.push("%29");
    } else {
      safeUrl.push(character);
    }
  }
  return `[${safeLabel}](${safeUrl.join("")})`;
}
