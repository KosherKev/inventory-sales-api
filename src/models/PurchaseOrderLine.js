const mongoose = require('mongoose');

const purchaseOrderLineSchema = new mongoose.Schema({
  purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, index: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  itemName: { type: String },
  sku: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  unitCost: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 }
}, { timestamps: true });

purchaseOrderLineSchema.index({ purchaseOrderId: 1 });

module.exports = mongoose.model('PurchaseOrderLine', purchaseOrderLineSchema);