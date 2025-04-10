const express = require("express");
const authController = require("../controllers/AuthController");
const { protect, authorize } = require("../middleware/Auth");

const router = express.Router();

// ✅ Auth Routes (Remove Authorization from Register)
router.post("/register", authController.register);  // ✅ No protect or authorize
router.post("/login", authController.login);

// ✅ Apply Authorization only for other routes
router.get("/users", protect, authorize("admin"), authController.getUsers);
router.get("/users/:id", protect, authorize("admin"), authController.getUserById);
router.put("/users/:id", protect, authorize("admin"), authController.updateUserById);
router.delete("/users/:id", protect, authorize("admin"), authController.deleteUserById);

module.exports = router;
