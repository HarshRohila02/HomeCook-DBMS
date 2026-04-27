const express = require("express");
const {
  getCampusLogs,
  createCampusLog,
  getLatestCampusStatus,
} = require("../controllers/campusLogsController");

const router = express.Router();

router.get("/", getCampusLogs);
router.get("/latest/:user_id", getLatestCampusStatus);
router.post("/", createCampusLog);

module.exports = router;
