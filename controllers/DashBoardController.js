const Stock = require("../models/Stock");
const User = require("../models/User");

// ✅ Get Dashboard Overview Data
exports.getDashboardData = async (req, res) => {
    try {
        const totalStock = await Stock.countDocuments();
        const lowStock = await Stock.countDocuments({ quantity: { $lt: 5 } });
        const totalUsers = await User.countDocuments();
        const totalAdmins = await User.countDocuments({ role: "admin" });

        res.status(200).json({
            status: "success",
            data: {
                totalStock,
                lowStock,
                totalUsers,
                totalAdmins,
            },
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
};

// ✅ Get Stock Details for Dashboard
exports.getStockDetails = async (req, res) => {
    try {
        const stockDetails = await Stock.find().populate("godown pdsShop", "name location");
        
        res.status(200).json({
            status: "success",
            data: stockDetails,
        });
    } catch (error) {
        console.error("Error fetching stock details:", error);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
};

// ✅ Get User Statistics for Dashboard
exports.getUserStatistics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const adminCount = await User.countDocuments({ role: "admin" });
        const deliveryPersonnelCount = await User.countDocuments({ role: "delivery_personnel" });

        res.status(200).json({
            status: "success",
            data: {
                totalUsers,
                adminCount,
                deliveryPersonnelCount,
            },
        });
    } catch (error) {
        console.error("Error fetching user statistics:", error);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
};
