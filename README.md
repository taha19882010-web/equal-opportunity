# تكافؤ الفرص — React + Node.js (Vercel)

- **Frontend:** React 18 + Vite (`src/`)
- **Backend:** Vercel Serverless Functions on Node.js (`api/`)
- **Database:** Postgres (Neon) — tables are created automatically on first request
- **Auth:** user accounts (username + password, scrypt-hashed) with roles — admin / editor / viewer / pending — and a signed HttpOnly cookie

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. On vercel.com: **Add New → Project → import the repo**. Vercel detects Vite automatically.
3. In the project: **Storage → Create Database → Neon (Postgres)** and connect it to the project.
   This adds `DATABASE_URL` for you.
4. In **Settings → Environment Variables** add:
   | Name | Value |
   |---|---|
   | `ADMIN_PASSWORD` | password of the first admin account (used once, on first start) |
   | `ADMIN_USERNAME` | optional, username of that first admin (default `admin`) |
   | `ALLOW_SIGNUP` | optional, `false` closes self-registration (default `true`) |
   | `SESSION_SECRET` | a long random string, e.g. output of `openssl rand -hex 32` |
5. **Redeploy** so the variables take effect. Open the URL and sign in as the admin. New sign-ups stay *pending* until an admin activates them in the **المستخدمون** tab.

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
| `/api/session` | GET (who am I), POST `{username,password}` (login), DELETE (logout) | public |
| `/api/register` | GET (is signup open), POST `{username,fullName,password}` | public |
| `/api/account` | POST `{oldPassword,newPassword}` | any active user |
| `/api/users` | GET, PATCH `{id,role?,password?}`, DELETE `?id=` | admin |
| `/api/employees` | GET, POST `{employees:[…]}` (upsert), DELETE `?id=` | read: any active role · write: admin / editor |
| `/api/services` | GET, POST `{service}`, DELETE `?id=` | read: any active role · write: admin / editor |
| `/api/settings` | GET `?key=logo`, PUT `{key,value}` | read: any active role · write: admin / editor |

## Notes

- Employee records contain national IDs and disability information. Use strong passwords,
  limit who gets them, and follow your organisation's data-protection rules.
- Login has a small delay on wrong passwords but no full rate limiting; add Vercel's
  firewall / rate-limit rules if the site is public.
- The Excel template is `public/employee-template.xlsx` (first sheet = data, headers must not change).
