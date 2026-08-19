// controllers/track.js
import { t } from "../services/i18n.js";
import { findUserByChatId, getLastPositions } from "../services/traccar.js";
import { getDevicesForUser, findDeviceForUser } from "../services/permissions.js";
import { telegramSendMessage, sendPlainText } from "../services/telegram.js";
import { formatDate, escapeMarkdown, markdownLink } from "../services/security.js";

const SENSITIVE_ATTRS = new Set([
  "telegramOwner",
  "telegramChatId",
  "password",
  "token",
  "secret"
]);

function computeTimeRange(limit) {
  const to = new Date();
  const from = new Date(to.getTime() - limit * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export async function handleTrack(chatId, text, locale) {
  const parts = text.split(/\s+/);
  const identifier = parts.slice(1).join(" ");

  const user = await findUserByChatId(chatId);
  if (!user) {
    await sendPlainText(chatId, t(locale, "start_assoc_prompt"));
    return;
  }

  if (!identifier) {
    const devices = await getDevicesForUser(chatId, user.id);
    if (!devices.length) {
      await sendPlainText(
        chatId,
        t(locale, "track_listing_devices") + "\n(none)"
      );
      return;
    }

    const lines = devices.map(
      (d) => "- " + (d.name || d.uniqueId || "id:" + d.id) + " (id:" + d.id + ")"
    );
    await sendPlainText(
      chatId,
      t(locale, "track_listing_devices") + "\n" + lines.join("\n")
    );
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

  const { from, to } = computeTimeRange(1);
  const positions = await getLastPositions(device.id, from, to);
  const pos = positions[0];

  let out =
    "*" +
    escapeMarkdown(t(locale, "track_device_info_title")) +
    "* : " +
    escapeMarkdown(device.name || device.uniqueId) +
    "\n";
  out += escapeMarkdown("ID: ") + escapeMarkdown(String(device.id)) + "\n";

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
    if (time) out += escapeMarkdown("- Date: ") + escapeMarkdown(formatDate(time)) + "\n";
    const linkLabel = pos.latitude + "," + pos.longitude;
    const linkUrl =
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(pos.latitude + "," + pos.longitude);
    out += escapeMarkdown("- Coordinates: ") + markdownLink(linkLabel, linkUrl) + "\n";
    if (typeof speed !== "undefined" && speed !== null)
      out += escapeMarkdown("- Speed: ") + escapeMarkdown(String(speed)) + " km/h\n";
    out += escapeMarkdown("- State: ") + escapeMarkdown(moving) + "\n";
    if (attrs.battery) out += escapeMarkdown("- Battery: ") + escapeMarkdown(String(attrs.battery)) + "\n";
  } else {
    out += "\n" + escapeMarkdown("No position available.") + "\n";
  }

  if (device.attributes && Object.keys(device.attributes).length) {
    out += "\n*Device attributes*:\n";
    Object.keys(device.attributes).forEach((key) => {
      if (SENSITIVE_ATTRS.has(key)) return;
      const val = device.attributes[key];
      out += escapeMarkdown("- ") + escapeMarkdown(key) + escapeMarkdown(" : ") + escapeMarkdown(String(val)) + "\n";
    });
  }

  await telegramSendMessage(chatId, out);
}
