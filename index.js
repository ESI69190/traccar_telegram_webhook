// index.js
import express from "express";
import { handleTelegramUpdate } from "./router/telegram.js";
import { checkEnv } from "./services/env.js";
import { registerBotCommands } from "./services/telegram.js";
import { handleMiniAppAssociate } from "./router/miniapp.js";
import { createRateLimiter } from "./services/rateLimiter.js";

const app = express();
app.use(express.json());
app.use(express.static("public"));

checkEnv();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Rate limiter for Mini App association endpoint
const miniAppRateLimiter = createRateLimiter({ keyPrefix: 'miniapp_assoc' });

app.post("/telegram/webhook", handleTelegramUpdate);
app.post("/api/associate/miniapp", miniAppRateLimiter, handleMiniAppAssociate);

app.listen(PORT, async () => {
  console.log("Traccar Telegram bot listening on port " + PORT);
  // Register Telegram bot commands (default + localized)
  await registerBotCommands();
});
