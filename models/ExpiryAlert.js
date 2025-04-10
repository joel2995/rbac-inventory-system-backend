const mongoose = require("mongoose");

const ExpiryAlertSchema = new mongoose.Schema(
    {
        rationItem: { type: String, required: true },
        godown: { type: mongoose.Schema.Types.ObjectId, ref: "Godown", required: true },
        expiryDate: { type: Date, required: true },
        alertStatus: { type: String, enum: ["pending", "notified"], default: "pending" }
    },
    { timestamps: true }
);

module.exports = mongoose.model("ExpiryAlert", ExpiryAlertSchema);
