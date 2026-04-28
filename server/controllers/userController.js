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
        avatar_url AS profile_image,
        role
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

async function changePassword(req, res) {
  const { user_id, currentPassword, newPassword } = req.body

  if (!user_id || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'user_id, currentPassword and newPassword are required' })
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ message: 'New password must be at least 4 characters' })
  }

  try {
    const [[user]] = await pool.query(
      'SELECT id, password FROM users WHERE id = ? LIMIT 1',
      [user_id],
    )

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const storedPassword = user.password ?? ''
    const isValid = storedPassword === currentPassword || (!storedPassword && currentPassword === 'password123')

    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [newPassword, user_id],
    )

    return res.json({ message: 'Password changed successfully' })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to change password',
      error: error?.message ?? String(error),
    })
  }
}

async function ensureFeedbackTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)
}

let feedbackTableReady = false

async function submitFeedback(req, res) {
  const { user_id, message } = req.body

  if (!user_id || !message?.trim()) {
    return res.status(400).json({ message: 'user_id and message are required' })
  }

  try {
    if (!feedbackTableReady) {
      await ensureFeedbackTable()
      feedbackTableReady = true
    }

    await pool.query(
      'INSERT INTO feedback (user_id, message) VALUES (?, ?)',
      [user_id, message.trim()],
    )

    return res.status(201).json({ message: 'Feedback submitted successfully' })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to submit feedback',
      error: error?.message ?? String(error),
    })
  }
}

module.exports = {
  getUserById,
  changePassword,
  submitFeedback,
}
