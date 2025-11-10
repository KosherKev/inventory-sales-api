const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    type: {
      type: String,
      enum: ['adjustment', 'transfer', 'sale', 'receive'],
      required: true
    },
    quantityChange: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      trim: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    transferLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location'
    },
    beforeQuantity: {
      type: Number,
      required: true
    },
    afterQuantity: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

inventoryMovementSchema.index({ itemId: 1, locationId: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);