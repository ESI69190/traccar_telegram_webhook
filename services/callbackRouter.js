// services/callbackRouter.js
//
// Callback routing is delegated to the central callbackData module
// (services/callbackData.js). All device-scoped callbacks use the schema:
//
//   cmd:<kind>:<deviceId>[:subtype[:subtype2...]]
//
// The Traccar numeric device id is ALWAYS carried in the dedicated field
// (position 2) and parsed explicitly, so "custom" / "engine" / "on" / "off"
// can never be interpreted as a device id. Legacy callbacks without the
// "cmd" prefix are preserved only for the fixed formats that were
// guaranteed to carry a numeric device id; ambiguous strings such as
// "commands:custom:123" are never accepted.
import { findUserByChatId, getLastPositions, traccarRequest } from "./traccar.js";
import { getDevicesForUser, findDeviceByIdForUser } from "./permissions.js";
import {
  telegramSendMessage, sendPlainText, editPlainText, answerCallbackQuery, editMessageText, editMessageReplyMarkup
} from "./telegram.js";
import { getUserLocale, t } from "./i18n.js";
import { formatDate, escapeMarkdown, markdownLink } from "./security.js";
import { executeEngineAction } from "../controllers/engine.js";
import { buildLocalizedWebAppUrl } from "../controllers/assoc.js";
import {
  encodeDeviceCallback,
  parseCallbackData,
  validateCallbackData,
  cleanDeviceId
} from "./callbackData.js";

const SENSITIVE_ATTRS = new Set([
  "telegramOwner",
  "telegramChatId",
  "password",
  "token",
  "secret"
]);

const HISTORY_RANGES = new Set(["recent", "today", "24h", "7d"]);
const DEVICE_KINDS = new Set([
  "commands", "custom", "engine", "track", "history", "status",
  "positions", "reports", "confirm"
]);
const MAX_CUSTOM_COMMANDS = 8;

async function getUserAndLocale(chatId, telegramLanguageCode) {
  const user = await findUserByChatId(chatId);
  const locale = getUserLocale(user, telegramLanguageCode);
  return { user, locale };
}

async function sendOrEditPlainText(chatId, messageId, text, options = {}) {
  if (messageId) {
    return editPlainText(chatId, messageId, text, options);
  }
  return sendPlainText(chatId, text, options);
}

