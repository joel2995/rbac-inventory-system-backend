const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/Auth");
const { createStock, getStocks, getStockById } = require("../controllers/StockController");
const authMiddleware = require("../middleware/Authmiddleware");


router.get("/all", authMiddleware, stockController.getAllStock);
router.post("/", protect, authorize("admin", "godown-manager"), createStock);
router.get("/", protect, getStocks);
router.get("/:id", protect, getStockById);

module.exports = router;
