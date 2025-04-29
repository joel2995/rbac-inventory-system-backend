const express = require("express");
const router = express.Router();
const tamperProofPackagingController = require("../controllers/TamperProofPackagingController");
const { protect, authorize } = require("../middleware/Auth");

// ✅ Apply Authentication Middleware
router.use(protect);

// 🔹 Create tamper-proof packaging for stock items in a delivery
router.post("/create", authorize("admin", "godown_manager"), tamperProofPackagingController.createPackaging);

// 🔹 Verify package integrity during transit
router.post("/verify", authorize("admin", "delivery_personnel", "pds_shop_owner"), tamperProofPackagingController.verifyPackageIntegrity);

// 🔹 Report package tampering
router.post("/report-tampering", authorize("admin", "delivery_personnel", "pds_shop_owner"), tamperProofPackagingController.reportTampering);

// 🔹 Get package details by packageId
router.get("/package/:packageId", authorize("admin", "godown_manager", "delivery_personnel", "pds_shop_owner"), tamperProofPackagingController.getPackageDetails);

// 🔹 Get all packages for a delivery
router.get("/delivery/:deliveryId", authorize("admin", "godown_manager", "delivery_personnel", "pds_shop_owner"), tamperProofPackagingController.getDeliveryPackages);

// 🔹 Scan package QR/barcode
router.post("/scan", authorize("admin", "godown_manager", "delivery_personnel", "pds_shop_owner"), tamperProofPackagingController.scanPackage);

// 🔹 Update package status on delivery completion
router.post("/complete", authorize("admin", "delivery_personnel", "pds_shop_owner"), tamperProofPackagingController.completePackageDelivery);

module.exports = router;