// controllers/commands.js
import { t } from "../services/i18n.js";
import { 
  findUserByChatId, 
  traccarFindDeviceByIdentifier, 
  traccarRequest 
} from "../services/traccar.js";
import { getDevicesForUser } from "../services/permissions.js";
import { telegramSendMessage } from "../services/telegram.js";

export async function handleCommands(chatId, text, locale) {
  const parts = text.split(/\s+/);
  const action = parts[1] || "";
  const deviceId = parts[2] || "";
  const commandType = parts[3] || "";

  if (!action || !deviceId || !commandType) {
    await telegramSendMessage(chatId, t(locale, "commands_usage"));
    return;
  }

  const user = await findUserByChatId(chatId);
  if (!user) {
    await telegramSendMessage(chatId, t(locale, "start_assoc_prompt"));
    return;
  }

  const devices = await getDevicesForUser(chatId, user.id);
  const device = devices.find(d => 
    d.name?.toLowerCase() === deviceId.toLowerCase() || 
    d.uniqueId?.toLowerCase() === deviceId.toLowerCase()
  );

  if (!device) {
    await telegramSendMessage(chatId, t(locale, "track_device_not_found") + deviceId);
    return;
  }

  const cmd = {
    deviceId: device.id,
    type: commandType,
    attributes: {}
  };

  const resp = await traccarRequest("post", "/api/commands/send", cmd);
  if (resp.status >= 200 && resp.status < 300) {
    await telegramSendMessage(chatId, t(locale, "command_sent"));
  } else {
    await telegramSendMessage(chatId, t(locale, "command_failed"));
  }
}