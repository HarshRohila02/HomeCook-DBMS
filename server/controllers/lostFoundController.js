const { pool } = require("../db");

async function getLostFoundItems(req, res) {
  const status = req.query.status;
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
    const params = [];

    if (status) {
      query += " WHERE status = ?";
      params.push(status);
    }

    query += " ORDER BY reported_at DESC, id DESC";

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

module.exports = {
  getLostFoundItems,
  createLostFoundItem,
  getLostFoundItemById,
};

