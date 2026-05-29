// services/permissions.js
import { traccarRequest } from "./traccar.js";

/**
 * Deprecated: original method used /api/permissions which may not be available.
 * Kept for backward compatibility but returns empty array.
 */
export async function getDeviceIdsForUser(userId) {
  // Return empty array to avoid using unsupported endpoint.
  return [];
}

/**
 * Get devices accessible to a user based on the telegramOwner attribute.
 * Devices must have the attribute `telegramOwner` equal to the provided chat ID.
 */
export async function getDevicesForUser(chatId) {
  if (!chatId) return [];

  // Retrieve all devices
  const devicesResp = await traccarRequest("get", "/api/devices");
  if (devicesResp.status !== 200) return [];

  const devices = devicesResp.data || [];
  console.log(`[permissions] Fetched ${devices.length} total devices from Traccar`);

  // Filter devices where telegramOwner attribute matches the chat ID
  const filtered = devices.filter(
    (d) =>
      d?.attributes?.telegramOwner &&
      String(d.attributes.telegramOwner) === String(chatId)
  );

  if (!filtered.length) {
    console.log(`[permissions] No devices with telegramOwner=${chatId} found.`);
    console.log(`[permissions] Devices found:`, devices.map(d => ({ id: d.id, name: d.name, attrs: d.attributes })));
  } else {
    console.log(`[permissions] Found ${filtered.length} device(s) for chatId ${chatId}`);
  }

  return filtered;
}
