const mongoose = require("mongoose");

const FIFOStockAllocationSchema = new mongoose.Schema(
    {
        batchNumber: { type: String, required: true, unique: true }, // Unique batch identifier
        rationItem: { type: String, required: true },
        godown: { type: mongoose.Schema.Types.ObjectId, ref: "Godown", required: true },
        arrivalDate: { type: Date, required: true }, // Date when stock was received
        allocatedQuantity: { type: Number, required: true, default: 0 }, // Quantity already allocated
        totalQuantity: { type: Number, required: true }, // Total quantity in batch
    },
    { timestamps: true }
);

module.exports = mongoose.model("FIFOStockAllocation", FIFOStockAllocationSchema);
