const express = require("express");
const {
  getLostFoundItems,
  createLostFoundItem,
  getLostFoundItemById,
} = require("../controllers/lostFoundController");

const router = express.Router();

router.get("/items", getLostFoundItems);
router.post("/items", createLostFoundItem);
router.get("/items/:id", getLostFoundItemById);

module.exports = router;

