// controllers/orders.js
import { t } from "../services/i18n.js";
import { findUserByChatId, traccarRequest, getOrderById, verifyOrderOwnership } from "../services/traccar.js";
import { telegramSendMessage, sendPlainText } from "../services/telegram.js";
import { isPositiveIntegerId, escapeMarkdown, MAX_LIMIT } from "../services/security.js";

function buildOrderListMessage(orders) {
  let out = "*Orders*:\n";
  orders.forEach((order, idx) => {
    out += `\n\\#${idx + 1}:\\n`;
    out += `\\- ID: ${order.id}\\n`;
    out += `\\- Unique ID: ${escapeMarkdown(order.uniqueId)}\\n`;
    out += `\\- Description: ${escapeMarkdown(order.description)}\\n`;
    out += `\\- From: ${escapeMarkdown(order.fromAddress)}\\n`;
    out += `\\- To: ${escapeMarkdown(order.toAddress)}\\n`;
  });
  return out;
}

// Each sub-command is a named, server-defined handler. The end-user never
// supplies the handler itself: `action === "update"` style branches are
// replaced by a server-side dispatch table so that the authorization checks
// inside the handlers run regardless of how the command was phrased.
async function handleGetOrders(parts, user, chatId, locale) {
  const limit = parts[2] || "";
  const offset = parts[3] || "";
  const keyword = parts[4] || "";
  const params = { userId: user.id };
  if (limit && isPositiveIntegerId(limit)) {
    const limitNum = Number(limit);
    params.limit = limitNum > MAX_LIMIT ? MAX_LIMIT : limitNum;
  }
  if (offset && isPositiveIntegerId(offset)) params.offset = Number(offset);
  if (keyword) params.keyword = keyword;
  const resp = await traccarRequest("get", "/api/orders", null, params);
  if (resp.status >= 200 && resp.status < 300) {
    await telegramSendMessage(chatId, buildOrderListMessage(resp.data || []));
  } else {
    await sendPlainText(chatId, t(locale, "generic_error"));
  }
}

async function handleCreateOrder(parts, chatId, locale) {
  const uniqueId = parts[2];
  const description = parts[3];
  const fromAddress = parts[4];
  const toAddress = parts[5];

  if (!uniqueId || !description || !fromAddress || !toAddress) {
    await sendPlainText(chatId, t(locale, "orders_usage"));
    return;
  }
  if (uniqueId.length > 64 || description.length > 512 || fromAddress.length > 512 || toAddress.length > 512) {
    await sendPlainText(chatId, t(locale, "order_failed"));
    return;
  }

  const orderData = {
    uniqueId,
    description,
    fromAddress,
    toAddress,
    attributes: {}
  };
  const resp = await traccarRequest("post", "/api/orders", orderData);
  if (resp.status >= 200 && resp.status < 300) {
    await sendPlainText(chatId, t(locale, "order_created"));
  } else {
    await sendPlainText(chatId, t(locale, "order_failed"));
  }
}

async function handleUpdateOrder(parts, user, chatId, locale) {
  const id = parts[2];
  if (!isPositiveIntegerId(id)) {
    await sendPlainText(chatId, t(locale, "generic_error"));
    return;
  }
  const ownsOrder = await verifyOrderOwnership(user.id, id);
  if (!ownsOrder) {
    await sendPlainText(chatId, t(locale, "order_failed"));
    return;
  }
  const order = await getOrderById(id);
  if (!order) {
    await sendPlainText(chatId, t(locale, "order_failed"));
    return;
  }

  const uniqueId = parts[3];
  const description = parts[4];
  const fromAddress = parts[5];
  const toAddress = parts[6];

  // Validate optional fields if provided
  if (uniqueId !== undefined && uniqueId.length > 64) {
    await sendPlainText(chatId, t(locale, "order_failed"));
    return;
  }
  if (description !== undefined && description.length > 512) {
    await sendPlainText(chatId, t(locale, "order_failed"));
    return;
  }
  if (fromAddress !== undefined && fromAddress.length > 512) {
    await sendPlainText(chatId, t(locale, "order_failed"));
    return;
  }
  if (toAddress !== undefined && toAddress.length > 512) {
    await sendPlainText(chatId, t(locale, "order_failed"));
    return;
  }

  const orderData = {
    id: Number(id),
    uniqueId: uniqueId !== undefined ? uniqueId : order.uniqueId,
    description: description !== undefined ? description : order.description,
    fromAddress: fromAddress !== undefined ? fromAddress : order.fromAddress,
    toAddress: toAddress !== undefined ? toAddress : order.toAddress,
    attributes: order.attributes || {}
  };
  const resp = await traccarRequest("put", `/api/orders/${id}`, orderData);
  if (resp.status >= 200 && resp.status < 300) {
    await sendPlainText(chatId, t(locale, "order_updated"));
  } else {
    await sendPlainText(chatId, t(locale, "order_failed"));
  }
}

async function handleDeleteOrder(parts, user, chatId, locale) {
  const id = parts[2];
  if (!isPositiveIntegerId(id)) {
    await sendPlainText(chatId, t(locale, "generic_error"));
    return;
  }
  const ownsOrder = await verifyOrderOwnership(user.id, id);
  if (!ownsOrder) {
    await sendPlainText(chatId, t(locale, "order_failed"));
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
}

export default async function handleOrders(chatId, text, locale) {
  const parts = text.split(/\s+/);
  const action = String(parts[1] || "").toLowerCase();

  const user = await findUserByChatId(chatId);
  if (!user) {
    await sendPlainText(chatId, t(locale, "start_assoc_prompt"));
    return;
  }

  switch (action) {
    case "get":
      await handleGetOrders(parts, user, chatId, locale);
      return;
    case "create":
      await handleCreateOrder(parts, chatId, locale);
      return;
    case "update":
      await handleUpdateOrder(parts, user, chatId, locale);
      return;
    case "delete":
      await handleDeleteOrder(parts, user, chatId, locale);
      return;
    default:
      await sendPlainText(chatId, t(locale, "orders_usage"));
      return;
  }
}
