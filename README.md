# Invy Hub Landing

React/Vite landing page plus a FastAPI admin/contact API. Data is stored in Supabase Postgres and the project is structured for Vercel Services.

## Local Setup

1. Copy env files:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

2. Fill `backend/.env`:

```env
DATABASE_URL="postgresql://postgres.project-ref:password@host:6543/postgres?pgbouncer=true"
JWT_SECRET="use-a-long-random-secret"
ADMIN_EMAIL="admin@invy.app"
ADMIN_PASSWORD="change-this-password"
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
```

3. Start the backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

4. Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

Admin panel: `http://localhost:5173/urs-admin`

API health: `http://localhost:8000/api/`

## Vercel Deployment

The root `vercel.json` uses Vercel Services:

- `frontend` is served at `/`
- `backend/main.py` is served at `/api`

In Vercel Project Settings, set Framework Preset to `Services`.

Add these Vercel environment variables:

```env
DATABASE_URL
JWT_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
CORS_ORIGINS
```

Use the production domain in `CORS_ORIGINS` after the first deploy. The backend creates the required tables on startup. You can also run `supabase/schema.sql` manually in Supabase SQL Editor if you want to provision schema yourself.

## API Contract

- `GET /api/`
- `POST /api/contact`
- `POST /api/admin/login`
- `GET /api/admin/me`
- `GET /api/admin/messages`
- `GET /api/admin/stats`
- `PATCH /api/admin/messages/{id}/read`
- `DELETE /api/admin/messages/{id}`

The frontend never talks to Supabase directly. Database credentials must only exist in backend and Vercel environment variables.