async function sendOrEditMarkdown(chatId, messageId, text, options = {}) {
  const payload = { parse_mode: "MarkdownV2", ...options };
  if (messageId) {
    return editMessageText(chatId, messageId, text, payload);
  }
  return telegramSendMessage(chatId, text, payload);
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

  if (devices.length === 1) {
    const device = devices[0];
    const callbackData = encodeDeviceCallback(targetAction, device.id);
    await handleCallbackAction(chatId, callbackData, locale, user, messageId);
    return;
  }

  const text = t(locale, "menu_choose_device");
  const keyboard = {
    inline_keyboard: devices.map((d) => [{
      text: d.name || d.uniqueId || `id:${d.id}`,
      callback_data: encodeDeviceCallback(targetAction, d.id)
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
        { text: t(locale, "btn_refresh"), callback_data: encodeDeviceCallback("track", deviceId, "refresh") },
        { text: t(locale, "btn_history"), callback_data: encodeDeviceCallback("history", deviceId) }
      ],
      [
        { text: t(locale, "btn_status"), callback_data: encodeDeviceCallback("status", deviceId) },
        { text: t(locale, "btn_commands"), callback_data: encodeDeviceCallback("commands", deviceId) }
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
      [{ text: t(locale, "btn_history_recent"), callback_data: encodeDeviceCallback("history", deviceId, "recent") }],
      [{ text: t(locale, "btn_history_today"), callback_data: encodeDeviceCallback("history", deviceId, "today") }],
      [{ text: t(locale, "btn_history_24h"), callback_data: encodeDeviceCallback("history", deviceId, "24h") }],
      [{ text: t(locale, "btn_history_7d"), callback_data: encodeDeviceCallback("history", deviceId, "7d") }],
      [{ text: t(locale, "btn_back"), callback_data: "device:list:history" }, { text: t(locale, "btn_home"), callback_data: "nav:home" }]
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
      [{ text: t(locale, "btn_refresh"), callback_data: encodeDeviceCallback("history", deviceId, range) }],
      [{ text: t(locale, "btn_back"), callback_data: encodeDeviceCallback("history", deviceId) }],
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
        { text: t(locale, "btn_refresh"), callback_data: encodeDeviceCallback("status", deviceId, "refresh") },
        { text: t(locale, "btn_track"), callback_data: encodeDeviceCallback("track", deviceId) }
      ],
      [
        { text: t(locale, "btn_commands"), callback_data: encodeDeviceCallback("commands", deviceId) },
        { text: t(locale, "btn_engine"), callback_data: encodeDeviceCallback("engine", deviceId, "on") }
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
      [{ text: t(locale, "btn_custom_command"), callback_data: encodeDeviceCallback("commands", deviceId, "custom") }],
      [{ text: t(locale, "btn_back"), callback_data: "device:list:commands" }, { text: t(locale, "btn_home"), callback_data: "nav:home" }]
    ]
  };

  await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
}

async function sendCustomCommandPicker(chatId, locale, user, deviceId, messageId = null) {
  const device = await findDeviceByIdForUser(chatId, user.id, deviceId);
  if (!device) {
    const text = t(locale, "track_device_not_found") + deviceId;
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]] };
    await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
    return;
  }

  let types = [];
  try {
    const resp = await traccarRequest("get", "/api/commands/types", null, { deviceId: device.id });
    if (resp.status >= 200 && resp.status < 300 && Array.isArray(resp.data)) {
      types = resp.data.filter((p) => typeof p === "string" && /^[A-Za-z0-9_]+$/.test(p));
    }
  } catch (e) {
    types = [];
  }

  if (!types.length) {
    const text = t(locale, "commands_custom_unavailable") + "\n" + t(locale, "commands_usage");
    const keyboard = {
      inline_keyboard: [
        [{ text: t(locale, "btn_back"), callback_data: encodeDeviceCallback("commands", deviceId) }],
        [{ text: t(locale, "btn_home"), callback_data: "nav:home" }]
      ]
    };
    await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
    return;
  }

  const shown = types.slice(0, MAX_CUSTOM_COMMANDS);
  const text = t(locale, "commands_custom_prompt", { device: device.name || device.uniqueId });
  const keyboard = {
    inline_keyboard: shown.map((type) => [{
      text: type,
      callback_data: encodeDeviceCallback("custom", deviceId, "exec:" + type)
    }]).concat([
      [{ text: t(locale, "btn_back"), callback_data: encodeDeviceCallback("commands", deviceId) }],
      [{ text: t(locale, "btn_home"), callback_data: "nav:home" }]
    ])
  };

  await sendOrEditPlainText(chatId, messageId, text, { reply_markup: keyboard });
}

