const { pool } = require("../db");

// Uses: VIEW (v_mess_ratings), GROUP BY, HAVING, LEFT JOIN, Subquery, SUM, MAX, MIN, CONCAT, COALESCE, UPPER
async function getAnalyticsSummary(req, res) {
  try {
    // 1. Mess ratings by meal type — GROUP BY + HAVING + aggregate (AVG, COUNT)
    const [mealRatings] = await pool.query(`
      SELECT
        meal_type,
        ROUND(AVG(avg_rating), 2) AS avg_rating,
        COUNT(*) AS menu_count,
        SUM(review_count) AS total_reviews,
        MIN(avg_rating) AS worst_rating,
        MAX(avg_rating) AS best_rating
      FROM mess_menus
      GROUP BY meal_type
      HAVING COUNT(*) > 0
      ORDER BY FIELD(meal_type, 'Breakfast', 'Lunch', 'Snacks', 'Dinner')
    `);

    // 2. User gatepass summary — LEFT JOIN + GROUP BY + COUNT
    const [userGatepasses] = await pool.query(`
      SELECT
        u.full_name,
        CONCAT(u.full_name, ' (', UPPER(COALESCE(u.university, 'N/A')), ')') AS display_name,
        COUNT(g.id) AS total_gatepasses
      FROM users u
      LEFT JOIN gatepasses g ON g.user_id = u.id
      GROUP BY u.id, u.full_name, u.university
    `);

    // 3. Shuttles with above-average seats — SUBQUERY
    const [aboveAvgShuttles] = await pool.query(`
      SELECT shuttle_code, route, seats_available, seats_total
      FROM shuttles
      WHERE seats_available > (SELECT AVG(seats_available) FROM shuttles)
    `);

    // 4. Users who never booked — SUBQUERY with NOT IN
    const [neverBooked] = await pool.query(`
      SELECT full_name, email
      FROM users
      WHERE id NOT IN (SELECT DISTINCT user_id FROM shuttle_bookings)
    `);

    // 5. Shuttle occupancy from VIEW
    const [occupancy] = await pool.query(`
      SELECT shuttle_code, route, seats_booked, occupancy_pct
      FROM v_shuttle_occupancy
      ORDER BY occupancy_pct DESC
    `);

    // 6. Overall stats — SUM, MAX, MIN
    const [[overallStats]] = await pool.query(`
      SELECT
        SUM(seats_available) AS total_available_seats,
        MAX(seats_total) AS largest_shuttle,
        MIN(seats_available) AS least_available_seats
      FROM shuttles
    `);

    // 7. Campus log summary — GROUP BY
    const [logSummary] = await pool.query(`
      SELECT status, COUNT(*) AS log_count, MAX(log_time) AS latest_log
      FROM campus_logs
      GROUP BY status
    `);

    // 8. Lost & Found summary — GROUP BY
    const [lfSummary] = await pool.query(`
      SELECT status, COUNT(*) AS item_count
      FROM lost_found_items
      GROUP BY status
    `);

    return res.json({
      mealRatings,
      userGatepasses,
      aboveAvgShuttles,
      neverBooked,
      shuttleOccupancy: occupancy,
      overallStats: overallStats ?? {},
      campusLogSummary: logSummary,
      lostFoundSummary: lfSummary,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch analytics",
      error: error?.message ?? String(error),
    });
  }
}

module.exports = { getAnalyticsSummary };
