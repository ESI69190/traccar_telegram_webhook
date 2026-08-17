# 🚀 Traccar Telegram Bot

Telegram bot to interact with a Traccar 6.x server.
Provides secure user association, per-user device access via device attributes, tracking, history, status, engine commands, orders, positions, and reports. Designed for modularity, internationalization, safe association flows and server-side authorization.

## Features

### User Association
- `/assoc <phone>` — associate phone number
- `/assoc telegram` — show contact share button (Telegram contact share) **or** open Telegram Mini App when `TELEGRAM_ASSOC_WEBAPP_URL` is configured
- **Telegram Mini App** — secure, in-app association flow using `Telegram.WebApp.initData` validation (recommended)
- Secure confirmation using **AES-256-GCM** encrypted password when `ASSOC_SECRET` is set (legacy flow)
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
- Locale priority: Telegram user locale → Traccar user attributes (`attributes.locale` or `attributes.language`) → fallback to English
- Supported locales: **en, fr, es, pt, tr, ru, zh, ja, de, ko, it** (with regional variants like en-US, fr-FR, es-ES, pt-BR, tr-TR, ru-RU, zh-CN, zh-Hans, ja-JP, de-DE, ko-KR, it-IT)
- Telegram command menu localized for all supported languages
- Date formatting uses locale-appropriate Intl locale

## Architecture

```
.
├─ index.js
├─ translations.js
├─ openapi.yaml
├─ public/
│  └─ miniapp.html
├─ router/
│  ├─ telegram.js
│  └─ miniapp.js
├─ services/
│  ├─ env.js
│  ├─ i18n.js
│  ├─ telegram.js
│  ├─ traccar.js
│  ├─ security.js
│  ├─ permissions.js
│  ├─ rateLimiter.js
│  └─ telegramInitData.js
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
| `TELEGRAM_ASSOC_WEBAPP_URL` | HTTPS URL of the Telegram Mini App frontend (e.g., `https://example.com/miniapp.html`) | No (required for Mini App flow) |
| `TELEGRAM_WEBAPP_AUTH_MAX_AGE_SECONDS` | Maximum age of `initData` in seconds (default: 300) | No |
| `PORT` | HTTP port (default: 3000) | No |
| `NODE_ENV` | `production` or `development` (default: development) | No |

*Either basic auth (`TRACCAR_USERNAME` + `TRACCAR_PASSWORD`) or API key (`TRACCAR_API_KEY`) is required.

**`BOT_SECRET`** is required in production. The webhook rejects requests when `BOT_SECRET` is missing in production or when the `X-Telegram-Bot-Api-Secret-Token` header does not match.

**`ASSOC_SECRET`** is required in production. When set, `/assoc` expects an **AES-256-GCM** encrypted password (versioned payload: version + iterations + salt + IV + tag + ciphertext, all base64-encoded) as confirmation to avoid sending plain passwords in chat. In production, contact-only association is disabled to prevent account takeover.

**`TELEGRAM_ASSOC_WEBAPP_URL`** must be an HTTPS URL in production. When configured, `/assoc telegram` sends an inline `web_app` button that opens the Mini App. The Mini App frontend is served from `/miniapp.html` by the application (or can be hosted separately at the configured URL).

**`TELEGRAM_WEBAPP_AUTH_MAX_AGE_SECONDS`** controls the maximum allowed age of `initData.auth_date`. Default is **300 seconds** (5 minutes). A small future tolerance (60 seconds) is also allowed for clock skew.

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
      - TELEGRAM_ASSOC_WEBAPP_URL=https://your-domain.com/miniapp.html
      - NODE_ENV=production
    ports:
      - "3000:3000"
```

## Usage

### Set Telegram Webhook
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<your-domain>/telegram/webhook&secret_token=<BOT_SECRET>"
```

### Typical Flow (Mini App — Recommended)
1. User sends `/start` to the bot
2. If not associated, user runs `/assoc telegram`
3. Bot replies with an inline **"Open Mini App"** button (uses `TELEGRAM_ASSOC_WEBAPP_URL`)
4. User taps the button → Telegram Mini App opens (`public/miniapp.html`)
5. User enters **email or phone** and **Traccar password** (type=password, never leaves the Mini App)
6. Mini App sends `Telegram.WebApp.initData` + credentials to `POST /api/associate/miniapp`
7. Backend validates `initData` (HMAC-SHA256, max age, future tolerance), authenticates with Traccar `/api/session` using user's credentials, associates `telegramChatId`
8. Success message sent to Telegram user; Mini App closes

