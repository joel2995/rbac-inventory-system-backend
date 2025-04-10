const express = require("express");
const router = express.Router();
const stockController = require("../controllers/StockController");
const { protect, authorize } = require("../middleware/Auth");

// ✅ Protect all routes
router.use(protect);

// ✅ Create stock (Only 'godown_manager')
router.post("/", authorize("admin", "godown_manager", "pds_shop_owner"), stockController.createStock);

// ✅ Get all stocks (Admin, Godown Manager, PDS Shop Owner)
router.get("/", authorize("admin", "godown_manager", "pds_shop_owner"), stockController.getStocks);

// ✅ Get stock by ID (Admin, Godown Manager, PDS Shop Owner)
router.get("/:id", authorize("admin", "godown_manager", "pds_shop_owner"), stockController.getStockById);

// ✅ Update stock (Only 'godown_manager')
router.put("/:id", authorize("admin", "godown_manager", "pds_shop_owner"), stockController.updateStock);

// ✅ Delete stock (Only 'admin')
router.delete("/:id", authorize("admin", "godown_manager", "pds_shop_owner"), stockController.deleteStock);

module.exports = router;
