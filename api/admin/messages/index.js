import { methodNotAllowed, normalizeRow, query, requireAdmin, sendJson, serverError } from "../../_lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res);

  try {
    const { error } = await requireAdmin(req);
    if (error) return sendJson(res, 401, { detail: error });
    const result = await query("select * from public.contact_messages order by created_at desc");
    return sendJson(res, 200, result.rows.map(normalizeRow));
  } catch (err) {
    return serverError(res, err);
  }
}
