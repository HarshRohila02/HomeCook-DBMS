const { testDbConnection } = require('../db')

async function apiTest(req, res) {
  res.json({ message: 'Server is running' })
}

async function dbTest(req, res) {
  try {
    const ok = await testDbConnection()
    if (!ok) {
      return res.status(500).json({ message: 'DB test failed' })
    }
    return res.json({ message: 'DB connected successfully' })
  } catch (error) {
    return res.status(500).json({
      message: 'DB connection error',
      error: error?.message ?? String(error),
    })
  }
}

module.exports = {
  apiTest,
  dbTest,
}

