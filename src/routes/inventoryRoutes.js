const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  addInventoryItem,
  getInventory,
  getInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');
const { checkLocationAccess, checkPermission } = require('../middleware/locationAccess');

// All routes require authentication and location access
router.use(protect);
router.use(checkLocationAccess);

router.route('/')
  .get(getInventory)
  .post(checkPermission('canManageInventory'), addInventoryItem);

router.route('/:itemId')
  .get(getInventoryItem)
  .put(checkPermission('canManageInventory'), updateInventoryItem)
  .delete(checkPermission('canManageInventory'), deleteInventoryItem);

module.exports = router;
