// controllers/track.js
import { t } from "../services/i18n.js";
import {
  findUserByChatId,
  traccarFindDeviceByIdentifier,
  getLastPositions
} from "../services/traccar.js";
import { getDevicesForUser } from "../services/permissions.js";
import { telegramSendMessage } from "../services/telegram.js";
import { formatDate, escapeMarkdown } from "../services/security.js";

const SENSITIVE_ATTRS = new Set([
  "telegramOwner",
  "telegramChatId",
  "password",
  "token",
  "secret"
]);

export async function handleTrack(chatId, text, locale) {
  const parts = text.split(/\s+/);
  const identifier = parts[1];

  if (!identifier) {
    const user = await findUserByChatId(chatId);
    if (!user) {
      await telegramSendMessage(chatId, t(locale, "start_assoc_prompt"));
      return;
    }

    const devices = await getDevicesForUser(chatId);
    if (!devices.length) {
      await telegramSendMessage(
        chatId,
        t(locale, "track_listing_devices") + "\n(none)"
      );
      return;
    }

    const lines = devices.map(
      (d) => "- " + escapeMarkdown(d.name || d.uniqueId || "id:" + d.id) + " (id:" + d.id + ")"
    );
    await telegramSendMessage(
      chatId,
      t(locale, "track_listing_devices") + "\n" + lines.join("\n")
    );
    return;
  }

  const user = await findUserByChatId(chatId);
  if (!user) {
    await telegramSendMessage(chatId, t(locale, "start_assoc_prompt"));
    return;
  }

  const allowedDevices = await getDevicesForUser(chatId);
  const device = await traccarFindDeviceByIdentifier(identifier);
  if (!device) {
    await telegramSendMessage(
      chatId,
      t(locale, "track_device_not_found") + escapeMarkdown(identifier)
    );
    return;
  }

  const isAuthorized = allowedDevices.some((d) => d.id === device.id);
  if (!isAuthorized) {
    await telegramSendMessage(
      chatId,
      t(locale, "track_device_not_found") + escapeMarkdown(identifier)
    );
    return;
  }

  const positions = await getLastPositions(device.id, 1);
  const pos = positions[0];

  let out =
    "*" +
    t(locale, "track_device_info_title") +
    "* : " +
    escapeMarkdown(device.name || device.uniqueId) +
    "\n";
  out += "ID: " + String(device.id) + "\n";

  if (pos) {
    const time =
      pos.serverTime || pos.fixTime || pos.time || pos.deviceTime || null;
    const speed =
      typeof pos.speed !== "undefined"
        ? pos.speed
        : pos.attributes && pos.attributes.speed;
    const attrs = pos.attributes || {};
    const ignition =
      typeof attrs.ignition !== "undefined" ? attrs.ignition : null;
    const moving =
      (speed && Number(speed) > 0) || ignition ? "Moving" : "Stopped";

    out += "\n*Last position*:\n";
    if (time) out += "- Date: " + escapeMarkdown(formatDate(time)) + "\n";
    out +=
      "- Coordinates: [" +
      pos.latitude +
      "," +
      pos.longitude +
      "](https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(pos.latitude + "," + pos.longitude) +
      ")\n";
    if (typeof speed !== "undefined" && speed !== null)
      out += "- Speed: " + escapeMarkdown(String(speed)) + " km/h\n";
    out += "- State: " + escapeMarkdown(moving) + "\n";
    if (attrs.battery) out += "- Battery: " + escapeMarkdown(String(attrs.battery)) + "\n";
  } else {
    out += "\nNo position available.\n";
  }

  if (device.attributes && Object.keys(device.attributes).length) {
    out += "\n*Device attributes*:\n";
    Object.keys(device.attributes).forEach((key) => {
      if (SENSITIVE_ATTRS.has(key)) return;
      const val = device.attributes[key];
      out += "- " + escapeMarkdown(key) + " : " + escapeMarkdown(String(val)) + "\n";
    });
  }

  await telegramSendMessage(chatId, out, { parse_mode: "Markdown" });
}
