// controllers/status.js
import { t } from "../services/i18n.js";
import { findUserByChatId, getLastPositions } from "../services/traccar.js";
import { findDeviceForUser } from "../services/permissions.js";
import { telegramSendMessage } from "../services/telegram.js";
import { formatDate, escapeMarkdown } from "../services/security.js";

function computeTimeRange(days) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export async function handleStatus(chatId, text, locale) {
  const parts = text.split(/\s+/);
  const identifier = parts[1];

  if (!identifier) {
    await telegramSendMessage(chatId, escapeMarkdown(t(locale, "status_usage")));
    return;
  }

  const user = await findUserByChatId(chatId);
  if (!user) {
    await telegramSendMessage(chatId, t(locale, "start_assoc_prompt"));
    return;
  }

  const device = await findDeviceForUser(chatId, user.id, identifier);
  if (!device) {
    await telegramSendMessage(
      chatId,
      escapeMarkdown(t(locale, "track_device_not_found")) + escapeMarkdown(identifier)
    );
    return;
  }

  const { from, to } = computeTimeRange(1);
  const positions = await getLastPositions(device.id, from, to);
  const pos = positions[0];

  let out = "*Status* " + escapeMarkdown(device.name || device.uniqueId) + ":\n";
  if (pos) {
    const time =
      pos.serverTime || pos.fixTime || pos.time || pos.deviceTime || null;
    const attrs = pos.attributes || {};
    const speed =
      typeof pos.speed !== "undefined"
        ? pos.speed
        : attrs && attrs.speed;
    const ignition =
      typeof attrs.ignition !== "undefined" ? attrs.ignition : null;
    const moving =
      (speed && Number(speed) > 0) || ignition ? "Moving" : "Stopped";

    if (time) out += "- Last update: " + escapeMarkdown(formatDate(time)) + "\n";
    out += "- State: " + escapeMarkdown(moving) + "\n";
    if (typeof speed !== "undefined" && speed !== null)
      out += "- Speed: " + escapeMarkdown(String(speed)) + " km/h\n";
    if (attrs.battery) out += "- Battery: " + escapeMarkdown(String(attrs.battery)) + "\n";
  } else {
    out += escapeMarkdown(t(locale, "no_positions")) + "\n";
  }

  await telegramSendMessage(chatId, out);
}
