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
    let resolvedDate = dateFilter;
    if (!resolvedDate) {
      const [[todayMenu]] = await pool.query(
        `
        SELECT menu_date
        FROM mess_menus
        WHERE menu_date = CURDATE()
        LIMIT 1
        `,
      );

      if (todayMenu?.menu_date) {
        resolvedDate = todayMenu.menu_date;
      } else {
        const [[nearestDate]] = await pool.query(
          `
          SELECT menu_date
          FROM mess_menus
          ORDER BY ABS(DATEDIFF(menu_date, CURDATE())), menu_date ASC
          LIMIT 1
          `,
        );
        resolvedDate = nearestDate?.menu_date ?? null;
      }
    }

    let query = MESS_SORT_SQL;
    const params = [];

    if (resolvedDate) {
      query += " WHERE menu_date = ?";
      params.push(resolvedDate);
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

async function getMessDates(req, res) {
  try {
    const [rows] = await pool.query(
      `
      SELECT DISTINCT menu_date
      FROM mess_menus
      ORDER BY menu_date ASC
      `,
    );
    return res.json(rows.map((row) => row.menu_date));
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch mess dates",
      error: error?.message ?? String(error),
    });
  }
}

async function createMessMenu(req, res) {
  const {
    menu_date,
    meal_type,
    start_time,
    end_time,
    items_text,
    avg_rating,
    review_count,
  } = req.body;

  if (!menu_date || !meal_type || !start_time || !end_time || !items_text?.trim()) {
    return res.status(400).json({
      message: "menu_date, meal_type, start_time, end_time and items_text are required",
    });
  }

  try {
    const [result] = await pool.query(
      `
      INSERT INTO mess_menus
      (
        menu_date,
        meal_type,
        start_time,
        end_time,
        items_text,
        avg_rating,
        review_count
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        menu_date,
        meal_type,
        start_time,
        end_time,
        items_text.trim(),
        Number(avg_rating ?? 0),
        Number(review_count ?? 0),
      ],
    );

    const [[created]] = await pool.query(
      `
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
      WHERE id = ?
      LIMIT 1
      `,
      [result.insertId],
    );

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create mess menu",
      error: error?.message ?? String(error),
    });
  }
}

async function updateMessMenu(req, res) {
  const menuId = Number(req.params.id);
  const {
    menu_date,
    meal_type,
    start_time,
    end_time,
    items_text,
    avg_rating,
    review_count,
  } = req.body;

  if (!Number.isInteger(menuId) || menuId <= 0) {
    return res.status(400).json({ message: "Invalid menu id" });
  }

  if (!menu_date || !meal_type || !start_time || !end_time || !items_text?.trim()) {
    return res.status(400).json({
      message: "menu_date, meal_type, start_time, end_time and items_text are required",
    });
  }

  try {
    const [result] = await pool.query(
      `
      UPDATE mess_menus
      SET
        menu_date = ?,
        meal_type = ?,
        start_time = ?,
        end_time = ?,
        items_text = ?,
        avg_rating = ?,
        review_count = ?
      WHERE id = ?
      `,
      [
        menu_date,
        meal_type,
        start_time,
        end_time,
        items_text.trim(),
        Number(avg_rating ?? 0),
        Number(review_count ?? 0),
        menuId,
      ],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    const [[updated]] = await pool.query(
      `
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
      WHERE id = ?
      LIMIT 1
      `,
      [menuId],
    );

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update mess menu",
      error: error?.message ?? String(error),
    });
  }
}

async function deleteMessMenu(req, res) {
  const menuId = Number(req.params.id);
  if (!Number.isInteger(menuId) || menuId <= 0) {
    return res.status(400).json({ message: "Invalid menu id" });
  }

  try {
    const [result] = await pool.query(
      `
      DELETE FROM mess_menus
      WHERE id = ?
      `,
      [menuId],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    return res.json({ message: "Menu item deleted successfully", id: menuId });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete mess menu",
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
  getMessDates,
  createMessMenu,
  updateMessMenu,
  deleteMessMenu,
  createMessReview,
};

