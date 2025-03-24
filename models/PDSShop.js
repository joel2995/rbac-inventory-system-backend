const mongoose = require("mongoose");

const PDSShopSchema = new mongoose.Schema({
  shopName: { type: String, required: true },
  location: { type: String, required: true },
  shopOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PDSShop", PDSShopSchema);
