const Godown = require("../models/Godown");
const User = require("../models/User");

// ✅ Create a New Godown (Admin & Godown Manager)
exports.addGodown = async (req, res) => {
    try {
        const { godownName, location, manager } = req.body;

        // 🔹 Ensure Manager Exists & is Either Admin or Godown Manager
        const user = await User.findById(manager);
        if (!user || (user.role !== "godown_manager" && user.role !== "admin")) {
            return res.status(400).json({ message: "Invalid manager ID or role" });
        }

        const newGodown = await Godown.create({ godownName, location, manager });
        res.status(201).json({ message: "Godown added successfully!", data: newGodown });
    } catch (error) {
        res.status(500).json({ message: "Error adding godown", error: error.message });
    }
};

// ✅ Retrieve All Godowns (Admin & Godown Manager)
exports.getGodowns = async (req, res) => {
    try {
        const godowns = await Godown.find().populate("manager", "name email");
        res.status(200).json({ status: "success", data: godowns });
    } catch (error) {
        res.status(500).json({ message: "Error fetching godowns", error: error.message });
    }
};

// ✅ Retrieve a Single Godown by ID (Admin & Godown Manager)
exports.getGodownById = async (req, res) => {
    try {
        const godown = await Godown.findById(req.params.id).populate("manager", "name email");
        if (!godown) return res.status(404).json({ message: "Godown not found" });

        res.status(200).json({ status: "success", data: godown });
    } catch (error) {
        res.status(500).json({ message: "Error fetching godown", error: error.message });
    }
};

// ✅ Update Godown (Admin & Godown Manager)
exports.updateGodown = async (req, res) => {
    try {
        const { godownName, location, manager } = req.body;

        // 🔹 Ensure Manager Exists & is Either Admin or Godown Manager
        if (manager) {
            const user = await User.findById(manager);
            if (!user || (user.role !== "godown_manager" && user.role !== "admin")) {
                return res.status(400).json({ message: "Invalid manager ID or role" });
            }
        }

        const updatedGodown = await Godown.findByIdAndUpdate(
            req.params.id, 
            { godownName, location, manager }, 
            { new: true }
        ).populate("manager", "name email");

        if (!updatedGodown) return res.status(404).json({ message: "Godown not found" });

        res.status(200).json({ message: "Godown updated successfully!", data: updatedGodown });
    } catch (error) {
        res.status(500).json({ message: "Error updating godown", error: error.message });
    }
};

// ✅ Delete Godown (Admin & Godown Manager)
exports.deleteGodown = async (req, res) => {
    try {
        const godown = await Godown.findByIdAndDelete(req.params.id);
        if (!godown) return res.status(404).json({ message: "Godown not found" });

        res.status(200).json({ message: "Godown deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting godown", error: error.message });
    }
};
