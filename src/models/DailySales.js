const mongoose = require('mongoose');

const dailySalesSchema = new mongoose.Schema(
  {
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    saleDate: {
      type: Date,
      required: [true, 'Sale date is required']
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'momo'],
      required: [true, 'Payment method is required']
    },
    totalSales: {
      type: Number,
      required: [true, 'Total sales amount is required'],
      min: [0, 'Total sales cannot be negative']
    },
    notes: {
      type: String,
      trim: true
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Allow multiple sale entries per day; remove unique constraint
// Index for querying recent sales
dailySalesSchema.index({ locationId: 1, saleDate: -1 });

module.exports = mongoose.model('DailySales', dailySalesSchema);
