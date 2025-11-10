const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    token: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    revoked: {
      type: Boolean,
      default: false
    },
    replacedByToken: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ token: 1 }, { unique: true });
refreshTokenSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);