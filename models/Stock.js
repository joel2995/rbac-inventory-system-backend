const mongoose = require("mongoose");

const StockSchema = new mongoose.Schema(
    {
        godown: { type: mongoose.Schema.Types.ObjectId, ref: "Godown" },
        pdsShop: { type: mongoose.Schema.Types.ObjectId, ref: "PDSShop" },
        rationItem: { type: String, required: true },
        quantity: { type: Number, required: true }
    },
    { timestamps: true } // Automatically adds `createdAt` and `updatedAt`
);

module.exports = mongoose.model("Stock", StockSchema);
