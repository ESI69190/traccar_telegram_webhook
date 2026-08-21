// controllers/assoc.js
import { t } from "../services/i18n.js";
import {
  normalizePhone,
  isValidEmail,
  encryptAssocPassword,
  decryptAssocPassword,
  redactPhone,
  escapeMarkdown,
  safeLog
} from "../services/security.js";
import {
  findUserByPhone,
  findUserByEmail,
  updateUserPhoneAndChat,
  verifySession
} from "../services/traccar.js";
import { telegramSendMessage, sendPlainText } from "../services/telegram.js";

function getAssocSecret() {
  return process.env.ASSOC_SECRET || null;
}

function getWebAppUrl() {
  return process.env.TELEGRAM_ASSOC_WEBAPP_URL || null;
}

export function buildLocalizedWebAppUrl(webAppUrl, locale) {
  try {
    const url = new URL(webAppUrl);
    url.searchParams.set("lang", locale || "en");
    return url.toString();
  } catch (e) {
    // If URL parsing fails, return original URL (should not happen with valid config)
    return webAppUrl;
  }
}

const pendingChats = new Map();
const PENDING_TTL = 10 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [chatId, meta] of pendingChats.entries()) {
    if (now - meta.createdAt > PENDING_TTL) {
      if (meta.assocPasswordPlain) {
        meta.assocPasswordPlain = null;
      }
      pendingChats.delete(chatId);
      console.log("Purge pending chat " + safeLog(chatId) + " (expired)");
    }
  }
}, 60 * 1000).unref();

function clearPending(chatId) {
  const meta = pendingChats.get(chatId);
  if (meta && meta.assocPasswordPlain) {
    meta.assocPasswordPlain = null;
  }
  pendingChats.delete(chatId);
}

/**
 * Server-side classification of an incoming message. The `kind` field is a
 * server-defined token (not raw user input), so security decisions in the
 * handler are never made directly on user-controlled data such as
 * `msg.contact` or `msg.text`.
 *
 * @param {Object} msg - Telegram update.message payload.
 * @returns {{kind: string, text?: string, phone?: string}}
 */
export function classifyAssocInput(msg) {
  if (msg && msg.contact && msg.contact.phone_number) {
    return { kind: "contact", phone: String(msg.contact.phone_number) };
  }
  if (msg && typeof msg.text === "string") {
    return { kind: "text", text: msg.text };
  }
  return { kind: "none" };
}

async function verifyUserPassword(email, password) {
  if (!email || !password) return false;
  try {
    const resp = await verifySession(email, password);
    return resp.status >= 200 && resp.status < 300;
  } catch (e) {
    return false;
  }
}

async function sendMiniAppPrompt(chatId, locale, webAppUrl) {
  const localizedWebAppUrl = buildLocalizedWebAppUrl(webAppUrl, locale);
  const keyboard = {
    inline_keyboard: [[
      { text: t(locale, "miniapp_button_open"), web_app: { url: localizedWebAppUrl } }
    ]]
  };
  await sendPlainText(chatId, t(locale, "miniapp_open_prompt"), {
    reply_markup: keyboard
  });
}

async function sendConfigError(chatId, locale) {
  console.error("TELEGRAM_ASSOC_WEBAPP_URL not configured for Mini App association");
  await sendPlainText(chatId, t(locale, "miniapp_error_config"));
}

// --- Legacy command handlers (reached only through a server-classified input) ---

async function handleMiniAppAssocCommand(chatId, locale, webAppUrl, hasWebApp) {
  if (hasWebApp) {
    await sendMiniAppPrompt(chatId, locale, webAppUrl);
  } else {
    // Configuration error - do NOT fall back to legacy workflow
    await sendConfigError(chatId, locale);
  }
  return true;
}

