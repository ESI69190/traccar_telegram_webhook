// router/telegram.js
import { getUserLocale, t } from "../services/i18n.js";
import { findUserByChatId } from "../services/traccar.js";
import { telegramSendMessage, sendPlainText } from "../services/telegram.js";
import { handleAssoc } from "../controllers/assoc.js";
import { handleTrack } from "../controllers/track.js";
import { handleHistory } from "../controllers/history.js";
import { handleStatus } from "../controllers/status.js";
import { handleEngine } from "../controllers/engine.js";
import { handlePositions } from "../controllers/positions.js";
import { handleCommands } from "../controllers/commands.js";
import handleOrders from "../controllers/orders.js";
import { handleReports } from "../controllers/reports.js";

export async function handleTelegramUpdate(req, res) {
  try {
    const botSecret = process.env.BOT_SECRET || null;
    if (botSecret) {
      const secretHeader = req.headers["x-telegram-bot-api-secret-token"];
      if (secretHeader !== botSecret) {
        console.warn("Invalid or missing Telegram secret token. Request rejected.");
        return res.sendStatus(401);
      }
    } else if (process.env.NODE_ENV === "production") {
      console.warn("BOT_SECRET not set in production. Telegram webhook request rejected.");
      return res.sendStatus(401);
    }

    const update = req.body;
    const msg = update && update.message;
    if (!msg) return res.sendStatus(200);

    if (msg.chat && msg.chat.type !== "private") {
      return res.sendStatus(200);
    }

    const chatId = String(
      (msg.chat && msg.chat.id) || (msg.from && msg.from.id) || ""
    );
    if (!chatId) return res.sendStatus(200);

    const associatedUser = await findUserByChatId(chatId);
    const locale = getUserLocale(associatedUser);
    const text = (msg.text || "").trim();

    // /start
    if (text.startsWith("/start")) {
      let startMsg =
        t(locale, "start_intro") +
        "\n\n" +
        t(locale, "start_commands") +
        "\n\n";
      if (!associatedUser) {
        startMsg += t(locale, "start_assoc_prompt");
      }
      await sendPlainText(chatId, startMsg);
      return res.sendStatus(200);
    }

    // assoc (commandes, contact, email pending)
    const assocHandled = await handleAssoc(chatId, msg, locale);
    if (assocHandled) return res.sendStatus(200);

    if (text.startsWith("/track")) {
      await handleTrack(chatId, text, locale);
      return res.sendStatus(200);
    }

    if (text.startsWith("/history")) {
      await handleHistory(chatId, text, locale);
      return res.sendStatus(200);
    }

    if (text.startsWith("/status")) {
      await handleStatus(chatId, text, locale);
      return res.sendStatus(200);
    }

    if (text.startsWith("/engine")) {
      await handleEngine(chatId, text, locale);
      return res.sendStatus(200);
    }

    if (text.startsWith("/commands")) {
      await handleCommands(chatId, text, locale);
      return res.sendStatus(200);
    }

    if (text.startsWith("/orders")) {
      await handleOrders(chatId, text, locale);
      return res.sendStatus(200);
    }

    if (text.startsWith("/positions")) {
      await handlePositions(chatId, text, locale);
      return res.sendStatus(200);
    }

    if (text.startsWith("/reports")) {
      await handleReports(chatId, text, locale);
      return res.sendStatus(200);
    }

    return res.sendStatus(200);
  } catch (e) {
    console.error("handleTelegramUpdate error:", String(e?.message || e));
    return res.sendStatus(200);
  }
}
