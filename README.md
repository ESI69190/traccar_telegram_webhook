# 🚀 Traccar Telegram Bot

Telegram bot to interact with a Traccar 6.x server.
Provides secure user association, per-user device access via device attributes, tracking, history, status, engine commands, orders, positions, and reports. Designed for modularity, internationalization, safe association flows and server-side authorization.

## Features

### User Association
- `/assoc <phone>` — associate phone number
- `/assoc telegram` — show contact share button (Telegram contact share)
- Secure confirmation using **AES-256-GCM** encrypted password when `ASSOC_SECRET` is set
- In production, `ASSOC_SECRET` is required; contact-only association is disabled to prevent account takeover
- Updates Traccar user attributes: `telegramChatId` and `phone`

### Tracking and Device Info
- `/track` — list devices associated with the Telegram user
- `/track <id>` — show device details and last known position with Google Maps link

### History
- `/history <id> [n]` — last n positions (default 5, capped at 50)

### Status
- `/status <id>` — device state, speed, battery, last update

### Engine Commands
- `/engine <id> on|off` — sends engineResume or engineStop via Traccar `/api/commands/send`

### Custom Commands
- `/commands <id> <type>` — send a custom command to a device

### Orders
- `/orders get [limit] [offset] [keyword]` — list the authenticated user's orders
- `/orders create <uniqueId> <description> <fromAddress> <toAddress>` — create an order scoped to the authenticated user
- `/orders update <id> [uniqueId] [description] [fromAddress] [toAddress]` — update an order after verifying ownership
- `/orders delete <id>` — delete an order after verifying ownership

### Positions
- `/positions <id> [limit]` — list recent positions for a device

### Reports
- `/reports <type> <id> [days]` — generate report (types: route, events, geofences, summary, trips, stops; days: 1-90, default 1)

### Internationalization
- Locale taken from Traccar user attributes (`attributes.locale` or `attributes.language`) or fallback to English
- Supported locales: **en, fr, es, pt, tr, ru** (with regional variants like en-US, fr-FR, es-ES, pt-BR, tr-TR, ru-RU)
- Telegram command menu localized for all supported languages
- Date formatting uses locale-appropriate Intl locale

## Architecture

```
.
├─ index.js
├─ translations.js
├─ openapi.yaml
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
   ├─ engine.js
   ├─ commands.js
   ├─ orders.js
   ├─ positions.js
   └─ reports.js
```

Key design points:
- Modular services for Traccar, Telegram, i18n and security
- Controllers implement command logic
- Permissions are handled by filtering devices returned by `GET /api/devices?userId=<id>` and matching a device attribute (e.g., `telegramOwner`) to the Telegram chat id. This avoids relying on `GET /api/permissions`, which is not available on some Traccar setups
- **Server-side authorization enforced for all resource access**: orders, devices, positions, reports — ownership verified before any operation

## Installation and Configuration

### Prerequisites
- Node.js 18+ (Node 20 recommended)
- A running Traccar 6.x server
- Telegram bot token

### Install
```bash
git clone https://github.com/ESI69190/traccar_telegram_webhook.git
cd traccar_telegram_webhook
npm install
```

### Environment Variables
Create a `.env` or export environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `TRACCAR_API_URL` | Traccar API base URL (default: `http://traccar:8082`) | No |
| `TRACCAR_USERNAME` | Traccar username for basic auth | Yes* |
| `TRACCAR_PASSWORD` | Traccar password for basic auth | Yes* |
| `TRACCAR_API_KEY` | Traccar API key (alternative to basic auth) | Yes* |
| `BOT_TOKEN` | Telegram bot token from @BotFather | **Yes** |
| `BOT_SECRET` | Telegram webhook secret token | **Yes (prod)** |
| `ASSOC_SECRET` | Secret for AES-256-GCM encryption (min 32 chars, high entropy) | **Yes (prod)** |
| `ASSOC_PBKDF2_ITERATIONS` | PBKDF2 iterations (default: 100000, min: 10000) | No |
| `PORT` | HTTP port (default: 3000) | No |
| `NODE_ENV` | `production` or `development` (default: development) | No |

*Either basic auth (`TRACCAR_USERNAME` + `TRACCAR_PASSWORD`) or API key (`TRACCAR_API_KEY`) is required.

**`BOT_SECRET`** is required in production. The webhook rejects requests when `BOT_SECRET` is missing in production or when the `X-Telegram-Bot-Api-Secret-Token` header does not match.

**`ASSOC_SECRET`** is required in production. When set, `/assoc` expects an **AES-256-GCM** encrypted password (versioned payload: version + iterations + salt + IV + tag + ciphertext, all base64-encoded) as confirmation to avoid sending plain passwords in chat. In production, contact-only association is disabled to prevent account takeover.

