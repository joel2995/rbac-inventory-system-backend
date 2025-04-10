const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/DeliveryController");
const { protect, authorize } = require("../middleware/Auth");



// ✅ Apply Authentication Middleware
router.use(protect);

// ✅ Define Delivery Routes
router.post("/", authorize("admin", "delivery_personnel" ), deliveryController.createDelivery);
router.get("/", authorize("admin",  "delivery_personnel"), deliveryController.getDeliveries);
router.get("/:id", authorize("admin", "delivery_personnel"), deliveryController.getDeliveryById);
router.put("/:id", authorize("admin", "delivery_personnel"), deliveryController.updateDelivery);
router.patch("/:id/complete", authorize("admin" , "delivery_personnel"), deliveryController.completeDelivery);
router.delete("/:id", authorize("admin" , "delivery_personnel"), deliveryController.deleteDelivery);

module.exports = router;
