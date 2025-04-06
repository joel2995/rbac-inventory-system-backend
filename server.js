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
const limiter = require("./middleware/Ratelimit");



dotenv.config();
const app = express();

app.use(morgan("dev"));
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url} ${res.statusCode}`);
    next();
});
app.use(limiter);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check if MONGO_URI is set
if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not defined. Please check your .env file.");
    process.exit(1);
}

app.use("/api/dashboard", require("./routes/DashBoardRoutes"));

app.use("/api/auth", authRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/vehicle", vehicleRoutes);
app.use("/api/pdsShop", pdsShopRoutes);

// Improved error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: err.status || "error",
        message: err.message || "Internal Server Error",
    });
});

// Database Connection
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => {
        console.error("MongoDB Connection Error:", err);
        process.exit(1);
    });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle Unhandled Promise Rejections
process.on("unhandledRejection", (err) => {
    console.log("UNHANDLED REJECTION! Shutting down...");
    console.log(err.name, err.message);
    process.exit(1);
});
