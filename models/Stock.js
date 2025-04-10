const mongoose = require("mongoose");

const StockSchema = new mongoose.Schema(
    {
        godown: { type: mongoose.Schema.Types.ObjectId, ref: "Godown", required: function() { return !this.pdsShop; } },
        pdsShop: { type: mongoose.Schema.Types.ObjectId, ref: "PDSShop", required: function() { return !this.godown; } },
        rationItem: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 }
    },
    { timestamps: true } // Automatically adds `createdAt` and `updatedAt`
);

module.exports = mongoose.model("Stock", StockSchema);
