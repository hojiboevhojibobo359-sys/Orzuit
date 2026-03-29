# OrzuIT

Professional multi-page website with admin panel, backend API, and PostgreSQL database.

## Stack

- Frontend: static HTML/CSS/JS pages
- Backend: Vercel Serverless Functions (`/api`)
- Database: PostgreSQL (`pg`)
- Admin auth: JWT + hashed passwords (`bcryptjs`)

## Vercel Analytics / local setup note

- This project uses custom analytics at `analytics.js` → `POST /api/analytics`, not `@vercel/analytics/next` client import in PowerShell.
- Do not run JS module `import` statements directly in shell. Use them only in script/module files that are bundled by a JS toolchain.
- For Vercel built-in analytics, configure in Vercel dashboard and continue using plan-specific tooling.

## Environment Variables

Set these variables in Vercel project settings:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - strong random secret
- `ADMIN_LOGIN` - initial admin username
- `ADMIN_PASSWORD` - initial admin password
- `ADMIN_BOOTSTRAP_SECRET` - optional one-time secret to reset admin credentials if you lose access
- `TELEGRAM_BOT_TOKEN` (optional) - Telegram bot token for sending messages
- `TELEGRAM_CHAT_ID` (optional) - Telegram chat ID where the bot sends messages

You can use `.env.example` as reference. Telegram can also be configured in **Admin → Telegram** (stored in DB); env variables take precedence.

## Telegram integration

- In Admin go to **Telegram**, enter **Chat-ID** and **Bot-Token**, then Save. Or set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in Vercel env.
- Send messages via `POST /api/telegram/send` with JSON body `{ "message": "Your text" }` (e.g. from a contact form). Use `parse_mode: "HTML"` for simple formatting.

## Admin URLs

- Login: `/admin-login.html`
- Dashboard: `/admin.html`

## Production readiness

- **Rate limiting**: Login (10/15 min), order (20/min), content (60/min) by IP; state in DB (`rate_limits` table).
- **Validation**: Centralized in `api/_lib/validate.js` for login, order, content, credentials, Telegram, bootstrap; API returns `{ error, details }` on validation failure.
- **Logging**: `api/_lib/logger.js` (info, warn, error) to stdout; set `LOG_LEVEL` (debug|info|warn|error) if needed.
- **ORM**: All DB access via `api/_lib/models` (Admin, SiteContent, Order, TelegramSettings); raw SQL only in `api/_lib/db.js` for init and in models.

## Notes

- Content is stored in DB and shared across all devices.
- First project in admin list is featured automatically on homepage.
