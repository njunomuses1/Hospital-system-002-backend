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
- Select the `/backend` as the service root (or keep default if repository root is the service)
- Railway auto-detects Node and runs `npm install` and `npm start`
- Ensure environment variables are set in Railway → Variables:
  - `NODE_ENV=production`
  - `ALLOWED_ORIGINS=https://your-frontend-domain` (and any others, comma-separated)
  - `JWT_SECRET` set to a secure value

No Dockerfile required; Railway Nixpacks will detect the `start` script. The service will listen on `PORT` provided by Railway.








