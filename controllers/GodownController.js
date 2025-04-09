const Godown = require("../models/Godown");
const User = require("../models/User");

// 🔹 Add a New Godown
exports.addGodown = async (req, res) => {
    try {
        const { godownName, location, manager } = req.body;

        // Ensure the assigned manager exists and is a godown_manager
        const user = await User.findById(manager);
        if (!user || user.role !== "godown_manager") {
            return res.status(400).json({ message: "Invalid manager ID or role" });
        }

        const newGodown = new Godown({ godownName, location, manager });
        await newGodown.save();

        res.status(201).json({ message: "Godown added successfully!", data: newGodown });
    } catch (error) {
        res.status(500).json({ message: "Error adding godown", error: error.message });
    }
};

// 🔹 Get All Godowns
exports.getGodowns = async (req, res) => {
    try {
        const godowns = await Godown.find().populate("manager", "name email");
        res.status(200).json({ status: "success", data: godowns });
    } catch (error) {
        res.status(500).json({ message: "Error fetching godowns", error: error.message });
    }
};

// 🔹 Get a Specific Godown by ID
exports.getGodownById = async (req, res) => {
    try {
        const godown = await Godown.findById(req.params.id).populate("manager", "name email");
        if (!godown) {
            return res.status(404).json({ message: "Godown not found" });
        }
        res.status(200).json({ status: "success", data: godown });
    } catch (error) {
        res.status(500).json({ message: "Error fetching godown", error: error.message });
    }
};

// 🔹 Update a Godown
exports.updateGodown = async (req, res) => {
    try {
        const { godownName, location, manager } = req.body;

        // Check if manager role is valid
        if (manager) {
            const user = await User.findById(manager);
            if (!user || user.role !== "godown_manager") {
                return res.status(400).json({ message: "Invalid manager ID or role" });
            }
        }

        const updatedGodown = await Godown.findByIdAndUpdate(req.params.id, 
            { godownName, location, manager }, 
            { new: true }
        ).populate("manager", "name email");

        if (!updatedGodown) {
            return res.status(404).json({ message: "Godown not found" });
        }

        res.status(200).json({ message: "Godown updated successfully!", data: updatedGodown });
    } catch (error) {
        res.status(500).json({ message: "Error updating godown", error: error.message });
    }
};

// 🔹 Delete a Godown
exports.deleteGodown = async (req, res) => {
    try {
        const godown = await Godown.findByIdAndDelete(req.params.id);
        if (!godown) {
            return res.status(404).json({ message: "Godown not found" });
        }

        res.status(200).json({ message: "Godown deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting godown", error: error.message });
    }
};
