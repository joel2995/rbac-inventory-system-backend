const express = require('express');
const router = express.Router();
const pdsShopController = require('../controllers/PDSShopController');
const { protect, authorize } = require('../middleware/Auth');


router.use(protect);
router.post('/', authorize('admin', 'pds_manager'), pdsShopController.addPDSShop);
router.get('/', authorize('admin', 'pds_manager', 'stock_manager'), pdsShopController.getPDSShops);
router.get('/:id', authorize('admin', 'pds_manager'), pdsShopController.getPDSShopById);
router.put('/:id', authorize('admin', 'pds_manager'), pdsShopController.updatePDSShop);
router.delete('/:id', authorize('admin'), pdsShopController.deletePDSShop);

module.exports = router;
