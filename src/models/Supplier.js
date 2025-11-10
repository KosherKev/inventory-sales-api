const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
  name: { type: String, required: true, trim: true },
  contactName: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  notes: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

supplierSchema.index({ locationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Supplier', supplierSchema);