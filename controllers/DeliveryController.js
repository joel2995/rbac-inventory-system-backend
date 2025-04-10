const Delivery = require("../models/Delivery");
const Stock = require("../models/Stock");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");

// ✅ Create a Delivery (Assign Delivery)
exports.createDelivery = async (req, res) => {
    try {
        if (!["admin", "delivery_personnel"].includes(req.user.role)) {
            return res.status(403).json({ message: "Unauthorized to assign delivery" });
        }

        const { vehicle, driver, godown, pdsShop, rationItem, quantity } = req.body;

        // 🔹 Validate assigned driver
        const assignedDriver = await User.findById(driver);
        if (!assignedDriver || assignedDriver.role !== "delivery_personnel") {
            return res.status(400).json({ message: "Invalid driver ID or role" });
        }

        // 🔹 Check if stock is available in the godown
        const stock = await Stock.findOne({ godown, rationItem });
        if (!stock || stock.quantity < quantity) {
            return res.status(400).json({ message: "Insufficient stock in the godown" });
        }

        // 🔹 Deduct stock from the godown
        stock.quantity -= quantity;
        await stock.save();

        // 🔹 Create the delivery
        const delivery = await Delivery.create({
            vehicle,
            driver,
            godown,
            pdsShop,
            rationItem,
            quantity,
            departureTime: new Date(),
            status: "in_transit",
            assignedBy: req.user._id
        });

        res.status(201).json({ message: "Delivery created successfully!", data: delivery });
    } catch (error) {
        res.status(500).json({ message: "Error creating delivery", error: error.message });
    }
};

// ✅ Retrieve All Deliveries
exports.getDeliveries = async (req, res) => {
    try {
        const deliveries = await Delivery.find()
            .populate("vehicle driver godown pdsShop", "name email role");

        res.status(200).json({ status: "success", data: deliveries });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving deliveries", error: error.message });
    }
};

// ✅ Retrieve a Specific Delivery by ID
exports.getDeliveryById = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id)
            .populate("vehicle driver godown pdsShop", "name email role");

        if (!delivery) return res.status(404).json({ message: "Delivery not found" });

        res.status(200).json({ status: "success", data: delivery });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving delivery", error: error.message });
    }
};

// ✅ Update Delivery Status
// ✅ Update Delivery (Allow Quantity & Other Fields Updates)
exports.updateDelivery = async (req, res) => {
    try {
        if (!["admin", "delivery_personnel"].includes(req.user.role)) {
            return res.status(403).json({ message: "Unauthorized to update delivery" });
        }

        const { status, arrivalTime, vehicle, driver, godown, pdsShop, rationItem, quantity } = req.body;

        // 🔹 Find the existing delivery
        const delivery = await Delivery.findById(req.params.id);
        if (!delivery) return res.status(404).json({ message: "Delivery not found" });

        // 🔹 If updating quantity, check if stock is available
        if (quantity && quantity !== delivery.quantity) {
            const stock = await Stock.findOne({ godown: godown || delivery.godown, rationItem: rationItem || delivery.rationItem });
            if (!stock || stock.quantity + delivery.quantity < quantity) {
                return res.status(400).json({ message: "Insufficient stock in the godown to update quantity" });
            }

            // 🔹 Restore the old quantity to godown stock before updating
            stock.quantity += delivery.quantity;
            stock.quantity -= quantity;
            await stock.save();
        }

        // 🔹 Update the delivery fields
        delivery.status = status || delivery.status;
        delivery.arrivalTime = arrivalTime || delivery.arrivalTime;
        delivery.vehicle = vehicle || delivery.vehicle;
        delivery.driver = driver || delivery.driver;
        delivery.godown = godown || delivery.godown;
        delivery.pdsShop = pdsShop || delivery.pdsShop;
        delivery.rationItem = rationItem || delivery.rationItem;
        delivery.quantity = quantity || delivery.quantity;

        await delivery.save();

        res.status(200).json({ message: "Delivery updated successfully!", data: delivery });

    } catch (error) {
        res.status(500).json({ message: "Error updating delivery", error: error.message });
    }
};


// ✅ Mark Delivery as Completed & Update Stock at PDS Shop
// ✅ Mark Delivery as Completed & Update Stock at PDS Shop
exports.completeDelivery = async (req, res) => {
    try {
        if (!["admin", "delivery_personnel"].includes(req.user.role)) {
            return res.status(403).json({ message: "Unauthorized to complete delivery" });
        }

        const delivery = await Delivery.findById(req.params.id);
        if (!delivery) return res.status(404).json({ message: "Delivery not found" });

        // 🔹 Check if already delivered
        if (delivery.status === "delivered") {
            return res.status(400).json({ message: "This delivery is already marked as completed!" });
        }

        // 🔹 Get current time
        const currentTime = new Date();

        // 🔹 Check if arrivalTime exists & current time has passed arrivalTime
        if (!delivery.arrivalTime || currentTime < delivery.arrivalTime) {
            return res.status(400).json({
                message: "Delivery cannot be marked as completed yet. Arrival time has not been reached."
            });
        }

        // 🔹 Update status & arrival time
        delivery.status = "delivered";
        delivery.arrivalTime = req.body.arrivalTime || new Date();
        await delivery.save();

        // 🔹 Add stock to PDS shop
        let pdsStock = await Stock.findOne({ pdsShop: delivery.pdsShop, rationItem: delivery.rationItem });

        if (pdsStock) {
            pdsStock.quantity += delivery.quantity;
            await pdsStock.save();
        } else {
            await Stock.create({
                pdsShop: delivery.pdsShop,
                rationItem: delivery.rationItem,
                quantity: delivery.quantity
            });
        }

        res.status(200).json({ message: "Delivery marked as completed!", data: delivery });

    } catch (error) {
        res.status(500).json({ message: "Error completing delivery", error: error.message });
    }
};



// ✅ Delete Delivery (Admin & Delivery Personnel)
exports.deleteDelivery = async (req, res) => {
    try {
        if (!["admin", "delivery_personnel"].includes(req.user.role)) {
            return res.status(403).json({ message: "Unauthorized to delete delivery" });
        }

        const delivery = await Delivery.findByIdAndDelete(req.params.id);
        if (!delivery) return res.status(404).json({ message: "Delivery not found" });

        res.status(200).json({ message: "Delivery deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting delivery", error: error.message });
    }
};
