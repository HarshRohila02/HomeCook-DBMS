const express = require("express");
const {
  getGatepasses,
  getGatepassById,
  createGatepass,
} = require("../controllers/gatepassController");

const router = express.Router();

router.get("/", getGatepasses);
router.get("/:id", getGatepassById);
router.post("/", createGatepass);

module.exports = router;
