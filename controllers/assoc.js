// controllers/assoc.js
import { t } from "../services/i18n.js";
import {
  normalizePhone,
  isValidEmail,
  decryptAssocPassword,
  redactPhone,
  escapeMarkdown
} from "../services/security.js";
import {
  findUserByPhone,
  findUserByEmail,
  updateUserPhoneAndChat
} from "../services/traccar.js";
import { telegramSendMessage } from "../services/telegram.js";
import axios from "axios";

const TRACCAR_URL = process.env.TRACCAR_URL || "http://traccar:8082";
function getAssocSecret() {
  return process.env.ASSOC_SECRET || null;
}

const pendingChats = new Map();
const PENDING_TTL = 10 * 60 * 1000;

function requireSecureAssoc() {
  if (process.env.NODE_ENV === "production" && !getAssocSecret()) {
    return true;
  }
  return false;
}

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
      reply_markup: keyboard,
      parse_mode: "Markdown"
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
        reply_markup: keyboard,
        parse_mode: "Markdown"
      });
      return true;
    }

    const phoneCandidate = normalizePhone(cleaned);
    if (!phoneCandidate || phoneCandidate.replace(/\D/g, "").length < 6) {
      await telegramSendMessage(chatId, t(locale, "assoc_invalid_phone"));
      return true;
    }

    if (getAssocSecret()) {
      if (!arg2) {
        pendingChats.set(chatId, {
          createdAt: Date.now(),
          awaitingEmail: false,
          phoneCandidate,
          awaitingAssocConfirm: true
        });
        await telegramSendMessage(chatId, t(locale, "assoc_encrypted_required"));
        return true;
      }

      const decrypted = decryptAssocPassword(arg2);
      if (!decrypted) {
        await telegramSendMessage(chatId, t(locale, "assoc_confirm_failed"));
        return true;
      }

      const userByPhone = await findUserByPhone(phoneCandidate);
      if (userByPhone && userByPhone.login) {
        try {
          const test = await axios.get(TRACCAR_URL + "/api/session", {
            auth: { username: userByPhone.login, password: decrypted },
            validateStatus: () => true
          });
          if (test.status === 200) {
            const upd = await updateUserPhoneAndChat(
              userByPhone.id,
              phoneCandidate,
              chatId
            );
            if (upd.ok) {
              await telegramSendMessage(
                chatId,
                t(locale, "assoc_confirm_success") +
                  escapeMarkdown(upd.user.name || userByPhone.email || userByPhone.id)
              );
            } else {
              await telegramSendMessage(chatId, t(locale, "generic_error"));
            }
            return true;
          } else {
            await telegramSendMessage(chatId, t(locale, "assoc_confirm_failed"));
            return true;
          }
        } catch (e) {
          console.error("Auth test error:", e?.toString());
          await telegramSendMessage(chatId, t(locale, "assoc_confirm_failed"));
          return true;
        }
      } else {
        pendingChats.set(chatId, {
          createdAt: Date.now(),
          awaitingEmail: true,
          phoneCandidate,
          awaitingAssocConfirm: true,
          assocPasswordPlain: decrypted
        });
        await telegramSendMessage(chatId, t(locale, "assoc_no_user_ask_email"));
        return true;
      }
    } else {
      if (requireSecureAssoc()) {
        await telegramSendMessage(chatId, t(locale, "assoc_confirm_failed"));
        return true;
      }
      const user = await findUserByPhone(phoneCandidate);
      if (user) {
        const upd = await updateUserPhoneAndChat(
          user.id,
          phoneCandidate,
          chatId
        );
        if (upd.ok) {
          await telegramSendMessage(
            chatId,
            t(locale, "assoc_found_and_updated") +
              escapeMarkdown(upd.user.name || upd.user.email || user.id)
          );
        } else {
          await telegramSendMessage(chatId, t(locale, "generic_error"));
        }
        return true;
      }
      pendingChats.set(chatId, {
        createdAt: Date.now(),
        awaitingEmail: true,
        phoneCandidate,
        awaitingAssocConfirm: false
      });
      await telegramSendMessage(chatId, t(locale, "assoc_no_user_ask_email"));
      return true;
    }
  }

  if (msg.contact) {
    const phoneRaw = String(msg.contact.phone_number || "");
    const phone = normalizePhone(phoneRaw);
    console.log("Contact shared phone:", redactPhone(phone), "chatId:", chatId);

    if (getAssocSecret()) {
      pendingChats.set(chatId, {
        createdAt: Date.now(),
        awaitingEmail: false,
        phoneCandidate: phone,
        awaitingAssocConfirm: true
      });
      await telegramSendMessage(
        chatId,
        t(locale, "assoc_encrypted_required")
      );
      return true;
    }

    if (requireSecureAssoc()) {
      await telegramSendMessage(chatId, t(locale, "assoc_confirm_failed"));
      await telegramSendMessage(chatId, "Keyboard removed.", {
        reply_markup: { remove_keyboard: true }
      });
      return true;
    }

    const userByPhone = await findUserByPhone(phone);
    if (userByPhone) {
      const upd1 = await updateUserPhoneAndChat(userByPhone.id, phone, chatId);
      if (upd1.ok) {
        await telegramSendMessage(
          chatId,
          t(locale, "assoc_found_and_updated") +
            escapeMarkdown(upd1.user.name || upd1.user.email || userByPhone.id)
        );
      } else {
        await telegramSendMessage(chatId, t(locale, "generic_error"));
      }
      await telegramSendMessage(chatId, "Keyboard removed.", {
        reply_markup: { remove_keyboard: true }
      });
      return true;
    }

    pendingChats.set(chatId, {
      createdAt: Date.now(),
      awaitingEmail: true,
      phoneCandidate: phone,
      awaitingAssocConfirm: false
    });
    await telegramSendMessage(chatId, t(locale, "assoc_no_user_ask_email"), {
      reply_markup: { remove_keyboard: true },
      parse_mode: "Markdown"
    });
    return true;
  }

  if (msg.text) {
    const pending = pendingChats.get(chatId);
    if (pending && pending.awaitingAssocConfirm && !pending.awaitingEmail) {
      const encryptedBase64 = String(msg.text || "").trim();
      const decrypted = decryptAssocPassword(encryptedBase64);
      if (!decrypted) {
        await telegramSendMessage(chatId, t(locale, "assoc_confirm_failed"));
        pendingChats.delete(chatId);
        return true;
      }

      const userByPhone = pending.phoneCandidate
        ? await findUserByPhone(pending.phoneCandidate)
        : null;
      if (userByPhone && userByPhone.login) {
        try {
          const test = await axios.get(TRACCAR_URL + "/api/session", {
            auth: { username: userByPhone.login, password: decrypted },
            validateStatus: () => true
          });
          if (test.status === 200) {
            const upd = await updateUserPhoneAndChat(
              userByPhone.id,
              pending.phoneCandidate,
              chatId
            );
            if (upd.ok) {
              await telegramSendMessage(
                chatId,
                t(locale, "assoc_confirm_success") +
                  escapeMarkdown(upd.user.name || userByPhone.email || userByPhone.id)
              );
            } else {
              await telegramSendMessage(chatId, t(locale, "generic_error"));
            }
          } else {
            await telegramSendMessage(
              chatId,
              t(locale, "assoc_confirm_failed")
            );
          }
        } catch (e) {
          console.error("Auth test error:", e?.toString());
          await telegramSendMessage(chatId, t(locale, "assoc_confirm_failed"));
        }
        pendingChats.delete(chatId);
        return true;
      }

      pending.awaitingEmail = true;
      pending.assocPasswordPlain = decrypted;
      await telegramSendMessage(chatId, t(locale, "assoc_no_user_ask_email"));
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
          if (pending.assocPasswordPlain) pending.assocPasswordPlain = null;
          pendingChats.delete(chatId);
          await telegramSendMessage(chatId, t(locale, "cancelled"));
          return true;
        }
        await telegramSendMessage(chatId, t(locale, "assoc_email_invalid"));
        return true;
      }

      const userByEmail = await findUserByEmail(candidateEmail);
      if (!userByEmail) {
        await telegramSendMessage(chatId, t(locale, "assoc_email_not_found"));
        return true;
      }

      if (pending.awaitingAssocConfirm && pending.assocPasswordPlain) {
        if (userByEmail.login) {
          try {
            const test2 = await axios.get(TRACCAR_URL + "/api/session", {
              auth: {
                username: userByEmail.login,
                password: pending.assocPasswordPlain
              },
              validateStatus: () => true
            });
            if (test2.status !== 200) {
              await telegramSendMessage(
                chatId,
                t(locale, "assoc_confirm_failed")
              );
              if (pending.assocPasswordPlain) pending.assocPasswordPlain = null;
              pendingChats.delete(chatId);
              return true;
            }
          } catch (e) {
            console.error("Auth test error:", e?.toString());
            await telegramSendMessage(chatId, t(locale, "assoc_confirm_failed"));
            if (pending.assocPasswordPlain) pending.assocPasswordPlain = null;
            pendingChats.delete(chatId);
            return true;
          }
        } else {
          console.warn(
            "No login for user to verify assoc password; proceeding to update."
          );
        }
      }

      const phoneToSet = pending.phoneCandidate || "";
      if (!phoneToSet) {
        await telegramSendMessage(
          chatId,
          "No phone candidate in pending state. Send /assoc <phone> or share contact."
        );
        if (pending.assocPasswordPlain) pending.assocPasswordPlain = null;
        pendingChats.delete(chatId);
        return true;
      }

      const upd2 = await updateUserPhoneAndChat(
        userByEmail.id,
        phoneToSet,
        chatId
      );
      if (pending.assocPasswordPlain) pending.assocPasswordPlain = null;
      if (upd2.ok) {
        await telegramSendMessage(
          chatId,
          t(locale, "assoc_updated_by_email") +
            escapeMarkdown(upd2.user.name || candidateEmail)
        );
      } else {
        await telegramSendMessage(chatId, t(locale, "generic_error"));
      }
      pendingChats.delete(chatId);
      return true;
    }
  }

  return false;
}
