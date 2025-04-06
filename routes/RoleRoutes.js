const express = require("express");
const roleController = require("../controllers/RoleController");
const { protect, authorize } = require("../middleware/Auth");  // Fixed Import

const router = express.Router();

router.get("/", protect, authorize("admin"), roleController.getRoles);
router.post("/", protect, authorize("admin"), roleController.createRole);
router.put("/:id", protect, authorize("admin"), roleController.updateRole);
router.delete("/:id", protect, authorize("admin"), roleController.deleteRole);

module.exports = router;
