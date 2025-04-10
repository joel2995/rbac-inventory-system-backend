const express = require("express");
const logController = require("../controllers/LogController");
const { protect, authorize } = require("../middleware/Auth");

const router = express.Router();

// ✅ Apply authentication
router.use(protect);

// ✅ Define Log Routes
router.post("/", authorize("admin"), logController.createLog);
router.get("/", authorize("admin"), logController.getLogs);
router.get("/:id", authorize("admin"), logController.getLogById);  // ✅ Get Log by ID

module.exports = router;
