import { methodNotAllowed, normalizeRow, query, sendJson, serverError } from "./_lib/db.js";

const validProducts = new Set(["Invy ERP", "Invy Cafe"]);

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res);

  try {
    const { name, email, product, message, company } = req.body || {};
    if (!name || !email || !message || !validProducts.has(product)) {
      return sendJson(res, 422, { detail: "invalid_contact_payload" });
    }

    const result = await query(
      `
      insert into public.contact_messages (name, email, product, message, company)
      values ($1, $2, $3, $4, $5)
      returning *
      `,
      [
        String(name).trim(),
        String(email).trim().toLowerCase(),
        product,
        String(message).trim(),
        company ? String(company).trim() : null,
      ],
    );
    return sendJson(res, 200, normalizeRow(result.rows[0]));
  } catch (error) {
    return serverError(res, error);
  }
}
