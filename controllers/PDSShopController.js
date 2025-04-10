const PDSShop = require("../models/PDSShop");
const User = require("../models/User");

// ✅ Add a New PDS Shop (Admin, PDS Manager & Godown Manager)
exports.addPDSShop = async (req, res) => {
    try {
        const { shopName, location, shopOwner } = req.body;

        // 🔹 Check if the logged-in user has permission to add a PDS Shop
        if (!["admin", "pds_manager", "godown_manager"].includes(req.user.role)) {
            return res.status(403).json({ message: "Unauthorized to add a PDS Shop" });
        }

        // 🔹 Ensure the provided Shop Owner exists & has the correct role
        const user = await User.findById(shopOwner);
        if (!user) {
            return res.status(404).json({ message: "Shop owner not found" });
        }
        if (user.role !== "pds_shop_owner" && user.role !== "admin" && user.role !== "godown_manager") {
            return res.status(400).json({ message: "Assigned shop owner must have the role 'pds_shop_owner'" });
        }

        // 🔹 Create new PDS Shop
        const newPDSShop = await PDSShop.create({ shopName, location, shopOwner });

        res.status(201).json({
            status: "success",
            message: "PDS Shop added successfully!",
            data: newPDSShop
        });
    } catch (error) {
        res.status(500).json({ message: "Error adding PDS Shop", error: error.message });
    }
};

// ✅ Retrieve All PDS Shops (Admin, PDS Manager & Godown Manager)
exports.getPDSShops = async (req, res) => {
    try {
        const pdsShops = await PDSShop.find().populate("shopOwner", "name email role");

        res.status(200).json({ status: "success", data: pdsShops });
    } catch (error) {
        res.status(500).json({ message: "Error fetching PDS Shops", error: error.message });
    }
};

// ✅ Retrieve a Single PDS Shop by ID (Admin, PDS Manager & Godown Manager)
exports.getPDSShopById = async (req, res) => {
    try {
        const pdsShop = await PDSShop.findById(req.params.id).populate("shopOwner", "name email role");

        if (!pdsShop) return res.status(404).json({ message: "PDS Shop not found" });

        res.status(200).json({ status: "success", data: pdsShop });
    } catch (error) {
        res.status(500).json({ message: "Error fetching PDS Shop", error: error.message });
    }
};

// ✅ Update PDS Shop (Admin, PDS Manager & Godown Manager)
exports.updatePDSShop = async (req, res) => {
    try {
        const { shopName, location, shopOwner } = req.body;

        // 🔹 Check if the logged-in user has permission to update a PDS Shop
        if (!["admin", "pds_manager", "godown_manager"].includes(req.user.role)) {
            return res.status(403).json({ message: "Unauthorized to update a PDS Shop" });
        }

        // 🔹 Validate if the new Shop Owner Exists & has the correct role
        if (shopOwner) {
            const user = await User.findById(shopOwner);
            if (!user) return res.status(404).json({ message: "Shop owner not found" });
            if (user.role !== "pds_shop_owner" && user.role !== "admin" && user.role !== "godown_manager") {
                return res.status(400).json({ message: "Assigned shop owner must have the role 'pds_shop_owner'" });
            }
        }

        // 🔹 Update the PDS Shop
        const updatedPDSShop = await PDSShop.findByIdAndUpdate(
            req.params.id, 
            { shopName, location, shopOwner }, 
            { new: true }
        ).populate("shopOwner", "name email role");

        if (!updatedPDSShop) return res.status(404).json({ message: "PDS Shop not found" });

        res.status(200).json({ status: "success", message: "PDS Shop updated successfully!", data: updatedPDSShop });
    } catch (error) {
        res.status(500).json({ message: "Error updating PDS Shop", error: error.message });
    }
};

// ✅ Delete PDS Shop (Only Admin & Godown Manager)
exports.deletePDSShop = async (req, res) => {
    try {
        // 🔹 Check if the logged-in user has permission to delete a PDS Shop
        if (!["admin", "godown_manager" , "pds_manager"].includes(req.user.role)) {
            return res.status(403).json({ message: "Unauthorized to delete a PDS Shop" });
        }

        const pdsShop = await PDSShop.findByIdAndDelete(req.params.id);
        if (!pdsShop) return res.status(404).json({ message: "PDS Shop not found" });

        res.status(200).json({ message: "PDS Shop deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting PDS Shop", error: error.message });
    }
};
