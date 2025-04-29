const express = require("express");
const router = express.Router();
const enhancedVehicleTrackingController = require("../controllers/EnhancedVehicleTrackingController");
const { protect, authorize } = require("../middleware/Auth");

// ✅ Apply Authentication Middleware
router.use(protect);

// 🔹 Initialize enhanced tracking with traffic-aware routing and geofencing
router.post("/initialize", authorize("admin", "delivery_personnel"), enhancedVehicleTrackingController.initializeEnhancedTracking);

// 🔹 Update vehicle location with enhanced anomaly detection
router.post("/update-location", enhancedVehicleTrackingController.updateEnhancedVehicleLocation);

// 🔹 Get real-time tracking dashboard data
router.get("/dashboard/:id", authorize("admin", "delivery_personnel", "pds_shop_owner"), enhancedVehicleTrackingController.getTrackingDashboardData);

// 🔹 Verify checkpoint with package integrity check
router.post("/verify-checkpoint", authorize("admin", "delivery_personnel"), enhancedVehicleTrackingController.verifyCheckpointWithPackages);

// 🔹 Complete delivery with package verification
router.post("/complete", authorize("admin", "delivery_personnel", "pds_shop_owner"), enhancedVehicleTrackingController.completeDeliveryWithPackageVerification);

module.exports = router;