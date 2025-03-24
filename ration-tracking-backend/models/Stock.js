const mongoose = require("mongoose");

const StockSchema = new mongoose.Schema({
    godown: { type: mongoose.Schema.Types.ObjectId, ref: "Godown", required: false },
    pdsShop: { type: mongoose.Schema.Types.ObjectId, ref: "PDSShop", required: false },
    rationItem: { type: String, required: true },
    quantity: { type: Number, required: true },
    updatedAt: { type: Date, default: Date.now }
  


});

module.exports = mongoose.model("Stock" , StockSchema);
