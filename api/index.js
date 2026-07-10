import { methodNotAllowed, sendJson } from "./_lib/db.js";

export default function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res);
  return sendJson(res, 200, { message: "Invy API" });
}
