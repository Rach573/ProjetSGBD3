# SnowDispatcher

Electron + Vue (Vite) app for mail dispatching and task management.

## Prerequisites
- Node.js 20+
- npm 10+
- MySQL reachable at the URL you configure

## Setup
1) Install deps
```
npm install
```
2) Create your env file
```
cp .env.example .env
# edit .env and fill DATABASE_URL and Gmail keys
```
3) Database
- If you have `schema.sql`, import it into MySQL (ex: `mysql -u user -p db < schema.sql`).
- Otherwise, ensure you have an empty `snowdispatcher` database (or adjust `DATABASE_URL`).

## Run
- Dev (vite + electron):
```
npm run dev
```
- Prod-ish local (build renderer then forge):
```
npm run start:prod
```

## Important env vars
- `DATABASE_URL` (format `mysql://USER:PASSWORD@HOST:PORT/DATABASE`)
- `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_REDIRECT_URI`
- Optional: `GMAIL_USER_EMAIL`, `GMAIL_LABEL_ID`, `GMAIL_QUERY`, `GMAIL_MAX_RESULTS`

## Useful scripts
- `npm run prisma:generate` / `npm run prisma:push` (if you use Prisma)
- `npm run seed:mail` to load sample data (if the script exists)
- `npm run lint`

## Notes
- Do not commit `.env` (already ignored). Keep secrets local or in CI secrets.
- In packaged/production mode, the renderer loads `dist/index.html`; run `npm run build:renderer` before `npm run start:prod` if needed.
