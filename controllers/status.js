// controllers/status.js
import { t } from "../services/i18n.js";
import {
  findUserByChatId,
  getLastPositions
} from "../services/traccar.js";
import { getDevicesForUser } from "../services/permissions.js";
import { telegramSendMessage } from "../services/telegram.js";
import { formatDate } from "../services/security.js";

export async function handleStatus(chatId, text, locale) {
  const parts = text.split(/\s+/);
  const identifier = parts[1];

  if (!identifier) {
    await telegramSendMessage(chatId, t(locale, "status_usage"));
    return;
  }

  const user = await findUserByChatId(chatId);
  if (!user) {
    await telegramSendMessage(chatId, t(locale, "start_assoc_prompt"));
    return;
  }

  const devices = await getDevicesForUser(user.id);
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

  const positions = await getLastPositions(device.id, 1);
  const pos = positions[0];

  let out = "*Status* " + (device.name || device.uniqueId) + ":\n";
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

    if (time) out += "- Last update: " + formatDate(time) + "\n";
    out += "- State: " + moving + "\n";
    if (typeof speed !== "undefined" && speed !== null)
      out += "- Speed: " + String(speed) + " km/h\n";
    if (attrs.battery) out += "- Battery: " + String(attrs.battery) + "\n";
  } else {
    out += t(locale, "no_positions") + "\n";
  }

  await telegramSendMessage(chatId, out, { parse_mode: "Markdown" });
}
