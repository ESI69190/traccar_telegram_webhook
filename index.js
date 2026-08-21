// index.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { rateLimit } from "express-rate-limit";
import { handleTelegramUpdate } from "./router/telegram.js";
import { checkEnv } from "./services/env.js";
import { registerBotCommands } from "./services/telegram.js";
import { handleMiniAppAssociate } from "./router/miniapp.js";

const JSON_BODY_LIMIT = "256kb";

// Defaults preserved from the previous custom rate limiter.
const DEFAULT_MINIAPP_MAX_REQUESTS = 10;
const DEFAULT_MINIAPP_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_TELEGRAM_MAX_REQUESTS = 120;
const DEFAULT_TELEGRAM_WINDOW_MS = 60 * 1000; // 1 minute

function positiveIntFromEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === null || raw === "") return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const rateLimitErrorHandler = (req, res) => {
  const retryAfter = Number(res.get("Retry-After") ?? 1);
  res.status(429).json({
    ok: false,
    error: "rate_limited",
    retryAfter: Number.isFinite(retryAfter) ? retryAfter : 1
  });
};

export function createApp() {
  const app = express();
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(express.static("public"));

  // Reverse-proxy trust handling: the repository's documented deployment
  // (docker-compose.yml) exposes the container directly on port 3000, so the
  // app always receives the real client IP. Trusting X-Forwarded-For here
  // would let a client spoof its IP unless a trusted proxy strips that
  // header, so proxy trust is intentionally not enabled. Deployments behind
  // a reverse proxy must configure Express `trust proxy` themselves (see
  // README). The default key generator of express-rate-limit uses req.ip.

  // Mini App association endpoint: 10 requests / minute per IP by default,
  // independently configurable via RATE_LIMIT_MAX_REQUESTS/RATE_LIMIT_WINDOW_MS.
  const miniAppRateLimiter = rateLimit({
    windowMs: positiveIntFromEnv(
      "RATE_LIMIT_WINDOW_MS",
      DEFAULT_MINIAPP_WINDOW_MS
    ),
    limit: positiveIntFromEnv(
      "RATE_LIMIT_MAX_REQUESTS",
      DEFAULT_MINIAPP_MAX_REQUESTS
    ),
    standardHeaders: "draft-7",
    legacyHeaders: true,
    handler: rateLimitErrorHandler
  });

  // Telegram can legitimately deliver bursts of updates, so it has a
  // dedicated, independently configurable limit (defaults to 120/min).
  const telegramWebhookRateLimiter = rateLimit({
    windowMs: positiveIntFromEnv(
      "TELEGRAM_RATE_LIMIT_WINDOW_MS",
      DEFAULT_TELEGRAM_WINDOW_MS
    ),
    limit: positiveIntFromEnv(
      "TELEGRAM_RATE_LIMIT_MAX_REQUESTS",
      DEFAULT_TELEGRAM_MAX_REQUESTS
    ),
    standardHeaders: "draft-7",
    legacyHeaders: true,
    handler: rateLimitErrorHandler
  });

  app.post("/telegram/webhook", telegramWebhookRateLimiter, handleTelegramUpdate);
  app.post("/api/associate/miniapp", miniAppRateLimiter, handleMiniAppAssociate);

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