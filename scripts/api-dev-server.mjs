import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "node:url";

function loadEnvFile(path) {
  try {
    const content = readFileSync(resolve(path), "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...rest] = trimmed.split("=");
      process.env[key.trim()] ||= rest.join("=").trim().replace(/^"|"$/g, "");
    }
  } catch {
    // Env file is optional for production-like shells.
  }
}

loadEnvFile(".env.local");
loadEnvFile("backend/.env");

const handlers = {
  "GET /api": () => import("../api/index.js"),
  "POST /api/contact": () => import("../api/contact.js"),
  "POST /api/admin/login": () => import("../api/admin/login.js"),
  "GET /api/admin/me": () => import("../api/admin/me.js"),
  "GET /api/admin/messages": () => import("../api/admin/messages/index.js"),
  "GET /api/admin/stats": () => import("../api/admin/stats.js"),
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify(body));
}

function createVercelResponse(res) {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      sendJson(res, this.statusCode, body);
      return this;
    },
  };
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function resolveHandler(method, pathname) {
  const direct = handlers[`${method} ${pathname}`];
  if (direct) return { load: direct, query: {} };

  const readMatch = pathname.match(/^\/api\/admin\/messages\/([^/]+)\/read$/);
  if (method === "PATCH" && readMatch) {
    return { load: () => import("../api/admin/messages/[id]/read.js"), query: { id: readMatch[1] } };
  }

  const deleteMatch = pathname.match(/^\/api\/admin\/messages\/([^/]+)$/);
  if (method === "DELETE" && deleteMatch) {
    return { load: () => import("../api/admin/messages/[id].js"), query: { id: deleteMatch[1] } };
  }

  return null;
}

const port = Number(process.env.API_DEV_PORT || 3000);

createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    return sendJson(res, 204, {});
  }

  const { pathname, query } = parse(req.url, true);
  const match = resolveHandler(req.method, pathname);
  if (!match) {
    return sendJson(res, 404, { detail: "not_found" });
  }

  try {
    const { default: handler } = await match.load();
    await handler(
      {
        method: req.method,
        headers: req.headers,
        query: { ...query, ...match.query },
        body: await readBody(req),
      },
      createVercelResponse(res),
    );
  } catch (error) {
    return sendJson(res, 500, { detail: error.message || "server_error" });
  }
}).listen(port, () => {
  console.log(`Invy API dev server running on http://localhost:${port}`);
});
