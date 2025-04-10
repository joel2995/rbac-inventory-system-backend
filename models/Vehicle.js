const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, unique: true },
  vehicleType: { type: String, required: true },
  assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true } // Ensuring a driver is assigned
}, 
{ timestamps: true } // ✅ Automatically adds `createdAt` & `updatedAt`
);

module.exports = mongoose.model("Vehicle", VehicleSchema);
