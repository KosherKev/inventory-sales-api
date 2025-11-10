const express = require('express');
const router = express.Router();
const {
  createLocation,
  getLocations,
  getLocation,
  updateLocation,
  deleteLocation
} = require('../controllers/locationController');
const { protect } = require('../middleware/auth');
const { checkLocationAccess } = require('../middleware/locationAccess');

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getLocations)
  .post(createLocation);

router.route('/:locationId')
  .get(checkLocationAccess, getLocation)
  .put(checkLocationAccess, updateLocation)
  .delete(checkLocationAccess, deleteLocation);

module.exports = router;
