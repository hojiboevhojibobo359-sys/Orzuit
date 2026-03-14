# OrzuIT

Professional multi-page website with admin panel, backend API, and PostgreSQL database.

## Stack

- Frontend: static HTML/CSS/JS pages
- Backend: Vercel Serverless Functions (`/api`)
- Database: PostgreSQL (`pg`)
- Admin auth: JWT + hashed passwords (`bcryptjs`)

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

## Notes

- Content is stored in DB and shared across all devices.
- First project in admin list is featured automatically on homepage.
