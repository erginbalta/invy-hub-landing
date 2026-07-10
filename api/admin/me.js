import { methodNotAllowed, requireAdmin, sendJson, serverError } from "../_lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res);

  try {
    const { admin, error } = await requireAdmin(req);
    if (error) return sendJson(res, 401, { detail: error });
    return sendJson(res, 200, { id: admin.id, email: admin.email });
  } catch (err) {
    return serverError(res, err);
  }
}
