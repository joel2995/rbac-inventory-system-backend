const mongoose = require("mongoose");

const DeliverySchema = new mongoose.Schema(
    {
        vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
        driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        godown: { type: mongoose.Schema.Types.ObjectId, ref: "Godown", required: true },
        pdsShop: { type: mongoose.Schema.Types.ObjectId, ref: "PDSShop", required: true },
        rationItem: { type: String, required: true },
        quantity: { type: Number, required: true },
        departureTime: { type: Date },
        arrivalTime: { type: Date },
        status: { type: String, enum: ["pending", "in_transit", "delivered"], default: "pending" },
        assignedBy: { type: mongoose.Schema.Types.ObjectId, 
            ref: "User",
            required: false ,
        } // Tracks who created the delivery
    },
    { timestamps: true } // Automatically adds createdAt & updatedAt
);

module.exports = mongoose.model("Delivery", DeliverySchema);
