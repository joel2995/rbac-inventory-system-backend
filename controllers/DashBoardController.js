const Stock = require("../models/Stock"); 
const User = require("../models/User");

const getDashboardData = async (req, res) => {
    try {
        const totalStock = await Stock.countDocuments();
        const lowStock = await Stock.countDocuments({ quantity: { $lt: 5 } }); // Items below 5 units
        const totalUsers = await User.countDocuments();
        const totalAdmins = await User.countDocuments({ role: "admin" });

        res.status(200).json({
            totalStock,
            lowStock,
            totalUsers,
            totalAdmins,
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { getDashboardData };
