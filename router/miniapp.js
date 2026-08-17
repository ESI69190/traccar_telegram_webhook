// router/miniapp.js
import { validateInitData, getInitDataMaxAge, getInitDataFutureTolerance } from "../services/telegramInitData.js";
import { findUserByEmail, findUserByPhone, getUserById, updateUserPhoneAndChat, verifySession } from "../services/traccar.js";
import { normalizePhone, isValidEmail } from "../services/security.js";
import { getUserLocale, t } from "../services/i18n.js";
import { telegramSendMessage } from "../services/telegram.js";

/**
 * Handle Mini App association request.
 * POST /api/associate/miniapp
 * Body: { initData: string, identifier: string, password: string }
 */
export async function handleMiniAppAssociate(req, res) {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  try {
    // Validate Content-Type
    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("application/json")) {
      return res.status(400).json({ ok: false, error: "invalid_content_type" });
    }

    // Validate request body size (conservative limit)
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ ok: false, error: "invalid_request_body" });
    }

    const { initData, identifier, password } = body;

    // Validate required fields
    if (!initData || typeof initData !== "string") {
      return res.status(400).json({ ok: false, error: "missing_init_data" });
    }
    if (!identifier || typeof identifier !== "string") {
      return res.status(400).json({ ok: false, error: "missing_identifier" });
    }
    if (!password || typeof password !== "string") {
      return res.status(400).json({ ok: false, error: "missing_password" });
    }

    // Conservative field length limits
    if (initData.length > 8192) {
      return res.status(400).json({ ok: false, error: "init_data_too_large" });
    }
    if (identifier.length > 256) {
      return res.status(400).json({ ok: false, error: "identifier_too_long" });
    }
    if (password.length > 256) {
      return res.status(400).json({ ok: false, error: "password_too_long" });
    }

    // Validate initData
    const maxAge = getInitDataMaxAge();
    const futureTolerance = getInitDataFutureTolerance();
    const validation = validateInitData(initData, BOT_TOKEN, maxAge, futureTolerance);

    if (!validation.ok) {
      // Log sanitized error (no initData, no credentials)
      console.warn("Mini App initData validation failed:", validation.error);
      return res.status(401).json({ ok: false, error: "invalid_telegram_session" });
    }

    const telegramUser = validation.user;
    const telegramUserId = String(telegramUser.id);
    const telegramLanguageCode = telegramUser.language_code || null;

    // Resolve identifier (email or phone)
    let user = null;
    const trimmedIdentifier = identifier.trim();

    if (isValidEmail(trimmedIdentifier)) {
      user = await findUserByEmail(trimmedIdentifier);
    } else {
      const phoneIntl = normalizePhone(trimmedIdentifier);
      if (phoneIntl) {
        user = await findUserByPhone(phoneIntl);
      }
    }

    if (!user) {
      // Generic error to prevent account enumeration
      return res.status(401).json({ ok: false, error: "authentication_failed" });
    }

    // Fetch full user details to get attributes (including telegramChatId)
    const fullUser = await getUserById(user.id);
    if (!fullUser) {
      return res.status(500).json({ ok: false, error: "user_fetch_failed" });
    }
    user = fullUser;

    // Verify Traccar credentials using /api/session WITHOUT service account auth
    // This uses the user's email and submitted password
    const sessionResp = await verifySession(user.email, password);
    if (sessionResp.status < 200 || sessionResp.status >= 300) {
      return res.status(401).json({ ok: false, error: "authentication_failed" });
    }

    // Reassociation protection: check if user already has a different telegramChatId
    const existingChatId = user.attributes?.telegramChatId;
    console.debug("[miniapp] existingChatId:", existingChatId, "telegramUserId:", telegramUserId, "user.attributes:", user.attributes);
    if (existingChatId && String(existingChatId) !== telegramUserId) {
      // Different Telegram user already associated - reject
      console.warn("Reassociation attempt rejected: user", user.id, "has chatId", existingChatId, "but Telegram user is", telegramUserId);
      return res.status(409).json({ ok: false, error: "already_associated" });
    }

    // If same chatId, idempotent success
    if (existingChatId && String(existingChatId) === telegramUserId) {
      console.debug("[miniapp] Idempotent reassociation detected, returning early");
      return res.json({ ok: true, message: "already_associated_idempotent" });
    }

    // Associate: update user with phone and telegramChatId
    const phoneToSet = user.phone || "";
    const upd = await updateUserPhoneAndChat(user.id, phoneToSet, telegramUserId);
    
    if (!upd.ok) {
      console.error("Failed to update user association:", upd.reason);
      return res.status(500).json({ ok: false, error: "association_failed" });
    }

    // Determine locale for success message (Telegram locale > Traccar locale > English)
    const locale = getUserLocale(user, telegramLanguageCode);

    // Send success message to Telegram user
    try {
      await telegramSendMessage(telegramUserId, t(locale, "miniapp_assoc_success"), { parse_mode: "MarkdownV2" });
    } catch (e) {
      // Non-fatal: association succeeded but notification failed
      console.warn("Failed to send Telegram notification:", e?.toString());
    }

    return res.json({ ok: true, message: "association_successful" });
  } catch (e) {
    console.error("handleMiniAppAssociate error:", e?.toString());
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}