### Legacy Flow (Encrypted Password)
1. User sends `/assoc telegram` and shares contact or `/assoc +123456789`
2. Bot prompts for encrypted password: `/assoc <phone> <encryptedPasswordBase64>`
3. Client encrypts Traccar password with AES-256-GCM using `ASSOC_SECRET` (PBKDF2 key derivation)
4. Bot decrypts, verifies via Traccar `/api/session`, associates `telegramChatId`

### Device Association Strategy
Because `GET /api/permissions` may be unavailable or restricted, the bot:
1. Calls `GET /api/devices?userId=<traccarUserId>` using the Traccar account configured for the bot (typically an admin/service account)
2. Filters devices by a device attribute such as `telegramOwner` that equals the Telegram chat id
3. This ensures each Telegram user sees only their devices

To associate a device to a Telegram user, add the attribute in Traccar device settings:
```
telegramOwner = 123456789
```

## Secure Association (Mini App)

The **Telegram Mini App** flow is the preferred and most secure association method:

```
/assoc
  -> Telegram bot responds with inline keyboard containing a `web_app` button
  -> Button URL = TELEGRAM_ASSOC_WEBAPP_URL (e.g., https://example.com/miniapp.html)
  -> Mini App frontend loads (served by the application from /miniapp.html)
  -> User enters email/phone and Traccar password (type=password)
  -> Frontend reads Telegram.WebApp.initData (provided by Telegram)
  -> Frontend POSTs { initData, identifier, password } to /api/associate/miniapp
  -> Backend validates initData (HMAC-SHA256 with BOT_TOKEN, max age 300s, future tolerance 60s)
  -> Backend looks up user by email or phone (service account)
  -> Backend verifies Traccar credentials via /api/session WITH USER'S PASSWORD (not service account)
  -> Backend checks reassociation protection (same Telegram user = idempotent; different = rejected)
  -> Backend updates user attributes: telegramChatId, phone
  -> Backend sends success notification to Telegram user
```

**Security properties:**
- Traccar passwords are **never sent through Telegram messages** and are **never stored by the bot**
- Password is entered only in the Mini App (type=password), submitted via HTTPS POST to backend
- `initData` provides cryptographic proof of Telegram user identity (verified with BOT_TOKEN)
- Service account is used **only for user lookup/update**; `/api/session` authenticates with the submitted Traccar user's credentials
- Service credentials are **NOT attached to `/api/session`**

### Environment Variables for Mini App

| Variable | Description | Default |
|----------|-------------|---------|
| `TELEGRAM_ASSOC_WEBAPP_URL` | HTTPS URL of the Mini App frontend. Must be HTTPS in production. | (required for Mini App) |
| `TELEGRAM_WEBAPP_AUTH_MAX_AGE_SECONDS` | Maximum age of `initData.auth_date` in seconds. | 300 |

**HTTPS is required for production** — Telegram Mini Apps only work over HTTPS.

## Authentication Separation

The implementation maintains a strict separation between service credentials and user credentials:

- **Traccar service account** (configured via `TRACCAR_USERNAME`/`TRACCAR_PASSWORD` or `TRACCAR_API_KEY`) is used for:
  - User lookup (`GET /api/users`, `GET /api/users/:id`)
  - User attribute updates (`PUT /api/users/:id` — phone, telegramChatId)
  - Device listing for permissions (`GET /api/devices?userId=`)
  - All other Traccar API calls (tracking, history, reports, orders, etc.)

- **User's Traccar credentials** (email + password entered in Mini App) are used **only** for:
  - `POST /api/session` authentication to verify the user knows their password

- **Service credentials are NEVER sent to `/api/session`** — this prevents privilege escalation and ensures each user authenticates with their own credentials.

## Rate Limiting

The Mini App association endpoint (`POST /api/associate/miniapp`) is protected by an in-memory rate limiter:

- **Threshold**: 10 requests per 15 minutes per IP
- **Storage**: Process-local / in-memory (Map-based)
- **Response**: HTTP 429 with `Retry-After` header when limit exceeded
- **Traccar authentication is prevented after limit** — the rate limiter runs before any Traccar calls
- **Multi-instance deployments**: Require shared storage (e.g., Redis) — the current implementation is single-instance only

## Reassociation

