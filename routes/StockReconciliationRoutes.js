const express = require("express");
const stockReconciliationController = require("../controllers/StockReconciliationController");
const { protect, authorize } = require("../middleware/Auth");

const router = express.Router();

// ✅ Apply Authentication Middleware
router.use(protect);

// 🔹 Perform Stock Reconciliation (Admin, Godown Manager)
router.post("/", authorize("admin", "godown_manager"), stockReconciliationController.reconcileStock);

// 🔹 View All Reconciliation Reports (Admin, Godown Manager)
router.get("/", authorize("admin", "godown_manager"), stockReconciliationController.getReconciliationReports);

// 🔹 View Specific Reconciliation Report by ID (Admin, Godown Manager)
router.get("/:id", authorize("admin", "godown_manager"), stockReconciliationController.getReconciliationById);

module.exports = router;
