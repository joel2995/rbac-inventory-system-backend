const Stock = require("../models/Stock");
const Delivery = require("../models/Delivery");
const Godown = require("../models/Godown");
const PDSShop = require("../models/PDSShop");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");


exports.loadStockToGodowon = async (req , res)=>{
    try{
        const { godownId , itemName , quantity} = req.body;

        const stock = await Stock.create({ godown: godownId, itemName, quantity});
        res.status(201).json({
            status : 'success' , 
            data: stock
        });

    }
    catch(error){
        res.status(400).json({
            status : 'error', 
            message : error.message
        });
    }
};

exports.assignStockToPDS = async (req , res)=>{
    try{
        const { stockId , pdsShopId} = req.body;

        const stock = await Stock.findByIdAndUpdate(stockId);
        if(!stock|| stock.status!=='available'){
            return res.status(400).json({
                status : error , 
                message : 'Stock not available'

            });
        }
        stock.pdsShop = pdsShopId;
        stock.status = 'assigned';
        await stock.save();

        res.status(200).json({
            status : 'success' , 
            data : stock
        });
    }
    catch(error){
        res.status(400).json({
            status : 'error' , 
            message : error.message
        });
    }
};

exports.startDelivery = async (req, res) => {
    try {
      const { stockId, vehicleId, driverId } = req.body;
  
      const delivery = await Delivery.create({
        stock: stockId,
        vehicle: vehicleId,
        driver: driverId,
        departureTime: new Date(),
        status: 'in_transit'
      });
  
      res.status(201).json({ status: 'success', data: delivery });
    } catch (error) {
      res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.completeDelivery = async (req, res) => {
    try {
      const { deliveryId } = req.body;
      const delivery = await Delivery.findById(deliveryId);
      if (!delivery) {
        return res.status(400).json({ status: 'error', message: 'Delivery not found' });
      }
  
      delivery.arrivalTime = new Date();
      delivery.status = 'delivered';
      await delivery.save();
  
      
      await Stock.findByIdAndUpdate(delivery.stock, { status: 'delivered' });
  
      res.status(200).json({ status: 'success', data: delivery });
    } catch (error) {
      res.status(400).json({ status: 'error', message: error.message });
    }
};


exports.getBeneficiaryStock = async (req, res) => {
    try {
      const user = await User.findById(req.user.id).populate('assignedPDSShop');
      const stocks = await Stock.find({ pdsShop: user.assignedPDSShop._id, status: 'assigned' });
  
      res.status(200).json({ status: 'success', data: stocks });
    } catch (error) {
      res.status(400).json({ status: 'error', message: error.message });
    }
};
  

exports.getAllStocks = async (req, res) => {
    try {
      const stocks = await Stock.find().populate('godown pdsShop');
      res.status(200).json({ status: 'success', data: stocks });
    } catch (error) {
      res.status(400).json({ status: 'error', message: error.message });
    }
};
  
exports.getAllDeliveries = async (req, res) => {
    try {
      const deliveries = await Delivery.find().populate('vehicle stock driver');
      res.status(200).json({ status: 'success', data: deliveries });
    } catch (error) {
      res.status(400).json({ status: 'error', message: error.message });
    }
};
