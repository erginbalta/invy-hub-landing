# Invy Hub Landing

React/Vite landing page with a Vercel Node Functions API for the contact form and admin panel. Data is stored in Supabase Postgres through `DATABASE_URL`.

## Local Setup

1. Install dependencies:

```bash
npm install
npm --prefix frontend install
```

2. Copy env files:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

3. Fill `backend/.env` for local smoke tests:

```env
DATABASE_URL="postgresql://postgres.project-ref:password@host:6543/postgres?pgbouncer=true"
JWT_SECRET="use-a-long-random-secret"
ADMIN_EMAIL="admin@invy.app"
ADMIN_PASSWORD="change-this-password"
```

4. Start the frontend:

```bash
npm run frontend:dev
```

Frontend: `http://localhost:5173`

Admin panel: `http://localhost:5173/urs-admin`

For full local Vercel routing, run `npx vercel dev` from the project root.

## Checks

```bash
npm run build
npm run api:smoke
```

`api:smoke` loads `backend/.env`, writes a temporary contact message, logs in as admin, reads stats/messages, toggles read status, and deletes the temporary message.

## Vercel Deployment

The root `vercel.json` deploys:

- `frontend/dist` as the static site
- `api/**` as Node.js Vercel Functions
- `/urs-admin` and `/urs-admin/*` as frontend routes
- `/api/*` as serverless API routes

Add these Vercel environment variables:

```env
DATABASE_URL
JWT_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
```

The API creates the required tables on first use. You can also run `supabase/schema.sql` manually in Supabase SQL Editor if you want to provision schema yourself.

## API Contract

- `GET /api/`
- `POST /api/contact`
- `POST /api/admin/login`
- `GET /api/admin/me`
- `GET /api/admin/messages`
- `GET /api/admin/stats`
- `PATCH /api/admin/messages/{id}/read`
- `DELETE /api/admin/messages/{id}`

The frontend never talks to Supabase directly. Database credentials must only exist in local env files and Vercel environment variables.
