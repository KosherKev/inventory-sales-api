const mongoose = require('mongoose');

const salesOrderSchema = new mongoose.Schema(
  {
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    orderDate: {
      type: Date,
      default: () => new Date()
    },
    customerName: {
      type: String,
      trim: true
    },
    itemsCount: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative']
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'mobile', 'mixed'],
      required: true
    },
    paidAmount: {
      type: Number,
      required: true,
      min: [0, 'Paid amount cannot be negative']
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'canceled'],
      default: 'completed'
    },
    notes: {
      type: String,
      trim: true
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

salesOrderSchema.index({ locationId: 1, orderDate: -1 });

module.exports = mongoose.model('SalesOrder', salesOrderSchema);