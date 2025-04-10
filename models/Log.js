const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema(
    {
        action: { type: String, required: true },
        details: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true } // Automatically adds `createdAt` and `updatedAt`
);

module.exports = mongoose.model("Log", LogSchema);
