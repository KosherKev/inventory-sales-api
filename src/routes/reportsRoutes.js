const express = require('express');
const router = express.Router({ mergeParams: true });
const { getReportsSummary } = require('../controllers/reportsController');
const { protect } = require('../middleware/auth');
const { checkLocationAccess } = require('../middleware/locationAccess');

// All routes require authentication and location access
router.use(protect);
router.use(checkLocationAccess);

router.get('/summary', getReportsSummary);

module.exports = router;