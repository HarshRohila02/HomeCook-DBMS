const { pool } = require("../db");
const { resolveRoleFromRequest } = require("../middleware/roleMiddleware");

async function getLostFoundItems(req, res) {
  const status = req.query.status;
  const search = req.query.search;
  const limit = Number(req.query.limit);
  const allowedStatuses = new Set(["found", "lost", "claimed"]);

  if (status && !allowedStatuses.has(status)) {
    return res.status(400).json({ message: "Invalid status filter" });
  }

  try {
    let query = `
      SELECT
        id,
        created_by_user_id,
        item_name,
        location,
        status,
        token_code,
        image_url,
        description,
        reported_at
      FROM lost_found_items
    `;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }

    if (search && search.trim()) {
      conditions.push(
        "(item_name LIKE ? OR location LIKE ? OR token_code LIKE ? OR description LIKE ?)"
      );
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    if (conditions.length) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY reported_at DESC, id DESC";

    if (Number.isInteger(limit) && limit > 0) {
      query += " LIMIT ?";
      params.push(limit);
    }

    const [rows] = await pool.query(query, params);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch lost and found items",
      error: error?.message ?? String(error),
    });
  }
}


async function createLostFoundItem(req, res) {
  const {
    created_by_user_id,
    item_name,
    location,
    status,
    token_code,
    image_url,
    description,
  } = req.body;

  const allowedStatuses = new Set(["found", "lost", "claimed"]);
  if (
    !created_by_user_id ||
    !item_name?.trim() ||
    !location?.trim() ||
    !status ||
    !allowedStatuses.has(status)
  ) {
    return res.status(400).json({
      message: "created_by_user_id, item_name, location and valid status are required",
    });
  }

  if (status === "found") {
    const role = await resolveRoleFromRequest(req);
    if (role !== "host") {
      return res.status(403).json({
        message: "Only host can add found items",
      });
    }
  }

  try {
    const [result] = await pool.query(
      `
      INSERT INTO lost_found_items
      (
        created_by_user_id,
        item_name,
        location,
        status,
        token_code,
        image_url,
        description,
        reported_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        created_by_user_id,
        item_name.trim(),
        location.trim(),
        status,
        token_code?.trim() || null,
        image_url?.trim() || null,
        description?.trim() || null,
      ],
    );

    const [[created]] = await pool.query(
      `
      SELECT
        id,
        created_by_user_id,
        item_name,
        location,
        status,
        token_code,
        image_url,
        description,
        reported_at
      FROM lost_found_items
      WHERE id = ?
      `,
      [result.insertId],
    );

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create lost and found item",
      error: error?.message ?? String(error),
    });
  }
}

async function getLostFoundItemById(req, res) {
  const itemId = Number(req.params.id);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    return res.status(400).json({ message: "Invalid item id" });
  }

  try {
    const [[row]] = await pool.query(
      `
      SELECT
        id,
        created_by_user_id,
        item_name,
        location,
        status,
        token_code,
        image_url,
        description,
        reported_at
      FROM lost_found_items
      WHERE id = ?
      LIMIT 1
      `,
      [itemId],
    );

    if (!row) {
      return res.status(404).json({ message: "Item not found" });
    }

    return res.json(row);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch item",
      error: error?.message ?? String(error),
    });
  }
}

async function claimLostFoundItem(req, res) {
  const itemId = Number(req.params.id);
  const { user_id, claim_message } = req.body;

  if (!Number.isInteger(itemId) || itemId <= 0) {
    return res.status(400).json({ message: "Invalid item id" });
  }
  if (!user_id || !claim_message?.trim()) {
    return res.status(400).json({ message: "user_id and claim_message are required" });
  }

  try {
    const [[item]] = await pool.query(
      `
      SELECT id, status
      FROM lost_found_items
      WHERE id = ?
      LIMIT 1
      `,
      [itemId],
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    if (item.status !== "found") {
      return res.status(409).json({ message: "Claims are only allowed for found items" });
    }

    const [[existingPendingClaim]] = await pool.query(
      `
      SELECT id
      FROM lost_found_claims
      WHERE item_id = ? AND user_id = ? AND claim_status = 'pending'
      LIMIT 1
      `,
      [itemId, user_id],
    );

    if (existingPendingClaim) {
      return res.status(409).json({ message: "Pending claim already exists for this item" });
    }

    const [result] = await pool.query(
      `
      INSERT INTO lost_found_claims (item_id, user_id, claim_message, claim_status)
      VALUES (?, ?, ?, 'pending')
      `,
      [itemId, user_id, claim_message.trim()],
    );

    const [[created]] = await pool.query(
      `
      SELECT
        c.id,
        c.item_id,
        c.user_id,
        c.claim_message,
        c.claim_status,
        c.created_at
      FROM lost_found_claims c
      WHERE c.id = ?
      LIMIT 1
      `,
      [result.insertId],
    );

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create claim",
      error: error?.message ?? String(error),
    });
  }
}

async function getLostFoundClaims(req, res) {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        c.id,
        c.item_id,
        c.user_id,
        c.claim_message,
        c.claim_status,
        c.created_at,
        i.item_name,
        i.location,
        i.token_code,
        u.full_name AS student_name,
        u.email AS student_email
      FROM lost_found_claims c
      INNER JOIN lost_found_items i ON i.id = c.item_id
      INNER JOIN users u ON u.id = c.user_id
      ORDER BY c.created_at DESC, c.id DESC
      `,
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch claims",
      error: error?.message ?? String(error),
    });
  }
}

async function updateLostFoundClaimStatus(req, res) {
  const claimId = Number(req.params.id);
  const status = String(req.body?.status || "").toLowerCase();

  if (!Number.isInteger(claimId) || claimId <= 0) {
    return res.status(400).json({ message: "Invalid claim id" });
  }
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "status must be approved or rejected" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[claim]] = await connection.query(
      `
      SELECT id, item_id, claim_status
      FROM lost_found_claims
      WHERE id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [claimId],
    );

    if (!claim) {
      await connection.rollback();
      return res.status(404).json({ message: "Claim not found" });
    }

    await connection.query(
      `
      UPDATE lost_found_claims
      SET claim_status = ?
      WHERE id = ?
      `,
      [status, claimId],
    );

    if (status === "approved") {
      await connection.query(
        `
        UPDATE lost_found_items
        SET status = 'claimed'
        WHERE id = ?
        `,
        [claim.item_id],
      );
    }

    const [[updatedClaim]] = await connection.query(
      `
      SELECT
        c.id,
        c.item_id,
        c.user_id,
        c.claim_message,
        c.claim_status,
        c.created_at
      FROM lost_found_claims c
      WHERE c.id = ?
      LIMIT 1
      `,
      [claimId],
    );

    await connection.commit();
    return res.json(updatedClaim);
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({
      message: "Failed to update claim status",
      error: error?.message ?? String(error),
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  getLostFoundItems,
  createLostFoundItem,
  getLostFoundItemById,
  claimLostFoundItem,
  getLostFoundClaims,
  updateLostFoundClaimStatus,
};

