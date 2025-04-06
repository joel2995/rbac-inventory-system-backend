const Delivery = require('../models/Delivery');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');


exports.assignDelivery = async (req, res) => {
    try {
        if (req.user.role !== "godown_manager") {
            return res.status(403).json({ message: "Unauthorized to assign delivery" });
        }

        const { stock, vehicle, pdsShop, departureTime } = req.body;

        const delivery = await Delivery.create({
            stock,
            vehicle,
            pdsShop,
            assignedBy: req.user._id,
            departureTime
        });

        res.status(201).json({
            status: "success",
            data: { delivery }
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getDeliveries = async (req, res) => {
    try {
        const deliveries = await Delivery.find()
            .populate('stock', 'itemName quantity')
            .populate('vehicle', 'vehicleNumber vehicleType')
            .populate('pdsShop', 'shopName location');

        res.status(200).json({
            status: "success",
            data: { deliveries }
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.updateDelivery = async (req, res) => {
    try {
        if (req.user.role !== "godown_manager") {
            return res.status(403).json({ message: "Unauthorized to update delivery" });
        }

        const delivery = await Delivery.findByIdAndUpdate(req.params.id, req.body, { new: true });

        res.status(200).json({
            status: "success",
            data: { delivery }
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.completeDelivery = async (req, res) => {
    try {
        if (req.user.role !== "delivery_personnel") {
            return res.status(403).json({ message: "Unauthorized to complete delivery" });
        }

        const delivery = await Delivery.findByIdAndUpdate(req.params.id, { arrivalTime: Date.now() }, { new: true });

        res.status(200).json({
            status: "success",
            message: "Delivery marked as completed",
            data: { delivery }
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteDelivery = async (req, res) => {
    try {
        const delivery = await Delivery.findByIdAndDelete(req.params.id);
        
        if (!delivery) {
            return res.status(404).json({
                status: "fail",
                message: "Delivery not found"
            });
        }

        res.status(200).json({
            status: "success",
            message: "Delivery deleted successfully"
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
