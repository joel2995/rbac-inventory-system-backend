const express = require("express");
const FIFOStockAllocationController = require("../controllers/FIFOStockAllocationController");
const { protect, authorize } = require("../middleware/Auth");

const router = express.Router();

router.use(protect);

router.post("/", authorize("admin", "godown_manager"), FIFOStockAllocationController.createFIFOStockBatch);


// 🔹 Allocate Stock Using FIFO (Admin, Stock Manager)
router.post("/allocate", authorize("admin", "godown_manager"), FIFOStockAllocationController.allocateStockFIFO);

// 🔹 Get All FIFO Stock Allocations
router.get("/", authorize("admin", "godown_manager"), FIFOStockAllocationController.getFIFOAllocations);

// 🔹 Get FIFO Allocation by ID
router.get("/:id", authorize("admin", "godown_manager"), FIFOStockAllocationController.getFIFOAllocationById);

module.exports = router;
