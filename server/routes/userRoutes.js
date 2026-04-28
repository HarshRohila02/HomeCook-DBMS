const express = require('express')
const { getUserById, changePassword, submitFeedback } = require('../controllers/userController')

const router = express.Router()

router.get('/:id', getUserById)
router.post('/change-password', changePassword)
router.post('/feedback', submitFeedback)

module.exports = router
