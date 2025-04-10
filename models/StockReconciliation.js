const mongoose = require("mongoose");

const StockReconciliationSchema = new mongoose.Schema(
  {
    godown: { type: mongoose.Schema.Types.ObjectId, ref: "Godown", required: true },
    rationItem: { type: String, required: true },
    recordedQuantity: { type: Number, required: true }, // Quantity as per manual check
    systemQuantity: { type: Number, required: true }, // Quantity in system
    discrepancy: { type: Boolean, default: false }, // True if there's a mismatch
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true } // Who performed reconciliation
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockReconciliation", StockReconciliationSchema);
