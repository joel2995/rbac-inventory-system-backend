const express = require("express");
const router = express.Router();
const vehicleTrackingController = require("../controllers/VehicleTrackingController");
const { protect, authorize } = require("../middleware/Auth");

// ✅ Apply Authentication Middleware
router.use(protect);

// 🔹 Initialize tracking for a delivery
router.post("/initialize", authorize("admin", "delivery_personnel"), vehicleTrackingController.initializeTracking);

// 🔹 Update vehicle location (secured with token, no auth required)
router.post("/update-location", vehicleTrackingController.updateVehicleLocation);

// 🔹 Verify checkpoint passage
router.post("/verify-checkpoint", authorize("admin", "delivery_personnel"), vehicleTrackingController.verifyCheckpoint);

// 🔹 Report suspicious activity or tampering
router.post("/report-tampering", authorize("admin", "delivery_personnel", "pds_shop_owner"), vehicleTrackingController.reportTampering);

// 🔹 Get tracking details
router.get("/:id", authorize("admin", "delivery_personnel", "pds_shop_owner"), vehicleTrackingController.getTrackingDetails);

// 🔹 Get all active trackings
router.get("/", authorize("admin", "delivery_personnel"), vehicleTrackingController.getAllActiveTrackings);

// 🔹 Complete delivery with OTP verification
router.post("/complete", authorize("admin", "delivery_personnel", "pds_shop_owner"), vehicleTrackingController.completeDeliveryWithOTP);

module.exports = router;