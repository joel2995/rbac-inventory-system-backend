const Vehicle = require("../models/Vehicle");
const User = require("../models/User");

// ✅ Add a New Vehicle (Only Admin & Delivery Personnel)
exports.addVehicle = async (req, res) => {
    try {
        // 🔹 Ensure the logged-in user has permission
        if (!["admin", "delivery_personnel"].includes(req.user.role)) {
            return res.status(403).json({ message: "Unauthorized to add a vehicle" });
        }

        const { vehicleNumber, vehicleType, assignedDriver } = req.body;

        // 🔹 Check if assigned driver exists & has the correct role
        const driver = await User.findById(assignedDriver);
        if (!driver || driver.role !== "delivery_personnel") {
            return res.status(400).json({ message: "Invalid driver ID or role" });
        }

        // 🔹 Create new vehicle entry
        const newVehicle = await Vehicle.create({ vehicleNumber, vehicleType, assignedDriver });

        res.status(201).json({ 
            status: "success",
            message: "Vehicle added successfully!",
            data: newVehicle 
        });
    } catch (error) {
        res.status(500).json({ message: "Error adding vehicle", error: error.message });
    }
};

// ✅ Retrieve All Vehicles (Admin & Delivery Personnel)
exports.getVehicles = async (req, res) => {
    try {
        if (!["admin", "delivery_personnel"].includes(req.user.role)) {
            return res.status(403).json({ message: "Unauthorized to view vehicles" });
        }

        const vehicles = await Vehicle.find().populate("assignedDriver", "name email role");

        res.status(200).json({ status: "success", data: vehicles });
    } catch (error) {
        res.status(500).json({ message: "Error fetching vehicles", error: error.message });
    }
};

// ✅ Retrieve a Single Vehicle by ID (Admin & Delivery Personnel)
exports.getVehicleById = async (req, res) => {
    try {
        if (!["admin", "delivery_personnel"].includes(req.user.role)) {
            return res.status(403).json({ message: "Unauthorized to view vehicle details" });
        }

        const vehicle = await Vehicle.findById(req.params.id).populate("assignedDriver", "name email role");

        if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

        res.status(200).json({ status: "success", data: vehicle });
    } catch (error) {
        res.status(500).json({ message: "Error fetching vehicle", error: error.message });
    }
};

// ✅ Update Vehicle (Only Admin & Delivery Personnel)
exports.updateVehicle = async (req, res) => {
    try {
        if (!["admin", "delivery_personnel"].includes(req.user.role)) {
            return res.status(403).json({ message: "Unauthorized to update vehicle" });
        }

        const { vehicleNumber, vehicleType, assignedDriver } = req.body;

        // 🔹 Validate if assigned driver exists
        if (assignedDriver) {
            const driver = await User.findById(assignedDriver);
            if (!driver || driver.role !== "delivery_personnel") {
                return res.status(400).json({ message: "Invalid driver ID or role" });
            }
        }

        const updatedVehicle = await Vehicle.findByIdAndUpdate(
            req.params.id, 
            { vehicleNumber, vehicleType, assignedDriver }, 
            { new: true }
        ).populate("assignedDriver", "name email role");

        if (!updatedVehicle) return res.status(404).json({ message: "Vehicle not found" });

        res.status(200).json({ status: "success", message: "Vehicle updated successfully!", data: updatedVehicle });
    } catch (error) {
        res.status(500).json({ message: "Error updating vehicle", error: error.message });
    }
};

// ✅ Delete Vehicle (Only Admin)
exports.deleteVehicle = async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.role !== "delivery_personnel") {
            return res.status(403).json({ message: "Unauthorized to delete vehicle" });
        }

        const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
        if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

        res.status(200).json({ message: "Vehicle deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting vehicle", error: error.message });
    }
};
