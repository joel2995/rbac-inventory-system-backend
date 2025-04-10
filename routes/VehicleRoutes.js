const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/VehicleController");
const { protect, authorize } = require("../middleware/Auth");

// ✅ Apply Authentication Middleware
router.use(protect);

// 🔹 Vehicle Routes (Only Admin & Delivery Personnel)
router.post("/", authorize("admin", "delivery_personnel"), vehicleController.addVehicle);
router.get("/", authorize("admin", "delivery_personnel"), vehicleController.getVehicles);
router.get("/:id", authorize("admin", "delivery_personnel"), vehicleController.getVehicleById);
router.put("/:id", authorize("admin", "delivery_personnel"), vehicleController.updateVehicle);
router.delete("/:id", authorize("admin" , "delivery_personnel"), vehicleController.deleteVehicle);

module.exports = router;
