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

  if (!process.env.ASSOC_SECRET) {
    console.warn(
      "ASSOC_SECRET not set: association confirmation will not accept encrypted password. Set ASSOC_SECRET for secure confirmation."
    );
  }
}
