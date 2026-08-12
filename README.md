🚀 Traccar Telegram Bot
Telegram bot to interact with a Traccar 6.x server.
Provides secure user association, per-user device access via device attributes, tracking, history, status, engine commands and orders. Designed for modularity, internationalization, safe association flows and server-side authorization.

Features
User association

/assoc <phone>

/assoc telegram (Telegram contact share)

Secure confirmation using AES-256-CBC encrypted password when ASSOC_SECRET is set

In production, ASSOC_SECRET is required; contact-only association is disabled to prevent account takeover.

Updates Traccar user attributes: telegramChatId and phone

Tracking and device info

/track — list devices associated with the Telegram user

/track <id> — show device details and last known position with Google Maps link

History

/history <id> [n] — last n positions (default 5, capped at 50)

Status

/status <id> — device state, speed, battery, last update

Engine commands

/engine <id> on|off — sends engineResume or engineStop via Traccar /api/commands/send

Orders

/orders get [limit] [offset] [keyword] — list the authenticated user's orders

/orders create <name> <description> <start> <end> — create an order scoped to the authenticated user

/orders update <id> <name> <description> <start> <end> — update an order after verifying ownership

/orders delete <id> — delete an order after verifying ownership

Internationalization

Locale taken from Traccar user attributes (attributes.locale or attributes.language) or fallback to English

Architecture
.
├─ index.js
├─ translations.js
├─ router/
│  └─ telegram.js
├─ services/
│  ├─ env.js
│  ├─ i18n.js
│  ├─ telegram.js
│  ├─ traccar.js
│  ├─ security.js
│  └─ permissions.js
└─ controllers/
├─ assoc.js
├─ track.js
├─ history.js
├─ status.js
└─ engine.js

Key design points:

Modular services for Traccar, Telegram, i18n and security.

Controllers implement command logic.

Permissions are handled by filtering devices returned by GET /api/devices and matching a device attribute (e.g., telegramOwner) to the Telegram chat id. This avoids relying on GET /api/permissions, which is not available on some Traccar setups.

Installation and configuration
Prerequisites
Node.js 18+ (Node 20 recommended)

A running Traccar 6.x server

Telegram bot token

Install
git clone https://github.com/<your-repo>/traccar-telegram-bot.git
cd traccar-telegram-bot
npm install

Environment variables
Create a .env or export environment variables:

TRACCAR_URL=http://traccar:8082
TRACCAR_USER=admin
TRACCAR_PASS=your_traccar_password
BOT_TOKEN=123456:ABC-DEF...
BOT_SECRET=your_webhook_secret
ASSOC_SECRET=your-32+chars-secret
PORT=3000
NODE_ENV=production

BOT_SECRET is required in production. The webhook rejects requests when BOT_SECRET is missing in production or when the X-Telegram-Bot-Api-Secret-Token header does not match.

ASSOC_SECRET is required in production. When set, /assoc expects an AES-256-CBC encrypted password (IV + ciphertext base64) as confirmation to avoid sending plain passwords in chat. In production, contact-only association is disabled to prevent account takeover.

Docker example
version: "3.8"
services:
telegram-webhook:
image: node:20
working_dir: /app
volumes:
- .:/app
command: ["node", "index.js"]
environment:
- TRACCAR_URL=http://traccar:8082
- TRACCAR_USER=admin
- TRACCAR_PASS=your_traccar_password
- BOT_TOKEN=123456:ABC-DEF...
- ASSOC_SECRET=your_assoc_secret
ports:
- "3000:3000"

Usage
Set Telegram webhook
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<your-domain>/telegram/webhook"

Typical flow
User sends /start to the bot.

If not associated, user runs /assoc telegram and shares contact or /assoc +123456789.

Admin or secure confirmation updates Traccar user attributes:

telegramChatId set to the Telegram chat id

phone set to the international phone number

Add device attribute telegramOwner = <chatId> for devices the user should see.

User runs /track to list devices, /track <id> for details, /history <id>, /status <id>, /engine <id> on|off.

Device association strategy
Because GET /api/permissions may be unavailable or restricted, the bot:

Calls GET /api/devices using the Traccar account configured for the bot (typically an admin account).

Filters devices by a device attribute such as telegramOwner that equals the Telegram chat id.

This ensures each Telegram user sees only their devices.

To associate a device to a Telegram user, add the attribute in Traccar device settings:

telegramOwner = 123456789

Security considerations
Webhook authentication: Configure BOT_SECRET and set the Telegram webhook secret_token. In production, the webhook rejects all requests if BOT_SECRET is not configured.

Encrypted association: ASSOC_SECRET is required in production. The client must encrypt the Traccar account password with AES-256-CBC (16-byte IV prefixed to ciphertext, both base64-encoded) and send it as /assoc <phone> <encryptedPasswordBase64>. Contact-only association is disabled in production to prevent account takeover.

No plaintext passwords in chat or logs. Decrypted passwords are cleared from memory immediately after use.

Server-side authorization: The Traccar API is accessed through a service account, so the application enforces its own authorization. Orders can only be read, updated or deleted by their owning Traccar user, and created orders are always scoped to the authenticated Telegram user.

Device access is enforced by filtering devices where the telegramOwner attribute equals the Telegram chat id.

Dedicated bot account recommended.

Audit logs recommended. Error logs contain only the error message and response status; request bodies, headers, credentials and full AxiosError objects are never logged.

Testing
Automated tests

npm test

Start the bot and ensure it logs “Traccar Telegram bot listening on port”.

Send /start in Telegram.

Use /assoc telegram and share contact or /assoc +123456789 (secure confirmation required when ASSOC_SECRET is set).

Set telegramOwner attribute on a device to the chat id.

Run /track and verify the device appears.

Contributing
Fork the repository and open pull requests.

Keep changes modular.

Update translations when adding new user-facing strings.

License
MIT
