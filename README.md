# Hospital System Backend (Express)

## Quick start

1. Create environment variables (Railway sets `PORT` automatically):

```
# .env (place alongside package.json)
NODE_ENV=development
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173
JWT_SECRET=change_me
```

2. Install and run locally:

```
npm install
npm run dev
```

API base: `http://localhost:${PORT}/v1`

- GET `/health` — service status
- GET `/v1` — API metadata
- Auth: `POST /v1/auth/login`, `POST /v1/auth/register`
- Patients: `GET/POST/PUT/DELETE /v1/patients`
- Doctors: `GET/POST /v1/doctors`
- Appointments: `GET/POST /v1/appointments`

Note: Data is in-memory for demo purposes.

## Deploy to Railway

- Push this repo to GitHub
- In Railway, create a New Project → Deploy from Repo
- Select the repository and choose the `backend/` folder as the service root (if you keep a mono-repo)
- Railway will detect Node.js and run `npm install` and `npm start` by default

Set the following environment variables in Railway (Environment → Variables):

- `NODE_ENV=production`
- `PORT` (Railway provides this automatically; you don't need to set it)
- `DATABASE_URL` — the full connection string (recommended), e.g. `mysql://user:pass@host:port/db`
- OR the explicit DB variables: `DB_CLIENT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
- Optional: `DATABASE_SSL=true` if your DB requires SSL connections
- `ALLOWED_ORIGINS` — comma-separated list of allowed origins for CORS (frontend URL)
- `JWT_SECRET` — a long random secret used to sign JWTs

Notes and tips:

- The code no longer overrides platform environment variables with a local `.env` file during production, so Railway-provided env vars will be respected.
- If the database is temporarily unreachable the code will retry a few times; if it still fails the app falls back to a local SQLite file so the service remains reachable for testing. For production you may prefer the service to fail-fast instead of falling back to SQLite.
- If your Railway MySQL requires SSL, set `DATABASE_SSL=true` in Railway variables; the app will pass an SSL option to the MySQL client.
- If you need to run migrations instead of `sync({ alter: true })`, consider replacing `syncDatabase` with Sequelize migrations for production-safe schema changes.

No Dockerfile required; Railway Nixpacks will detect the `start` script. The service will listen on the `PORT` provided by Railway.








