// services/permissions.js
import { traccarRequest } from "./traccar.js";

/**
 * Get device IDs accessible to a user via Traccar permissions API.
 */
export async function getDeviceIdsForUser(userId) {
  const resp = await traccarRequest("get", `/api/permissions?userId=${userId}`);
  if (resp.status !== 200) return [];
  // Traccar returns array of { deviceId: number, userId: number }
  const perms = resp.data || [];
  return perms
    .filter((p) => p.deviceId)
    .map((p) => p.deviceId);
}

/**
 * Get devices accessible to a user.
 * First tries Traccar's native permissions, then falls back to telegramOwner attribute.
 */
export async function getDevicesForUser(chatId, userId) {
  if (!chatId) return [];

  // Retrieve all devices
  const devicesResp = await traccarRequest("get", "/api/devices");
  if (devicesResp.status !== 200) return [];

  const devices = devicesResp.data || [];
  console.log(`[permissions] Fetched ${devices.length} total devices from Traccar`);

  // Method 1: If userId provided, try Traccar native permissions
  if (userId) {
    const allowedIds = await getDeviceIdsForUser(userId);
    console.log(`[permissions] Traccar permissions returned device IDs:`, allowedIds);
    if (allowedIds.length > 0) {
      const filtered = devices.filter((d) => allowedIds.includes(d.id));
      console.log(`[permissions] Found ${filtered.length} device(s) via Traccar permissions for userId ${userId}`);
      if (filtered.length > 0) return filtered;
    }
  }

  // Method 2: Fall back to telegramOwner attribute matching chatId
  const filtered = devices.filter(
    (d) =>
      d?.attributes?.telegramOwner &&
      String(d.attributes.telegramOwner) === String(chatId)
  );

  if (!filtered.length) {
    console.log(`[permissions] No devices with telegramOwner=${chatId} found.`);
    console.log(`[permissions] Devices found:`, devices.map(d => ({ id: d.id, name: d.name, attrs: d.attributes })));
  } else {
    console.log(`[permissions] Found ${filtered.length} device(s) via telegramOwner for chatId ${chatId}`);
  }

  return filtered;
}
