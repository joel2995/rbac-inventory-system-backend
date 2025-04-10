const express = require("express");
const {
    getDashboardData,
    getStockDetails,
    getUserStatistics
} = require("../controllers/DashBoardController");

const { protect, authorize } = require("../middleware/Auth");

const router = express.Router();

// ✅ Apply authentication
router.use(protect);

// ✅ Dashboard Routes
router.get("/", authorize("admin", "stock_manager", "delivery_manager"), getDashboardData);
router.get("/stock", authorize("admin", "stock_manager"), getStockDetails);
router.get("/users", authorize("admin"), getUserStatistics);

module.exports = router;
