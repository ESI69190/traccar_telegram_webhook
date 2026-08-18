// services/callbackRouter.js
import { findUserByChatId, getLastPositions } from "./traccar.js";
import { getDevicesForUser, findDeviceForUser } from "./permissions.js";
import { telegramSendMessage, sendPlainText, answerCallbackQuery, editMessageText, editMessageReplyMarkup } from "./telegram.js";
import { getUserLocale, t } from "./i18n.js";
import { formatDate, escapeMarkdown, markdownLink, MAX_LIMIT } from "./security.js";
import { handleTrack } from "../controllers/track.js";
import { handleHistory } from "../controllers/history.js";
import { handleStatus } from "../controllers/status.js";
import { handleEngine } from "../controllers/engine.js";
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
  
  if (messageId) {
    await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  } else {
    await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  }
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
    if (messageId) {
      await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    } else {
      await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    }
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
      text: escapeMarkdown(d.name || d.uniqueId || `id:${d.id}`),
      callback_data: `${targetAction}:${d.id}`
    }]).concat([[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]])
  };
  
  if (messageId) {
    await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  } else {
    await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  }
}

async function sendTrackResult(chatId, locale, user, deviceId, messageId = null) {
  const device = await findDeviceForUser(chatId, user.id, deviceId);
  if (!device) {
    const text = t(locale, "track_device_not_found") + deviceId;
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]] };
    if (messageId) {
      await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    } else {
      await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    }
    return;
  }
  
  const { from, to } = computeTimeRange(1);
  const positions = await getLastPositions(device.id, from, to);
  const pos = positions[0];
  
  let out = "*" + escapeMarkdown(t(locale, "track_device_info_title")) + "* : " + escapeMarkdown(device.name || device.uniqueId) + "\n";
  out += "ID: " + String(device.id) + "\n";
  
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
    out += "\nNo position available.\n";
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
  
  if (messageId) {
    await editMessageText(chatId, messageId, out, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  } else {
    await telegramSendMessage(chatId, out, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  }
}

async function sendHistoryMenu(chatId, locale, user, deviceId, messageId = null) {
  const device = await findDeviceForUser(chatId, user.id, deviceId);
  if (!device) {
    const text = t(locale, "track_device_not_found") + deviceId;
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]] };
    if (messageId) await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    else await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    return;
  }
  
  const text = t(locale, "menu_history_period") + " " + escapeMarkdown(device.name || device.uniqueId) + ":";
  const keyboard = {
    inline_keyboard: [
      [
        { text: t(locale, "btn_history_recent"), callback_data: `history:recent:${deviceId}` },
        { text: t(locale, "btn_history_today"), callback_data: `history:today:${deviceId}` }
      ],
      [
        { text: t(locale, "btn_history_24h"), callback_data: `history:24h:${deviceId}` },
        { text: t(locale, "btn_history_7d"), callback_data: `history:7d:${deviceId}` }
      ],
      [
        { text: t(locale, "btn_back"), callback_data: `track:${deviceId}` },
        { text: t(locale, "btn_home"), callback_data: "nav:home" }
      ]
    ]
  };
  
  if (messageId) {
    await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  } else {
    await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  }
}

