const express = require("express");
const router = express.Router();
const deliveryVerificationController = require("../controllers/DeliveryVerificationController");
const { protect, authorize } = require("../middleware/Auth");

// ✅ Apply Authentication Middleware
router.use(protect);

// 🔹 Generate OTP for delivery verification
router.post("/generate-otp", authorize("admin", "delivery_personnel", "pds_shop_owner"), deliveryVerificationController.generateDeliveryOTP);

// 🔹 Verify delivery with OTP
router.post("/verify-otp", authorize("admin", "delivery_personnel", "pds_shop_owner"), deliveryVerificationController.verifyDeliveryOTP);

// 🔹 Report delivery integrity issues
router.post("/report-issues", authorize("admin", "delivery_personnel", "pds_shop_owner"), deliveryVerificationController.reportIntegrityIssues);

// 🔹 Get verification details
router.get("/:deliveryId", authorize("admin", "delivery_personnel", "pds_shop_owner"), deliveryVerificationController.getVerificationDetails);

// 🔹 Get all verifications (admin only)
router.get("/", authorize("admin"), deliveryVerificationController.getAllVerifications);

module.exports = router;