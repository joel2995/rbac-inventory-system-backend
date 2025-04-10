const StockAgeTracking = require("../models/StockAgeTracking");

// ✅ Create a new Stock Age Tracking Record
exports.addStockAge = async (req, res) => {
    try {
        const { batchNumber, rationItem, godown, arrivalDate, priority } = req.body;

        // Check if batch number already exists
        const existingBatch = await StockAgeTracking.findOne({ batchNumber });
        if (existingBatch) {
            return res.status(400).json({ message: "Batch number already exists!" });
        }

        const newStockAge = await StockAgeTracking.create({
            batchNumber,
            rationItem,
            godown,
            arrivalDate,
            priority
        });

        res.status(201).json({
            status: "success",
            message: "Stock age tracking record added successfully!",
            data: newStockAge
        });
    } catch (error) {
        res.status(500).json({ message: "Error adding stock age tracking record", error: error.message });
    }
};

// ✅ Retrieve All Stock Age Tracking Records
exports.getStockAgeRecords = async (req, res) => {
    try {
        const records = await StockAgeTracking.find().populate("godown", "godownName location");
        res.status(200).json({ status: "success", data: records });
    } catch (error) {
        res.status(500).json({ message: "Error fetching stock age records", error: error.message });
    }
};

// ✅ Retrieve a Specific Stock Age Record by ID
exports.getStockAgeById = async (req, res) => {
    try {
        const stockAge = await StockAgeTracking.findById(req.params.id).populate("godown", "godownName location");

        if (!stockAge) {
            return res.status(404).json({ message: "Stock age tracking record not found" });
        }

        res.status(200).json({ status: "success", data: stockAge });
    } catch (error) {
        res.status(500).json({ message: "Error fetching stock age tracking record", error: error.message });
    }
};

// ✅ Update Stock Age Tracking Record
exports.updateStockAge = async (req, res) => {
    try {
        const { batchNumber, rationItem, arrivalDate, priority } = req.body;

        const updatedStockAge = await StockAgeTracking.findByIdAndUpdate(
            req.params.id,
            { batchNumber, rationItem, arrivalDate, priority },
            { new: true, runValidators: true }
        ).populate("godown", "godownName location");

        if (!updatedStockAge) {
            return res.status(404).json({ message: "Stock age tracking record not found" });
        }

        res.status(200).json({
            status: "success",
            message: "Stock age tracking record updated successfully!",
            data: updatedStockAge
        });
    } catch (error) {
        res.status(500).json({ message: "Error updating stock age tracking record", error: error.message });
    }
};

// ✅ Delete Stock Age Tracking Record
exports.deleteStockAge = async (req, res) => {
    try {
        const deletedStockAge = await StockAgeTracking.findByIdAndDelete(req.params.id);

        if (!deletedStockAge) {
            return res.status(404).json({ message: "Stock age tracking record not found" });
        }

        res.status(200).json({ message: "Stock age tracking record deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting stock age tracking record", error: error.message });
    }
};
