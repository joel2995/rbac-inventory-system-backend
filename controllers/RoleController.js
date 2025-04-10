const User = require("../models/User");

// ✅ Get All Unique Roles from Users
exports.getRoles = async (req, res) => {
    try {
        const roles = await User.distinct("role"); 
        res.status(200).json({ status: "success", data: roles });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

// ✅ Get Role of a Specific User by ID
exports.getRoleByUserId = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("role");

        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ status: "success", data: { role: user.role } });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

// ✅ Assign a Role to a User (By User ID)
exports.assignRole = async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;

        if (!role) return res.status(400).json({ message: "Role is required" });

        const user = await User.findByIdAndUpdate(userId, { role }, { new: true, runValidators: true });

        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ status: "success", message: "Role assigned successfully", data: user });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

// ✅ Update an Existing User's Role (By User ID)
exports.updateRole = async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;

        if (!role) return res.status(400).json({ message: "Role is required" });

        const user = await User.findByIdAndUpdate(userId, { role }, { new: true, runValidators: true });

        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ status: "success", message: "User role updated successfully", data: user });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

// ✅ Remove a User's Role (Reset to "user" By User ID)
exports.removeRole = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findByIdAndUpdate(userId, { role: "user" }, { new: true });

        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ status: "success", message: "User role reset to 'user' successfully", data: user });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};
