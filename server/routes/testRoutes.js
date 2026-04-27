const express = require('express')
const { apiTest, dbTest } = require('../controllers/testController')

const router = express.Router()

router.get('/test', apiTest)
router.get('/db-test', dbTest)

module.exports = router

