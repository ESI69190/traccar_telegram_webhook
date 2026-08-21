// services/callbackData.js
//
// Central, deterministic callback_data encoding/parsing.
//
// Schema (compact, well within Telegram's 64-byte callback_data limit):
//   cmd:<kind>:<deviceId>[:subtype]
//
// where <kind> is the action/command type and <deviceId> is ALWAYS the
// Traccar numeric device id when a device is involved. The deviceId is never
// used as a positional index that could be confused with the kind.
//
// Examples:
//   cmd:commands:123            -> open command menu for device 123
//   cmd:custom:123:input        -> custom command input for device 123
//   cmd:custom:123:exec:type    -> execute custom command "type" on device 123
//   cmd:engine:123:on           -> engine on confirm for device 123
//   cmd:engine:123:off          -> engine off confirm for device 123
//   cmd:engine:123:on:confirm   -> engine on confirmation step for device 123
//   cmd:track:123
//   cmd:history:123:24h
//   cmd:status:123:refresh
//   cmd:positions:123
//   cmd:reports:123:route
//
// Legacy non-device callbacks that do not reference the device flow:
//   menu:main, device:list:<target>, orders:list, language:set:en,
//   nav:home, nav:help, cancel, assoc
//
// Decoding NEVER guesses positions inside the data string: the returned
// object always has explicit fields (deviceId, kind, subtype).
// If a segment that must be a numeric Traccar deviceId is not numeric,
// parseCallbackData returns { ... } with deviceId: null and a
// `deviceIdValid` flag instead of substituting string values.

const CALLBACK_PREFIX = "command:";

function cleanDeviceId(raw) {
  if (raw === undefined || raw === null) return null;
  const str = String(raw).trim();
  if (!/^\d+$/.test(str)) return null;
  const num = Number(str);
  if (!Number.isSafeInteger(num) || num <= 0) return null;
  return num;
}

/**
 * Build callback_data for a device-scoped flow.
 * @param {string} kind - "commands", "engine", "track", "history", "status",
 *                        "positions", "reports", "confirm"
 * @param {number|string} deviceId - Traccar numeric device id
 * @param {string} [subtype] - optional subtype (custom, on, off, refresh,
 *                             24h, today, 7d, route, stops, summary, exec, ...)
 * @returns {string} e.g. "cmd:commands:123:custom"
 */
export function encodeDeviceCallback(kind, deviceId, subtype) {
  const id = cleanDeviceId(deviceId);
  if (id === null) {
    throw new TypeError("encodeDeviceCallback: invalid deviceId: " + String(deviceId));
  }
  const parts = ["cmd", kind, String(id)];
  if (subtype !== undefined && subtype !== null && subtype !== "") {
    parts.push(String(subtype));
  }
  return parts.join(":");
}

/**
 * Build legacy/non-device callback_data.
 */
export function encodeSimpleCallback(action, param1, param2) {
  const parts = [String(action)];
  if (param1 !== undefined && param1 !== null && param1 !== "") parts.push(String(param1));
  if (param2 !== undefined && param2 !== null && param2 !== "") parts.push(String(param2));
  return parts.join(":");
}

/**
 * Parse callback_data into a deterministic object.
 * Returns null for non-strings.
 */
export function parseCallbackData(data) {
  if (!data || typeof data !== "string") return null;
  const parts = data.split(":");
  const first = parts[0] || "";

  // Device-scoped schema: cmd:<kind>:<deviceId>[:<subtype>...]
  if (first === "cmd") {
    const kind = parts[1] || "";
    const deviceId = cleanDeviceId(parts[2]);
    return {
      action: "cmd",
      kind,
      deviceId,
      deviceIdValid: deviceId !== null,
      subtype: parts[3] || "",
      subtype2: parts[4] || ""
    };
  }

  // Legacy generic action (menu, device, orders, language, nav, cancel, assoc)
  return {
    action: first,
    params: parts.slice(1)
  };
}

/**
 * Validate callback data action.
 */
export function validateCallbackData(parsed) {
  if (!parsed) return false;
  if (parsed.action === "cmd") {
    return Boolean(parsed.kind);
  }
  const validActions = new Set([
    "menu", "device", "track", "history", "status", "commands",
    "engine", "confirm", "orders", "positions", "reports",
    "language", "nav", "cancel", "assoc", "help"
  ]);
  return validActions.has(parsed.action);
}

export { cleanDeviceId };
