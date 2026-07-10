import { methodNotAllowed, query, requireAdmin, sendJson, serverError } from "../../_lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "DELETE") return methodNotAllowed(res);

  try {
    const { error } = await requireAdmin(req);
    if (error) return sendJson(res, 401, { detail: error });
    const result = await query("delete from public.contact_messages where id = $1 returning id", [req.query.id]);
    if (result.rows.length === 0) {
      return sendJson(res, 404, { detail: "message_not_found" });
    }
    return sendJson(res, 200, { deleted: true });
  } catch (err) {
    return serverError(res, err);
  }
}
