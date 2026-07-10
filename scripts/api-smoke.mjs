import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path) {
  const fullPath = resolve(path);
  const content = readFileSync(fullPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=").trim().replace(/^"|"$/g, "");
    process.env[key.trim()] ||= value;
  }
}

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

async function invoke(handler, req) {
  const res = createResponse();
  await handler(req, res);
  if (res.statusCode >= 400) {
    throw new Error(`${res.statusCode}: ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

loadEnvFile("backend/.env");

const [{ default: contact }, { default: login }, { default: messages }, { default: stats }, { default: read }, { default: remove }] =
  await Promise.all([
    import("../api/contact.js"),
    import("../api/admin/login.js"),
    import("../api/admin/messages/index.js"),
    import("../api/admin/stats.js"),
    import("../api/admin/messages/[id]/read.js"),
    import("../api/admin/messages/[id].js"),
  ]);

const email = `api-smoke-${Date.now()}@example.com`;

const created = await invoke(contact, {
  method: "POST",
  body: {
    name: "API Smoke",
    email,
    product: "Invy ERP",
    message: "Vercel function smoke test",
    company: "Invy",
  },
  headers: {},
});

const auth = await invoke(login, {
  method: "POST",
  body: {
    email: process.env.ADMIN_EMAIL || "admin@invy.app",
    password: process.env.ADMIN_PASSWORD || "InvyAdmin2025!",
  },
  headers: {},
});

const headers = { authorization: `Bearer ${auth.access_token}` };
const listed = await invoke(messages, { method: "GET", headers });
const statData = await invoke(stats, { method: "GET", headers });
await invoke(read, { method: "PATCH", headers, query: { id: created.id } });
await invoke(remove, { method: "DELETE", headers, query: { id: created.id } });

console.log(
  JSON.stringify(
    {
      created: created.id,
      listed: listed.some((message) => message.id === created.id),
      total: statData.total,
      deleted: true,
    },
    null,
    2,
  ),
);
