// controllers/engine.js
import { t } from "../services/i18n.js";
import { findUserByChatId, traccarRequest } from "../services/traccar.js";
import { findDeviceForUser } from "../services/permissions.js";
import { telegramSendMessage, sendPlainText } from "../services/telegram.js";
import { escapeMarkdown } from "../services/security.js";

export async function handleEngine(chatId, text, locale) {
  const parts = text.split(/\s+/);
  const identifier = parts[1];
  const action = (parts[2] || "").toLowerCase();

  if (!identifier || !action) {
    await sendPlainText(chatId, t(locale, "engine_usage"));
    return;
  }

  const user = await findUserByChatId(chatId);
  if (!user) {
    await sendPlainText(chatId, t(locale, "start_assoc_prompt"));
    return;
  }

  const device = await findDeviceForUser(chatId, user.id, identifier);
  if (!device) {
    await sendPlainText(
      chatId,
      t(locale, "track_device_not_found") + identifier
    );
    return;
  }

  const type = action === "on" ? "engineResume" : "engineStop";

  const cmd = {
    deviceId: device.id,
    type,
    attributes: {}
  };

  const resp = await traccarRequest("post", "/api/commands/send", cmd);
  if (resp.status >= 200 && resp.status < 300) {
    await sendPlainText(chatId, t(locale, "engine_command_sent"));
  } else {
    await sendPlainText(chatId, t(locale, "engine_command_failed"));
  }
}
