const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const { checkLocationAccess, checkPermission } = require('../middleware/locationAccess');
const supplierController = require('../controllers/supplierController');

// All routes require authentication and location access
router.use(protect);
router.use(checkLocationAccess);

router.route('/')
  .get(supplierController.getSuppliers)
  .post(checkPermission('canManageInventory'), supplierController.createSupplier);

router.route('/:supplierId')
  .get(supplierController.getSupplier)
  .put(checkPermission('canManageInventory'), supplierController.updateSupplier)
  .delete(checkPermission('canManageInventory'), supplierController.deleteSupplier);

module.exports = router;