- **Same Telegram account**: Idempotent — re-running `/assoc telegram` and completing the Mini App flow for an already-associated account returns success without changes
- **Different Telegram account**: Rejected — if a Traccar user already has a different `telegramChatId`, the Mini App flow returns HTTP 409 `already_associated`

## MarkdownV2

All user-facing messages use **Telegram MarkdownV2** with centralized escaping via `services/security.js::escapeMarkdown()`:

- Reserved characters escaped: `_ * [ ] ( ) ~ \` > # + - = | { } . !`
- Dynamic/user-controlled values are **always** passed through `escapeMarkdown()`
- Static templates with intentional formatting (e.g., bold, links) use `telegramSendMessage` directly with `parse_mode: "MarkdownV2"` and pre-escaped content
- Regression tests verify escaping behavior in `tests/security.test.js` and `tests/controllers.test.js`

## Telegram Security (initData Validation)

The Mini App backend validates `Telegram.WebApp.initData` per Telegram's specification:

- **HMAC-SHA256 verification**: `secret_key = HMAC_SHA256("WebAppData", BOT_TOKEN)`, then verify `hash == HMAC_SHA256(secret_key, data_check_string)`
- **Max age**: `TELEGRAM_WEBAPP_AUTH_MAX_AGE_SECONDS` (default 300s) — rejects stale `auth_date`
- **Future tolerance**: 60 seconds — allows minor clock skew
- **Trusted Telegram ID source**: `initData.user.id` is the authoritative Telegram user identifier; it is used for `telegramChatId` association and reassociation checks

## Traccar Authentication

| Question | Answer |
|----------|--------|
| SERVICE ACCOUNT USED FOR USER LOOKUP/UPDATE? | **YES** |
| SERVICE ACCOUNT USED FOR /api/session USER AUTH? | **NO** |

The service account performs user lookup and attribute updates. The `/api/session` call uses the **user's submitted credentials** (email + password from Mini App) to verify they know their Traccar password.

## Password Safety

| Property | Status |
|----------|--------|
| Stored by bot | **NO** |
| Logged | **NO** |
| Returned in API responses | **NO** |
| Sent in Telegram messages | **NO** |
| In URL / query parameters | **NO** |
| Browser storage (localStorage, sessionStorage, cookies, IndexedDB, Telegram SecureStorage) | **NO** |
| Console.log of credentials | **NO** |
| Raw initData submitted to backend | **YES** (required for verification) |

The Mini App frontend (`public/miniapp.html`):
- Uses `<input type="password">` for password field
- Does not write password to any browser storage
- Does not log credentials
- Submits `initData` + credentials via `fetch()` POST to `/api/associate/miniapp`

## i18n Parity

All user-facing strings are translated for **6 languages**:

| Language | Code | Status |
|----------|------|--------|
| English | `en` | ✅ Complete |
| French | `fr` | ✅ Complete |
| Spanish | `es` | ✅ Complete |
| Portuguese | `pt` | ✅ Complete |
| Turkish | `tr` | ✅ Complete |
| Russian | `ru` | ✅ Complete |

New Mini App keys added: `miniapp_open_prompt`, `miniapp_button_open`, plus all existing `miniapp_*` keys.

## Legacy Association (Deprecated)

The following environment variables and flow are **legacy/deprecated** but still functional:

- `ASSOC_SECRET` — secret for AES-256-GCM encryption
- `ASSOC_PBKDF2_ITERATIONS` — PBKDF2 iteration count
- Encrypted password flow: `/assoc <phone> <encryptedPasswordBase64>`

**The legacy flow is NOT removed** — it remains as a fallback when `TELEGRAM_ASSOC_WEBAPP_URL` is not configured. However, the Mini App flow is strongly recommended for security and usability.

## Testing

### Automated Tests
```bash
npm test
```
93 tests pass (0 failed).

### Manual Verification
1. Start the bot and ensure it logs "Traccar Telegram bot listening on port"
2. Send `/start` in Telegram
3. Use `/assoc telegram` — should show "Open Mini App" button when `TELEGRAM_ASSOC_WEBAPP_URL` is set
4. Tap button → Mini App opens → enter credentials → association completes
5. Set `telegramOwner` attribute on a device to the chat id
6. Run `/track` and verify the device appears
7. Test `/orders get`, `/orders create`, `/positions`, `/reports`

## Contributing
- Fork the repository and open pull requests
- Keep changes modular
- Update translations when adding new user-facing strings
- Add tests for new security-sensitive functionality
- Run `npm test` before submitting

## License
MIT