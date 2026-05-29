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
 * The Traccar user must have the attribute `telegramChatId` set.
 * Devices must have the attribute `telegramOwner` equal to that chat ID.
 */
export async function getDevicesForUser(userId) {
  // Retrieve the user to obtain the telegramChatId
  const userResp = await traccarRequest("get", `/api/users/${userId}`);
  if (userResp.status !== 200) return [];

  const user = userResp.data;
  const chatId = user?.attributes?.telegramChatId;
  if (!chatId) return [];

  // Retrieve all devices
  const devicesResp = await traccarRequest("get", "/api/devices");
  if (devicesResp.status !== 200) return [];

  const devices = devicesResp.data || [];

  // Filter devices where telegramOwner attribute matches the user's chat ID
  return devices.filter(
    (d) =>
      d?.attributes?.telegramOwner &&
      String(d.attributes.telegramOwner) === String(chatId)
  );
}