async function handleLegacyAssoc(chatId, locale, text) {
  const parts = text.split(/\s+/);
  const arg1 = parts[1] || "";
  const arg2 = parts[2] || "";
  const cleaned = String(arg1 || "").replace(/^["']|["']$/g, "").trim();

  if (!cleaned) {
    // Plain /assoc with no arguments - this is handled by the caller
    return false;
  }

  const phoneCandidate = normalizePhone(cleaned);
  if (!phoneCandidate || phoneCandidate.replace(/\D/g, "").length < 6) {
    await sendPlainText(chatId, t(locale, "assoc_invalid_phone"));
    return true;
  }

  if (!getAssocSecret()) {
    await sendPlainText(chatId, t(locale, "assoc_confirm_failed"));
    return true;
  }

  if (!arg2) {
    pendingChats.set(chatId, {
      createdAt: Date.now(),
      awaitingEmail: false,
      phoneCandidate,
      awaitingAssocConfirm: true
    });
    await sendPlainText(chatId, t(locale, "assoc_encrypted_required"));
    return true;
  }

  const decrypted = decryptAssocPassword(arg2);
  if (!decrypted) {
    await sendPlainText(chatId, t(locale, "assoc_confirm_failed"));
    return true;
  }

  const userByPhone = await findUserByPhone(phoneCandidate);
  if (userByPhone && userByPhone.email) {
    const valid = await verifyUserPassword(userByPhone.email, decrypted);
    if (!valid) {
      await sendPlainText(chatId, t(locale, "assoc_confirm_failed"));
      return true;
    }
    const upd = await updateUserPhoneAndChat(
      userByPhone.id,
      phoneCandidate,
      chatId
    );
    if (upd.ok) {
      await sendPlainText(
        chatId,
        t(locale, "assoc_confirm_success") +
          (upd.user.name || userByPhone.email || userByPhone.id)
      );
    } else {
      await sendPlainText(chatId, t(locale, "generic_error"));
    }
    return true;
  }

  pendingChats.set(chatId, {
    createdAt: Date.now(),
    awaitingEmail: true,
    phoneCandidate,
    awaitingAssocConfirm: true,
    assocPasswordPlain: decrypted
  });
  await sendPlainText(chatId, t(locale, "assoc_no_user_ask_email"));
  return true;
}

async function handleContactShare(chatId, phoneRaw, locale) {
  const phone = normalizePhone(phoneRaw);
  console.log(
    "Contact shared phone:",
    safeLog(redactPhone(phone)),
    "chatId:",
    safeLog(chatId)
  );

  if (!getAssocSecret()) {
    await sendPlainText(chatId, t(locale, "assoc_confirm_failed"));
    await sendPlainText(chatId, "Keyboard removed.", {
      reply_markup: { remove_keyboard: true }
    });
    return true;
  }

  pendingChats.set(chatId, {
    createdAt: Date.now(),
    awaitingEmail: false,
    phoneCandidate: phone,
    awaitingAssocConfirm: true
  });
  await sendPlainText(
    chatId,
    t(locale, "assoc_encrypted_required"),
    { reply_markup: { remove_keyboard: true } }
  );
  return true;
}

async function handlePlainText(chatId, text, locale) {
  const pending = pendingChats.get(chatId);
  if (!pending || !pending.awaitingAssocConfirm) return false;
  const textValue = String(text || "").trim();

  if (pending.awaitingEmail) {
    const candidateEmail = textValue;
    const cancelWord = (t(locale, "cancel") || "cancel").toLowerCase();
    if (!isValidEmail(candidateEmail)) {
      if (
        candidateEmail.toLowerCase() === cancelWord ||
        candidateEmail.toLowerCase() === "annuler"
      ) {
        clearPending(chatId);
        await sendPlainText(chatId, t(locale, "cancelled"));
        return true;
      }
      await sendPlainText(chatId, t(locale, "assoc_email_invalid"));
      return true;
    }

    const userByEmail = await findUserByEmail(candidateEmail);
    if (!userByEmail) {
      await sendPlainText(chatId, t(locale, "assoc_email_not_found"));
      return true;
    }

    if (pending.awaitingAssocConfirm && pending.assocPasswordPlain) {
      const valid = await verifyUserPassword(
        userByEmail.email,
        pending.assocPasswordPlain
      );
      if (!valid) {
        await sendPlainText(chatId, t(locale, "assoc_confirm_failed"));
        clearPending(chatId);
        return true;
      }
    }

    const phoneToSet = pending.phoneCandidate || "";
    if (!phoneToSet) {
      await sendPlainText(
        chatId,
        "No phone candidate in pending state. Send /assoc <phone> or share contact."
      );
      clearPending(chatId);
      return true;
    }

    const upd2 = await updateUserPhoneAndChat(
      userByEmail.id,
      phoneToSet,
      chatId
    );
    clearPending(chatId);
    if (upd2.ok) {
      await sendPlainText(
        chatId,
        t(locale, "assoc_updated_by_email") +
          (upd2.user.name || candidateEmail)
      );
    } else {
      await sendPlainText(chatId, t(locale, "generic_error"));
    }
    return true;
  }

  // Awaiting encrypted password confirmation
  const encryptedBase64 = textValue;
  const decrypted = decryptAssocPassword(encryptedBase64);
  if (!decrypted) {
    await sendPlainText(chatId, t(locale, "assoc_confirm_failed"));
    clearPending(chatId);
    return true;
  }

  const userByPhone = pending.phoneCandidate
    ? await findUserByPhone(pending.phoneCandidate)
    : null;
  if (userByPhone && userByPhone.email) {
    const valid = await verifyUserPassword(userByPhone.email, decrypted);
    if (!valid) {
      await sendPlainText(chatId, t(locale, "assoc_confirm_failed"));
      clearPending(chatId);
      return true;
    }
    const upd = await updateUserPhoneAndChat(
      userByPhone.id,
      pending.phoneCandidate,
      chatId
    );
    if (upd.ok) {
      await sendPlainText(
        chatId,
        t(locale, "assoc_confirm_success") +
          (upd.user.name || userByPhone.email || userByPhone.id)
      );
    } else {
      await sendPlainText(chatId, t(locale, "generic_error"));
    }
    clearPending(chatId);
    return true;
  }

  pending.awaitingEmail = true;
  pending.assocPasswordPlain = decrypted;
  await sendPlainText(chatId, t(locale, "assoc_no_user_ask_email"));
  return true;
}

export async function handleAssoc(chatId, msg, locale) {
  // Classify the incoming message through a server-owned function. All
  // downstream branches switch on the server-defined `kind`, so user input
  // cannot select a sensitive code path directly.
  const input = classifyAssocInput(msg);
  const text = input.kind === "text" ? input.text.trim() : "";

  // Check if Mini App is configured
  const webAppUrl = getWebAppUrl();
  const hasWebApp = !!webAppUrl;

  // Mini App association commands: "/assoc" or "/assoc telegram"
  const lowerText = text.toLowerCase();
  const isMiniAppAssoc = lowerText === "/assoc" || lowerText === "/assoc telegram";

  if (isMiniAppAssoc) {
    return handleMiniAppAssocCommand(chatId, locale, webAppUrl, hasWebApp);
  }

  // Legacy explicit syntax: /assoc <phone> <encryptedPassword>
  if (input.kind === "text" && text.startsWith("/assoc")) {
    const handled = await handleLegacyAssoc(chatId, locale, text);
    if (handled) return true;
    // Fall back to Mini App prompt for a bare /assoc
    return handleMiniAppAssocCommand(chatId, locale, webAppUrl, hasWebApp);
  }

  // Contact sharing - only reached via explicit legacy path (not from plain /assoc)
  if (input.kind === "contact") {
    return handleContactShare(chatId, input.phone, locale);
  }

  if (input.kind === "text") {
    const handled = await handlePlainText(chatId, text, locale);
    if (handled) return true;
  }

  return false;
}