const express = require("express");
const router = express.Router();
const godownController = require("../controllers/GodownController");
const { protect, authorize } = require("../middleware/Auth");

// Apply authentication middleware
router.use(protect);

// 🔹 Routes for Godown Management
router.post("/", authorize("admin"), godownController.addGodown); // Add a new godown
router.get("/", authorize("admin", "stock_manager"), godownController.getGodowns); // View all godowns
router.get("/:id", authorize("admin", "stock_manager"), godownController.getGodownById); // View specific godown
router.put("/:id", authorize("admin"), godownController.updateGodown); // Update godown details
router.delete("/:id", authorize("admin"), godownController.deleteGodown); // Delete godown

module.exports = router;
