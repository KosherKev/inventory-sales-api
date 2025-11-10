const LocationUser = require('../models/LocationUser');

// Check if user has access to a specific location
exports.checkLocationAccess = async (req, res, next) => {
  try {
    const locationId = req.params.locationId || req.body.locationId;

    if (!locationId) {
      return res.status(400).json({
        success: false,
        message: 'Location ID is required'
      });
    }

    // Check if user has access to this location
    const locationUser = await LocationUser.findOne({
      userId: req.user._id,
      locationId: locationId
    });

    if (!locationUser) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this location'
      });
    }

    // Attach location user info to request
    req.locationUser = locationUser;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking location access',
      error: error.message
    });
  }
};

// Check specific permissions
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.locationUser || !req.locationUser.permissions[permission]) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission to ${permission.replace('can', '').toLowerCase()}`
      });
    }
    next();
  };
};
