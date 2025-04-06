const Stock = require("../models/Stock");

exports.createStock = async (req, res) => {
    try {
        const stock = await Stock.create(req.body);
        res.status(201).json(stock);
    } catch (error) {
        res.status(500).json({ message: "Error creating stock", error: error.message });
    }
};

exports.getStocks = async (req, res) => {
    try {
        const stocks = await Stock.find().populate("godown pdsShop");
        res.status(200).json(stocks);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving stocks", error: error.message });
    }
};

exports.getStockById = async (req, res) => {
    try {
        const stock = await Stock.findById(req.params.id).populate("godown pdsShop");
        if (!stock) {
            return res.status(404).json({ message: "Stock not found" });
        }
        res.status(200).json(stock);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving stock", error: error.message });
    }
};