async function executeCustomCommand(chatId, locale, user, deviceId, commandType) {
  if (!commandType) {
    await sendPlainText(chatId, t(locale, "commands_usage"));
    return;
  }
  const type = String(commandType).trim();
  if (!/^[A-Za-z0-9_]+$/.test(type)) {
    await sendPlainText(chatId, t(locale, "commands_usage"));
    return;
  }

  const device = await findDeviceByIdForUser(chatId, user.id, deviceId);
  if (!device) {
    await sendPlainText(chatId, t(locale, "track_device_not_found") + deviceId);
    return;
  }

  const cmd = { deviceId: device.id, type, attributes: {} };
  const resp = await traccarRequest("post", "/api/commands/send", cmd);
  if (resp.status >= 200 && resp.status < 300) {
    await sendPlainText(chatId, t(locale, "command_sent"));
  } else {
    await sendPlainText(chatId, t(locale, "command_failed"));
  }
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
        { text: t(locale, "btn_yes"), callback_data: encodeDeviceCallback("confirm", deviceId, "engine:" + action) },
        { text: t(locale, "btn_no"), callback_data: encodeDeviceCallback("commands", deviceId) }
      ],
      [{ text: t(locale, "btn_back"), callback_data: encodeDeviceCallback("commands", deviceId) }]
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
      [{ text: t(locale, "btn_refresh"), callback_data: encodeDeviceCallback("positions", deviceId) }],
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
      [{ text: t(locale, "btn_report_route"), callback_data: encodeDeviceCallback("reports", deviceId, "route") }],
      [{ text: t(locale, "btn_report_stops"), callback_data: encodeDeviceCallback("reports", deviceId, "stops") }],
      [{ text: t(locale, "btn_report_summary"), callback_data: encodeDeviceCallback("reports", deviceId, "summary") }],
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
  const resp = await traccarRequest("get", `/api/reports/${reportType}`, null, { deviceId: device.id, from, to });

  let out;
  if (resp.status >= 200 && resp.status < 300) {
    out = formatReport(reportType, resp.data);
  } else {
    out = escapeMarkdown(t(locale, "generic_error"));
  }

  const keyboard = {
    inline_keyboard: [
      [{ text: t(locale, "btn_refresh"), callback_data: encodeDeviceCallback("reports", deviceId, reportType) }],
      [{ text: t(locale, "btn_back"), callback_data: encodeDeviceCallback("reports", deviceId) }],
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

  await answerCallbackQuery(callbackQuery.id);

  if (!chatId) return;

  const parsed = parseCallbackData(data);
  if (!validateCallbackData(parsed)) {
    await sendPlainText(chatId, t("en", "invalid_action"));
    return;
  }

  const { user, locale } = await getUserAndLocale(chatId, telegramLanguageCode);

  await handleCallbackAction(chatId, data, locale, user, messageId);
}

async function handleCallbackAction(chatId, data, locale, user, messageId) {
  const parsed = parseCallbackData(data);
  if (!parsed) {
    await sendPlainText(chatId, t(locale, "invalid_action"));
    return;
  }

  // New deterministic schema: cmd:<kind>:<deviceId>[:subtype[:subtype2...]]
  if (parsed.action === "cmd") {
    await handleCmdKind(chatId, parsed, locale, user, messageId);
    return;
  }

  const { action, params } = parsed;
  try {
    switch (action) {
      case "menu":
        if (params[0] === "main") await sendMainMenu(chatId, locale, user, messageId);
        break;
      case "device":
        if (params[0] === "list") {
          await sendDeviceSelector(chatId, locale, user, messageId, params[1] || "track");
        }
        break;
      case "orders":
        if (params[0] === "list") {
          await sendOrdersMenu(chatId, locale, user, messageId);
        }
        break;
      case "language":
        if (params[0] === "set") {
          await sendPlainText(chatId, t(locale, "language_set_info", { lang: params[1] }));
          await sendMainMenu(chatId, locale, user, messageId);
        } else {
          await sendLanguageMenu(chatId, locale, messageId);
        }
        break;
      case "nav":
        if (params[0] === "home" || params[0] === "back") {
          await sendMainMenu(chatId, locale, user, messageId);
        } else if (params[0] === "help") {
          await sendHelpMenu(chatId, locale, messageId);
        }
        break;
      case "track":
      case "history":
      case "status":
      case "commands":
      case "engine":
      case "confirm":
      case "positions":
      case "reports":
        await handleLegacyDeviceAction(chatId, action, params, locale, user, messageId);
        break;
      case "cancel":
        await sendMainMenu(chatId, locale, user, messageId);
        break;
      case "assoc":
        break;
      default:
        await sendPlainText(chatId, t(locale, "invalid_action"));
    }
  } catch (error) {
    console.error("Callback action error:", error);
    await sendPlainText(chatId, t(locale, "generic_error"));
  }
}

async function handleCmdKind(chatId, parsed, locale, user, messageId) {
  const { kind, deviceId, deviceIdValid, subtype, subtype2 } = parsed;

  // Validate BEFORE any permission/device lookup. Only a valid positive
  // numeric Traccar device id is accepted. "custom", "engine", "command",
  // "on", "off" etc. are never treated as a device id.
  if (!DEVICE_KINDS.has(kind) || !deviceIdValid || deviceId === null || deviceId === undefined) {
    await sendPlainText(chatId, t(locale, "invalid_action"));
    return;
  }

  try {
    switch (kind) {
      case "commands":
        if (subtype === "custom") {
          await sendCustomCommandPicker(chatId, locale, user, deviceId, messageId);
        } else {
          await sendCommandsMenu(chatId, locale, user, deviceId, messageId);
        }
        break;
      case "custom":
        if (subtype === "exec") {
          await executeCustomCommand(chatId, locale, user, deviceId, subtype2);
        } else {
          await sendCustomCommandPicker(chatId, locale, user, deviceId, messageId);
        }
        break;
      case "engine":
        if (subtype === "on" || subtype === "off") {
          await sendEngineConfirmation(chatId, locale, user, deviceId, subtype, messageId);
        } else {
          await sendPlainText(chatId, t(locale, "invalid_action"));
        }
        break;
      case "confirm": {
        // The parser splits "engine:on" into subtype="engine" + subtype2="on",
        // so the confirmation subtype must be reassembled before matching.
        const confirmSubtype = subtype2 ? `${subtype}:${subtype2}` : subtype;
        const engineMatch = /^engine:(on|off)$/.exec(confirmSubtype);
        if (engineMatch) {
          await executeEngineCommand(chatId, locale, user, deviceId, engineMatch[1]);
        } else {
          await sendPlainText(chatId, t(locale, "invalid_action"));
        }
        break;
      }
      case "track":
        await sendTrackResult(chatId, locale, user, deviceId, messageId);
        break;
      case "history":
        if (HISTORY_RANGES.has(subtype)) {
          await sendHistoryResult(chatId, locale, user, deviceId, subtype, messageId);
        } else {
          await sendHistoryMenu(chatId, locale, user, deviceId, messageId);
        }
        break;
      case "status":
        await sendStatusResult(chatId, locale, user, deviceId, messageId);
        break;
      case "positions":
        await sendPositionsResult(chatId, locale, user, deviceId, messageId);
        break;
      case "reports":
        if (subtype) {
          await sendReportResult(chatId, locale, user, deviceId, subtype, messageId);
        } else {
          await sendReportsMenu(chatId, locale, user, deviceId, messageId);
        }
        break;
      default:
        await sendPlainText(chatId, t(locale, "invalid_action"));
    }
  } catch (error) {
    console.error("Callback cmd error:", error);
    await sendPlainText(chatId, t(locale, "generic_error"));
  }
}

/**
 * Legacy fixed-schema device callbacks. The device id is validated as a
 * numeric Traccar id BEFORE any permission lookup; "custom"/"engine"/
 * "command" and other non-numeric tokens are rejected with invalid_action.
 */
async function handleLegacyDeviceAction(chatId, action, params, locale, user, messageId) {
  let subtype = null;
  let rawId = null;

  switch (action) {
    case "track":
      if (params[0] === "refresh") {
        subtype = "refresh";
        rawId = params[1];
      } else {
        rawId = params[0];
      }
      break;
    case "history": {
      const first = params[0];
      if (HISTORY_RANGES.has(first)) {
        subtype = first;
        rawId = params[1];
      } else {
        rawId = params[0];
      }
      break;
    }
    case "status":
      if (params[0] === "refresh") {
        subtype = "refresh";
        rawId = params[1];
      } else {
        rawId = params[0];
      }
      break;
    case "commands":
      rawId = params[0];
      break;
    case "engine":
      if (params[0] === "on" || params[0] === "off") {
        subtype = params[0];
        rawId = params[1];
      }
      break;
    case "confirm":
      if (params[0] === "engine" && (params[1] === "on" || params[1] === "off")) {
        subtype = "engine:" + params[1];
        rawId = params[2];
      }
      break;
    case "positions":
      rawId = params[0];
      break;
    case "reports":
      if (params[1]) {
        subtype = params[0];
        rawId = params[1];
      } else {
        rawId = params[0];
      }
      break;
    default:
      await sendPlainText(chatId, t(locale, "invalid_action"));
      return;
  }

  const deviceId = cleanDeviceId(rawId);
  if (deviceId === null) {
    await sendPlainText(chatId, t(locale, "invalid_action"));
    return;
  }

  switch (action) {
    case "track":
      await sendTrackResult(chatId, locale, user, deviceId, messageId);
      break;
    case "history":
      if (subtype) {
        await sendHistoryResult(chatId, locale, user, deviceId, subtype, messageId);
      } else {
        await sendHistoryMenu(chatId, locale, user, deviceId, messageId);
      }
      break;
    case "status":
      await sendStatusResult(chatId, locale, user, deviceId, messageId);
      break;
    case "commands":
      await sendCommandsMenu(chatId, locale, user, deviceId, messageId);
      break;
    case "engine":
      if (subtype === "on" || subtype === "off") {
        await sendEngineConfirmation(chatId, locale, user, deviceId, subtype, messageId);
      } else {
        await sendPlainText(chatId, t(locale, "invalid_action"));
      }
      break;
    case "confirm":
      if (subtype === "engine:on") {
        await executeEngineCommand(chatId, locale, user, deviceId, "on");
      } else if (subtype === "engine:off") {
        await executeEngineCommand(chatId, locale, user, deviceId, "off");
      } else {
        await sendPlainText(chatId, t(locale, "invalid_action"));
      }
      break;
    case "positions":
      await sendPositionsResult(chatId, locale, user, deviceId, messageId);
      break;
    case "reports":
      if (subtype) {
        await sendReportResult(chatId, locale, user, deviceId, subtype, messageId);
      } else {
        await sendReportsMenu(chatId, locale, user, deviceId, messageId);
      }
      break;
    default:
      await sendPlainText(chatId, t(locale, "invalid_action"));
  }
}

export { parseCallbackData, validateCallbackData, sendMainMenu, sendHelpMenu };
