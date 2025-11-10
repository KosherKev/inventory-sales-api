const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const { checkLocationAccess, checkPermission } = require('../middleware/locationAccess');
const purchaseOrderController = require('../controllers/purchaseOrderController');

// All routes require authentication and location access
router.use(protect);
router.use(checkLocationAccess);

router.route('/')
  .get(purchaseOrderController.getPurchaseOrders)
  .post(checkPermission('canManageInventory'), purchaseOrderController.createPurchaseOrder);

router.get('/:poId', purchaseOrderController.getPurchaseOrder);

router.patch('/:poId/receive', checkPermission('canManageInventory'), purchaseOrderController.receivePurchaseOrder);

module.exports = router;