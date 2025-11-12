const Inventory = require('../models/Inventory');
const InventoryMovement = require('../models/InventoryMovement');
const LocationUser = require('../models/LocationUser');

// @desc    Add inventory item
// @route   POST /api/locations/:locationId/inventory
// @access  Private
exports.addInventoryItem = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { itemName, unitCost, sellingPrice, quantity, description } = req.body;

    if (sellingPrice === undefined) {
      return res.status(400).json({ success: false, message: 'Selling price is required' });
    }

    const inventoryItem = await Inventory.create({
      locationId,
      itemName,
      unitCost,
      sellingPrice,
      quantity,
      description,
      addedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Inventory item added successfully',
      data: inventoryItem
    });
  } catch (error) {
    // Provide clearer feedback for common failure modes
    if (error && (error.name === 'ValidationError')) {
      const fieldErrors = Object.values(error.errors || {}).map(e => ({
        field: e.path,
        message: e.message,
        kind: e.kind,
        value: e.value
      }));
      console.error('Inventory ValidationError', { message: error.message, fieldErrors });
      return res.status(400).json({
        success: false,
        message: 'Validation failed when adding inventory item',
        error: error.message,
        details: { fieldErrors }
      });
    }
    // Handle invalid ObjectId casts (e.g., bad locationId or addedBy)
    if (error && (error.name === 'CastError')) {
      const castDetails = { path: error.path, value: error.value, kind: error.kind };
      console.error('Inventory CastError', castDetails);
      return res.status(400).json({
        success: false,
        message: 'Invalid identifier provided (locationId or related references)',
        error: error.message,
        details: castDetails
      });
    }
    // Handle unique index conflicts (e.g., Atlas may have a unique index on {locationId,itemName})
    if (error && (error.code === 11000 || String(error.message).includes('E11000'))) {
      const dupDetails = {
        indexName: error?.keyPattern ? Object.keys(error.keyPattern).join('_') : undefined,
        keyPattern: error?.keyPattern,
        keyValue: error?.keyValue,
        message: error.message
      };
      console.error('Inventory DuplicateKey', dupDetails);
      return res.status(409).json({
        success: false,
        message: 'An item with the same name already exists for this location',
        error: error.message,
        details: dupDetails
      });
    }
    console.error('Inventory Create Error', { name: error?.name, code: error?.code, message: error?.message });
    res.status(500).json({
      success: false,
      message: 'Error adding inventory item',
      error: error.message,
      details: { name: error?.name, code: error?.code }
    });
  }
};

// @desc    Get all inventory for a location (with pagination)
// @route   GET /api/locations/:locationId/inventory
// @access  Private
exports.getInventory = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { isActive, page = 1, limit = 25, sort = 'createdAt', order = 'desc', q } = req.query;

    const filter = { locationId };

    // Default to active items when no isActive query is provided
    if (isActive !== undefined) {
      filter.isActive = String(isActive).toLowerCase() === 'true';
    } else {
      filter.isActive = true;
    }

    if (q) {
      const regex = new RegExp(String(q), 'i');
      filter.$or = [{ itemName: regex }, { description: regex }];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const sortOrder = String(order).toLowerCase() === 'asc' ? 1 : -1;

    const total = await Inventory.countDocuments(filter);

    const inventory = await Inventory.find(filter)
      .populate('addedBy', 'firstName lastName')
      .sort({ [sort]: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Calculate totals (current page only and overall totalValue/totalItems for returned items)
    const totalValue = inventory.reduce((sum, item) => sum + item.totalCost, 0);
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);

    res.status(200).json({
      data: inventory,
      meta: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        limit: limitNum
      },
      summary: {
        totalValue,
        totalItems
      }
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INVENTORY_FETCH_ERROR',
        message: 'Error fetching inventory',
        details: error.message
      }
    });
  }
};

