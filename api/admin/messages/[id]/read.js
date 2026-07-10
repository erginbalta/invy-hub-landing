import { methodNotAllowed, normalizeRow, query, requireAdmin, sendJson, serverError } from "../../../_lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "PATCH") return methodNotAllowed(res);

  try {
    const { error } = await requireAdmin(req);
    if (error) return sendJson(res, 401, { detail: error });

    const existing = await query("select read from public.contact_messages where id = $1 limit 1", [req.query.id]);
    if (existing.rows.length === 0) {
      return sendJson(res, 404, { detail: "message_not_found" });
    }

    const updated = await query(
      "update public.contact_messages set read = $1 where id = $2 returning *",
      [!existing.rows[0].read, req.query.id],
    );
    return sendJson(res, 200, normalizeRow(updated.rows[0]));
  } catch (err) {
    return serverError(res, err);
  }
}
