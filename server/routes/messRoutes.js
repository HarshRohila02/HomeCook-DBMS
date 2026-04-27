const express = require("express");
const { getMessMenus, createMessReview } = require("../controllers/messController");

const router = express.Router();

router.get("/", getMessMenus);
router.post("/review", createMessReview);

module.exports = router;