async function sendHistoryResult(chatId, locale, user, deviceId, period, messageId = null) {
  const device = await findDeviceForUser(chatId, user.id, deviceId);
  if (!device) {
    const text = t(locale, "track_device_not_found") + deviceId;
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]] };
    if (messageId) await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    else await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    return;
  }
  
  let days = 7;
  let limit = 10;
  if (period === "recent") { days = 7; limit = 10; }
  else if (period === "today") { days = 1; limit = 20; }
  else if (period === "24h") { days = 1; limit = 50; }
  else if (period === "7d") { days = 7; limit = 50; }
  
  const { from, to } = computeTimeRange(days);
  const positions = await getLastPositions(device.id, from, to);
  const limitedPositions = positions.slice(0, Math.min(limit, MAX_LIMIT));
  
  if (!limitedPositions.length) {
    const text = t(locale, "no_positions");
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: `history:${deviceId}` }]] };
    if (messageId) await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    else await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    return;
  }
  
  let out = escapeMarkdown("*History for* ") + escapeMarkdown(device.name || device.uniqueId) + escapeMarkdown(":\n");
  limitedPositions.forEach((p, idx) => {
    const time = p.serverTime || p.fixTime || p.time || p.deviceTime || null;
    out += escapeMarkdown("\n#") + escapeMarkdown(String(idx + 1)) + escapeMarkdown(":\n");
    if (time) out += escapeMarkdown("- Date: ") + escapeMarkdown(formatDate(time, locale)) + "\n";
    const linkLabel = p.latitude + "," + p.longitude;
    const linkUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(p.latitude + "," + p.longitude);
    out += escapeMarkdown("- Coordinates: ") + markdownLink(linkLabel, linkUrl) + "\n";
  });
  
  const keyboard = {
    inline_keyboard: [
      [{ text: t(locale, "btn_refresh"), callback_data: `history:${period}:${deviceId}` }],
      [{ text: t(locale, "btn_back"), callback_data: `history:${deviceId}` }],
      [{ text: t(locale, "btn_home"), callback_data: "nav:home" }]
    ]
  };
  
  if (messageId) {
    await editMessageText(chatId, messageId, out, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  } else {
    await telegramSendMessage(chatId, out, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  }
}

async function sendStatusResult(chatId, locale, user, deviceId, messageId = null) {
  const device = await findDeviceForUser(chatId, user.id, deviceId);
  if (!device) {
    const text = t(locale, "track_device_not_found") + deviceId;
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]] };
    if (messageId) await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    else await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    return;
  }
  
  const { from, to } = computeTimeRange(1);
  const positions = await getLastPositions(device.id, from, to);
  const pos = positions[0];
  
  let out = escapeMarkdown("*Status* ") + escapeMarkdown(device.name || device.uniqueId) + escapeMarkdown(":\n");
  if (pos) {
    const time = pos.serverTime || pos.fixTime || pos.time || pos.deviceTime || null;
    const attrs = pos.attributes || {};
    const speed = typeof pos.speed !== "undefined" ? pos.speed : (attrs && attrs.speed);
    const ignition = typeof attrs.ignition !== "undefined" ? attrs.ignition : null;
    const moving = (speed && Number(speed) > 0) || ignition ? "Moving" : "Stopped";
    
    if (time) out += escapeMarkdown("- Last update: ") + escapeMarkdown(formatDate(time, locale)) + "\n";
    out += escapeMarkdown("- State: ") + escapeMarkdown(moving) + "\n";
    if (typeof speed !== "undefined" && speed !== null) out += escapeMarkdown("- Speed: ") + escapeMarkdown(String(speed)) + " km/h\n";
    if (attrs.battery) out += escapeMarkdown("- Battery: ") + escapeMarkdown(String(attrs.battery)) + "\n";
  } else {
    out += escapeMarkdown(t(locale, "no_positions")) + "\n";
  }
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: t(locale, "btn_refresh"), callback_data: `status:refresh:${deviceId}` },
        { text: t(locale, "btn_position"), callback_data: `track:${deviceId}` }
      ],
      [
        { text: t(locale, "btn_commands"), callback_data: `commands:${deviceId}` },
        { text: t(locale, "btn_back"), callback_data: `device:list:status` }
      ],
      [{ text: t(locale, "btn_home"), callback_data: "nav:home" }]
    ]
  };
  
  if (messageId) {
    await editMessageText(chatId, messageId, out, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  } else {
    await telegramSendMessage(chatId, out, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  }
}

async function sendCommandsMenu(chatId, locale, user, deviceId, messageId = null) {
  const device = await findDeviceForUser(chatId, user.id, deviceId);
  if (!device) {
    const text = t(locale, "track_device_not_found") + deviceId;
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]] };
    if (messageId) await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    else await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    return;
  }
  
  const text = t(locale, "menu_commands_title") + " " + escapeMarkdown(device.name || device.uniqueId) + ":";
  const keyboard = {
    inline_keyboard: [
      [
        { text: t(locale, "btn_engine_on"), callback_data: `confirm:engine:on:${deviceId}` },
        { text: t(locale, "btn_engine_off"), callback_data: `confirm:engine:off:${deviceId}` }
      ],
      [
        { text: t(locale, "btn_back"), callback_data: `track:${deviceId}` },
        { text: t(locale, "btn_home"), callback_data: "nav:home" }
      ]
    ]
  };
  
  if (messageId) {
    await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  } else {
    await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  }
}

async function sendEngineConfirmation(chatId, locale, user, deviceId, action, messageId = null) {
  const device = await findDeviceForUser(chatId, user.id, deviceId);
  if (!device) {
    const text = t(locale, "track_device_not_found") + deviceId;
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]] };
    if (messageId) await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    else await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    return;
  }
  
  const actionText = action === "on" ? t(locale, "btn_engine_on") : t(locale, "btn_engine_off");
  const text = t(locale, "confirm_engine_action", { action: actionText, device: escapeMarkdown(device.name || device.uniqueId) });
  const keyboard = {
    inline_keyboard: [
      [
        { text: t(locale, "btn_confirm"), callback_data: `engine:${action}:${deviceId}` },
        { text: t(locale, "btn_cancel"), callback_data: `commands:${deviceId}` }
      ]
    ]
  };
  
  if (messageId) {
    await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  } else {
    await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  }
}

