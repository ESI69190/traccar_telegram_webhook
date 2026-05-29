🚀 Traccar Telegram Bot
Telegram bot to interact with a Traccar 6.x server.
Provides secure user association, per-user device access via device attributes, tracking, history, status and engine commands. Designed for modularity, internationalization, and safe association flows.

Features
User association

/assoc <phone>

/assoc telegram (Telegram contact share)

Optional secure confirmation using AES-256-CBC encrypted password when ASSOC_SECRET is set

Updates Traccar user attributes: telegramChatId and phone

Tracking and device info

/track — list devices associated with the Telegram user

/track <id> — show device details and last known position with Google Maps link

History

/history <id> [n] — last n positions (default 5)

Status

/status <id> — device state, speed, battery, last update

Engine commands

/engine <id> on|off — sends engineResume or engineStop via Traccar /api/commands/send

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
ASSOC_SECRET=optional-32+chars-secret
PORT=3000

ASSOC_SECRET is optional but recommended. When set, /assoc expects an AES-256-CBC encrypted password (IV + ciphertext base64) as confirmation to avoid sending plain passwords in chat.

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
Encrypted association: If ASSOC_SECRET is set, the client must encrypt the Traccar account password with AES-256-CBC (16-byte IV prefixed to ciphertext, both base64-encoded) and send it as /assoc <phone> <encryptedPasswordBase64>.

No plaintext passwords in chat.

Dedicated bot account recommended.

Audit logs recommended.

Testing
Start the bot and ensure it logs “Traccar Telegram bot listening on port”.

Send /start in Telegram.

Use /assoc telegram and share contact or /assoc +123456789.

Set telegramOwner attribute on a device to the chat id.

Run /track and verify the device appears.

Contributing
Fork the repository and open pull requests.

Keep changes modular.

Update translations when adding new user-facing strings.

License
MIT
