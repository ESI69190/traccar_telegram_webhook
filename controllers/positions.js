// controllers/positions.js
import { t } from "../services/i18n.js";
import { findUserByChatId, getLastPositions } from "../services/traccar.js";
import { findDeviceForUser } from "../services/permissions.js";
import { telegramSendMessage, sendPlainText } from "../services/telegram.js";
import { formatDate, MAX_LIMIT, escapeMarkdown, markdownLink } from "../services/security.js";

function computeTimeRange(days) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export async function handlePositions(chatId, text, locale) {
  const parts = text.split(/\s+/);
  const identifier = parts[1];
  const n = parts[2] ? parseInt(parts[2], 10) : 5;

  if (!identifier) {
    await sendPlainText(chatId, t(locale, "positions_usage"));
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

  const limit = Math.min(Math.max(isNaN(n) || n <= 0 ? 5 : n, 1), MAX_LIMIT);
  const { from, to } = computeTimeRange(7);
  const positions = await getLastPositions(device.id, from, to);
  const limitedPositions = positions.slice(0, limit);

  if (!limitedPositions.length) {
    await sendPlainText(chatId, t(locale, "no_positions"));
    return;
  }

  let out = escapeMarkdown(t(locale, "positions_for")) + " " + escapeMarkdown(device.name || device.uniqueId) + ":\n";
  limitedPositions.forEach((p, idx) => {
    const time = p.serverTime || p.fixTime || p.time || p.deviceTime || null;
    out += `\n#${idx + 1}:\n`;
    if (time) out += `- Date: ${escapeMarkdown(formatDate(time))}\n`;
    const linkLabel = p.latitude + "," + p.longitude;
    const linkUrl =
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(p.latitude + "," + p.longitude);
    out += `- Coordinates: ${markdownLink(linkLabel, linkUrl)}\n`;
    out += `- Speed: ${escapeMarkdown(p.speed || 0)} km/h\n`;
  });

  await telegramSendMessage(chatId, out);
}
