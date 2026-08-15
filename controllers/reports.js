// controllers/reports.js
import { t } from "../services/i18n.js";
import { findUserByChatId, traccarRequest } from "../services/traccar.js";
import { findDeviceForUser } from "../services/permissions.js";
import { telegramSendMessage, sendPlainText } from "../services/telegram.js";
import { escapeMarkdown, MAX_LIMIT } from "../services/security.js";

const VALID_REPORT_TYPES = new Set([
  "route",
  "events",
  "geofences",
  "summary",
  "trips",
  "stops"
]);

// Report bounds constants
const MIN_DAYS = 1;
const MAX_DAYS = 90; // Maximum days for report range to prevent unbounded queries

function parseReportArgs(parts) {
  const type = parts[1];
  const identifier = parts[2] || "";
  const days = parts[3] ? parseInt(parts[3], 10) : 1;
  // Validate and bound days parameter
  let validatedDays = isNaN(days) || days < MIN_DAYS ? MIN_DAYS : days;
  validatedDays = validatedDays > MAX_DAYS ? MAX_DAYS : validatedDays;
  return { type, identifier, days: validatedDays };
}

function computeTimeRange(days) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

function formatReport(reportType, data) {
  if (!Array.isArray(data) || !data.length) {
    return "No data for report *" + escapeMarkdown(reportType) + "*.";
  }
  let out = "*" + escapeMarkdown(reportType) + "* report:\n";
  data.slice(0, 10).forEach((row, idx) => {
    out += `\n#${idx + 1}:\n`;
    Object.keys(row).forEach((key) => {
      if (typeof row[key] === "object" && row[key] !== null) return;
      out += `- ${escapeMarkdown(key)}: ${escapeMarkdown(String(row[key]))}\n`;
    });
  });
  if (data.length > 10) {
    out += `\n... and ${data.length - 10} more row(s).`;
  }
  return out;
}

export async function handleReports(chatId, text, locale) {
  const parts = text.split(/\s+/);

  if (parts.length < 3) {
    await sendPlainText(
      chatId,
      t(locale, "reports_usage")
    );
    return;
  }

  const { type, identifier, days } = parseReportArgs(parts);

  if (!VALID_REPORT_TYPES.has(type)) {
    await sendPlainText(
      chatId,
      t(locale, "reports_usage")
    );
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

  const { from, to } = computeTimeRange(days);
  const params = { deviceId: device.id, from, to };
  const resp = await traccarRequest("get", `/api/reports/${type}`, null, params);

  if (resp.status >= 200 && resp.status < 300) {
    await telegramSendMessage(chatId, formatReport(type, resp.data));
  } else {
    await sendPlainText(chatId, t(locale, "generic_error"));
  }
}
