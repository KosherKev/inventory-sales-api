const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  addInventoryItem,
  getInventory,
  getInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventorySummary,
  adjustInventoryItem,
  getLowStock,
  transferInventoryItem,
  getInventoryMovements
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');
const { checkLocationAccess, checkPermission } = require('../middleware/locationAccess');

// All routes require authentication and location access
router.use(protect);
router.use(checkLocationAccess);

// Summary endpoint
router.get('/summary', getInventorySummary);
// Low stock endpoint
router.get('/low-stock', getLowStock);

router.route('/')
  .get(getInventory)
  .post(checkPermission('canManageInventory'), addInventoryItem);

router.route('/:itemId')
  .get(getInventoryItem)
  .put(checkPermission('canManageInventory'), updateInventoryItem)
  .delete(checkPermission('canManageInventory'), deleteInventoryItem);

// Adjust item quantity
router.post('/:itemId/adjust', checkPermission('canManageInventory'), adjustInventoryItem);
// Transfer item to another location
router.post('/:itemId/transfer', checkPermission('canManageInventory'), transferInventoryItem);
// List movements
router.get('/:itemId/movements', getInventoryMovements);

module.exports = router;
