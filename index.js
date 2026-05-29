// index.js
import express from "express";
import { handleTelegramUpdate } from "./router/telegram.js";
import { checkEnv } from "./services/env.js";

const app = express();
app.use(express.json());

checkEnv();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.post("/telegram/webhook", handleTelegramUpdate);

app.listen(PORT, () => {
  console.log("Traccar Telegram bot listening on port " + PORT);
});
