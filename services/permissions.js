// services/permissions.js
import { traccarRequest } from "./traccar.js";

/**
 * Get devices accessible to a user.
 * Filters by telegramOwner attribute matching the chatId.
 * Requires the Traccar API user to have admin access to see all devices.
 */
export async function getDevicesForUser(chatId) {
  if (!chatId) return [];

  // Retrieve all devices (requires admin access)
  const devicesResp = await traccarRequest("get", "/api/devices");
  if (devicesResp.status !== 200) return [];

  const devices = devicesResp.data || [];
  console.log(`[permissions] Fetched ${devices.length} total devices from Traccar`);

  if (devices.length === 0) {
    console.log(`[permissions] WARNING: 0 devices returned. The Traccar API user may not have admin rights.`);
    console.log(`[permissions] Either make the API user an admin, or add 'telegramOwner' attribute to devices.`);
  }

  // Filter devices where telegramOwner attribute matches the chat ID
  const filtered = devices.filter(
    (d) =>
      d?.attributes?.telegramOwner &&
      String(d.attributes.telegramOwner) === String(chatId)
  );

  if (!filtered.length) {
    console.log(`[permissions] No devices with telegramOwner=${chatId} found.`);
    if (devices.length > 0) {
      console.log(`[permissions] Devices found:`, devices.map(d => ({ id: d.id, name: d.name, attrs: d.attributes })));
    }
  } else {
    console.log(`[permissions] Found ${filtered.length} device(s) for chatId ${chatId}`);
  }

  return filtered;
}
