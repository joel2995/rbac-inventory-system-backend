const express = require("express");
const deliveryController = require("../controllers/DeliveryController");
const { protect, authorize } = require("../middleware/Auth");

const router = express.Router();

router.post("/", protect, authorize("admin", "delivery_manager"), deliveryController.createDelivery);
router.get("/", protect, deliveryController.getAllDeliveries);
router.get("/:id", protect, deliveryController.getDeliveryById);
router.put("/:id", protect, authorize("admin", "delivery_manager"), deliveryController.updateDelivery);
router.delete("/:id", protect, authorize("admin", "delivery_manager"), deliveryController.deleteDelivery);

module.exports = router;
