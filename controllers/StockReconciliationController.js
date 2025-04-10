const StockReconciliation = require("../models/StockReconciliation");
const Stock = require("../models/Stock");

// ✅ Perform Stock Reconciliation
exports.reconcileStock = async (req, res) => {
    try {
        const { godown, rationItem, recordedQuantity, verifiedBy } = req.body;

        // 🔹 Get system quantity
        const stock = await Stock.findOne({ godown, rationItem });
        if (!stock) {
            return res.status(404).json({ message: "Stock not found in the system" });
        }

        const systemQuantity = stock.quantity;
        const discrepancy = recordedQuantity !== systemQuantity;

        // 🔹 Create Reconciliation Report
        const reconciliation = await StockReconciliation.create({
            godown,
            rationItem,
            recordedQuantity,
            systemQuantity,
            discrepancy,
            verifiedBy
        });

        res.status(201).json({ status: "success", message: "Stock reconciled successfully", data: reconciliation });
    } catch (error) {
        res.status(500).json({ message: "Error reconciling stock", error: error.message });
    }
};

// ✅ Get All Reconciliation Reports
exports.getReconciliationReports = async (req, res) => {
    try {
        const reports = await StockReconciliation.find().populate("godown verifiedBy", "name location email role");
        res.status(200).json({ status: "success", data: reports });
    } catch (error) {
        res.status(500).json({ message: "Error fetching reports", error: error.message });
    }
};

// ✅ Get Reconciliation Report by ID
exports.getReconciliationById = async (req, res) => {
    try {
        const report = await StockReconciliation.findById(req.params.id).populate("godown verifiedBy", "name location email role");

        if (!report) {
            return res.status(404).json({ message: "Reconciliation report not found" });
        }

        res.status(200).json({ status: "success", data: report });
    } catch (error) {
        res.status(500).json({ message: "Error fetching reconciliation report", error: error.message });
    }
};
