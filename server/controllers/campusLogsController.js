const { pool } = require("../db");

function toInitials(fullName) {
  if (!fullName) return "U";
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

async function getCampusLogs(req, res) {
  const statusFilter = req.query.status;
  const allowedStatuses = new Set(["IN", "OUT"]);

  if (statusFilter && !allowedStatuses.has(statusFilter)) {
    return res.status(400).json({ message: "status must be IN or OUT" });
  }

  try {
    let query = `
      SELECT
        l.id,
        l.user_id,
        l.status,
        l.log_time,
        u.full_name,
        u.avatar_url
      FROM campus_logs l
      INNER JOIN users u ON u.id = l.user_id
    `;
    const params = [];

    if (statusFilter) {
      query += " WHERE l.status = ?";
      params.push(statusFilter);
    }

    query += " ORDER BY l.log_time DESC, l.id DESC";

    const [rows] = await pool.query(query, params);

    return res.json(
      rows.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        status: row.status,
        log_time: row.log_time,
        student_name: row.full_name,
        profile_image: row.avatar_url,
        profile_placeholder: toInitials(row.full_name),
      })),
    );
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch campus logs",
      error: error?.message ?? String(error),
    });
  }
}

async function createCampusLog(req, res) {
  const { user_id, status, log_time } = req.body;
  const allowedStatuses = new Set(["IN", "OUT"]);

  if (!user_id || !status || !log_time) {
    return res.status(400).json({ message: "user_id, status and log_time are required" });
  }
  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ message: "status must be IN or OUT" });
  }

  try {
    const [result] = await pool.query(
      `
      INSERT INTO campus_logs (user_id, status, log_time)
      VALUES (?, ?, ?)
      `,
      [user_id, status, log_time],
    );

    const [[created]] = await pool.query(
      `
      SELECT
        l.id,
        l.user_id,
        l.status,
        l.log_time,
        u.full_name,
        u.avatar_url
      FROM campus_logs l
      INNER JOIN users u ON u.id = l.user_id
      WHERE l.id = ?
      LIMIT 1
      `,
      [result.insertId],
    );

    return res.status(201).json({
      id: created.id,
      user_id: created.user_id,
      status: created.status,
      log_time: created.log_time,
      student_name: created.full_name,
      profile_image: created.avatar_url,
      profile_placeholder: toInitials(created.full_name),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create campus log",
      error: error?.message ?? String(error),
    });
  }
}

module.exports = {
  getCampusLogs,
  createCampusLog,
};
