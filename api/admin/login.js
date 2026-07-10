import bcrypt from "bcryptjs";
import { createToken, methodNotAllowed, query, seedAdmin, sendJson, serverError } from "../_lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res);

  try {
    await seedAdmin();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const result = await query("select * from public.admin_users where email = $1 limit 1", [email]);
    const admin = result.rows[0];

    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return sendJson(res, 401, { detail: "incorrect_email_or_password" });
    }

    return sendJson(res, 200, {
      access_token: createToken(admin),
      token_type: "bearer",
    });
  } catch (error) {
    return serverError(res, error);
  }
}
