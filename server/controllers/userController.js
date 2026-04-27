const { pool } = require('../db')

async function getUserById(req, res) {
  const userId = Number(req.params.id)

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Invalid user id' })
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT
        id,
        full_name,
        phone,
        email,
        university,
        avatar_url AS profile_image
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId],
    )

    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.json(rows[0])
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch user',
      error: error?.message ?? String(error),
    })
  }
}

module.exports = {
  getUserById,
}

