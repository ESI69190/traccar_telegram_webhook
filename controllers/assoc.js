// controllers/assoc.js
import { t } from "../services/i18n.js";
import {
  normalizePhone,
  isValidEmail,
  encryptAssocPassword,
  decryptAssocPassword,
  redactPhone,
  escapeMarkdown
} from "../services/security.js";
import {
  findUserByPhone,
  findUserByEmail,
  updateUserPhoneAndChat,
  verifySession
} from "../services/traccar.js";
import { telegramSendMessage } from "../services/telegram.js";

function getAssocSecret() {
  return process.env.ASSOC_SECRET || null;
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
      console.log("Purge pending chat " + chatId + " (expired)");
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

async function verifyUserPassword(email, password) {
  if (!email || !password) return false;
  try {
    const resp = await verifySession(email, password);
    return resp.status >= 200 && resp.status < 300;
  } catch (e) {
    return false;
  }
}

export async function handleAssoc(chatId, msg, locale) {
  const text = (msg.text || "").trim();

  if (text.toLowerCase() === "/assoc telegram") {
    pendingChats.set(chatId, {
      createdAt: Date.now(),
      awaitingEmail: false,
      phoneCandidate: null,
      awaitingAssocConfirm: false
    });
    const keyboard = {
      keyboard: [[{ text: "Partager mon contact", request_contact: true }]],
      one_time_keyboard: true,
      resize_keyboard: true
    };
    await telegramSendMessage(chatId, t(locale, "share_contact_prompt"), {
      reply_markup: keyboard
    });
    return true;
  }

  if (text.startsWith("/assoc")) {
    const parts = text.split(/\s+/);
    const arg1 = parts[1] || "";
    const arg2 = parts[2] || "";
    const cleaned = String(arg1 || "").replace(/^["']|["']$/g, "").trim();

    if (!cleaned) {
      pendingChats.set(chatId, {
        createdAt: Date.now(),
        awaitingEmail: false,
        phoneCandidate: null,
        awaitingAssocConfirm: false
      });
      const keyboard = {
        keyboard: [[{ text: "Partager mon contact", request_contact: true }]],
        one_time_keyboard: true,
        resize_keyboard: true
      };
      await telegramSendMessage(chatId, t(locale, "assoc_no_phone"), {
        reply_markup: keyboard
      });
      return true;
    }

    const phoneCandidate = normalizePhone(cleaned);
    if (!phoneCandidate || phoneCandidate.replace(/\D/g, "").length < 6) {
      await telegramSendMessage(chatId, escapeMarkdown(t(locale, "assoc_invalid_phone")));
      return true;
    }

    if (!getAssocSecret()) {
      await telegramSendMessage(chatId, escapeMarkdown(t(locale, "assoc_confirm_failed")));
      return true;
    }

    if (!arg2) {
      pendingChats.set(chatId, {
        createdAt: Date.now(),
        awaitingEmail: false,
        phoneCandidate,
        awaitingAssocConfirm: true
      });
      await telegramSendMessage(chatId, escapeMarkdown(t(locale, "assoc_encrypted_required")));
      return true;
    }

    const decrypted = decryptAssocPassword(arg2);
    if (!decrypted) {
      await telegramSendMessage(chatId, escapeMarkdown(t(locale, "assoc_confirm_failed")));
      return true;
    }

    const userByPhone = await findUserByPhone(phoneCandidate);
    if (userByPhone && userByPhone.email) {
      const valid = await verifyUserPassword(userByPhone.email, decrypted);
      if (!valid) {
        await telegramSendMessage(chatId, escapeMarkdown(t(locale, "assoc_confirm_failed")));
        return true;
      }
      const upd = await updateUserPhoneAndChat(
        userByPhone.id,
        phoneCandidate,
        chatId
      );
      if (upd.ok) {
        await telegramSendMessage(
          chatId,
          escapeMarkdown(t(locale, "assoc_confirm_success")) +
            escapeMarkdown(upd.user.name || userByPhone.email || userByPhone.id)
        );
      } else {
        await telegramSendMessage(chatId, escapeMarkdown(t(locale, "generic_error")));
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
    await telegramSendMessage(chatId, escapeMarkdown(t(locale, "assoc_no_user_ask_email")));
    return true;
  }

  if (msg.contact) {
    const phoneRaw = String(msg.contact.phone_number || "");
    const phone = normalizePhone(phoneRaw);
    console.log("Contact shared phone:", redactPhone(phone), "chatId:", chatId);

    if (!getAssocSecret()) {
      await telegramSendMessage(chatId, escapeMarkdown(t(locale, "assoc_confirm_failed")));
      await telegramSendMessage(chatId, "Keyboard removed.", {
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
    await telegramSendMessage(
      chatId,
      escapeMarkdown(t(locale, "assoc_encrypted_required")),
      { reply_markup: { remove_keyboard: true } }
    );
    return true;
  }

  if (msg.text) {
    const pending = pendingChats.get(chatId);
    if (pending && pending.awaitingAssocConfirm && !pending.awaitingEmail) {
      const encryptedBase64 = String(msg.text || "").trim();
      const decrypted = decryptAssocPassword(encryptedBase64);
      if (!decrypted) {
        await telegramSendMessage(chatId, escapeMarkdown(t(locale, "assoc_confirm_failed")));
        clearPending(chatId);
        return true;
      }

      const userByPhone = pending.phoneCandidate
        ? await findUserByPhone(pending.phoneCandidate)
        : null;
      if (userByPhone && userByPhone.email) {
        const valid = await verifyUserPassword(userByPhone.email, decrypted);
        if (!valid) {
          await telegramSendMessage(chatId, escapeMarkdown(t(locale, "assoc_confirm_failed")));
          clearPending(chatId);
          return true;
        }
        const upd = await updateUserPhoneAndChat(
          userByPhone.id,
          pending.phoneCandidate,
          chatId
        );
        if (upd.ok) {
          await telegramSendMessage(
            chatId,
            escapeMarkdown(t(locale, "assoc_confirm_success")) +
              escapeMarkdown(upd.user.name || userByPhone.email || userByPhone.id)
          );
        } else {
          await telegramSendMessage(chatId, escapeMarkdown(t(locale, "generic_error")));
        }
        clearPending(chatId);
        return true;
      }

      pending.awaitingEmail = true;
      pending.assocPasswordPlain = decrypted;
      await telegramSendMessage(chatId, escapeMarkdown(t(locale, "assoc_no_user_ask_email")));
      return true;
    }

    if (pending && pending.awaitingEmail) {
      const candidateEmail = String(msg.text || "").trim();
      const cancelWord = (t(locale, "cancel") || "cancel").toLowerCase();
      if (!isValidEmail(candidateEmail)) {
        if (
          candidateEmail.toLowerCase() === cancelWord ||
          candidateEmail.toLowerCase() === "annuler"
        ) {
          clearPending(chatId);
          await telegramSendMessage(chatId, escapeMarkdown(t(locale, "cancelled")));
          return true;
        }
        await telegramSendMessage(chatId, escapeMarkdown(t(locale, "assoc_email_invalid")));
        return true;
      }

      const userByEmail = await findUserByEmail(candidateEmail);
      if (!userByEmail) {
        await telegramSendMessage(chatId, escapeMarkdown(t(locale, "assoc_email_not_found")));
        return true;
      }

      if (pending.awaitingAssocConfirm && pending.assocPasswordPlain) {
        const valid = await verifyUserPassword(
          userByEmail.email,
          pending.assocPasswordPlain
        );
        if (!valid) {
          await telegramSendMessage(chatId, escapeMarkdown(t(locale, "assoc_confirm_failed")));
          clearPending(chatId);
          return true;
        }
      }

      const phoneToSet = pending.phoneCandidate || "";
      if (!phoneToSet) {
        await telegramSendMessage(
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
        await telegramSendMessage(
          chatId,
          escapeMarkdown(t(locale, "assoc_updated_by_email")) +
            escapeMarkdown(upd2.user.name || candidateEmail)
        );
      } else {
        await telegramSendMessage(chatId, escapeMarkdown(t(locale, "generic_error")));
      }
      return true;
    }
  }

  return false;
}
