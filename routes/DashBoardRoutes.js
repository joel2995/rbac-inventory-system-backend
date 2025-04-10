const express = require("express");
const router = express.Router();
const { getDashboardData } = require("../controllers/DashBoardController");
const { protect, authorize } = require("../middleware/Auth"); // ✅ FIX: Use named imports

// ✅ Apply authentication and role-based authorization
router.get("/", protect, authorize("admin", "stock_manager", "delivery_manager"), getDashboardData);

module.exports = router;
