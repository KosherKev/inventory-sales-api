const SalesOrder = require('../models/SalesOrder');
const SalesOrderItem = require('../models/SalesOrderItem');
const Inventory = require('../models/Inventory');
const InventoryMovement = require('../models/InventoryMovement');

// @desc    Create a sales order with line items and deduct inventory
// @route   POST /api/locations/:locationId/sales-orders
// @access  Private (canAddSales)
exports.createSalesOrder = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { customerName, items, paymentMethod, paidAmount, notes, orderDate } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must include at least one item' });
    }
    if (!paymentMethod || paidAmount === undefined) {
      return res.status(400).json({ success: false, message: 'Payment method and paidAmount are required' });
    }

    // Validate items and compute totals
    const prepared = [];
    let totalAmount = 0;
    let itemsCount = 0;

    for (const it of items) {
      const qty = parseInt(it.quantity);
      const unitPrice = parseFloat(it.unitPrice);
      if (!it.itemId || isNaN(qty) || qty <= 0 || isNaN(unitPrice) || unitPrice < 0) {
        return res.status(400).json({ success: false, message: 'Each item requires valid itemId, quantity (>0), and unitPrice (>=0)' });
      }
      const inv = await Inventory.findById(it.itemId);
      if (!inv || String(inv.locationId) !== String(locationId)) {
        return res.status(404).json({ success: false, message: `Inventory item ${it.itemId} not found in this location` });
      }
      if (inv.quantity < qty) {
        return res.status(400).json({ success: false, message: `Insufficient stock for item '${inv.itemName}'` });
      }
      const lineTotal = qty * unitPrice;
      totalAmount += lineTotal;
      itemsCount += qty;
      prepared.push({ inv, qty, unitPrice, lineTotal });
    }

    // Create order header
    const order = await SalesOrder.create({
      locationId,
      orderDate: orderDate ? new Date(orderDate) : new Date(),
      customerName,
      itemsCount,
      totalAmount,
      paymentMethod,
      paidAmount,
      status: 'completed',
      notes,
      recordedBy: req.user._id
    });

    // Create items, deduct inventory, record movements
    const orderItems = [];
    for (const p of prepared) {
      const itemDoc = await SalesOrderItem.create({
        salesOrderId: order._id,
        itemId: p.inv._id,
        itemName: p.inv.itemName,
        unitPrice: p.unitPrice,
        quantity: p.qty,
        lineTotal: p.lineTotal
      });
      orderItems.push(itemDoc);

      const beforeQty = p.inv.quantity;
      p.inv.quantity = p.inv.quantity - p.qty;
      p.inv.totalCost = p.inv.unitCost * p.inv.quantity;
      await p.inv.save();

      await InventoryMovement.create({
        itemId: p.inv._id,
        locationId: p.inv.locationId,
        type: 'sale',
        quantityChange: -p.qty,
        reason: `Sales order ${order._id}`,
        performedBy: req.user._id,
        beforeQuantity: beforeQty,
        afterQuantity: p.inv.quantity
      });
    }

    res.status(201).json({ success: true, message: 'Sales order created', data: { order, items: orderItems } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating sales order', error: error.message });
  }
};

// @desc    List sales orders for a location
// @route   GET /api/locations/:locationId/sales-orders
// @access  Private
exports.getSalesOrders = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { startDate, endDate, page = 1, limit = 25, sort = 'orderDate', order = 'desc', q } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const sortOrder = String(order).toLowerCase() === 'asc' ? 1 : -1;

    const filter = { locationId };
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }
    if (q) {
      const regex = new RegExp(String(q), 'i');
      filter.$or = [{ customerName: regex }, { notes: regex }];
    }

    const total = await SalesOrder.countDocuments(filter);
    const orders = await SalesOrder.find(filter)
      .populate('recordedBy', 'firstName lastName')
      .sort({ [sort]: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalItems = orders.reduce((sum, o) => sum + o.itemsCount, 0);

    res.status(200).json({
      data: orders,
      meta: { total, page: pageNum, totalPages: Math.ceil(total / limitNum), limit: limitNum },
      summary: { totalRevenue, totalItems }
    });
  } catch (error) {
    res.status(500).json({ error: { code: 'SALES_ORDERS_LIST_ERROR', message: 'Error fetching sales orders', details: error.message } });
  }
};

// @desc    Get sales order detail
// @route   GET /api/locations/:locationId/sales-orders/:orderId
// @access  Private
exports.getSalesOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await SalesOrder.findById(orderId).populate('recordedBy', 'firstName lastName');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales order not found' });
    }
    const items = await SalesOrderItem.find({ salesOrderId: order._id });
    res.status(200).json({ success: true, data: { order, items } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching sales order', error: error.message });
  }
};

// @desc    Sales orders summary
// @route   GET /api/locations/:locationId/sales-orders/summary
// @access  Private
exports.getSalesOrdersSummary = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { startDate, endDate } = req.query;
    const filter = { locationId };
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    const orders = await SalesOrder.find(filter).select('totalAmount itemsCount orderDate');
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalItems = orders.reduce((sum, o) => sum + o.itemsCount, 0);
    const totalOrders = orders.length;

    res.status(200).json({ data: { totalRevenue, totalItems, totalOrders, startDate: startDate || null, endDate: endDate || null } });
  } catch (error) {
    res.status(500).json({ error: { code: 'SALES_ORDERS_SUMMARY_ERROR', message: 'Error fetching sales orders summary', details: error.message } });
  }
};