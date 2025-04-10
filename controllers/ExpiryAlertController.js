const ExpiryAlert = require("../models/ExpiryAlert");
const Stock = require("../models/Stock");

// ✅ Generate Expiry Alerts
exports.generateExpiryAlerts = async (req, res) => {
    try {
        const { godown, rationItem, expiryDate } = req.body;

        // ✅ Validate if stock exists
        const stock = await Stock.findOne({ godown, rationItem });
        if (!stock) return res.status(404).json({ message: "Stock not found" });

        // ✅ Create expiry alert
        const alert = await ExpiryAlert.create({ godown, rationItem, expiryDate });

        res.status(201).json({ status: "success", message: "Expiry alert generated", data: alert });
    } catch (error) {
        res.status(500).json({ message: "Error generating expiry alert", error: error.message });
    }
};

// ✅ Get All Expiry Alerts
exports.getExpiryAlerts = async (req, res) => {
    try {
        const alerts = await ExpiryAlert.find().populate("godown", "godownName location");
        res.status(200).json({ status: "success", data: alerts });
    } catch (error) {
        res.status(500).json({ message: "Error fetching expiry alerts", error: error.message });
    }
};

// ✅ Get Expiry Alert by ID
exports.getExpiryAlertById = async (req, res) => {
    try {
        const alert = await ExpiryAlert.findById(req.params.id).populate("godown", "godownName location");

        if (!alert) return res.status(404).json({ message: "Expiry alert not found" });

        res.status(200).json({ status: "success", data: alert });
    } catch (error) {
        res.status(500).json({ message: "Error fetching expiry alert", error: error.message });
    }
};

// ✅ Mark Expiry Alert as Notified
exports.markAsNotified = async (req, res) => {
    try {
        const alert = await ExpiryAlert.findByIdAndUpdate(req.params.id, { alertStatus: "notified" }, { new: true });

        if (!alert) return res.status(404).json({ message: "Expiry alert not found" });

        res.status(200).json({ status: "success", message: "Alert marked as notified", data: alert });
    } catch (error) {
        res.status(500).json({ message: "Error updating alert", error: error.message });
    }
};
