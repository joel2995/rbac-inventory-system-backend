const mongoose = require("mongoose");

const TamperProofPackagingSchema = new mongoose.Schema(
  {
    stock: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Stock", 
      required: true 
    },
    delivery: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Delivery", 
      required: true 
    },
    batchNumber: { 
      type: String, 
      required: true 
    },
    packageId: { 
      type: String, 
      required: true, 
      unique: true 
    },
    qrCode: { 
      type: String, 
      required: true 
    },
    barcode: { 
      type: String, 
      required: true 
    },
    sealIntact: { 
      type: Boolean, 
      default: true 
    },
    tamperEvidence: [{
      timestamp: { type: Date, default: Date.now },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: [Number] // [longitude, latitude]
      },
      reportedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
      },
      description: String,
      images: [String], // URLs to images showing tampering evidence
      verifiedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
      }
    }],
    securityFeatures: {
      tamperEvidentTape: { type: Boolean, default: true },
      securitySeals: { type: Boolean, default: true },
      rfidTag: { type: Boolean, default: false },
      other: [String]
    },
    verificationHistory: [{
      timestamp: { type: Date, default: Date.now },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: [Number] // [longitude, latitude]
      },
      verifiedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
      },
      status: {
        type: String,
        enum: ["intact", "suspicious", "compromised"],
        default: "intact"
      },
      notes: String
    }],
    currentStatus: {
      type: String,
      enum: ["sealed", "in_transit", "delivered", "compromised"],
      default: "sealed"
    }
  },
  { timestamps: true }
);

// Create index for geospatial queries on tamper evidence locations
TamperProofPackagingSchema.index({ "tamperEvidence.location": "2dsphere" });
TamperProofPackagingSchema.index({ "verificationHistory.location": "2dsphere" });

module.exports = mongoose.model("TamperProofPackaging", TamperProofPackagingSchema);