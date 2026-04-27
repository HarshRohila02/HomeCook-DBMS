const { pool } = require("../db");

const MESS_SORT_SQL = `
  SELECT
    id,
    menu_date,
    meal_type,
    start_time,
    end_time,
    items_text,
    avg_rating,
    review_count
  FROM mess_menus
`;

async function getMessMenus(req, res) {
  const dateFilter = req.query.date;

  try {
    let query = MESS_SORT_SQL;
    const params = [];

    if (dateFilter) {
      query += " WHERE menu_date = ?";
      params.push(dateFilter);
    }

    query += `
      ORDER BY
        menu_date ASC,
        FIELD(meal_type, 'Breakfast', 'Lunch', 'Snacks', 'Dinner')
    `;

    const [rows] = await pool.query(query, params);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch mess menus",
      error: error?.message ?? String(error),
    });
  }
}

async function createMessReview(req, res) {
  const { user_id, mess_menu_id, rating, review_text } = req.body;
  const ratingNumber = Number(rating);

  if (!user_id || !mess_menu_id || !review_text) {
    return res.status(400).json({ message: "user_id, mess_menu_id and review_text are required" });
  }

  if (!Number.isFinite(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
    return res.status(400).json({ message: "rating must be between 1 and 5" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [insertResult] = await connection.query(
      `
      INSERT INTO mess_reviews (user_id, mess_menu_id, rating, feedback)
      VALUES (?, ?, ?, ?)
      `,
      [user_id, mess_menu_id, ratingNumber, review_text],
    );

    const [[aggregate]] = await connection.query(
      `
      SELECT
        ROUND(AVG(rating), 2) AS avg_rating,
        COUNT(*) AS review_count
      FROM mess_reviews
      WHERE mess_menu_id = ?
      `,
      [mess_menu_id],
    );

    await connection.query(
      `
      UPDATE mess_menus
      SET avg_rating = ?, review_count = ?
      WHERE id = ?
      `,
      [aggregate.avg_rating ?? 0, aggregate.review_count ?? 0, mess_menu_id],
    );

    await connection.commit();

    return res.status(201).json({
      message: "Review submitted successfully",
      review_id: insertResult.insertId,
      avg_rating: Number(aggregate.avg_rating ?? 0),
      review_count: Number(aggregate.review_count ?? 0),
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({
      message: "Failed to submit review",
      error: error?.message ?? String(error),
    });
  } finally {
    connection.release();
  }
}

module.exports = {
  getMessMenus,
  createMessReview,
};

