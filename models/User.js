const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ["admin", "godown_manager", "pds_shop_owner", "delivery_personnel", "beneficiary"],
        required: true,
    },
    contactnumber: { type: String, required: true },
    address: { type: String, required: true },

    assignedPDSShop: { type: mongoose.Schema.Types.ObjectId, ref: "PDSShop", required: false },
    assignedGodown: { type: mongoose.Schema.Types.ObjectId, ref: "Godown", required: false },
    assignedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: false },

}, { timestamps: true }); // Auto-adds createdAt & updatedAt

module.exports = mongoose.model("User", UserSchema);
