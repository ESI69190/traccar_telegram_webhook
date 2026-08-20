// services/callbackRouter.js
import { findUserByChatId, getLastPositions } from "./traccar.js";
import { getDevicesForUser, findDeviceByIdForUser } from "./permissions.js";
import { telegramSendMessage, sendPlainText, editPlainText, answerCallbackQuery, editMessageText, editMessageReplyMarkup } from "./telegram.js";
import { getUserLocale, t } from "./i18n.js";
import { formatDate, escapeMarkdown, markdownLink, MAX_LIMIT } from "./security.js";
import { handleTrack } from "../controllers/track.js";
import { handleHistory } from "../controllers/history.js";
import { handleStatus } from "../controllers/status.js";
import { executeEngineAction } from "../controllers/engine.js";
import { handleCommands } from "../controllers/commands.js";
import handleOrders from "../controllers/orders.js";
import { handlePositions } from "../controllers/positions.js";
import { handleReports } from "../controllers/reports.js";
import { buildLocalizedWebAppUrl } from "../controllers/assoc.js";

const SENSITIVE_ATTRS = new Set([
  "telegramOwner",
  "telegramChatId",
  "password",
  "token",
  "secret"
]);

// Callback data format: action:param1:param2:...
// Examples:
// menu:main
// device:list
// device:select:123
// track:123
// track:refresh:123
// history:123
// history:today:123
// history:24h:123
// history:7d:123
// status:123
// status:refresh:123
// commands:123
// engine:on:123
// engine:off:123
// confirm:engine:on:123
// confirm:engine:off:123
// orders:list
// positions:123
// reports:route:123
// language
// language:set:fr
// nav:home
// nav:back
// cancel

function parseCallbackData(data) {
  if (!data || typeof data !== "string") return null;
  const parts = data.split(":");
  return {
    action: parts[0],
    params: parts.slice(1)
  };
}

function validateCallbackData(parsed) {
  if (!parsed || !parsed.action) return false;
  const validActions = new Set([
    "menu", "device", "track", "history", "status", "commands",
    "engine", "confirm", "orders", "positions", "reports",
    "language", "nav", "cancel", "assoc"
  ]);
  return validActions.has(parsed.action);
}

async function getUserAndLocale(chatId, telegramLanguageCode) {
  const user = await findUserByChatId(chatId);
  const locale = getUserLocale(user, telegramLanguageCode);
  return { user, locale };
}

/**
 * Send or edit a plain-text message (localized/raw strings).
 * Automatically escapes the text for MarkdownV2.
 */
async function sendOrEditPlainText(chatId, messageId, text, options = {}) {
  if (messageId) {
    return editPlainText(chatId, messageId, text, options);
  } else {
    return sendPlainText(chatId, text, options);
  }
}

/**
 * Send or edit an intentionally formatted MarkdownV2 message.
 * The caller is responsible for ensuring the text is properly escaped.
 */
async function sendOrEditMarkdown(chatId, messageId, text, options = {}) {
  const payload = { parse_mode: "MarkdownV2", ...options };
  if (messageId) {
    return editMessageText(chatId, messageId, text, payload);
  } else {
    return telegramSendMessage(chatId, text, payload);
  }
}

