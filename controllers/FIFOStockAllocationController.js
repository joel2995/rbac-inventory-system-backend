const FIFOStockAllocation = require("../models/FIFOStockAllocation");
const Stock = require("../models/Stock");

// ✅ Allocate Stock Using FIFO Method
// ✅ Create a FIFO Stock Batch
exports.createFIFOStockBatch = async (req, res) => {
    try {
        const { batchNumber, rationItem, godown, arrivalDate, totalQuantity } = req.body;

        const batch = await FIFOStockAllocation.create({
            batchNumber,
            rationItem,
            godown,
            arrivalDate,
            totalQuantity,
            allocatedQuantity: 0,
        });

        res.status(201).json({ status: "success", message: "FIFO Batch created successfully!", data: batch });
    } catch (error) {
        res.status(500).json({ message: "Error creating FIFO batch", error: error.message });
    }
};




exports.allocateStockFIFO = async (req, res) => {
    try {
        const { godown, rationItem, requestedQuantity } = req.body;

        // 🔹 Fetch available stock batches sorted by oldest first (FIFO)
        const batches = await FIFOStockAllocation.find({ godown, rationItem })
            .sort({ arrivalDate: 1 });

        let remainingQuantity = requestedQuantity;
        let allocatedBatches = [];

        for (let batch of batches) {
            if (remainingQuantity <= 0) break;

            let availableInBatch = batch.totalQuantity - batch.allocatedQuantity;
            let allocatedNow = Math.min(availableInBatch, remainingQuantity);

            batch.allocatedQuantity += allocatedNow;
            remainingQuantity -= allocatedNow;

            await batch.save();
            allocatedBatches.push({ batchNumber: batch.batchNumber, allocated: allocatedNow });
        }

        if (remainingQuantity > 0) {
            return res.status(400).json({ message: "Insufficient stock available!" });
        }

        res.status(200).json({
            status: "success",
            message: "Stock allocated successfully using FIFO!",
            allocatedBatches
        });
    } catch (error) {
        res.status(500).json({ message: "Error in FIFO stock allocation", error: error.message });
    }
};

// ✅ Get All FIFO Stock Allocations
exports.getFIFOAllocations = async (req, res) => {
    try {
        const allocations = await FIFOStockAllocation.find().populate("godown", "godownName location");
        res.status(200).json({ status: "success", data: allocations });
    } catch (error) {
        res.status(500).json({ message: "Error fetching allocations", error: error.message });
    }
};

// ✅ Get FIFO Allocation by ID
exports.getFIFOAllocationById = async (req, res) => {
    try {
        const allocation = await FIFOStockAllocation.findById(req.params.id).populate("godown", "godownName location");

        if (!allocation) return res.status(404).json({ message: "Allocation record not found" });

        res.status(200).json({ status: "success", data: allocation });
    } catch (error) {
        res.status(500).json({ message: "Error fetching allocation", error: error.message });
    }
};
