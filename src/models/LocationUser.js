const mongoose = require('mongoose');

const locationUserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'manager', 'staff'],
      default: 'staff'
    },
    permissions: {
      canManageInventory: {
        type: Boolean,
        default: true
      },
      canAddSales: {
        type: Boolean,
        default: true
      },
      canViewReports: {
        type: Boolean,
        default: true
      },
      canManageUsers: {
        type: Boolean,
        default: false
      }
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index - one user per location
locationUserSchema.index({ userId: 1, locationId: 1 }, { unique: true });
locationUserSchema.index({ locationId: 1 });

module.exports = mongoose.model('LocationUser', locationUserSchema);