async function sendMainMenu(chatId, locale, user, messageId = null) {
  const isAssociated = !!user;

  let keyboard;
  let text;

  if (isAssociated) {
    text = t(locale, "menu_main_title");
    keyboard = {
      inline_keyboard: [
        [
          { text: t(locale, "btn_position"), callback_data: "device:list:track" },
          { text: t(locale, "btn_history"), callback_data: "device:list:history" }
        ],
        [
          { text: t(locale, "btn_status"), callback_data: "device:list:status" },
          { text: t(locale, "btn_commands"), callback_data: "device:list:commands" }
        ],
        [
          { text: t(locale, "btn_orders"), callback_data: "orders:list" },
          { text: t(locale, "btn_reports"), callback_data: "device:list:reports" }
        ],
        [
          { text: t(locale, "btn_positions"), callback_data: "device:list:positions" },
          { text: t(locale, "btn_language"), callback_data: "language" }
        ],
        [
          { text: t(locale, "btn_help"), callback_data: "nav:help" }
        ]
      ]
    };
  } else {
    text = t(locale, "menu_main_unassociated");
    const webAppUrl = process.env.TELEGRAM_ASSOC_WEBAPP_URL;
    const localizedUrl = webAppUrl ? buildLocalizedWebAppUrl(webAppUrl, locale) : null;

    keyboard = {
      inline_keyboard: [
        [
          { text: t(locale, "btn_connect_account"), web_app: { url: localizedUrl || "https://example.com" } }
        ],
        [
          { text: t(locale, "btn_language"), callback_data: "language" },
          { text: t(locale, "btn_help"), callback_data: "nav:help" }
        ]
      ]
    };

    // If no webapp URL, show error message instead
    if (!webAppUrl) {
      text = t(locale, "miniapp_error_config");
    }
  }

  await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
}

async function sendDeviceSelector(chatId, locale, user, messageId, targetAction) {
  const devices = await getDevicesForUser(chatId, user.id);

  if (!devices.length) {
    const text = t(locale, "track_listing_devices") + "\n(none)";
    const keyboard = {
      inline_keyboard: [
        [{ text: t(locale, "btn_back"), callback_data: "nav:home" }]
      ]
    };
    await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
    return;
  }

  // Single device optimization - go directly to action
  if (devices.length === 1) {
    const device = devices[0];
    // Route directly to the target action with this device
    const callbackData = `${targetAction}:${device.id}`;
    // Simulate the callback by calling the handler directly
    await handleCallbackAction(chatId, callbackData, locale, user, messageId);
    return;
  }

  // Multiple devices - show selector
  const text = t(locale, "menu_choose_device");
  const keyboard = {
    inline_keyboard: devices.map(d => [{
      text: d.name || d.uniqueId || `id:${d.id}`,
      callback_data: `${targetAction}:${d.id}`
    }]).concat([[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]])
  };

  await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
}

async function sendTrackResult(chatId, locale, user, deviceId, messageId = null) {
  const device = await findDeviceByIdForUser(chatId, user.id, deviceId);
  if (!device) {
    const text = t(locale, "track_device_not_found") + deviceId;
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]] };
    await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
    return;
  }

  const { from, to } = computeTimeRange(1);
  const positions = await getLastPositions(device.id, from, to);
  const pos = positions[0];

  let out = "*" + escapeMarkdown(t(locale, "track_device_info_title")) + "* : " + escapeMarkdown(device.name || device.uniqueId) + "\n";
  out += escapeMarkdown("ID: ") + escapeMarkdown(String(device.id)) + "\n";

  if (pos) {
    const time = pos.serverTime || pos.fixTime || pos.time || pos.deviceTime || null;
    const speed = typeof pos.speed !== "undefined" ? pos.speed : (pos.attributes && pos.attributes.speed);
    const attrs = pos.attributes || {};
    const ignition = typeof attrs.ignition !== "undefined" ? attrs.ignition : null;
    const moving = (speed && Number(speed) > 0) || ignition ? "Moving" : "Stopped";

    out += "\n*Last position*:\n";
    if (time) out += escapeMarkdown("- Date: ") + escapeMarkdown(formatDate(time, locale)) + "\n";
    const linkLabel = pos.latitude + "," + pos.longitude;
    const linkUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(pos.latitude + "," + pos.longitude);
    out += escapeMarkdown("- Coordinates: ") + markdownLink(linkLabel, linkUrl) + "\n";
    if (typeof speed !== "undefined" && speed !== null) out += escapeMarkdown("- Speed: ") + escapeMarkdown(String(speed)) + " km/h\n";
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

  const keyboard = {
    inline_keyboard: [
      [
        { text: t(locale, "btn_refresh"), callback_data: `track:refresh:${deviceId}` },
        { text: t(locale, "btn_history"), callback_data: `history:${deviceId}` }
      ],
      [
        { text: t(locale, "btn_status"), callback_data: `status:${deviceId}` },
        { text: t(locale, "btn_commands"), callback_data: `commands:${deviceId}` }
      ],
      [
        { text: t(locale, "btn_back"), callback_data: "device:list:track" },
        { text: t(locale, "btn_home"), callback_data: "nav:home" }
      ]
    ]
  };

  await sendOrEditMarkdown(chatId, messageId, out, { reply_markup: keyboard });
}

