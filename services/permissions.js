// services/permissions.js
import { traccarRequest } from "./traccar.js";

/**
 * Get devices accessible to a Telegram user by resolving their Traccar user
 * and querying Traccar for devices scoped to that user.
 */
export async function getDevicesForUser(chatId, userId) {
  if (!chatId || !userId) {
    console.log("[permissions] Rejected device lookup: missing chatId or userId");
    return [];
  }

  const params = { userId };

  const devicesResp = await traccarRequest("get", "/api/devices", null, params);
  if (devicesResp.status !== 200) return [];

  const devices = devicesResp.data || [];
  console.log(`[permissions] Fetched ${devices.length} device(s) for userId=${userId}`);
  return devices;
}

/**
 * Find a single device accessible to the user by name, uniqueId, plate, or registration.
 */
export async function findDeviceForUser(chatId, userId, identifier) {
  const idClean = String(identifier || "").trim().toLowerCase();
  if (!idClean) return null;

  const devices = await getDevicesForUser(chatId, userId);
  for (let i = 0; i < devices.length; i++) {
    const d = devices[i];
    if (d.name && String(d.name).trim().toLowerCase() === idClean) return d;
    if (d.uniqueId && String(d.uniqueId).trim().toLowerCase() === idClean)
      return d;
    if (d.attributes) {
      const attrs = d.attributes;
      if (
        attrs.plate &&
        String(attrs.plate).trim().toLowerCase() === idClean
      )
        return d;
      if (
        attrs.registration &&
        String(attrs.registration).trim().toLowerCase() === idClean
      )
        return d;
    }
  }
  return null;
}

/**
 * Normalize a raw device id to a valid positive Traccar numeric id.
 * Returns null when the raw value is not a positive integer (e.g. "custom",
 * "engine", "command", "on", "off", "", "12.5", "-3").
 */
export function normalizeDeviceId(rawDeviceId) {
  if (rawDeviceId === undefined || rawDeviceId === null) return null;
  const str = String(rawDeviceId).trim();
  if (!/^\d+$/.test(str)) return null;
  const num = Number(str);
  if (!Number.isSafeInteger(num) || num <= 0) return null;
  return num;
}

/**
 * Find a single device accessible to the user by Traccar device ID.
 * Device IDs from callback data or internal lookups must be normalized
 * before comparing to avoid string vs number mismatches.
 */
export async function findDeviceByIdForUser(chatId, userId, rawDeviceId) {
  const deviceId = normalizeDeviceId(rawDeviceId);

  if (deviceId === null) {
    console.log("[permissions] Invalid deviceId for lookup");
    return null;
  }

  const devices = await getDevicesForUser(chatId, userId);

  const device = devices.find((d) => Number(d.id) === deviceId);

  return device || null;
}
