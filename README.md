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

You can use `.env.example` as reference.

## Admin URLs

- Login: `/admin-login.html`
- Dashboard: `/admin.html`

## Notes

- Content is stored in DB and shared across all devices.
- First project in admin list is featured automatically on homepage.