async function sendHistoryMenu(chatId, locale, user, deviceId, messageId = null) {
  const device = await findDeviceByIdForUser(chatId, user.id, deviceId);
  if (!device) {
    const text = t(locale, "track_device_not_found") + deviceId;
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]] };
    await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
    return;
  }

  const text = t(locale, "history_choose_range");
  const keyboard = {
    inline_keyboard: [
      [{ text: t(locale, "btn_history_recent"), callback_data: `history:recent:${deviceId}` }],
      [{ text: t(locale, "btn_history_today"), callback_data: `history:today:${deviceId}` }],
      [{ text: t(locale, "btn_history_24h"), callback_data: `history:24h:${deviceId}` }],
      [{ text: t(locale, "btn_history_7d"), callback_data: `history:7d:${deviceId}` }],
      [{ text: t(locale, "btn_back"), callback_data: `device:list:history` }, { text: t(locale, "btn_home"), callback_data: "nav:home" }]
    ]
  };

  await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
}

async function sendHistoryResult(chatId, locale, user, deviceId, range, messageId = null) {
  const device = await findDeviceByIdForUser(chatId, user.id, deviceId);
  if (!device) {
    const text = t(locale, "track_device_not_found") + deviceId;
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]] };
    await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
    return;
  }

  const { from, to } = computeTimeRange(range === "recent" ? 1 : (range === "today" ? 1 : (range === "24h" ? 1 : 7)));
  const positions = await getLastPositions(device.id, from, to);

  let out = "*" + escapeMarkdown(t(locale, "history_title")) + "* : " + escapeMarkdown(device.name || device.uniqueId) + "\n";
  out += escapeMarkdown("Range: ") + escapeMarkdown(range) + "\n\n";

  if (!positions.length) {
    out += escapeMarkdown("No positions found for this period.") + "\n";
  } else {
    positions.slice(0, 10).forEach((pos, idx) => {
      const time = pos.serverTime || pos.fixTime || pos.time || pos.deviceTime || null;
      const speed = typeof pos.speed !== "undefined" ? pos.speed : (pos.attributes && pos.attributes.speed);
      out += escapeMarkdown(`${idx + 1}. `);
      if (time) out += escapeMarkdown(formatDate(time, locale)) + " ";
      out += escapeMarkdown(pos.latitude + "," + pos.longitude);
      if (typeof speed !== "undefined" && speed !== null) out += " " + escapeMarkdown(String(speed)) + " km/h";
      out += "\n";
    });
    if (positions.length > 10) {
      out += "\n" + escapeMarkdown("... and ") + escapeMarkdown(String(positions.length - 10)) + escapeMarkdown(" more.") + "\n";
    }
  }

  const keyboard = {
    inline_keyboard: [
      [{ text: t(locale, "btn_refresh"), callback_data: `history:${range}:${deviceId}` }],
      [{ text: t(locale, "btn_back"), callback_data: `history:${deviceId}` }],
      [{ text: t(locale, "btn_home"), callback_data: "nav:home" }]
    ]
  };
  await sendOrEditMarkdown(chatId, messageId, out, { reply_markup: keyboard });
}

