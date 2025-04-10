const express = require("express");
const expiryAlertController = require("../controllers/ExpiryAlertController");
const { protect, authorize } = require("../middleware/Auth");

const router = express.Router();

// ✅ Apply Authentication Middleware
router.use(protect);

// 🔹 Generate Expiry Alert (Admin, Stock Manager)
router.post("/", authorize("admin", "godown_manager"), expiryAlertController.generateExpiryAlerts);

// 🔹 Get All Expiry Alerts (Admin, Stock Manager)
router.get("/", authorize("admin", "godown_manager"), expiryAlertController.getExpiryAlerts);

// 🔹 Get Expiry Alert by ID
router.get("/:id", authorize("admin", "godown_manager"), expiryAlertController.getExpiryAlertById);

// 🔹 Mark Expiry Alert as Notified
router.put("/:id", authorize("admin", "godown_manager"), expiryAlertController.markAsNotified);

module.exports = router;
