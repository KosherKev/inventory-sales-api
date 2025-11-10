const Location = require('../models/Location');
const LocationUser = require('../models/LocationUser');

// @desc    Create a new location
// @route   POST /api/locations
// @access  Private
exports.createLocation = async (req, res) => {
  try {
    const { name, address, description } = req.body;

    // Create location
    const location = await Location.create({
      name,
      address,
      description,
      createdBy: req.user._id
    });

    // Automatically assign creator as owner
    await LocationUser.create({
      userId: req.user._id,
      locationId: location._id,
      role: 'owner',
      permissions: {
        canManageInventory: true,
        canAddSales: true,
        canViewReports: true,
        canManageUsers: true
      },
      assignedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating location',
      error: error.message
    });
  }
};

// @desc    Get all locations for current user
// @route   GET /api/locations
// @access  Private
exports.getLocations = async (req, res) => {
  try {
    // Get all locations user has access to
    const locationUsers = await LocationUser.find({ userId: req.user._id })
      .populate('locationId')
      .populate('userId', 'firstName lastName email');

    const locations = locationUsers
      .filter(lu => lu.locationId && lu.locationId.isActive)
      .map(lu => ({
        ...lu.locationId.toObject(),
        userRole: lu.role,
        permissions: lu.permissions
      }));

    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching locations',
      error: error.message
    });
  }
};

// @desc    Get single location
// @route   GET /api/locations/:locationId
// @access  Private
exports.getLocation = async (req, res) => {
  try {
    const { locationId } = req.params;

    const location = await Location.findById(locationId)
      .populate('createdBy', 'firstName lastName email');

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Get user's role and permissions for this location
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

    res.status(200).json({
      success: true,
      data: {
        ...location.toObject(),
        userRole: locationUser.role,
        permissions: locationUser.permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching location',
      error: error.message
    });
  }
};

// @desc    Update location
// @route   PUT /api/locations/:locationId
// @access  Private (Owner/Manager)
exports.updateLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { name, address, description } = req.body;

    const location = await Location.findByIdAndUpdate(
      locationId,
      { name, address, description },
      { new: true, runValidators: true }
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message
    });
  }
};

// @desc    Delete location (soft delete)
// @route   DELETE /api/locations/:locationId
// @access  Private (Owner only)
exports.deleteLocation = async (req, res) => {
  try {
    const { locationId } = req.params;

    const location = await Location.findByIdAndUpdate(
      locationId,
      { isActive: false },
      { new: true }
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting location',
      error: error.message
    });
  }
};