async function sendStatusResult(chatId, locale, user, deviceId, messageId = null) {
  const device = await findDeviceByIdForUser(chatId, user.id, deviceId);
  if (!device) {
    const text = t(locale, "track_device_not_found") + deviceId;
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]] };
    await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
    return;
  }

  const { from, to } = computeTimeRange(1);
  const positions = await getLastPositions(device.id, from, to);
  const pos = positions[0];

  let out = "*" + escapeMarkdown(t(locale, "status_title")) + "* : " + escapeMarkdown(device.name || device.uniqueId) + "\n";
  out += escapeMarkdown("ID: ") + escapeMarkdown(String(device.id)) + "\n";

  if (pos) {
    const time = pos.serverTime || pos.fixTime || pos.time || pos.deviceTime || null;
    const speed = typeof pos.speed !== "undefined" ? pos.speed : (pos.attributes && pos.attributes.speed);
    const attrs = pos.attributes || {};
    const ignition = typeof attrs.ignition !== "undefined" ? attrs.ignition : null;
    const moving = (speed && Number(speed) > 0) || ignition ? "Moving" : "Stopped";

    out += "\n*Last position*:\n";
    if (time) out += escapeMarkdown("- Date: ") + escapeMarkdown(formatDate(time, locale)) + "\n";
    const linkLabel = pos.latitude + "," + pos.longitude;
    const linkUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(pos.latitude + "," + pos.longitude);
    out += escapeMarkdown("- Coordinates: ") + markdownLink(linkLabel, linkUrl) + "\n";
    if (typeof speed !== "undefined" && speed !== null) out += escapeMarkdown("- Speed: ") + escapeMarkdown(String(speed)) + " km/h\n";
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

  const keyboard = {
    inline_keyboard: [
      [
        { text: t(locale, "btn_refresh"), callback_data: `status:refresh:${deviceId}` },
        { text: t(locale, "btn_track"), callback_data: `track:${deviceId}` }
      ],
      [
        { text: t(locale, "btn_commands"), callback_data: `commands:${deviceId}` },
        { text: t(locale, "btn_engine"), callback_data: `engine:on:${deviceId}` }
      ],
      [
        { text: t(locale, "btn_back"), callback_data: "device:list:status" },
        { text: t(locale, "btn_home"), callback_data: "nav:home" }
      ]
    ]
  };

  await sendOrEditMarkdown(chatId, messageId, out, { reply_markup: keyboard });
}

async function sendCommandsMenu(chatId, locale, user, deviceId, messageId = null) {
  const device = await findDeviceByIdForUser(chatId, user.id, deviceId);
  if (!device) {
    const text = t(locale, "track_device_not_found") + deviceId;
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]] };
    await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
    return;
  }

  const text = t(locale, "commands_choose_type");
  const keyboard = {
    inline_keyboard: [
      [{ text: t(locale, "btn_custom_command"), callback_data: `commands:custom:${deviceId}` }],
      [{ text: t(locale, "btn_back"), callback_data: `device:list:commands` }, { text: t(locale, "btn_home"), callback_data: "nav:home" }]
    ]
  };

  await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
}

async function sendEngineConfirmation(chatId, locale, user, deviceId, action, messageId = null) {
  const device = await findDeviceByIdForUser(chatId, user.id, deviceId);
  if (!device) {
    const text = t(locale, "track_device_not_found") + deviceId;
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]] };
    await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
    return;
  }

  const actionText = action === "on" ? t(locale, "btn_engine_on") : t(locale, "btn_engine_off");
  const text = t(locale, "confirm_engine_action", { action: actionText, device: device.name || device.uniqueId });
  const keyboard = {
    inline_keyboard: [
      [
        { text: t(locale, "btn_yes"), callback_data: `confirm:engine:${action}:${deviceId}` },
        { text: t(locale, "btn_no"), callback_data: `commands:${deviceId}` }
      ],
      [{ text: t(locale, "btn_back"), callback_data: `commands:${deviceId}` }]
    ]
  };

  await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
}

