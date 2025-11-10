const Inventory = require('../models/Inventory');

// @desc    Add inventory item
// @route   POST /api/locations/:locationId/inventory
// @access  Private
exports.addInventoryItem = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { itemName, unitCost, quantity, description, sku, category } = req.body;

    const inventoryItem = await Inventory.create({
      locationId,
      itemName,
      unitCost,
      quantity,
      description,
      sku,
      category,
      addedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Inventory item added successfully',
      data: inventoryItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding inventory item',
      error: error.message
    });
  }
};

// @desc    Get all inventory for a location
// @route   GET /api/locations/:locationId/inventory
// @access  Private
exports.getInventory = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { isActive, category } = req.query;

    const filter = { locationId };

    // Default to active items when no isActive query is provided
    if (isActive !== undefined) {
      filter.isActive = String(isActive).toLowerCase() === 'true';
    } else {
      filter.isActive = true;
    }

    if (category) {
      filter.category = category;
    }

    const inventory = await Inventory.find(filter)
      .populate('addedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Calculate totals
    const totalValue = inventory.reduce((sum, item) => sum + item.totalCost, 0);
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);

    res.status(200).json({
      success: true,
      count: inventory.length,
      summary: {
        totalValue,
        totalItems
      },
      data: inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory',
      error: error.message
    });
  }
};

// @desc    Get single inventory item
// @route   GET /api/locations/:locationId/inventory/:itemId
// @access  Private
exports.getInventoryItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await Inventory.findById(itemId)
      .populate('addedBy', 'firstName lastName');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory item',
      error: error.message
    });
  }
};

// @desc    Update inventory item
// @route   PUT /api/locations/:locationId/inventory/:itemId
// @access  Private
exports.updateInventoryItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { itemName, unitCost, quantity, description, sku, category } = req.body;

    const item = await Inventory.findById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Update fields
    if (itemName !== undefined) item.itemName = itemName;
    if (unitCost !== undefined) item.unitCost = unitCost;
    if (quantity !== undefined) item.quantity = quantity;
    if (description !== undefined) item.description = description;
    if (sku !== undefined) item.sku = sku;
    if (category !== undefined) item.category = category;

    await item.save();

    res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully',
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating inventory item',
      error: error.message
    });
  }
};

// @desc    Delete inventory item (soft delete)
// @route   DELETE /api/locations/:locationId/inventory/:itemId
// @access  Private
exports.deleteInventoryItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await Inventory.findByIdAndUpdate(
      itemId,
      { isActive: false },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting inventory item',
      error: error.message
    });
  }
};