`ASSOC_PBKDF2_ITERATIONS` allows tuning PBKDF2 work factor (minimum 10000).

### Docker Example
```yaml
version: "3.8"
services:
  telegram-webhook:
    image: node:20
    working_dir: /app
    volumes:
      - .:/app
    command: ["node", "index.js"]
    environment:
      - TRACCAR_API_URL=http://traccar:8082
      - TRACCAR_USERNAME=admin
      - TRACCAR_PASSWORD=your_traccar_password
      - BOT_TOKEN=123456:ABC-DEF...
      - ASSOC_SECRET=your-32+-char-secret
      - NODE_ENV=production
    ports:
      - "3000:3000"
```

## Usage

### Set Telegram Webhook
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<your-domain>/telegram/webhook&secret_token=<BOT_SECRET>"
```

### Typical Flow
1. User sends `/start` to the bot
2. If not associated, user runs `/assoc telegram` and shares contact or `/assoc +123456789`
3. Admin or secure confirmation updates Traccar user attributes:
   - `telegramChatId` set to the Telegram chat id
   - `phone` set to the international phone number
4. Add device attribute `telegramOwner = <chatId>` for devices the user should see
5. User runs `/track` to list devices, `/track <id>` for details, `/history <id>`, `/status <id>`, `/engine <id> on|off`, `/orders get`, `/positions <id>`, `/reports route <id>`

### Device Association Strategy
Because `GET /api/permissions` may be unavailable or restricted, the bot:
1. Calls `GET /api/devices?userId=<traccarUserId>` using the Traccar account configured for the bot (typically an admin/service account)
2. Filters devices by a device attribute such as `telegramOwner` that equals the Telegram chat id
3. This ensures each Telegram user sees only their devices

To associate a device to a Telegram user, add the attribute in Traccar device settings:
```
telegramOwner = 123456789
```

## Security Considerations

- **Webhook authentication**: Configure `BOT_SECRET` and set the Telegram webhook `secret_token`. In production, the webhook rejects all requests if `BOT_SECRET` is not configured.
- **Encrypted association**: `ASSOC_SECRET` is required in production. The client must encrypt the Traccar account password with **AES-256-GCM** (versioned payload: version byte + 4-byte iterations + 16-byte salt + 16-byte IV + 16-byte auth tag + ciphertext, all base64-encoded) and send it as `/assoc <phone> <encryptedPasswordBase64>`. Contact-only association is disabled in production to prevent account takeover.
- **No plaintext passwords in chat or logs**. Decrypted passwords are cleared from memory immediately after use.
- **Server-side authorization**: The Traccar API is accessed through a service account, so the application enforces its own authorization. Orders can only be read, updated or deleted by their owning Traccar user, and created orders are always scoped to the authenticated Telegram user.
- **Device access** is enforced by filtering devices where the `telegramOwner` attribute equals the Telegram chat id.
- **Dedicated bot service account recommended** for Traccar API access.
- **Audit logs recommended**. Error logs contain only the error message and response status; request bodies, headers, credentials and full error objects are never logged.
- **Input validation**: All user-controlled input (IDs, pagination, string lengths, report bounds) is validated server-side before Traccar API calls.

## Cryptography

The association confirmation uses **AES-256-GCM** (authenticated encryption) with **PBKDF2-HMAC-SHA256** key derivation:
- **Key derivation**: PBKDF2-HMAC-SHA256, configurable iterations (default 100,000, minimum 10,000)
- **Salt**: 16 bytes cryptographically random
- **IV/Nonce**: 16 bytes cryptographically random
- **Authentication tag**: 16 bytes (GCM)
- **Payload format (v1)**: `version(1) + iterations(4, big-endian) + salt(16) + iv(16) + tag(16) + ciphertext`
- **Backward compatibility**: Legacy payloads (salt + iv + tag + ciphertext) are still decryptable with default iterations
- **No hardcoded keys**, secrets never logged

## Testing

### Automated Tests
```bash
npm test
```

### Manual Verification
1. Start the bot and ensure it logs "Traccar Telegram bot listening on port"
2. Send `/start` in Telegram
3. Use `/assoc telegram` and share contact or `/assoc +123456789` (secure confirmation required when `ASSOC_SECRET` is set)
4. Set `telegramOwner` attribute on a device to the chat id
5. Run `/track` and verify the device appears
6. Test `/orders get`, `/orders create`, `/positions`, `/reports`

## Contributing
- Fork the repository and open pull requests
- Keep changes modular
- Update translations when adding new user-facing strings
- Add tests for new security-sensitive functionality
- Run `npm test` before submitting

## License
MIT