async function executeEngineCommand(chatId, locale, user, deviceId, action) {
  const device = await findDeviceByIdForUser(chatId, user.id, deviceId);
  if (!device) {
    await sendPlainText(chatId, t(locale, "track_device_not_found") + deviceId);
    return;
  }

  const result = await executeEngineAction(device.id, action);

  if (result.valid && result.ok) {
    await sendPlainText(chatId, t(locale, "engine_command_sent"));
  } else {
    await sendPlainText(chatId, t(locale, "engine_command_failed"));
  }
}

async function sendOrdersMenu(chatId, locale, user, messageId = null) {
  const text = t(locale, "orders_menu_title");
  const keyboard = {
    inline_keyboard: [
      [{ text: t(locale, "btn_orders_list"), callback_data: "orders:list" }],
      [{ text: t(locale, "btn_back"), callback_data: "nav:home" }]
    ]
  };

  await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
}

async function sendPositionsResult(chatId, locale, user, deviceId, messageId = null) {
  const device = await findDeviceByIdForUser(chatId, user.id, deviceId);
  if (!device) {
    const text = t(locale, "track_device_not_found") + deviceId;
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]] };
    await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
    return;
  }

  const { from, to } = computeTimeRange(1);
  const positions = await getLastPositions(device.id, from, to);

  let out = "*" + escapeMarkdown(t(locale, "positions_title")) + "* : " + escapeMarkdown(device.name || device.uniqueId) + "\n\n";

  if (!positions.length) {
    out += escapeMarkdown("No positions available.") + "\n";
  } else {
    positions.slice(0, 10).forEach((pos, idx) => {
      const time = pos.serverTime || pos.fixTime || pos.time || pos.deviceTime || null;
      const speed = typeof pos.speed !== "undefined" ? pos.speed : (pos.attributes && pos.attributes.speed);
      out += escapeMarkdown(`${idx + 1}. `);
      if (time) out += escapeMarkdown(formatDate(time, locale)) + " ";
      out += escapeMarkdown(pos.latitude + "," + pos.longitude);
      if (typeof speed !== "undefined" && speed !== null) out += " " + escapeMarkdown(String(speed)) + " km/h";
      out += "\n";
    });
    if (positions.length > 10) {
      out += "\n" + escapeMarkdown("... and ") + escapeMarkdown(String(positions.length - 10)) + escapeMarkdown(" more.") + "\n";
    }
  }

  const keyboard = {
    inline_keyboard: [
      [{ text: t(locale, "btn_refresh"), callback_data: `positions:${deviceId}` }],
      [{ text: t(locale, "btn_back"), callback_data: "device:list:positions" }],
      [{ text: t(locale, "btn_home"), callback_data: "nav:home" }]
    ]
  };
  await sendOrEditMarkdown(chatId, messageId, out, { reply_markup: keyboard });
}

async function sendReportsMenu(chatId, locale, user, deviceId, messageId = null) {
  const device = await findDeviceByIdForUser(chatId, user.id, deviceId);
  if (!device) {
    const text = t(locale, "track_device_not_found") + deviceId;
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]] };
    await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
    return;
  }

  const text = t(locale, "reports_choose_type");
  const keyboard = {
    inline_keyboard: [
      [{ text: t(locale, "btn_report_route"), callback_data: `reports:route:${deviceId}` }],
      [{ text: t(locale, "btn_report_stops"), callback_data: `reports:stops:${deviceId}` }],
      [{ text: t(locale, "btn_report_summary"), callback_data: `reports:summary:${deviceId}` }],
      [{ text: t(locale, "btn_back"), callback_data: "device:list:reports" }, { text: t(locale, "btn_home"), callback_data: "nav:home" }]
    ]
  };

  await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
}

