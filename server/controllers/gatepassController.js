const { pool } = require("../db");

async function getGatepasses(req, res) {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        id,
        user_id,
        gatepass_code,
        reason,
        destination,
        out_date AS date,
        time_out,
        expected_return_time,
        status
      FROM gatepasses
      ORDER BY created_at DESC, id DESC
      `,
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch gatepasses",
      error: error?.message ?? String(error),
    });
  }
}

async function getGatepassById(req, res) {
  const gatepassId = Number(req.params.id);
  if (!Number.isInteger(gatepassId) || gatepassId <= 0) {
    return res.status(400).json({ message: "Invalid gatepass id" });
  }

  try {
    const [[row]] = await pool.query(
      `
      SELECT
        id,
        user_id,
        gatepass_code,
        reason,
        destination,
        out_date AS date,
        time_out,
        expected_return_time,
        status
      FROM gatepasses
      WHERE id = ?
      LIMIT 1
      `,
      [gatepassId],
    );

    if (!row) {
      return res.status(404).json({ message: "Gatepass not found" });
    }

    return res.json(row);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch gatepass",
      error: error?.message ?? String(error),
    });
  }
}

async function createGatepass(req, res) {
  const {
    user_id,
    reason,
    destination,
    date,
    time_out,
    expected_return_time,
    status,
  } = req.body;

  if (
    !user_id ||
    !reason?.trim() ||
    !destination?.trim() ||
    !date ||
    !time_out ||
    !expected_return_time
  ) {
    return res.status(400).json({
      message:
        "user_id, reason, destination, date, time_out and expected_return_time are required",
    });
  }

  const requestedStatus = status?.trim() || "pending";
  const finalStatus = requestedStatus.toLowerCase();
  const gatepassCode = `GP-${Date.now()}`;

  try {
    const [result] = await pool.query(
      `
      INSERT INTO gatepasses
      (
        user_id,
        gatepass_code,
        reason,
        destination,
        out_date,
        time_out,
        expected_return_time,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        user_id,
        gatepassCode,
        reason.trim(),
        destination.trim(),
        date,
        time_out,
        expected_return_time,
        finalStatus,
      ],
    );

    const [[created]] = await pool.query(
      `
      SELECT
        id,
        user_id,
        gatepass_code,
        reason,
        destination,
        out_date AS date,
        time_out,
        expected_return_time,
        status
      FROM gatepasses
      WHERE id = ?
      LIMIT 1
      `,
      [result.insertId],
    );

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create gatepass",
      error: error?.message ?? String(error),
    });
  }
}

async function updateGatepassStatus(req, res) {
  const gatepassId = Number(req.params.id);
  const requestedStatus = String(req.body?.status || "").toLowerCase();

  if (!Number.isInteger(gatepassId) || gatepassId <= 0) {
    return res.status(400).json({ message: "Invalid gatepass id" });
  }

  const statusMap = {
    approved: "approved",
    rejected: "rejected",
    security_out: "security_out",
    security_in: "security_in",
  };
  const nextStatus = statusMap[requestedStatus];
  if (!nextStatus) {
    return res.status(400).json({
      message: "status must be approved, rejected, security_out, or security_in",
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[gatepass]] = await connection.query(
      `
      SELECT id, user_id
      FROM gatepasses
      WHERE id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [gatepassId],
    );

    if (!gatepass) {
      await connection.rollback();
      return res.status(404).json({ message: "Gatepass not found" });
    }

    await connection.query(
      `
      UPDATE gatepasses
      SET status = ?
      WHERE id = ?
      `,
      [nextStatus, gatepassId],
    );

    if (requestedStatus === "security_out" || requestedStatus === "security_in") {
      const campusStatus = requestedStatus === "security_out" ? "OUT" : "IN";
      await connection.query(
        `
        INSERT INTO campus_logs (user_id, status, log_time)
        VALUES (?, ?, NOW())
        `,
        [gatepass.user_id, campusStatus],
      );
    }

    const [[updated]] = await connection.query(
      `
      SELECT
        id,
        user_id,
        gatepass_code,
        reason,
        destination,
        out_date AS date,
        time_out,
        expected_return_time,
        status
      FROM gatepasses
      WHERE id = ?
      LIMIT 1
      `,
      [gatepassId],
    );

    await connection.commit();
    return res.json(updated);
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({
      message: "Failed to update gatepass status",
      error: error?.message ?? String(error),
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  getGatepasses,
  getGatepassById,
  createGatepass,
  updateGatepassStatus,
};
