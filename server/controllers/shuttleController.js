const { pool } = require("../db");

async function getShuttles(req, res) {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        id,
        route,
        departure_time,
        arrival_time,
        seats_available
      FROM shuttles
      ORDER BY departure_time ASC, id ASC
      `,
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch shuttles",
      error: error?.message ?? String(error),
    });
  }
}

async function bookShuttle(req, res) {
  const { user_id, shuttle_id } = req.body;

  if (!user_id || !shuttle_id) {
    return res.status(400).json({ message: "user_id and shuttle_id are required" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[existingBooking]] = await connection.query(
      `
      SELECT id
      FROM shuttle_bookings
      WHERE user_id = ? AND shuttle_id = ? AND booking_status = 'Booked'
      LIMIT 1
      `,
      [user_id, shuttle_id],
    );

    if (existingBooking) {
      await connection.rollback();
      return res.status(409).json({ message: "Duplicate booking is not allowed" });
    }

    const [[shuttle]] = await connection.query(
      `
      SELECT id, seats_available
      FROM shuttles
      WHERE id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [shuttle_id],
    );

    if (!shuttle) {
      await connection.rollback();
      return res.status(404).json({ message: "Shuttle not found" });
    }

    if (Number(shuttle.seats_available ?? 0) <= 0) {
      await connection.rollback();
      return res.status(409).json({ message: "No seats available for this shuttle" });
    }

    const [insertResult] = await connection.query(
      `
      INSERT INTO shuttle_bookings (user_id, shuttle_id, booking_status, booked_at)
      VALUES (?, ?, 'Booked', NOW())
      `,
      [user_id, shuttle_id],
    );

    await connection.query(
      `
      UPDATE shuttles
      SET seats_available = seats_available - 1
      WHERE id = ?
      `,
      [shuttle_id],
    );

    const [[createdBooking]] = await connection.query(
      `
      SELECT
        b.id,
        b.user_id,
        b.shuttle_id,
        b.booking_status,
        b.booked_at,
        s.route,
        s.departure_time,
        s.arrival_time,
        s.seats_available
      FROM shuttle_bookings b
      INNER JOIN shuttles s ON s.id = b.shuttle_id
      WHERE b.id = ?
      LIMIT 1
      `,
      [insertResult.insertId],
    );

    await connection.commit();
    return res.status(201).json(createdBooking);
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({
      message: "Failed to book shuttle",
      error: error?.message ?? String(error),
    });
  } finally {
    connection.release();
  }
}

async function getBookingsByUserId(req, res) {
  const userId = Number(req.params.user_id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "Invalid user_id" });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT
        b.id,
        b.user_id,
        b.shuttle_id,
        b.booking_status,
        b.booked_at,
        s.route,
        s.departure_time,
        s.arrival_time
      FROM shuttle_bookings b
      INNER JOIN shuttles s ON s.id = b.shuttle_id
      WHERE b.user_id = ? AND b.booking_status = 'Booked'
      ORDER BY b.booked_at DESC, b.id DESC
      `,
      [userId],
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch shuttle bookings",
      error: error?.message ?? String(error),
    });
  }
}

async function createShuttle(req, res) {
  const { route, departure_time, arrival_time, seats_available } = req.body;

  if (!route || !departure_time || !arrival_time || seats_available === undefined) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [result] = await pool.query(
      `
      INSERT INTO shuttles (route, departure_time, arrival_time, seats_available)
      VALUES (?, ?, ?, ?)
      `,
      [route, departure_time, arrival_time, seats_available],
    );

    const [[newShuttle]] = await pool.query(
      "SELECT * FROM shuttles WHERE id = ?",
      [result.insertId],
    );

    return res.status(201).json(newShuttle);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create shuttle",
      error: error?.message ?? String(error),
    });
  }
}

async function updateShuttle(req, res) {
  const { id } = req.params;
  const { route, departure_time, arrival_time, seats_available } = req.body;

  if (!route || !departure_time || !arrival_time || seats_available === undefined) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [result] = await pool.query(
      `
      UPDATE shuttles
      SET route = ?, departure_time = ?, arrival_time = ?, seats_available = ?
      WHERE id = ?
      `,
      [route, departure_time, arrival_time, seats_available, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Shuttle not found" });
    }

    const [[updatedShuttle]] = await pool.query(
      "SELECT * FROM shuttles WHERE id = ?",
      [id],
    );

    return res.json(updatedShuttle);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update shuttle",
      error: error?.message ?? String(error),
    });
  }
}

async function deleteShuttle(req, res) {
  const { id } = req.params;

  try {
    // We should check if there are active bookings before deleting, 
    // but for now we'll just delete the shuttle. 
    // In a real app, we might want to soft-delete or cancel bookings.
    const [result] = await pool.query("DELETE FROM shuttles WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Shuttle not found" });
    }

    return res.json({ message: "Shuttle deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete shuttle",
      error: error?.message ?? String(error),
    });
  }
}

module.exports = {
  getShuttles,
  bookShuttle,
  getBookingsByUserId,
  createShuttle,
  updateShuttle,
  deleteShuttle,
};
