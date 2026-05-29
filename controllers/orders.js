// controllers/orders.js
import { t } from "../services/i18n.js";
import { findUserByChatId, traccarRequest } from "../services/traccar.js";
import { getDevicesForUser } from "../services/permissions.js";
import { telegramSendMessage } from "../services/telegram.js";

export default async function handleOrders(chatId, text, locale) {
  const parts = text.split(/\s+/);
  const action = parts[1] || "";
  const userId = parts[2] || "";
  const limit = parts[3] || "";
  const offset = parts[4] || "";
  const keyword = parts[5] || "";

  if (!action) {
    await telegramSendMessage(chatId, t(locale, "orders_usage"));
    return;
  }

  const user = await findUserByChatId(chatId);
  if (!user) {
    await telegramSendMessage(chatId, t(locale, "start_assoc_prompt"));
    return;
  }

  // GET /orders
  if (action === "get") {
    const params = { userId: userId, limit: limit, offset: offset, keyword: keyword };
    const resp = await traccarRequest("get", "/api/orders", params);
    if (resp.status >= 200 && resp.status < 300) {
      const orders = resp.data;
      let out = "*Orders*:\n";
      orders.forEach((order, idx) => {
        out += `\n#${idx + 1}:\n- ID: ${order.id}\n- Name: ${order.name}\n- Description: ${order.description}\n- Start: ${order.start}\n- End: ${order.end}\n`;
      });
      await telegramSendMessage(chatId, out, { parse_mode: "Markdown" });
    } else {
      await telegramSendMessage(chatId, t(locale, "generic_error"));
    }
  }

  // POST /orders
  if (action === "create") {
    const orderData = { name: parts[2], description: parts[3], start: parts[4], end: parts[5] };
    const resp = await traccarRequest("post", "/api/orders", orderData);
    if (resp.status >= 200 && resp.status < 300) {
      await telegramSendMessage(chatId, t(locale, "order_created"));
    } else {
      await telegramSendMessage(chatId, t(locale, "order_failed"));
    }
  }

  // PUT /orders/{id}
  if (action === "update") {
    const id = parts[2];
    const orderData = { name: parts[3], description: parts[4], start: parts[5], end: parts[6] };
    const resp = await traccarRequest("put", `/api/orders/${id}`, orderData);
    if (resp.status >= 200 && resp.status < 300) {
      await telegramSendMessage(chatId, t(locale, "order_updated"));
    } else {
      await telegramSendMessage(chatId, t(locale, "order_failed"));
    }
  }

  // DELETE /orders/{id}
  if (action === "delete") {
    const id = parts[2];
    const resp = await traccarRequest("delete", `/api/orders/${id}`);
    if (resp.status >= 200 && resp.status < 300) {
      await telegramSendMessage(chatId, t(locale, "order_deleted"));
    } else {
      await telegramSendMessage(chatId, t(locale, "order_failed"));
    }
  }
}