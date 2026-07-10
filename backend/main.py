import os
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from typing import Any, Literal, Optional
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import bcrypt
import jwt
import psycopg
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from psycopg.rows import dict_row
from pydantic import BaseModel, EmailStr, Field

load_dotenv()

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 60 * 24 * 7


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip().strip('"')


def get_jwt_secret() -> str:
    secret = env("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET is required")
    return secret


def get_database_url() -> str:
    database_url = env("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required")

    parts = urlsplit(database_url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query.pop("pgbouncer", None)
    if parts.hostname and "supabase.com" in parts.hostname and "sslmode" not in query:
        query["sslmode"] = "require"
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(admin_id: str, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": admin_id,
        "email": email,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_MINUTES),
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def normalize_record(record: Optional[dict[str, Any]]) -> Optional[dict[str, Any]]:
    if record is None:
        return None
    normalized = dict(record)
    if "id" in normalized:
        normalized["id"] = str(normalized["id"])
    if isinstance(normalized.get("created_at"), datetime):
        normalized["created_at"] = normalized["created_at"].isoformat()
    if isinstance(normalized.get("updated_at"), datetime):
        normalized["updated_at"] = normalized["updated_at"].isoformat()
    return normalized


class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    product: Literal["Invy ERP", "Invy Cafe"]
    message: str = Field(min_length=1, max_length=4000)
    company: Optional[str] = Field(default=None, max_length=160)


class ContactMessage(BaseModel):
    id: str
    name: str
    email: EmailStr
    product: str
    message: str
    company: Optional[str] = None
    read: bool
    created_at: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Database:
    @contextmanager
    def connect(self):
        with psycopg.connect(get_database_url(), row_factory=dict_row) as connection:
            yield connection

    def ensure_schema(self) -> None:
        with self.connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("create extension if not exists pgcrypto")
                cursor.execute(
                    """
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
                    """
                )
                cursor.execute(
                    """
                    create table if not exists public.admin_users (
                      id uuid primary key default gen_random_uuid(),
                      email text unique not null,
                      password_hash text not null,
                      created_at timestamptz not null default now(),
                      updated_at timestamptz not null default now()
                    )
                    """
                )
                cursor.execute(
                    """
                    create index if not exists contact_messages_created_at_idx
                    on public.contact_messages (created_at desc)
                    """
                )
                cursor.execute(
                    """
                    create index if not exists contact_messages_read_idx
                    on public.contact_messages (read)
                    """
                )
            connection.commit()

    def select_admin_by_email(self, email: str) -> Optional[dict[str, Any]]:
        with self.connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("select * from public.admin_users where email = %s limit 1", (email,))
                return normalize_record(cursor.fetchone())

    def insert_admin(self, email: str, password_hash: str) -> dict[str, Any]:
        with self.connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    insert into public.admin_users (email, password_hash)
                    values (%s, %s)
                    returning *
                    """,
                    (email, password_hash),
                )
                row = cursor.fetchone()
            connection.commit()
            return normalize_record(row)

    def update_admin_password(self, admin_id: str, password_hash: str) -> dict[str, Any]:
        with self.connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    update public.admin_users
                    set password_hash = %s, updated_at = now()
                    where id = %s
                    returning *
                    """,
                    (password_hash, admin_id),
                )
                row = cursor.fetchone()
            connection.commit()
            return normalize_record(row)

    def insert_message(self, payload: ContactCreate) -> dict[str, Any]:
        with self.connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    insert into public.contact_messages (name, email, product, message, company)
                    values (%s, %s, %s, %s, %s)
                    returning *
                    """,
                    (
                        payload.name.strip(),
                        payload.email.lower(),
                        payload.product,
                        payload.message.strip(),
                        payload.company.strip() if payload.company else None,
                    ),
                )
                row = cursor.fetchone()
            connection.commit()
            return normalize_record(row)

    def list_messages(self) -> list[dict[str, Any]]:
        with self.connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("select * from public.contact_messages order by created_at desc")
                return [normalize_record(row) for row in cursor.fetchall()]

    def select_message(self, message_id: str) -> Optional[dict[str, Any]]:
        with self.connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("select * from public.contact_messages where id = %s limit 1", (message_id,))
                return normalize_record(cursor.fetchone())

    def toggle_message_read(self, message_id: str, next_read: bool) -> Optional[dict[str, Any]]:
        with self.connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    update public.contact_messages
                    set read = %s
                    where id = %s
                    returning *
                    """,
                    (next_read, message_id),
                )
                row = cursor.fetchone()
            connection.commit()
            return normalize_record(row)

    def delete_message(self, message_id: str) -> bool:
        with self.connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("delete from public.contact_messages where id = %s returning id", (message_id,))
                deleted = cursor.fetchone()
            connection.commit()
            return deleted is not None


