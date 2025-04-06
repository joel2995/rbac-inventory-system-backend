const Vehicle = require('../models/Vehicle');


exports.addVehicle = async (req, res) => {
    try {
        const { vehicleNumber, vehicleType, assignedDriver } = req.body;

        const newVehicle = await Vehicle.create({
            vehicleNumber,
            vehicleType,
            assignedDriver,
        });

        res.status(201).json({
            status: 'success',
            data: { vehicle: newVehicle }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

//
exports.getVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find().populate('assignedDriver');

        res.status(200).json({
            status: 'success',
            data: { vehicles }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.getVehicleById = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id).populate('assignedDriver');

        if (!vehicle) {
            return res.status(404).json({
                status: 'error',
                message: 'Vehicle not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { vehicle }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.updateVehicle = async (req, res) => {
    try {
        const { vehicleNumber, vehicleType, assignedDriver } = req.body;

        const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, {
            vehicleNumber,
            vehicleType,
            assignedDriver
        }, { new: true });

        if (!vehicle) {
            return res.status(404).json({
                status: 'error',
                message: 'Vehicle not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { vehicle }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};


exports.deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                status: 'error',
                message: 'Vehicle not found'
            });
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};