async function sendReportResult(chatId, locale, user, deviceId, reportType, messageId = null) {
  const device = await findDeviceByIdForUser(chatId, user.id, deviceId);
  if (!device) {
    const text = t(locale, "track_device_not_found") + deviceId;
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]] };
    await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
    return;
  }

  const { from, to } = computeTimeRange(7);
  const { traccarRequest } = await import("./traccar.js");
  const resp = await traccarRequest("get", `/api/reports/${reportType}`, null, { deviceId: device.id, from, to });

  let out;
  if (resp.status >= 200 && resp.status < 300) {
    out = formatReport(reportType, resp.data);
  } else {
    out = escapeMarkdown(t(locale, "generic_error"));
  }

  const keyboard = {
    inline_keyboard: [
      [{ text: t(locale, "btn_refresh"), callback_data: `reports:${reportType}:${deviceId}` }],
      [{ text: t(locale, "btn_back"), callback_data: `reports:${deviceId}` }],
      [{ text: t(locale, "btn_home"), callback_data: "nav:home" }]
    ]
  };

  await sendOrEditMarkdown(chatId, messageId, out, { reply_markup: keyboard });
}

async function sendLanguageMenu(chatId, locale, messageId = null) {
  const text = t(locale, "menu_language_title");
  const keyboard = {
    inline_keyboard: [
      [{ text: "English", callback_data: "language:set:en" }, { text: "Français", callback_data: "language:set:fr" }],
      [{ text: "Español", callback_data: "language:set:es" }, { text: "Português", callback_data: "language:set:pt" }],
      [{ text: "Türkçe", callback_data: "language:set:tr" }, { text: "Русский", callback_data: "language:set:ru" }],
      [{ text: "中文", callback_data: "language:set:zh" }, { text: "日本語", callback_data: "language:set:ja" }],
      [{ text: "Deutsch", callback_data: "language:set:de" }, { text: "한국어", callback_data: "language:set:ko" }],
      [{ text: "Italiano", callback_data: "language:set:it" }],
      [{ text: t(locale, "btn_back"), callback_data: "nav:home" }]
    ]
  };

  await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
}

async function sendHelpMenu(chatId, locale, messageId = null) {
  const text = t(locale, "menu_help_text");
  const keyboard = {
    inline_keyboard: [
      [{ text: t(locale, "btn_back"), callback_data: "nav:home" }]
    ]
  };

  await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
}

function computeTimeRange(days) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

function formatReport(reportType, data) {
  if (!Array.isArray(data) || !data.length) {
    return escapeMarkdown("No data for report ") + "*" + escapeMarkdown(reportType) + "*" + escapeMarkdown(".");
  }
  let out = "*" + escapeMarkdown(reportType) + "*" + escapeMarkdown(" report:\n");
  data.slice(0, 10).forEach((row, idx) => {
    out += "\n" + escapeMarkdown("#") + escapeMarkdown(String(idx + 1)) + escapeMarkdown(":\n");
    Object.keys(row).forEach((key) => {
      if (typeof row[key] === "object" && row[key] !== null) return;
      out += escapeMarkdown("- ") + escapeMarkdown(key) + escapeMarkdown(": ") + escapeMarkdown(String(row[key])) + "\n";
    });
  });
  if (data.length > 10) {
    out += "\n" + escapeMarkdown("... and ") + escapeMarkdown(String(data.length - 10)) + escapeMarkdown(" more row(s).");
  }
  return out;
}

export async function handleCallbackQuery(update) {
  const callbackQuery = update.callback_query;
  if (!callbackQuery) return;

  const chatId = String(callbackQuery.message?.chat?.id || callbackQuery.from?.id || "");
  const messageId = callbackQuery.message?.message_id;
  const telegramLanguageCode = callbackQuery.from?.language_code || null;
  const data = callbackQuery.data;

  // Acknowledge callback query immediately
  await answerCallbackQuery(callbackQuery.id);

  if (!chatId) return;

  const parsed = parseCallbackData(data);
  if (!validateCallbackData(parsed)) {
    await sendPlainText(chatId, "Invalid action");
    return;
  }

  const { user, locale } = await getUserAndLocale(chatId, telegramLanguageCode);

  await handleCallbackAction(chatId, data, locale, user, messageId);
}

