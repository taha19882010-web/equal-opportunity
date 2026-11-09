# تكافؤ الفرص — React + Node.js (Vercel)

- **Frontend:** React 18 + Vite (`src/`)
- **Backend:** Vercel Serverless Functions on Node.js (`api/`)
- **Database:** Postgres (Neon) — tables are created automatically on first request
- **Auth:** shared passwords (admin = full access, viewer = read only) with a signed HttpOnly cookie

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. On vercel.com: **Add New → Project → import the repo**. Vercel detects Vite automatically.
3. In the project: **Storage → Create Database → Neon (Postgres)** and connect it to the project.
   This adds `DATABASE_URL` for you.
4. In **Settings → Environment Variables** add:
   | Name | Value |
   |---|---|
   | `ADMIN_PASSWORD` | a strong password (add / edit / delete / import) |
   | `VIEWER_PASSWORD` | optional, read-only password |
   | `SESSION_SECRET` | a long random string, e.g. output of `openssl rand -hex 32` |
5. **Redeploy** so the variables take effect. Open the URL and sign in.

## Run locally

```bash
npm install
npm i -g vercel
vercel link
vercel env pull .env.local
vercel dev          # serves the React app and the /api functions together
```

`npm run dev` alone starts only the front end (no API, so login will fail).

## API

| Route | Methods | Access |
|---|---|---|
| `/api/session` | GET (who am I), POST (login), DELETE (logout) | public |
| `/api/employees` | GET, POST `{employees:[…]}` (upsert), DELETE `?id=` | read: any role · write: admin |
| `/api/services` | GET, POST `{service}`, DELETE `?id=` | read: any role · write: admin |
| `/api/settings` | GET `?key=logo`, PUT `{key,value}` | read: any role · write: admin |

## Notes

- Employee records contain national IDs and disability information. Use strong passwords,
  limit who gets them, and follow your organisation's data-protection rules.
- Login has a small delay on wrong passwords but no full rate limiting; add Vercel's
  firewall / rate-limit rules if the site is public.
- The Excel template is `public/employee-template.xlsx` (first sheet = data, headers must not change).
