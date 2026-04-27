const express = require("express");
const {
  getCampusLogs,
  createCampusLog,
} = require("../controllers/campusLogsController");

const router = express.Router();

router.get("/", getCampusLogs);
router.post("/", createCampusLog);

module.exports = router;
