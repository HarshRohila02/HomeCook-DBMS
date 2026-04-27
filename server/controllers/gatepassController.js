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
  const finalStatus =
    requestedStatus.toLowerCase() === "pending" ? "Requested" : requestedStatus;
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

module.exports = {
  getGatepasses,
  getGatepassById,
  createGatepass,
};
