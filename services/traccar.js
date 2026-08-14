// services/traccar.js
import axios from "axios";

const TRACCAR_USERNAME = process.env.TRACCAR_USERNAME || "";
const TRACCAR_PASSWORD = process.env.TRACCAR_PASSWORD || "";
const TRACCAR_API_KEY = process.env.TRACCAR_API_KEY || "";

function getTraccarApiUrl() {
  return process.env.TRACCAR_API_URL || "http://traccar:8082";
}

function buildUrl(endpoint) {
  const base = getTraccarApiUrl().replace(/\/$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : "/" + endpoint;
  return base + cleanEndpoint;
}

function getAuthHeaders() {
  const headers = {};
  if (TRACCAR_API_KEY) {
    headers.Authorization = "Bearer " + TRACCAR_API_KEY;
  }
  return headers;

}

function getAuthConfig() {
  if (TRACCAR_API_KEY) {
    return { headers: getAuthHeaders() };
  }
  if (TRACCAR_USERNAME && TRACCAR_PASSWORD) {
    return { auth: { username: TRACCAR_USERNAME, password: TRACCAR_PASSWORD } };
  }
  return {};
}

function safeLogError(err) {
  const status = err && err.response && err.response.status;
  console.error("Traccar request error:", String(err?.message || err));
  if (status) {
    console.error("Response status:", status);
  }
}

export async function traccarRequest(method, endpoint, data, queryParams) {
  const url = buildUrl(endpoint);
  const authConfig = getAuthConfig();
  const config = {
    method,
    url,
    ...authConfig,
    data,
    params: queryParams,
    validateStatus: () => true,
    headers: {
      "Content-Type": "application/json",
      ...(authConfig.headers || {})
    }
  };

  console.log("-> Traccar request", { method, endpoint });
  try {
    const resp = await axios(config);
    console.log("<- Traccar response", { status: resp.status });
    return resp;
  } catch (err) {
    safeLogError(err);
    throw err;
  }
}

export async function verifySession(email, password) {
  const params = new URLSearchParams();
  params.append("email", email);
  params.append("password", password);

  const url = buildUrl("/api/session");
  const config = {
    method: "post",
    url,
    data: params.toString(),
    validateStatus: () => true,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  };

  console.log("-> Traccar session verify", { method: "post", endpoint: "/api/session" });
  try {
    const resp = await axios(config);
    console.log("<- Traccar session response", { status: resp.status });
    return resp;
  } catch (err) {
    safeLogError(err);
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

export async function getLastPositions(deviceId, from, to) {
  const params = { deviceId };
  if (from) params.from = from;
  if (to) params.to = to;
  const resp = await traccarRequest("get", "/api/positions", null, params);
  if (resp.status !== 200) return [];
  return resp.data || [];
}

export async function getOrderById(orderId) {
  const resp = await traccarRequest("get", "/api/orders/" + orderId);
  if (resp.status >= 200 && resp.status < 300) return resp.data || null;
  return null;
}
