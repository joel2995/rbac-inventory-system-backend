const mongoose = require("mongoose");

const StockAgeTrackingSchema = new mongoose.Schema(
    {
        batchNumber: { type: String, required: true, unique: true }, // Unique batch identifier
        rationItem: { type: String, required: true },
        godown: { type: mongoose.Schema.Types.ObjectId, ref: "Godown", required: true },
        arrivalDate: { type: Date, required: true }, // Date when stock was received
        priority: { type: Number, required: true }, // Lower value = higher priority (FIFO)
    },
    { timestamps: true }
);

module.exports = mongoose.model("StockAgeTracking", StockAgeTrackingSchema);
