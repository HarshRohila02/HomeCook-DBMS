const express = require("express");
const {
  getMessMenus,
  getMessDates,
  createMessMenu,
  updateMessMenu,
  deleteMessMenu,
  createMessReview,
} = require("../controllers/messController");
const { requireHost } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/dates", getMessDates);
router.get("/", getMessMenus);
router.post("/", requireHost, createMessMenu);
router.put("/:id", requireHost, updateMessMenu);
router.delete("/:id", requireHost, deleteMessMenu);
router.post("/review", createMessReview);

module.exports = router;

