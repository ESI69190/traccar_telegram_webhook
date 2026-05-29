// controllers/engine.js
import { t } from "../services/i18n.js";
import {
  findUserByChatId,
  traccarFindDeviceByIdentifier,
  traccarRequest
} from "../services/traccar.js";
import { getDevicesForUser } from "../services/permissions.js";
import { telegramSendMessage } from "../services/telegram.js";

export async function handleEngine(chatId, text, locale) {
  const parts = text.split(/\s+/);
  const identifier = parts[1];
  const action = (parts[2] || "").toLowerCase();

  if (!identifier || !action) {
    await telegramSendMessage(chatId, t(locale, "engine_usage"));
    return;
  }

  const user = await findUserByChatId(chatId);
  if (!user) {
    await telegramSendMessage(chatId, t(locale, "start_assoc_prompt"));
    return;
  }

  const devices = await getDevicesForUser(chatId);
  const device = devices.find(
    (d) =>
      d.name?.toLowerCase() === identifier.toLowerCase() ||
      d.uniqueId?.toLowerCase() === identifier.toLowerCase()
  );

  if (!device) {
    await telegramSendMessage(
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
    await telegramSendMessage(chatId, t(locale, "engine_command_sent"));
  } else {
    await telegramSendMessage(chatId, t(locale, "engine_command_failed"));
  }
}
