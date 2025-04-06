const express = require("express");
const router = express.Router();
const { getDashboardData } = require("../controllers/DashBoardController");
const authMiddleware = require("../middleware/Authmiddleware");

router.get("/", authMiddleware, getDashboardData);

module.exports = router;
