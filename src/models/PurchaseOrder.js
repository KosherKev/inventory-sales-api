const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
  status: { type: String, enum: ['draft', 'submitted', 'received'], default: 'draft' },
  orderDate: { type: Date, default: Date.now },
  receivedAt: { type: Date },
  totalAmount: { type: Number, default: 0 },
  totalItems: { type: Number, default: 0 },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

purchaseOrderSchema.index({ locationId: 1, supplierId: 1, orderDate: -1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);