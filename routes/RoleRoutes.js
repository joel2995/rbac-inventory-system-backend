const express = require("express");
const roleController = require("../controllers/RoleController");
const { protect, authorize } = require("../middleware/Auth");

const router = express.Router();

// ✅ All routes require authentication
router.use(protect);

// 🔹 Get all available roles
router.get("/", authorize("admin"), roleController.getRoles);

// 🔹 Get role of a specific user by ID
router.get("/:id", authorize("admin"), roleController.getRoleByUserId);

// 🔹 Assign role to a user (By User ID)
router.post("/:id", authorize("admin"), roleController.assignRole);

// 🔹 Update role of a user (By User ID)
router.put("/:id", authorize("admin"), roleController.updateRole);

// 🔹 Remove role (reset to "user") (By User ID)
router.delete("/:id", authorize("admin"), roleController.removeRole);

module.exports = router;
