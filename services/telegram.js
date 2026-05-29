// services/telegram.js
import axios from "axios";

const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = BOT_TOKEN
  ? "https://api.telegram.org/bot" + BOT_TOKEN
  : null;

export async function telegramSendMessage(chatId, text, options) {
  if (!TELEGRAM_API) {
    console.warn(
      "telegramSendMessage: BOT_TOKEN missing, message not sent: " + text
    );
    return null;
  }
  try {
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: options?.parse_mode || "Markdown",
      reply_markup: options?.reply_markup
    };
    const resp = await axios.post(TELEGRAM_API + "/sendMessage", payload, {
      validateStatus: () => true
    });
    console.log("<- Telegram sendMessage", {
      status: resp.status,
      data: resp.data
    });
    return resp.data;
  } catch (err) {
    console.error("Telegram sendMessage error:", err?.toString());
    return null;
  }
}
