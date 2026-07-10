create extension if not exists pgcrypto;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  product text not null check (product in ('Invy ERP', 'Invy Cafe')),
  message text not null,
  company text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create index if not exists contact_messages_read_idx
  on public.contact_messages (read);

-- The FastAPI backend connects directly with DATABASE_URL.
-- Do not expose the database URL in frontend code.
