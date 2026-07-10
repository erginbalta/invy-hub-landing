import { methodNotAllowed, query, requireAdmin, sendJson, serverError } from "../_lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res);

  try {
    const { error } = await requireAdmin(req);
    if (error) return sendJson(res, 401, { detail: error });
    const result = await query("select product, read from public.contact_messages");
    const messages = result.rows;
    return sendJson(res, 200, {
      total: messages.length,
      unread: messages.filter((message) => !message.read).length,
      read: messages.filter((message) => message.read).length,
      erp: messages.filter((message) => message.product === "Invy ERP").length,
      cafe: messages.filter((message) => message.product === "Invy Cafe").length,
    });
  } catch (err) {
    return serverError(res, err);
  }
}