async function handleCallbackAction(chatId, data, locale, user, messageId) {
  const parsed = parseCallbackData(data);
  const { action, params } = parsed;

  try {
    switch (action) {
      case "menu":
        if (params[0] === "main") {
          await sendMainMenu(chatId, locale, user, messageId);
        }
        break;

      case "device":
        if (params[0] === "list") {
          const targetAction = params[1] || "track";
          await sendDeviceSelector(chatId, locale, user, messageId, targetAction);
        } else if (params[0] === "select") {
          const deviceId = params[1];
          const targetAction = params[2] || "track";
          // This would be handled by the specific action handler
        }
        break;

      case "track":
        if (params[0] === "refresh") {
          await sendTrackResult(chatId, locale, user, params[1], messageId);
        } else {
          await sendTrackResult(chatId, locale, user, params[0], messageId);
        }
        break;

      case "history":
        if (params[0] === "recent" || params[0] === "today" || params[0] === "24h" || params[0] === "7d") {
          await sendHistoryResult(chatId, locale, user, params[1], params[0], messageId);
        } else {
          await sendHistoryMenu(chatId, locale, user, params[0], messageId);
        }
        break;

      case "status":
        if (params[0] === "refresh") {
          await sendStatusResult(chatId, locale, user, params[1], messageId);
        } else {
          await sendStatusResult(chatId, locale, user, params[0], messageId);
        }
        break;

      case "commands":
        await sendCommandsMenu(chatId, locale, user, params[0], messageId);
        break;

      case "engine":
        if (params[0] === "on" || params[0] === "off") {
          await sendEngineConfirmation(chatId, locale, user, params[1], params[0], messageId);
        }
        break;

      case "confirm":
        if (params[0] === "engine" && (params[1] === "on" || params[1] === "off")) {
          await executeEngineCommand(chatId, locale, user, params[2], params[1]);
        }
        break;

      case "orders":
        if (params[0] === "list") {
          await sendOrdersMenu(chatId, locale, user, messageId);
        }
        break;

      case "positions":
        await sendPositionsResult(chatId, locale, user, params[0], messageId);
        break;

      case "reports":
        if (params[1]) {
          await sendReportResult(chatId, locale, user, params[1], params[0], messageId);
        } else {
          await sendReportsMenu(chatId, locale, user, params[0], messageId);
        }
        break;

      case "language":
        if (params[0] === "set") {
          // Language is determined by Telegram, just show confirmation
          await sendPlainText(chatId, t(locale, "language_set_info", { lang: params[1] }));
          await sendMainMenu(chatId, locale, user, messageId);
        } else {
          await sendLanguageMenu(chatId, locale, messageId);
        }
        break;

      case "nav":
        if (params[0] === "home") {
          await sendMainMenu(chatId, locale, user, messageId);
        } else if (params[0] === "back") {
          await sendMainMenu(chatId, locale, user, messageId);
        } else if (params[0] === "help") {
          await sendHelpMenu(chatId, locale, messageId);
        }
        break;

      case "cancel":
        await sendMainMenu(chatId, locale, user, messageId);
        break;

      case "assoc":
        // Handled by existing assoc controller
        break;

      default:
        await sendPlainText(chatId, t(locale, "invalid_action"));
    }
  } catch (error) {
    console.error("Callback action error:", error);
    await sendPlainText(chatId, t(locale, "generic_error"));
  }
}

export { parseCallbackData, validateCallbackData, sendMainMenu, sendHelpMenu };