async function executeEngineCommand(chatId, locale, user, deviceId, action) {
  const device = await findDeviceForUser(chatId, user.id, deviceId);
  if (!device) {
    await sendPlainText(chatId, t(locale, "track_device_not_found") + deviceId);
    return;
  }
  
  const type = action === "on" ? "engineResume" : "engineStop";
  const cmd = { deviceId: device.id, type, attributes: {} };
  
  const { traccarRequest } = await import("./traccar.js");
  const resp = await traccarRequest("post", "/api/commands/send", cmd);
  
  if (resp.status >= 200 && resp.status < 300) {
    await sendPlainText(chatId, t(locale, "engine_command_sent"));
  } else {
    await sendPlainText(chatId, t(locale, "engine_command_failed"));
  }
  
  // Return to commands menu
  await sendCommandsMenu(chatId, locale, user, deviceId);
}

async function sendOrdersMenu(chatId, locale, user, messageId = null) {
  // For orders, we'll show a simple list with get action
  const { traccarRequest } = await import("./traccar.js");
  const resp = await traccarRequest("get", "/api/orders", null, { userId: user.id });
  
  let text;
  let keyboard;
  
  if (resp.status >= 200 && resp.status < 300) {
    const orders = resp.data || [];
    if (!orders.length) {
      text = t(locale, "orders_empty");
    } else {
      text = "*Orders*:\n";
      orders.slice(0, 10).forEach((order, idx) => {
        text += `\n\\#${idx + 1}:\\n`;
        text += `\\- ID: ${order.id}\\n`;
        text += `\\- Unique ID: ${escapeMarkdown(order.uniqueId)}\\n`;
        text += `\\- Description: ${escapeMarkdown(order.description)}\\n`;
        text += `\\- From: ${escapeMarkdown(order.fromAddress)}\\n`;
        text += `\\- To: ${escapeMarkdown(order.toAddress)}\\n`;
      });
      if (orders.length > 10) {
        text += `\\n... and ${orders.length - 10} more.`;
      }
    }
  } else {
    text = t(locale, "generic_error");
  }
  
  keyboard = {
    inline_keyboard: [
      [{ text: t(locale, "btn_refresh"), callback_data: "orders:list" }],
      [{ text: t(locale, "btn_back"), callback_data: "nav:home" }]
    ]
  };
  
  if (messageId) {
    await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  } else {
    await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  }
}

async function sendPositionsResult(chatId, locale, user, deviceId, messageId = null) {
  const device = await findDeviceForUser(chatId, user.id, deviceId);
  if (!device) {
    const text = t(locale, "track_device_not_found") + deviceId;
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]] };
    if (messageId) await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    else await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    return;
  }
  
  const { from, to } = computeTimeRange(7);
  const positions = await getLastPositions(device.id, from, to);
  const limitedPositions = positions.slice(0, 10);
  
  if (!limitedPositions.length) {
    const text = t(locale, "no_positions");
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: `track:${deviceId}` }]] };
    if (messageId) await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    else await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    return;
  }
  
  let out = escapeMarkdown(t(locale, "positions_for")) + " " + escapeMarkdown(device.name || device.uniqueId) + escapeMarkdown(":\n");
  limitedPositions.forEach((p, idx) => {
    const time = p.serverTime || p.fixTime || p.time || p.deviceTime || null;
    out += escapeMarkdown("\n#") + escapeMarkdown(String(idx + 1)) + escapeMarkdown(":\n");
    if (time) out += escapeMarkdown("- Date: ") + escapeMarkdown(formatDate(time, locale)) + "\n";
    const linkLabel = p.latitude + "," + p.longitude;
    const linkUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(p.latitude + "," + p.longitude);
    out += escapeMarkdown("- Coordinates: ") + markdownLink(linkLabel, linkUrl) + "\n";
    out += escapeMarkdown("- Speed: ") + escapeMarkdown(String(p.speed || 0)) + " km/h\n";
  });
  
  const keyboard = {
    inline_keyboard: [
      [{ text: t(locale, "btn_refresh"), callback_data: `positions:${deviceId}` }],
      [{ text: t(locale, "btn_back"), callback_data: `track:${deviceId}` }],
      [{ text: t(locale, "btn_home"), callback_data: "nav:home" }]
    ]
  };
  
  if (messageId) {
    await editMessageText(chatId, messageId, out, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  } else {
    await telegramSendMessage(chatId, out, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  }
}

async function sendReportsMenu(chatId, locale, user, deviceId, messageId = null) {
  const device = await findDeviceForUser(chatId, user.id, deviceId);
  if (!device) {
    const text = t(locale, "track_device_not_found") + deviceId;
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]] };
    if (messageId) await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    else await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    return;
  }
  
  const text = t(locale, "menu_reports_title") + " " + escapeMarkdown(device.name || device.uniqueId) + ":";
  const keyboard = {
    inline_keyboard: [
      [
        { text: t(locale, "btn_report_route"), callback_data: `reports:route:${deviceId}` },
        { text: t(locale, "btn_report_events"), callback_data: `reports:events:${deviceId}` }
      ],
      [
        { text: t(locale, "btn_report_geofences"), callback_data: `reports:geofences:${deviceId}` },
        { text: t(locale, "btn_report_summary"), callback_data: `reports:summary:${deviceId}` }
      ],
      [
        { text: t(locale, "btn_report_trips"), callback_data: `reports:trips:${deviceId}` },
        { text: t(locale, "btn_report_stops"), callback_data: `reports:stops:${deviceId}` }
      ],
      [
        { text: t(locale, "btn_back"), callback_data: `track:${deviceId}` },
        { text: t(locale, "btn_home"), callback_data: "nav:home" }
      ]
    ]
  };
  
  if (messageId) {
    await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  } else {
    await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  }
}

