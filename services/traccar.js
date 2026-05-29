// services/traccar.js
import axios from "axios";

const TRACCAR_URL = process.env.TRACCAR_URL || "http://traccar:8082";
const TRACCAR_USER = process.env.TRACCAR_USER;
const TRACCAR_PASS = process.env.TRACCAR_PASS;

export async function traccarRequest(method, endpoint, data) {
  const url = TRACCAR_URL + endpoint;
  console.log("-> Traccar request", { method, url, authUser: TRACCAR_USER });
  try {
    const resp = await axios({
      method,
      url,
      auth: { username: TRACCAR_USER, password: TRACCAR_PASS },
      data,
      validateStatus: () => true,
      headers: { "Content-Type": "application/json" }
    });
    console.log("<- Traccar response", {
      status: resp.status,
      statusText: resp.statusText
    });
    return resp;
  } catch (err) {
    console.error("Traccar request error:", err?.toString());
    if (err && err.response) {
      console.error("Response data:", err.response.data);
      console.error("Response status:", err.response.status);
    }
    throw err;
  }
}

export async function findUserByChatId(chatId) {
  const resp = await traccarRequest("get", "/api/users");
  if (resp.status !== 200) return null;
  const users = resp.data || [];
  return (
    users.find(
      (u) =>
        u.attributes &&
        u.attributes.telegramChatId &&
        String(u.attributes.telegramChatId) === String(chatId)
    ) || null
  );
}

export async function getUserById(userId) {
  const resp = await traccarRequest("get", "/api/users/" + userId);
  if (resp.status >= 200 && resp.status < 300) return resp.data;
  return null;
}

export async function findUserByPhone(phoneIntl) {
  const resp = await traccarRequest("get", "/api/users");
  if (resp.status !== 200) return null;
  const users = resp.data || [];
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const uphone = (u.phone || "").replace(/\s/g, "");
    if (!uphone) continue;
    if (uphone === phoneIntl) return u;
  }
  return null;
}

export async function findUserByEmail(email) {
  const resp = await traccarRequest("get", "/api/users");
  if (resp.status !== 200) return null;
  const users = resp.data || [];
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    if (!u.email) continue;
    if (
      String(u.email).trim().toLowerCase() ===
      String(email).trim().toLowerCase()
    )
      return u;
  }
  return null;
}

export async function updateUserPhoneAndChat(userId, phoneIntl, chatId) {
  const fullUser = await getUserById(userId);
  if (!fullUser) return { ok: false, reason: "get_failed" };
  fullUser.phone = phoneIntl;
  fullUser.attributes = fullUser.attributes || {};
  fullUser.attributes.telegramChatId = String(chatId);
  const putResp = await traccarRequest(
    "put",
    "/api/users/" + fullUser.id,
    fullUser
  );
  if (putResp.status >= 200 && putResp.status < 300)
    return { ok: true, user: fullUser };
  return {
    ok: false,
    reason: "put_failed",
    status: putResp.status,
    data: putResp.data
  };
}

export async function traccarFindDeviceByIdentifier(identifier) {
  const idClean = String(identifier || "").trim().toLowerCase();
  if (!idClean) return null;
  const resp = await traccarRequest("get", "/api/devices");
  if (resp.status !== 200) return null;
  const devices = resp.data || [];
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

export async function getLastPositions(deviceId, limit = 1) {
  const resp = await traccarRequest(
    "get",
    `/api/positions?deviceId=${deviceId}&limit=${limit}`
  );
  if (resp.status !== 200) return [];
  return resp.data || [];
}
