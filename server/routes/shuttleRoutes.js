const express = require("express");
const {
  getShuttles,
  bookShuttle,
  getBookingsByUserId,
} = require("../controllers/shuttleController");

const router = express.Router();

router.get("/", getShuttles);
router.post("/book", bookShuttle);
router.get("/bookings/:user_id", getBookingsByUserId);

module.exports = router;