// @desc    Get inventory summary for a location
// @route   GET /api/locations/:locationId/inventory/summary
// @access  Private
exports.getInventorySummary = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { isActive, q } = req.query;

    const filter = { locationId };

    if (isActive !== undefined) {
      filter.isActive = String(isActive).toLowerCase() === 'true';
    } else {
      filter.isActive = true;
    }

    if (q) {
      const regex = new RegExp(String(q), 'i');
      filter.$or = [{ itemName: regex }, { description: regex }];
    }

    const items = await Inventory.find(filter).select('quantity totalCost');
    const totalValue = items.reduce((sum, item) => sum + item.totalCost, 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    res.status(200).json({
      data: {
        totalValue,
        totalItems
      }
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INVENTORY_SUMMARY_ERROR',
        message: 'Error fetching inventory summary',
        details: error.message
      }
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
    const { itemName, unitCost, sellingPrice, quantity, description } = req.body;

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
    if (sellingPrice !== undefined) item.sellingPrice = sellingPrice;
    if (quantity !== undefined) item.quantity = quantity;
    if (description !== undefined) item.description = description;

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

// @desc    Adjust inventory quantity (audit movement)
// @route   POST /api/locations/:locationId/inventory/:itemId/adjust
// @access  Private (Manage Inventory)
exports.adjustInventoryItem = async (req, res) => {
  try {
    const { locationId, itemId } = req.params;
    const { delta, reason } = req.body;

    const quantityDelta = parseInt(delta);
    if (isNaN(quantityDelta) || quantityDelta === 0) {
      return res.status(400).json({ success: false, message: 'Invalid delta. Provide a non-zero integer.' });
    }

    const item = await Inventory.findById(itemId);
    if (!item || String(item.locationId) !== String(locationId)) {
      return res.status(404).json({ success: false, message: 'Inventory item not found for this location' });
    }

    const beforeQuantity = item.quantity;
    const afterQuantity = beforeQuantity + quantityDelta;
    if (afterQuantity < 0) {
      return res.status(400).json({ success: false, message: 'Adjustment would result in negative quantity' });
    }

    item.quantity = afterQuantity;
    item.totalCost = item.unitCost * item.quantity;
    await item.save();

    const movement = await InventoryMovement.create({
      itemId: item._id,
      locationId: item.locationId,
      type: 'adjustment',
      quantityChange: quantityDelta,
      reason,
      performedBy: req.user._id,
      beforeQuantity,
      afterQuantity
    });

    res.status(200).json({
      success: true,
      message: 'Inventory adjusted successfully',
      data: { item, movement }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adjusting inventory', error: error.message });
  }
};

// @desc    Get low stock items for a location
// @route   GET /api/locations/:locationId/inventory/low-stock
// @access  Private
exports.getLowStock = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { page = 1, limit = 25 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const filter = {
      locationId,
      isActive: true,
      reorderThreshold: { $gt: 0 }
    };

    const total = await Inventory.countDocuments({
      ...filter,
      $expr: { $lte: ['$quantity', '$reorderThreshold'] }
    });

    const items = await Inventory.find({
      ...filter,
      $expr: { $lte: ['$quantity', '$reorderThreshold'] }
    })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.status(200).json({
      data: items,
      meta: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ error: { code: 'LOW_STOCK_ERROR', message: 'Error fetching low stock items', details: error.message } });
  }
};

// @desc    Transfer inventory to another location
// @route   POST /api/locations/:locationId/inventory/:itemId/transfer
// @access  Private (Manage Inventory)
exports.transferInventoryItem = async (req, res) => {
  try {
    const { locationId, itemId } = req.params;
    const { toLocationId, quantity, reason } = req.body;

    if (!toLocationId) {
      return res.status(400).json({ success: false, message: 'Destination location (toLocationId) is required' });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer' });
    }

    const sourceItem = await Inventory.findById(itemId);
    if (!sourceItem || String(sourceItem.locationId) !== String(locationId)) {
      return res.status(404).json({ success: false, message: 'Source inventory item not found for this location' });
    }
    if (sourceItem.quantity < qty) {
      return res.status(400).json({ success: false, message: 'Insufficient quantity to transfer' });
    }

    // Verify user has access and permission to manage inventory at destination location
    const destAccess = await LocationUser.findOne({ userId: req.user._id, locationId: toLocationId });
    if (!destAccess || !destAccess.permissions?.canManageInventory) {
      return res.status(403).json({ success: false, message: 'You do not have permission to manage inventory at the destination location' });
    }

    // Find or create destination item by name
    let destItem = await Inventory.findOne({ locationId: toLocationId, itemName: sourceItem.itemName });
    if (!destItem) {
      destItem = await Inventory.create({
        locationId: toLocationId,
        itemName: sourceItem.itemName,
        unitCost: sourceItem.unitCost,
        sellingPrice: sourceItem.sellingPrice,
        quantity: 0,
        description: sourceItem.description,
        isActive: true,
        addedBy: req.user._id
      });
    }

    // Adjust quantities
    const sourceBefore = sourceItem.quantity;
    const destBefore = destItem.quantity;

    sourceItem.quantity = sourceItem.quantity - qty;
    sourceItem.totalCost = sourceItem.unitCost * sourceItem.quantity;
    await sourceItem.save();

    destItem.quantity = destItem.quantity + qty;
    destItem.totalCost = destItem.unitCost * destItem.quantity;
    await destItem.save();

    // Record movements for audit
    const srcMovement = await InventoryMovement.create({
      itemId: sourceItem._id,
      locationId: sourceItem.locationId,
      type: 'transfer',
      quantityChange: -qty,
      reason,
      performedBy: req.user._id,
      beforeQuantity: sourceBefore,
      afterQuantity: sourceItem.quantity,
      transferLocationId: toLocationId
    });

    const destMovement = await InventoryMovement.create({
      itemId: destItem._id,
      locationId: destItem.locationId,
      type: 'transfer',
      quantityChange: qty,
      reason,
      performedBy: req.user._id,
      beforeQuantity: destBefore,
      afterQuantity: destItem.quantity,
      transferLocationId: locationId
    });

    res.status(200).json({
      success: true,
      message: 'Inventory transferred successfully',
      data: {
        sourceItem,
        destItem,
        movements: { source: srcMovement, destination: destMovement }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error transferring inventory', error: error.message });
  }
};

// @desc    List movements for an inventory item
// @route   GET /api/locations/:locationId/inventory/:itemId/movements
// @access  Private
exports.getInventoryMovements = async (req, res) => {
  try {
    const { locationId, itemId } = req.params;
    const { page = 1, limit = 25 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const filter = { itemId, locationId };
    const total = await InventoryMovement.countDocuments(filter);
    const movements = await InventoryMovement.find(filter)
      .populate('performedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.status(200).json({
      data: movements,
      meta: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ error: { code: 'MOVEMENTS_LIST_ERROR', message: 'Error fetching movements', details: error.message } });
  }
};
