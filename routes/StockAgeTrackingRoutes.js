const express = require("express");
const stockAgeController = require("../controllers/StockAgeTrackingController");
const { protect, authorize } = require("../middleware/Auth");

const router = express.Router();

// ✅ Apply Authentication Middleware
router.use(protect);

// 🔹 Create a New Stock Age Tracking Entry
router.post("/", authorize("admin", "godown_manager"), stockAgeController.addStockAge);

// 🔹 Get All Stock Age Tracking Records
router.get("/", authorize("admin", "godown_manager"), stockAgeController.getStockAgeRecords);

// 🔹 Get a Specific Stock Age Tracking Record by ID
router.get("/:id", authorize("admin", "godown_manager"), stockAgeController.getStockAgeById);

// 🔹 Update a Stock Age Tracking Record
router.put("/:id", authorize("admin", "godown_manager"), stockAgeController.updateStockAge);

// 🔹 Delete a Stock Age Tracking Record
router.delete("/:id", authorize("admin", "godown_manager"), stockAgeController.deleteStockAge);

module.exports = router;
