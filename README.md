# OrzuIT

Professional multi-page website with admin panel, backend API, and PostgreSQL database.

## Stack

- Frontend: static HTML/CSS/JS pages
- Backend: Vercel Serverless Functions (`/api`)
- Database: PostgreSQL (`pg`)
- Admin auth: JWT + hashed passwords (`bcryptjs`)

## Build & deploy

- **Production build** (`vercel build` / Vercel dashboard): runs `npm run build` → checks required files, auto-detects framework entrypoint, validates `vercel.json` route safety, runs `npm test` (see `scripts/build.cjs`).
- **Local:** `npm test` or `npm run build`

### Почему был site-wide 404 на Vercel

1. **Неполная папка `.vercel/output` (Build Output API)** без корректного `config.json` — не использовать; сборка **не** генерирует `.vercel/output`.
2. **Root Directory** в настройках проекта Vercel не должен указывать на `public/` — корень репозитория должен содержать `index.html`, остальные `*.html`, `vercel.json`, `api/`.
3. **Домен** должен быть привязан к **этому** проекту и актуальному **Production** deployment.

Analytics are custom: `analytics.js` → `POST /api/analytics` (not the Next.js `@vercel/analytics` package).

### Logo & favicon

- **In repo:** `public/logo.svg` (header, default `siteLogo`), `public/favicon.svg` (tab icon). Linked from all HTML pages and `site.webmanifest`.
- **Optional PNG set** (16–512 px, Apple touch, Android): install devDependencies (`npm install`), run `npm run icons` — uses `sharp` to rasterize the SVGs into `public/*.png`. Commit those files if you need legacy PNG-only clients or richer Open Graph images (many social crawlers prefer PNG/JPEG ~1200×630).

### Vercel “404 NOT_FOUND” after deploy (build cache)

If logs show `404: NOT_FOUND` with an id like `fra1::…` while **uploading the build cache**, that is a **Vercel platform/storage glitch**, not an application bug. The deployment can still succeed; redeploy or contact Vercel support if it repeats.

### Site returns 404 on `/` or `/about` etc.

1. **Vercel → Project → Settings → General → Root Directory** must be **empty** (repository root), not `public`.  
   `index.html` and all `*.html` pages live next to `api/` and `vercel.json`; if Root Directory is only `public`, the server never sees `index.html` → 404.
2. **`vercel.json`** intentionally stays minimal (`cleanUrls`, `trailingSlash`) and avoids catch-all rewrites that can shadow `/` or `/api`.
3. After changing settings, trigger a **new Production deploy**.

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
