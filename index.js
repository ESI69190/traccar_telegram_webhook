// index.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { handleTelegramUpdate } from "./router/telegram.js";
import { checkEnv } from "./services/env.js";
import { registerBotCommands } from "./services/telegram.js";
import { handleMiniAppAssociate } from "./router/miniapp.js";
import { createRateLimiter } from "./services/rateLimiter.js";

const JSON_BODY_LIMIT = "256kb";
const TELEGRAM_DEFAULT_MAX_REQUESTS = 120;

export function createApp() {
  const app = express();
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(express.static("public"));

  // Rate limiter for Mini App association endpoint. Its existing defaults and
  // RATE_LIMIT_* environment variables remain unchanged.
  const miniAppRateLimiter = createRateLimiter({
    keyPrefix: "miniapp_assoc"
  });

  // Telegram can legitimately deliver bursts of updates, so it has a
  // dedicated, independently configurable limit.
  const telegramWebhookRateLimiter = createRateLimiter({
    keyPrefix: "telegram_webhook",
    maxRequestsEnv: "TELEGRAM_RATE_LIMIT_MAX_REQUESTS",
    windowMsEnv: "TELEGRAM_RATE_LIMIT_WINDOW_MS",
    defaultMaxRequests: TELEGRAM_DEFAULT_MAX_REQUESTS
  });

  app.post(
    "/telegram/webhook",
    telegramWebhookRateLimiter,
    handleTelegramUpdate
  );
  app.post(
    "/api/associate/miniapp",
    miniAppRateLimiter,
    handleMiniAppAssociate
  );

  return app;
}

export function startServer() {
  checkEnv();

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const app = createApp();

  app.listen(port, async () => {
    console.log("Traccar Telegram bot listening on port " + port);
    // Register Telegram bot commands (default + localized)
    await registerBotCommands();
  });

  return app;
}

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  startServer();
}
