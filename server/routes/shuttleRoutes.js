const express = require("express");
const {
  getShuttles,
  bookShuttle,
  getBookingsByUserId,
  createShuttle,
  updateShuttle,
  deleteShuttle,
} = require("../controllers/shuttleController");

const router = express.Router();

router.get("/", getShuttles);
router.post("/", createShuttle);
router.put("/:id", updateShuttle);
router.delete("/:id", deleteShuttle);
router.post("/book", bookShuttle);
router.get("/bookings/:user_id", getBookingsByUserId);

module.exports = router;
