const express = require("express");
const router = express.Router();
const godownController = require("../controllers/GodownController");
const { protect, authorize } = require("../middleware/Auth");

// ✅ Apply Authentication Middleware
router.use(protect);

// 🔹 Godown Routes (Only Admin & Stock Manager can access)
router.post("/", authorize("admin", "godown_manager"), godownController.addGodown);
router.get("/", authorize("admin", "godown_manager"), godownController.getGodowns);
router.get("/:id", authorize("admin", "godown_manager"), godownController.getGodownById);
router.put("/:id", authorize("admin", "godown_manager"), godownController.updateGodown);
router.delete("/:id", authorize("admin", "godown_manager"), godownController.deleteGodown);

module.exports = router;
