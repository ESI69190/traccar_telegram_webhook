// services/env.js
export function checkEnv() {
  const missing = [];
  if (!process.env.TRACCAR_URL)
    console.warn("TRACCAR_URL not set, using default http://traccar:8082");
  if (!process.env.TRACCAR_USER) missing.push("TRACCAR_USER");
  if (!process.env.TRACCAR_PASS) missing.push("TRACCAR_PASS");
  if (!process.env.BOT_TOKEN) missing.push("BOT_TOKEN");

  if (missing.length) {
    console.warn("Missing environment variables: " + missing.join(", "));
  }

  if (!process.env.BOT_SECRET) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "BOT_SECRET not set in production: Telegram webhook requests are rejected. Set BOT_SECRET and configure the Telegram webhook secret_token for secure operation."
      );
    } else {
      console.warn(
        "BOT_SECRET not set: Telegram webhook requests will not be validated. Set BOT_SECRET and configure the Telegram webhook secret_token for secure operation."
      );
    }
  }

  if (!process.env.ASSOC_SECRET) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "ASSOC_SECRET not set in production: association is disabled. Set ASSOC_SECRET for secure confirmation."
      );
    } else {
      console.warn(
        "ASSOC_SECRET not set: association confirmation will not accept encrypted password. Set ASSOC_SECRET for secure confirmation."
      );
    }
  }
}
