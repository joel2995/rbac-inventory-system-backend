const Stock = require("../models/Stock");

// ✅ Create Stock (Only 'godown_manager' can add stock)
exports.createStock = async (req, res) => {
    try {
        // Check user role
        if (req.user.role !== "godown_manager" && req.user.role !== "admin" && req.user.role !== "pds_shop_owner") {
            return res.status(403).json({ message: "Unauthorized. Only godown managers can add stock." });
        }

        const { godown, pdsShop, rationItem, quantity } = req.body;

        // ✅ Input validation
        if (!rationItem || !quantity) {
            return res.status(400).json({ message: "Ration item and quantity are required." });
        }

        // ✅ Create Stock
        const stock = await Stock.create({ godown, pdsShop, rationItem, quantity });

        res.status(201).json({ status: "success", message: "Stock added successfully", data: stock });

    } catch (error) {
        res.status(500).json({ message: "Error creating stock", error: error.message });
    }
};

// ✅ Retrieve All Stocks (Only 'admin', 'godown_manager', 'pds_shop_owner' can view)
exports.getStocks = async (req, res) => {
    try {
        // Fetch stocks and populate related fields
        const stocks = await Stock.find()
            .populate("godown", "godownName location")
            .populate("pdsShop", "shopName location");

        if (stocks.length === 0) {
            return res.status(404).json({ message: "No stock records found" });
        }

        res.status(200).json({ status: "success", data: stocks });

    } catch (error) {
        res.status(500).json({ message: "Error retrieving stocks", error: error.message });
    }
};

// ✅ Retrieve Stock by ID
exports.getStockById = async (req, res) => {
    try {
        const stock = await Stock.findById(req.params.id)
            .populate("godown", "godownName location")
            .populate("pdsShop", "shopName location");

        if (!stock) {
            return res.status(404).json({ message: "Stock not found" });
        }

        res.status(200).json({ status: "success", data: stock });

    } catch (error) {
        res.status(500).json({ message: "Error retrieving stock", error: error.message });
    }
};

// ✅ Update Stock (Only 'godown_manager' can update)
exports.updateStock = async (req, res) => {
    try {
        if (req.user.role !== "godown_manager" && req.user.role !== "admin" && req.user.role !== "pds_shop_owner") {
            return res.status(403).json({ message: "Unauthorized. Only godown managers can update stock." });
        }

        const updatedStock = await Stock.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!updatedStock) {
            return res.status(404).json({ message: "Stock not found" });
        }

        res.status(200).json({ status: "success", message: "Stock updated successfully", data: updatedStock });

    } catch (error) {
        res.status(500).json({ message: "Error updating stock", error: error.message });
    }
};

// ✅ Delete Stock (Only 'admin' can delete)
exports.deleteStock = async (req, res) => {
    try {
        if (req.user.role !== "godown_manager" && req.user.role !== "admin" && req.user.role !== "pds_shop_owner") {
            return res.status(403).json({ message: "Unauthorized. Only admin can delete stock." });
        }

        const stock = await Stock.findByIdAndDelete(req.params.id);

        if (!stock) {
            return res.status(404).json({ message: "Stock not found" });
        }

        res.status(200).json({ status: "success", message: "Stock deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: "Error deleting stock", error: error.message });
    }
};
