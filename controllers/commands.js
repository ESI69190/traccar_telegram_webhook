// controllers/commands.js
import { t } from "../services/i18n.js";
import { findUserByChatId, traccarRequest } from "../services/traccar.js";
import { findDeviceForUser } from "../services/permissions.js";
import { telegramSendMessage, sendPlainText } from "../services/telegram.js";
import { escapeMarkdown } from "../services/security.js";

export async function handleCommands(chatId, text, locale) {
  const parts = text.split(/\s+/);
  const action = parts[1] || "";
  const deviceId = parts[2] || "";
  const commandType = parts[3] || "";

  if (!action || !deviceId || !commandType) {
    await sendPlainText(chatId, t(locale, "commands_usage"));
    return;
  }

  const user = await findUserByChatId(chatId);
  if (!user) {
    await sendPlainText(chatId, t(locale, "start_assoc_prompt"));
    return;
  }

  const device = await findDeviceForUser(chatId, user.id, deviceId);
  if (!device) {
    await sendPlainText(
      chatId,
      t(locale, "track_device_not_found") + deviceId
    );
    return;
  }

  const cmd = {
    deviceId: device.id,
    type: commandType,
    attributes: {}
  };

  const resp = await traccarRequest("post", "/api/commands/send", cmd);
  if (resp.status >= 200 && resp.status < 300) {
    await sendPlainText(chatId, t(locale, "command_sent"));
  } else {
    await sendPlainText(chatId, t(locale, "command_failed"));
  }
}
