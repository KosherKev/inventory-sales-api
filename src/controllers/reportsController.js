const PurchaseOrder = require('../models/PurchaseOrder');
const PurchaseOrderLine = require('../models/PurchaseOrderLine');
const DailySales = require('../models/DailySales');
const Inventory = require('../models/Inventory');

// @desc    Profit/Loss summary for a date range
// @route   GET /api/locations/:locationId/reports/summary
// @access  Private
exports.getReportsSummary = async (req, res) => {
  try {
    const { locationId } = req.params;
    let { startDate, endDate } = req.query;

    // Default to current month if no range provided
    if (!startDate || !endDate) {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      startDate = startDate ? startDate : first.toISOString();
      endDate = endDate ? endDate : last.toISOString();
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Purchase Orders received in range
    const poFilter = {
      locationId,
      status: 'received',
      receivedAt: { $gte: start, $lte: end }
    };
    const purchaseOrders = await PurchaseOrder.find(poFilter).select('_id totalAmount totalItems');
    const poIds = purchaseOrders.map(po => po._id);
    const poLines = await PurchaseOrderLine.find({ purchaseOrderId: { $in: poIds } }).select('itemId quantity unitCost lineTotal');

    let totalItemsAdded = 0;
    let totalInventoryAddedCost = 0;
    let supposedRevenue = 0;
    let supposedProfit = 0;

    // Preload inventory pricing for items referenced in PO lines
    const itemIds = [...new Set(poLines.map(l => String(l.itemId)))];
    const inventories = await Inventory.find({ _id: { $in: itemIds }, locationId }).select('_id sellingPrice');
    const priceById = new Map(inventories.map(inv => [String(inv._id), inv.sellingPrice || 0]));

    for (const ln of poLines) {
      const qty = ln.quantity || 0;
      const unitCost = ln.unitCost || 0;
      const sellingPrice = priceById.get(String(ln.itemId)) || 0;
      totalItemsAdded += qty;
      totalInventoryAddedCost += ln.lineTotal || (qty * unitCost);
      supposedRevenue += qty * sellingPrice;
      supposedProfit += qty * (sellingPrice - unitCost);
    }

    // Actual sales from DailySales within range
    const salesFilter = { locationId, saleDate: { $gte: start, $lte: end } };
    const sales = await DailySales.find(salesFilter).select('totalSales paymentMethod');
    const actualSalesTotal = sales.reduce((sum, s) => sum + (s.totalSales || 0), 0);
    const cashSales = sales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + (s.totalSales || 0), 0);
    const momoSales = sales.filter(s => s.paymentMethod === 'momo').reduce((sum, s) => sum + (s.totalSales || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        range: { startDate: start, endDate: end },
        inventoryAdded: { totalItemsAdded, totalInventoryAddedCost },
        supposed: { supposedRevenue, supposedProfit },
        actualSales: { totalRevenue: actualSalesTotal, cash: cashSales, momo: momoSales }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating reports summary', error: error.message });
  }
};