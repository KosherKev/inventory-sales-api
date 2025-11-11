const PurchaseOrder = require('../models/PurchaseOrder');
const PurchaseOrderLine = require('../models/PurchaseOrderLine');
const Supplier = require('../models/Supplier');
const Inventory = require('../models/Inventory');
const InventoryMovement = require('../models/InventoryMovement');

// @desc    Create purchase order with lines
// @route   POST /api/locations/:locationId/purchase-orders
// @access  Private (Manage Inventory)
exports.createPurchaseOrder = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { supplierId, orderDate, notes, lines } = req.body;

    if (!supplierId) return res.status(400).json({ success: false, message: 'supplierId is required' });
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ success: false, message: 'Purchase order must include at least one line' });
    }
    const supplier = await Supplier.findById(supplierId);
    if (!supplier || String(supplier.locationId) !== String(locationId)) {
      return res.status(404).json({ success: false, message: 'Supplier not found for this location' });
    }

    let totalAmount = 0;
    let totalItems = 0;
    const prepared = [];

    for (const ln of lines) {
      const qty = parseInt(ln.quantity);
      const unitCost = parseFloat(ln.unitCost);
      if (!ln.itemId || isNaN(qty) || qty <= 0 || isNaN(unitCost) || unitCost < 0) {
        return res.status(400).json({ success: false, message: 'Each line requires valid itemId, quantity (>0), and unitCost (>=0)' });
      }
      const inv = await Inventory.findById(ln.itemId);
      if (!inv || String(inv.locationId) !== String(locationId)) {
        return res.status(404).json({ success: false, message: `Inventory item ${ln.itemId} not found in this location` });
      }
      const lineTotal = qty * unitCost;
      totalAmount += lineTotal;
      totalItems += qty;
      prepared.push({ inv, qty, unitCost, lineTotal });
    }

    const po = await PurchaseOrder.create({
      locationId,
      supplierId,
      status: 'submitted',
      orderDate: orderDate ? new Date(orderDate) : new Date(),
      totalAmount,
      totalItems,
      notes,
      createdBy: req.user._id
    });

    const createdLines = [];
    for (const p of prepared) {
      const lineDoc = await PurchaseOrderLine.create({
        purchaseOrderId: po._id,
        itemId: p.inv._id,
        itemName: p.inv.itemName,
        quantity: p.qty,
        unitCost: p.unitCost,
        lineTotal: p.lineTotal
      });
      createdLines.push(lineDoc);
    }

    res.status(201).json({ success: true, data: { purchaseOrder: po, lines: createdLines } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating purchase order', error: error.message });
  }
};

// @desc    List purchase orders
// @route   GET /api/locations/:locationId/purchase-orders
// @access  Private
exports.getPurchaseOrders = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { page = 1, limit = 25, sort = 'orderDate', order = 'desc', status, supplierId } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const sortOrder = String(order).toLowerCase() === 'asc' ? 1 : -1;

    const filter = { locationId };
    if (status) filter.status = status;
    if (supplierId) filter.supplierId = supplierId;

    const total = await PurchaseOrder.countDocuments(filter);
    const purchaseOrders = await PurchaseOrder.find(filter)
      .populate('supplierId', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ [sort]: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.status(200).json({ data: purchaseOrders, meta: { total, page: pageNum, totalPages: Math.ceil(total / limitNum), limit: limitNum } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching purchase orders', error: error.message });
  }
};

// @desc    Get purchase order detail
// @route   GET /api/locations/:locationId/purchase-orders/:poId
// @access  Private
exports.getPurchaseOrder = async (req, res) => {
  try {
    const { poId } = req.params;
    const po = await PurchaseOrder.findById(poId)
      .populate('supplierId', 'name')
      .populate('createdBy', 'firstName lastName');
    if (!po) return res.status(404).json({ success: false, message: 'Purchase order not found' });
    const lines = await PurchaseOrderLine.find({ purchaseOrderId: po._id });
    res.status(200).json({ success: true, data: { purchaseOrder: po, lines } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching purchase order', error: error.message });
  }
};

// @desc    Receive purchase order: update inventory quantities and costs (moving average)
// @route   PATCH /api/locations/:locationId/purchase-orders/:poId/receive
// @access  Private (Manage Inventory)
exports.receivePurchaseOrder = async (req, res) => {
  try {
    const { poId } = req.params;
    const { receivedAt } = req.body;
    const po = await PurchaseOrder.findById(poId);
    if (!po) return res.status(404).json({ success: false, message: 'Purchase order not found' });
    if (po.status === 'received') {
      return res.status(400).json({ success: false, message: 'Purchase order already received' });
    }
    const lines = await PurchaseOrderLine.find({ purchaseOrderId: po._id });
    if (lines.length === 0) return res.status(400).json({ success: false, message: 'No lines to receive' });

    for (const ln of lines) {
      const inv = await Inventory.findById(ln.itemId);
      if (!inv || String(inv.locationId) !== String(po.locationId)) {
        return res.status(404).json({ success: false, message: `Inventory item ${ln.itemId} not found at PO location` });
      }
      const beforeQty = inv.quantity;
      const beforeCost = inv.unitCost;
      // New quantity after receiving
      const newQty = inv.quantity + ln.quantity;
      // Moving average unit cost
      const newUnitCost = newQty === 0 ? inv.unitCost : ((beforeQty * beforeCost) + (ln.quantity * ln.unitCost)) / newQty;

      inv.quantity = newQty;
      inv.unitCost = newUnitCost;
      inv.totalCost = inv.unitCost * inv.quantity;
      await inv.save();

      await InventoryMovement.create({
        itemId: inv._id,
        locationId: inv.locationId,
        type: 'receive',
        quantityChange: ln.quantity,
        reason: `PO ${po._id} received`,
        performedBy: req.user._id,
        beforeQuantity: beforeQty,
        afterQuantity: inv.quantity
      });
    }

    po.status = 'received';
    po.receivedAt = receivedAt ? new Date(receivedAt) : new Date();
    await po.save();

    res.status(200).json({ success: true, message: 'Purchase order received', data: { purchaseOrder: po } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error receiving purchase order', error: error.message });
  }
};