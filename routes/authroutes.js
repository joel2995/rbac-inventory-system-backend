const express = require("express");
const authController = require("../controllers/AuthController");
const { protect, authorize } = require("../middleware/Auth");
const { validateUserRegistration } = require("../middleware/Validate");



const router = express.Router();

// Public Routes (No Authentication Required)
router.post("/register", validateUserRegistration, authController.register);
router.post("/login", authController.login);

// Protected Routes (Authentication Required)
router.get("/users", protect, authorize("admin"), authController.getUsers);
router.delete("/users/:id", protect, authorize("admin"), authController.deleteUser);

module.exports = router;