db = Database()
api_router = APIRouter()


def get_current_admin(request: Request) -> dict[str, Any]:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = auth.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired") from None
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token") from None

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    admin = db.select_admin_by_email(payload.get("email", ""))
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return admin


@api_router.get("/")
def root() -> dict[str, str]:
    return {"message": "Invy API"}


@api_router.post("/contact", response_model=ContactMessage)
def create_contact(payload: ContactCreate) -> dict[str, Any]:
    return db.insert_message(payload)


@api_router.post("/admin/login")
def admin_login(payload: LoginRequest) -> dict[str, str]:
    email = payload.email.lower().strip()
    admin = db.select_admin_by_email(email)
    if not admin or not verify_password(payload.password, admin.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {
        "access_token": create_access_token(str(admin["id"]), email),
        "token_type": "bearer",
    }


@api_router.get("/admin/me")
def admin_me(admin: dict[str, Any] = Depends(get_current_admin)) -> dict[str, str]:
    return {"id": str(admin["id"]), "email": admin["email"]}


@api_router.get("/admin/messages", response_model=list[ContactMessage])
def list_messages(admin: dict[str, Any] = Depends(get_current_admin)) -> list[dict[str, Any]]:
    return db.list_messages()


@api_router.get("/admin/stats")
def message_stats(admin: dict[str, Any] = Depends(get_current_admin)) -> dict[str, int]:
    messages = db.list_messages()
    return {
        "total": len(messages),
        "unread": sum(1 for message in messages if not message.get("read")),
        "read": sum(1 for message in messages if message.get("read")),
        "erp": sum(1 for message in messages if message.get("product") == "Invy ERP"),
        "cafe": sum(1 for message in messages if message.get("product") == "Invy Cafe"),
    }


@api_router.patch("/admin/messages/{message_id}/read", response_model=ContactMessage)
def toggle_read(message_id: str, admin: dict[str, Any] = Depends(get_current_admin)) -> dict[str, Any]:
    existing = db.select_message(message_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Message not found")
    updated = db.toggle_message_read(message_id, not bool(existing.get("read")))
    if not updated:
        raise HTTPException(status_code=404, detail="Message not found")
    return updated


@api_router.delete("/admin/messages/{message_id}")
def delete_message(message_id: str, admin: dict[str, Any] = Depends(get_current_admin)) -> dict[str, bool]:
    deleted = db.delete_message(message_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"deleted": True}


app = FastAPI(title="Invy API")

cors_origins = [item.strip() for item in env("CORS_ORIGINS", "*").split(",") if item.strip()]
allow_credentials = "*" not in cors_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins or ["*"],
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Vercel Services strips /api before forwarding; direct local uvicorn keeps it.
app.include_router(api_router)
app.include_router(api_router, prefix="/api")


@app.on_event("startup")
def on_startup() -> None:
    db.ensure_schema()
    admin_email = env("ADMIN_EMAIL", "admin@invy.app").lower()
    admin_password = env("ADMIN_PASSWORD", "InvyAdmin2025!")
    existing = db.select_admin_by_email(admin_email)
    password_hash = hash_password(admin_password)

    if not existing:
        db.insert_admin(admin_email, password_hash)
        return

    if not verify_password(admin_password, existing.get("password_hash", "")):
        db.update_admin_password(str(existing["id"]), password_hash)
