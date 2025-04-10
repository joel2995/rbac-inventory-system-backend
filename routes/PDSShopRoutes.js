const express = require("express");
const router = express.Router();
const pdsShopController = require("../controllers/PDSShopController");
const { protect, authorize } = require("../middleware/Auth");

// ✅ Apply Authentication Middleware
router.use(protect);

// 🔹 PDS Shop Routes (Only Admin & PDS Manager can access)
router.post("/", authorize("admin", "pds_manager", "godown_manager"), pdsShopController.addPDSShop);
router.get("/", authorize("admin", "pds_manager", "godown_manager"), pdsShopController.getPDSShops);
router.get("/:id", authorize("admin", "pds_manager", "godown_manager"), pdsShopController.getPDSShopById);
router.put("/:id", authorize("admin", "pds_manager", "godown_manager"), pdsShopController.updatePDSShop);
router.delete("/:id", authorize("admin", "pds_manager", "godown_manager"), pdsShopController.deletePDSShop);

module.exports = router;
