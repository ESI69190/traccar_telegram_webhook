// controllers/engine.js
import { t } from "../services/i18n.js";
import { findUserByChatId, traccarRequest } from "../services/traccar.js";
import { findDeviceForUser } from "../services/permissions.js";
import { sendPlainText } from "../services/telegram.js";

const ALLOWED_ACTIONS = new Set(["on", "off"]);

export async function executeEngineAction(deviceId, action) {
  const normalized = String(action || "").toLowerCase();
  if (!ALLOWED_ACTIONS.has(normalized)) {
    return { valid: false, action: normalized };
  }
  const type = normalized === "on" ? "engineResume" : "engineStop";
  const cmd = { deviceId, type, attributes: {} };
  const resp = await traccarRequest("post", "/api/commands/send", cmd);
  return { valid: true, ok: resp.status >= 200 && resp.status < 300, status: resp.status, type };
}

export async function handleEngine(chatId, text, locale) {
  const tokens = String(text || "").split(/\s+/).filter(Boolean);
  const maybeAction = tokens.length > 1 ? tokens[tokens.length - 1] : "";
  if (!maybeAction) {
    await sendPlainText(chatId, t(locale, "engine_usage"));
    return;
  }
  const normalizedAction = maybeAction.toLowerCase();
  if (!ALLOWED_ACTIONS.has(normalizedAction)) {
    await sendPlainText(chatId, t(locale, "engine_usage"));
    return;
  }
  const identifier = tokens.slice(1, -1).join(" ");
  if (!identifier) {
    await sendPlainText(chatId, t(locale, "engine_usage"));
    return;
  }
  const user = await findUserByChatId(chatId);
  if (!user) {
    await sendPlainText(chatId, t(locale, "start_assoc_prompt"));
    return;
  }
  const device = await findDeviceForUser(chatId, user.id, identifier);
  if (!device) {
    await sendPlainText(chatId, t(locale, "track_device_not_found") + identifier);
    return;
  }
  const result = await executeEngineAction(device.id, normalizedAction);
  if (result.valid && result.ok) {
    await sendPlainText(chatId, t(locale, "engine_command_sent"));
  } else {
    await sendPlainText(chatId, t(locale, "engine_command_failed"));
  }
}
