const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const logger = require("./utils/Logger");

const authRoutes = require("./routes/AuthRoutes");
const stockRoutes = require("./routes/StockRoutes");
const deliveryRoutes = require("./routes/DeliveryRoutes");
const roleRoutes = require("./routes/RoleRoutes");
const vehicleRoutes = require("./routes/VehicleRoutes");
const pdsShopRoutes = require("./routes/PDSShopRoutes");
const godownRoutes = require("./routes/GodownRoutes");
const dashboardRoutes = require("./routes/DashBoardRoutes");
const logRoutes = require("./routes/LogRoutes");  // ✅ Tamper-Proof Logs
const stockReconciliationRoutes = require("./routes/StockReconciliationRoutes"); // ✅ Live Stock Reconciliation
const expiryAlertRoutes = require("./routes/ExpiryAlertRoutes"); // ✅ Expiry Alerts
const stockAgeTrackingRoutes = require("./routes/StockAgeTrackingRoutes"); // ✅ Stock Age Tracking
const limiter = require("./middleware/Ratelimit");
const fifoStockAllocationRoutes = require("./routes/FIFOStockAllocationRoutes"); // ✅ FIFO Stock Allocation
const vehicleTrackingRoutes = require("./routes/VehicleTrackingRoutes"); // ✅ Real-time Vehicle Tracking
const deliveryVerificationRoutes = require("./routes/DeliveryVerificationRoutes"); // ✅ OTP Delivery Verification
const tamperProofPackagingRoutes = require("./routes/TamperProofPackagingRoutes"); // ✅ Tamper-Proof Packaging with QR/Barcode
const enhancedVehicleTrackingRoutes = require("./routes/EnhancedVehicleTrackingRoutes"); // ✅ Enhanced GPS Tracking with Google Maps API


dotenv.config();
const app = express();

// ✅ Middleware
app.use(morgan("dev"));
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url} ${res.statusCode}`);
    next();
});
app.use(limiter);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Check if MONGO_URI is set
if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not defined. Please check your .env file.");
    process.exit(1);
}

// ✅ Routes
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/vehicle", vehicleRoutes);
app.use("/api/pdsShop", pdsShopRoutes);
app.use("/api/godowns", godownRoutes);
app.use("/api/logs", logRoutes);  // ✅ Tamper-Proof Logs
app.use("/api/stock-reconciliation", stockReconciliationRoutes); // ✅ Live Stock Reconciliation
app.use("/api/expiry-alerts", expiryAlertRoutes); // ✅ Expiry Alerts
app.use("/api/stock-age", stockAgeTrackingRoutes); // ✅ Stock Age Tracking
app.use("/api/fifo-allocation", fifoStockAllocationRoutes); 
app.use("/api/vehicle-tracking", vehicleTrackingRoutes); // ✅ Real-time Vehicle Tracking
app.use("/api/delivery-verification", deliveryVerificationRoutes); // ✅ OTP Delivery Verification 
app.use("/api/tamper-proof-packaging", tamperProofPackagingRoutes); // ✅ Tamper-Proof Packaging with QR/Barcode
app.use("/api/enhanced-tracking", enhancedVehicleTrackingRoutes); // ✅ Enhanced GPS Tracking with Google Maps API

// ✅ Global Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: err.status || "error",
        message: err.message || "Internal Server Error",
    });
});

// ✅ Database Connection
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    });

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ✅ Handle Unhandled Promise Rejections
process.on("unhandledRejection", (err) => {
    console.log("❌ UNHANDLED REJECTION! Shutting down...");
    console.log(err.name, err.message);
    process.exit(1);
});
