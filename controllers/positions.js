// controllers/positions.js
import { t } from "../services/i18n.js";
import { findUserByChatId, traccarRequest } from "../services/traccar.js";
import { getDevicesForUser } from "../services/permissions.js";
import { telegramSendMessage } from "../services/telegram.js";
import { formatDate } from "../services/security.js";

export async function handlePositions(chatId, text, locale) {
  const parts = text.split(/\s+/);
  const identifier = parts[1];
  const limit = parts[2] ? parseInt(parts[2], 10) : 5;

  if (!identifier) {
    await telegramSendMessage(chatId, t(locale, "positions_usage"));
    return;
  }

  const user = await findUserByChatId(chatId);
  if (!user) {
    await telegramSendMessage(chatId, t(locale, "start_assoc_prompt"));
    return;
  }

  const devices = await getDevicesForUser(user.id);
  const device = devices.find(
    d => d.name?.toLowerCase() === identifier.toLowerCase() ||
         d.uniqueId?.toLowerCase() === identifier.toLowerCase()
  );

  if (!device) {
    await telegramSendMessage(chatId, t(locale, "track_device_not_found") + identifier);
    return;
  }

  const resp = await traccarRequest(
    "get",
    `/api/positions?deviceId=${device.id}&limit=${limit}`
  );

  if (resp.status !== 200) {
    await telegramSendMessage(chatId, t(locale, "no_positions"));
    return;
  }

  const positions = resp.data || [];
  if (!positions.length) {
    await telegramSendMessage(chatId, t(locale, "no_positions"));
    return;
  }

  let out = t(locale, "positions_for") + " " + (device.name || device.uniqueId) + ":\n";
  positions.forEach((p, idx) => {
    const time = p.serverTime || p.fixTime || p.time || p.deviceTime || null;
    out += `\n#${idx + 1}:\n`;
    if (time) out += `- Date: ${formatDate(time)}\n`;
    out += `- Coordinates: [${p.latitude}, ${p.longitude}]`;
    out += `\n- Speed: ${p.speed || 0} km/h\n`;
  });

  await telegramSendMessage(chatId, out, { parse_mode: "Markdown" });
}