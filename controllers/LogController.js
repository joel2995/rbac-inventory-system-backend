const Log = require("../models/Log");

// ✅ Create a New Log Entry
exports.createLog = async (req, res) => {
    try {
        const { action, details } = req.body;
        const user = req.user._id;

        if (!action || !details) {
            return res.status(400).json({ message: "Action and details are required!" });
        }

        const newLog = await Log.create({ action, details, user });

        res.status(201).json({
            status: "success",
            message: "Log entry created successfully!",
            data: newLog
        });
    } catch (error) {
        res.status(500).json({ message: "Error creating log", error: error.message });
    }
};

// ✅ Retrieve All Logs
exports.getLogs = async (req, res) => {
    try {
        const logs = await Log.find().populate("user", "name email role");

        res.status(200).json({
            status: "success",
            data: logs
        });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving logs", error: error.message });
    }
};

// ✅ Retrieve a Specific Log by ID
exports.getLogById = async (req, res) => {
    try {
        const log = await Log.findById(req.params.id).populate("user", "name email role");

        if (!log) {
            return res.status(404).json({ message: "Log not found" });
        }

        res.status(200).json({
            status: "success",
            data: log
        });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving log", error: error.message });
    }
};
