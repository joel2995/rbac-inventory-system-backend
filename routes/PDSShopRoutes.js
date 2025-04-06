const express = require('express');
const router = express.Router();
const pdsShopController = require('../controllers/PDSShopController');
const { protect, authorize } = require('../middleware/Auth');


router.use(protect);
router.post('/', authorize('admin', 'pds_manager'), pdsShopController.addPdsShop);
router.get('/', authorize('admin', 'pds_manager', 'stock_manager'), pdsShopController.getPdsShops);
router.get('/:id', authorize('admin', 'pds_manager'), pdsShopController.getPdsShopById);
router.put('/:id', authorize('admin', 'pds_manager'), pdsShopController.updatePdsShop);
router.delete('/:id', authorize('admin'), pdsShopController.deletePdsShop);

module.exports = router;
