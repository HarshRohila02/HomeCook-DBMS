const { pool } = require("../db");

async function resolveRoleFromRequest(req) {
  const explicitRole = req.body?.role || req.query?.role;
  if (explicitRole) {
    return String(explicitRole).toLowerCase();
  }

  const rawUserId =
    req.body?.user_id ??
    req.body?.created_by_user_id ??
    req.query?.user_id ??
    req.query?.created_by_user_id ??
    req.params?.user_id;
  const userId = Number(rawUserId);
  if (!Number.isInteger(userId) || userId <= 0) return null;

  const [[user]] = await pool.query(
    "SELECT role FROM users WHERE id = ? LIMIT 1",
    [userId],
  );

  return user?.role ? String(user.role).toLowerCase() : null;
}

async function requireHost(req, res, next) {
  try {
    const role = await resolveRoleFromRequest(req);
    if (role !== "host") {
      return res.status(403).json({ message: "Host access required" });
    }
    return next();
  } catch (error) {
    return res.status(500).json({
      message: "Failed to validate role",
      error: error?.message ?? String(error),
    });
  }
}

module.exports = {
  requireHost,
  resolveRoleFromRequest,
};
