import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";

const { Pool } = pg;

let pool;
let schemaReady;

function env(name, fallback = "") {
  return (process.env[name] || fallback).trim();
}

function databaseUrl() {
  const raw = env("DATABASE_URL");
  if (!raw) {
    throw new Error("DATABASE_URL is required");
  }

  const url = new URL(raw);
  url.searchParams.delete("pgbouncer");
  return url.toString();
}

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl(),
      max: 3,
      idleTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function query(text, params = []) {
  await ensureSchema();
  return getPool().query(text, params);
}

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const client = await getPool().connect();
      try {
        await client.query("create extension if not exists pgcrypto");
        await client.query(`
          create table if not exists public.contact_messages (
            id uuid primary key default gen_random_uuid(),
            name text not null,
            email text not null,
            product text not null check (product in ('Invy ERP', 'Invy Cafe')),
            message text not null,
            company text,
            read boolean not null default false,
            created_at timestamptz not null default now()
          )
        `);
        await client.query(`
          create table if not exists public.admin_users (
            id uuid primary key default gen_random_uuid(),
            email text unique not null,
            password_hash text not null,
            created_at timestamptz not null default now(),
            updated_at timestamptz not null default now()
          )
        `);
        await client.query(`
          create index if not exists contact_messages_created_at_idx
          on public.contact_messages (created_at desc)
        `);
        await client.query(`
          create index if not exists contact_messages_read_idx
          on public.contact_messages (read)
        `);
      } finally {
        client.release();
      }
    })();
  }
  return schemaReady;
}

export async function seedAdmin() {
  await ensureSchema();
  const email = env("ADMIN_EMAIL", "admin@invy.app").toLowerCase();
  const password = env("ADMIN_PASSWORD", "InvyAdmin2025!");
  const existing = await getPool().query("select * from public.admin_users where email = $1 limit 1", [email]);
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing.rows.length === 0) {
    await getPool().query(
      "insert into public.admin_users (email, password_hash) values ($1, $2)",
      [email, passwordHash],
    );
    return;
  }

  const matches = await bcrypt.compare(password, existing.rows[0].password_hash);
  if (!matches) {
    await getPool().query(
      "update public.admin_users set password_hash = $1, updated_at = now() where id = $2",
      [passwordHash, existing.rows[0].id],
    );
  }
}

export function normalizeRow(row) {
  if (!row) return null;
  return {
    ...row,
    id: String(row.id),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

export function createToken(admin) {
  const secret = env("JWT_SECRET");
  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }
  return jwt.sign(
    {
      sub: String(admin.id),
      email: admin.email,
      type: "access",
    },
    secret,
    { expiresIn: "7d" },
  );
}

export async function requireAdmin(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return { error: "not_authenticated" };
  }

  try {
    const payload = jwt.verify(auth.replace("Bearer ", "").trim(), env("JWT_SECRET"));
    if (payload.type !== "access") {
      return { error: "invalid_token" };
    }
    const result = await query("select * from public.admin_users where email = $1 limit 1", [payload.email || ""]);
    if (result.rows.length === 0) {
      return { error: "admin_not_found" };
    }
    return { admin: normalizeRow(result.rows[0]) };
  } catch {
    return { error: "invalid_token" };
  }
}

export function sendJson(res, status, body) {
  res.status(status).json(body);
}

export function methodNotAllowed(res) {
  sendJson(res, 405, { detail: "method_not_allowed" });
}

export function serverError(res, error) {
  sendJson(res, 500, { detail: error.message || "server_error" });
}
