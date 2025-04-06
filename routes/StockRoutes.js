const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/Auth");
const stockController = require("../controllers/StockController");

router.use(protect);
router.get("/all", authorize("admin", "godown_manager"), stockController.getStocks);
router.post("/", authorize("admin", "godown_manager"), stockController.createStock);
router.get("/:id", authorize("admin", "godown_manager"), stockController.getStockById);

module.exports = router;