async function sendReportResult(chatId, locale, user, deviceId, reportType, messageId = null) {
  const device = await findDeviceForUser(chatId, user.id, deviceId);
  if (!device) {
    const text = t(locale, "track_device_not_found") + deviceId;
    const keyboard = { inline_keyboard: [[{ text: t(locale, "btn_back"), callback_data: "nav:home" }]] };
    if (messageId) await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    else await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
    return;
  }
  
  const { from, to } = computeTimeRange(7);
  const { traccarRequest } = await import("./traccar.js");
  const resp = await traccarRequest("get", `/api/reports/${reportType}`, null, { deviceId: device.id, from, to });
  
  let out;
  if (resp.status >= 200 && resp.status < 300) {
    out = formatReport(reportType, resp.data);
  } else {
    out = t(locale, "generic_error");
  }
  
  const keyboard = {
    inline_keyboard: [
      [{ text: t(locale, "btn_refresh"), callback_data: `reports:${reportType}:${deviceId}` }],
      [{ text: t(locale, "btn_back"), callback_data: `reports:${deviceId}` }],
      [{ text: t(locale, "btn_home"), callback_data: "nav:home" }]
    ]
  };
  
  if (messageId) {
    await editMessageText(chatId, messageId, out, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  } else {
    await telegramSendMessage(chatId, out, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  }
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
  
  if (messageId) {
    await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  } else {
    await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  }
}

async function sendHelpMenu(chatId, locale, messageId = null) {
  const text = t(locale, "menu_help_text");
  const keyboard = {
    inline_keyboard: [
      [{ text: t(locale, "btn_back"), callback_data: "nav:home" }]
    ]
  };
  
  if (messageId) {
    await editMessageText(chatId, messageId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  } else {
    await telegramSendMessage(chatId, text, { reply_markup: keyboard, parse_mode: "MarkdownV2" });
  }
}

function computeTimeRange(days) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

function formatReport(reportType, data) {
  if (!Array.isArray(data) || !data.length) {
    return `No data for report *${escapeMarkdown(reportType)}*.`;
  }
  let out = `*${escapeMarkdown(reportType)}* report:\n`;
  data.slice(0, 10).forEach((row, idx) => {
    out += `\n\\#${idx + 1}:\\n`;
    Object.keys(row).forEach((key) => {
      if (typeof row[key] === "object" && row[key] !== null) return;
      out += `\\- ${escapeMarkdown(key)}: ${escapeMarkdown(String(row[key]))}\\n`;
    });
  });
  if (data.length > 10) {
    out += `\\n... and ${data.length - 10} more row(s).`;
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
          await executeEngineCommand(chatId, locale, user, params[1], params[0]);
        }
        break;
        
      case "confirm":
        if (params[0] === "engine" && (params[1] === "on" || params[1] === "off")) {
          await sendEngineConfirmation(chatId, locale, user, params[2], params[1], messageId);
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
