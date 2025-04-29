const mongoose = require("mongoose");

const DeliveryVerificationSchema = new mongoose.Schema(
  {
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      required: true,
      unique: true
    },
    otp: {
      code: { type: String, required: true },
      generatedAt: { type: Date, default: Date.now },
      expiresAt: { type: Date, required: true },
      attempts: { type: Number, default: 0 },
      maxAttempts: { type: Number, default: 3 }
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "expired", "failed"],
      default: "pending"
    },
    verifiedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: { type: String },
      timestamp: { type: Date }
    },
    deliveryIntegrity: {
      isIntact: { type: Boolean },
      issues: [{
        description: { type: String },
        reportedAt: { type: Date, default: Date.now },
        reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        evidence: { type: String } // Could store image URLs or other evidence
      }]
    },
    signatureData: { type: String }, // Could store a base64 signature image
    notes: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryVerification", DeliveryVerificationSchema);