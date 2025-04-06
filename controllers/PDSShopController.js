const PDSShop = require('../models/PDSShop');


exports.addPDSShop = async (req, res) => {
    try {
        const { shopName, location, shopOwner } = req.body;

        const newPDSShop = await PDSShop.create({
            shopName,
            location,
            shopOwner
        });

        res.status(201).json({
            status: 'success',
            data: { pdsShop: newPDSShop }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};


exports.getPDSShops = async (req, res) => {
    try {
        const pdsShops = await PDSShop.find().populate('shopOwner');

        res.status(200).json({
            status: 'success',
            data: { pdsShops }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};


exports.getPDSShopById = async (req, res) => {
    try {
        const pdsShop = await PDSShop.findById(req.params.id).populate('shopOwner');

        if (!pdsShop) {
            return res.status(404).json({
                status: 'error',
                message: 'PDS Shop not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { pdsShop }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};


exports.updatePDSShop = async (req, res) => {
    try {
        const { shopName, location, shopOwner } = req.body;

        const pdsShop = await PDSShop.findByIdAndUpdate(req.params.id, {
            shopName,
            location,
            shopOwner
        }, { new: true });

        if (!pdsShop) {
            return res.status(404).json({
                status: 'error',
                message: 'PDS Shop not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { pdsShop }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.deletePDSShop = async (req, res) => {
    try {
        const pdsShop = await PDSShop.findByIdAndDelete(req.params.id);

        if (!pdsShop) {
            return res.status(404).json({
                status: 'error',
                message: 'PDS Shop not found'
            });
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};
