const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/VehicleController');
const { protect, authorize } = require('../middleware/Auth');

// Protected routes - Admin & Delivery Manager
router.use(protect);
router.post('/', authorize('admin', 'delivery_manager'), vehicleController.addVehicle);
router.get('/', authorize('admin', 'delivery_manager'), vehicleController.getVehicles);
router.get('/:id', authorize('admin', 'delivery_manager'), vehicleController.getVehicleById);
router.put('/:id', authorize('admin', 'delivery_manager'), vehicleController.updateVehicle);
router.delete('/:id', authorize('admin'), vehicleController.deleteVehicle);

module.exports = router;


