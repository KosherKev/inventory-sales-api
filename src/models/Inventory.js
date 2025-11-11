const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true
    },
    unitCost: {
      type: Number,
      required: [true, 'Unit cost is required'],
      min: [0, 'Unit cost cannot be negative']
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },
    totalCost: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      trim: true
    },
    reorderThreshold: {
      type: Number,
      default: 0,
      min: [0, 'Reorder threshold cannot be negative']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Calculate totalCost before saving
inventorySchema.pre('save', function (next) {
  this.totalCost = this.unitCost * this.quantity;
  next();
});

// Indexes
inventorySchema.index({ locationId: 1, itemName: 1 });
inventorySchema.index({ locationId: 1, isActive: 1 });
// Removed SKU-related index after schema simplification

module.exports = mongoose.model('Inventory', inventorySchema);
