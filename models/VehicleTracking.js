const mongoose = require("mongoose");

const CheckpointSchema = new mongoose.Schema(
  {
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    name: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending", "verified", "missed"],
      default: "pending"
    },
    verificationCode: { type: String }, // Code used to verify passing through checkpoint
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: { type: String }
  },
  { _id: true }
);

const VehicleTrackingSchema = new mongoose.Schema(
  {
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      required: true
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    startLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: [Number] // [longitude, latitude]
    },
    endLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: [Number] // [longitude, latitude]
    },
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: [Number], // [longitude, latitude]
      lastUpdated: { type: Date, default: Date.now }
    },
    plannedRoute: {
      type: [{
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: [Number] // [longitude, latitude]
      }]
    },
    checkpoints: [CheckpointSchema],
    status: {
      type: String,
      enum: ["preparing", "in_transit", "delayed", "suspicious_activity", "completed", "cancelled"],
      default: "preparing"
    },
    deliveryOTP: { type: String }, // OTP for delivery verification
    otpVerified: { type: Boolean, default: false },
    expectedDeliveryTime: { type: Date },
    actualDeliveryTime: { type: Date },
    securityToken: { type: String }, // Token for secure updates from driver app
    lastCheckpointPassed: { type: Number, default: -1 }, // Index of last checkpoint passed
    anomalyDetected: { type: Boolean, default: false },
    anomalyDetails: { type: String },
    tamperAttempts: [{
      timestamp: { type: Date, default: Date.now },
      description: { type: String },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: [Number] // [longitude, latitude]
      }
    }]
  },
  { timestamps: true }
);

// Create index for geospatial queries
VehicleTrackingSchema.index({ "currentLocation": "2dsphere" });
VehicleTrackingSchema.index({ "checkpoints.location": "2dsphere" });

module.exports = mongoose.model("VehicleTracking", VehicleTrackingSchema);