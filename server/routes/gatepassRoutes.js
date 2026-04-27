const express = require("express");
const {
  getGatepasses,
  getGatepassById,
  createGatepass,
  updateGatepassStatus,
} = require("../controllers/gatepassController");
const { requireHost } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", getGatepasses);
router.get("/:id", getGatepassById);
router.post("/", createGatepass);
router.put("/:id/status", requireHost, updateGatepassStatus);

module.exports = router;
