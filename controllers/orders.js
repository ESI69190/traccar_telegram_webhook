// controllers/orders.js
import { t } from "../services/i18n.js";
import { findUserByChatId, traccarRequest, getOrderById } from "../services/traccar.js";
import { telegramSendMessage, sendPlainText } from "../services/telegram.js";
import { isPositiveIntegerId, escapeMarkdown } from "../services/security.js";

export default async function handleOrders(chatId, text, locale) {
  const parts = text.split(/\s+/);
  const action = parts[1] || "";

  if (!action) {
    await sendPlainText(chatId, t(locale, "orders_usage"));
    return;
  }

  const user = await findUserByChatId(chatId);
  if (!user) {
    await sendPlainText(chatId, t(locale, "start_assoc_prompt"));
    return;
  }

  // GET /orders
  if (action === "get") {
    const limit = parts[2] || "";
    const offset = parts[3] || "";
    const keyword = parts[4] || "";
    const params = { userId: user.id };
    if (limit && isPositiveIntegerId(limit)) params.limit = Number(limit);
    if (offset && isPositiveIntegerId(offset)) params.offset = Number(offset);
    if (keyword) params.keyword = keyword;
    const resp = await traccarRequest("get", "/api/orders", null, params);
    if (resp.status >= 200 && resp.status < 300) {
      const orders = resp.data || [];
      let out = "*Orders*:\n";
      orders.forEach((order, idx) => {
        out += `\n#${idx + 1}:\n`;
        out += `- ID: ${order.id}\n`;
        out += `- Unique ID: ${escapeMarkdown(order.uniqueId)}\n`;
        out += `- Description: ${escapeMarkdown(order.description)}\n`;
        out += `- From: ${escapeMarkdown(order.fromAddress)}\n`;
        out += `- To: ${escapeMarkdown(order.toAddress)}\n`;
      });
      await telegramSendMessage(chatId, out);
    } else {
      await sendPlainText(chatId, t(locale, "generic_error"));
    }
    return;
  }

  // POST /orders
  if (action === "create") {
    const orderData = {
      uniqueId: parts[2],
      description: parts[3],
      fromAddress: parts[4],
      toAddress: parts[5],
      attributes: {}
    };
    const resp = await traccarRequest("post", "/api/orders", orderData);
    if (resp.status >= 200 && resp.status < 300) {
      await sendPlainText(chatId, t(locale, "order_created"));
    } else {
      await sendPlainText(chatId, t(locale, "order_failed"));
    }
    return;
  }

  // PUT /orders/{id}
  if (action === "update") {
    const id = parts[2];
    if (!isPositiveIntegerId(id)) {
      await sendPlainText(chatId, t(locale, "generic_error"));
      return;
    }
    const order = await getOrderById(id);
    if (!order) {
      await sendPlainText(chatId, t(locale, "order_failed"));
      return;
    }
    const orderData = {
      id: Number(id),
      uniqueId: parts[3],
      description: parts[4],
      fromAddress: parts[5],
      toAddress: parts[6],
      attributes: order.attributes || {}
    };
    const resp = await traccarRequest("put", `/api/orders/${id}`, orderData);
    if (resp.status >= 200 && resp.status < 300) {
      await sendPlainText(chatId, t(locale, "order_updated"));
    } else {
      await sendPlainText(chatId, t(locale, "order_failed"));
    }
    return;
  }

  // DELETE /orders/{id}
  if (action === "delete") {
    const id = parts[2];
    if (!isPositiveIntegerId(id)) {
      await sendPlainText(chatId, t(locale, "generic_error"));
      return;
    }
    const order = await getOrderById(id);
    if (!order) {
      await sendPlainText(chatId, t(locale, "order_failed"));
      return;
    }
    const resp = await traccarRequest("delete", `/api/orders/${id}`);
    if (resp.status >= 200 && resp.status < 300) {
      await sendPlainText(chatId, t(locale, "order_deleted"));
    } else {
      await sendPlainText(chatId, t(locale, "order_failed"));
    }
    return;
  }

  await sendPlainText(chatId, t(locale, "orders_usage"));
}
