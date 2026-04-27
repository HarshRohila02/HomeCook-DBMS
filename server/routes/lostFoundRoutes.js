const express = require("express");
const {
  getLostFoundItems,
  createLostFoundItem,
  getLostFoundItemById,
  claimLostFoundItem,
  getLostFoundClaims,
  updateLostFoundClaimStatus,
} = require("../controllers/lostFoundController");
const { requireHost } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/items", getLostFoundItems);
router.post("/items", createLostFoundItem);
router.get("/items/:id", getLostFoundItemById);
router.post("/items/:id/claim", claimLostFoundItem);
router.get("/claims", requireHost, getLostFoundClaims);
router.put("/claims/:id/status", requireHost, updateLostFoundClaimStatus);

module.exports = router;

