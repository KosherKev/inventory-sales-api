const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const { checkLocationAccess, checkPermission } = require('../middleware/locationAccess');
const salesOrderController = require('../controllers/salesOrderController');

// All routes require authentication and location access
router.use(protect);
router.use(checkLocationAccess);

// POST create order
router.post('/', checkPermission('canAddSales'), salesOrderController.createSalesOrder);

// List orders
router.get('/', salesOrderController.getSalesOrders);

// Summary
router.get('/summary', salesOrderController.getSalesOrdersSummary);

// Detail
router.get('/:orderId', salesOrderController.getSalesOrder);

module.exports = router;