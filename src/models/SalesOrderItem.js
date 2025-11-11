const mongoose = require('mongoose');

const salesOrderItemSchema = new mongoose.Schema(
  {
    salesOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      required: true
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative']
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    lineTotal: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

salesOrderItemSchema.index({ salesOrderId: 1 });

module.exports = mongoose.model('SalesOrderItem', salesOrderItemSchema);