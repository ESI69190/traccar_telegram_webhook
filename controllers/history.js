// controllers/history.js
import { t } from "../services/i18n.js";
import {
  findUserByChatId,
  getLastPositions
} from "../services/traccar.js";
import { getDevicesForUser } from "../services/permissions.js";
import { telegramSendMessage } from "../services/telegram.js";
import { formatDate } from "../services/security.js";

export async function handleHistory(chatId, text, locale) {
  const parts = text.split(/\s+/);
  const identifier = parts[1];
  const n = parts[2] ? parseInt(parts[2], 10) : 5;

  if (!identifier) {
    await telegramSendMessage(chatId, t(locale, "history_usage"));
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

  const limit = isNaN(n) || n <= 0 ? 5 : n;
  const positions = await getLastPositions(device.id, limit);

  if (!positions.length) {
    await telegramSendMessage(chatId, t(locale, "no_positions"));
    return;
  }

  let out = "*History for* " + (device.name || device.uniqueId) + ":\n";
  positions.forEach((p, idx) => {
    const time =
      p.serverTime || p.fixTime || p.time || p.deviceTime || null;
    out += "\n#" + (idx + 1) + ":\n";
    if (time) out += "- Date: " + formatDate(time) + "\n";
    out +=
      "- Coordinates: [" +
      p.latitude +
      "," +
      p.longitude +
      "](https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(p.latitude + "," + p.longitude) +
      ")\n";
  });

  await telegramSendMessage(chatId, out, { parse_mode: "Markdown" });
}
