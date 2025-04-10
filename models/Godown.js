const mongoose = require("mongoose");

const GodownSchema = new mongoose.Schema({
  godownName: { type: String, required: true },
  location: { type: String, required: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

module.exports = mongoose.model("Godown", GodownSchema);
