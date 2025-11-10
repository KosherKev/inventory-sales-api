const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  addDailySales,
  getSales,
  getSalesRecord,
  updateDailySales,
  deleteDailySales,
  getSalesSummary
} = require('../controllers/salesController');
const { protect } = require('../middleware/auth');
const { checkLocationAccess, checkPermission } = require('../middleware/locationAccess');

// All routes require authentication and location access
router.use(protect);
router.use(checkLocationAccess);

router.get('/summary', getSalesSummary);

router.route('/')
  .get(getSales)
  .post(checkPermission('canAddSales'), addDailySales);

router.route('/:salesId')
  .get(getSalesRecord)
  .put(checkPermission('canAddSales'), updateDailySales)
  .delete(checkPermission('canAddSales'), deleteDailySales);

module.exports = router;
