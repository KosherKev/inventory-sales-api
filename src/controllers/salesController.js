const DailySales = require('../models/DailySales');

// @desc    Add daily sales record
// @route   POST /api/locations/:locationId/sales
// @access  Private
exports.addDailySales = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { saleDate, totalSales, notes } = req.body;

    // Convert saleDate to start of day (midnight) for consistency
    const date = new Date(saleDate);
    date.setHours(0, 0, 0, 0);

    const salesRecord = await DailySales.create({
      locationId,
      saleDate: date,
      totalSales,
      notes,
      recordedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Daily sales record added successfully',
      data: salesRecord
    });
  } catch (error) {
    // Handle duplicate entry (same date for same location)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Sales record for this date already exists. Please update the existing record instead.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error adding daily sales record',
      error: error.message
    });
  }
};

// @desc    Get all sales for a location
// @route   GET /api/locations/:locationId/sales
// @access  Private
exports.getSales = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { startDate, endDate, limit = 30 } = req.query;

    const filter = { locationId };

    // Date range filter
    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) {
        filter.saleDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.saleDate.$lte = end;
      }
    }

    const sales = await DailySales.find(filter)
      .populate('recordedBy', 'firstName lastName')
      .sort({ saleDate: -1 })
      .limit(parseInt(limit));

    // Calculate total sales
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalSales, 0);

    res.status(200).json({
      success: true,
      count: sales.length,
      summary: {
        totalRevenue
      },
      data: sales
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sales records',
      error: error.message
    });
  }
};

// @desc    Get single sales record
// @route   GET /api/locations/:locationId/sales/:salesId
// @access  Private
exports.getSalesRecord = async (req, res) => {
  try {
    const { salesId } = req.params;

    const sale = await DailySales.findById(salesId)
      .populate('recordedBy', 'firstName lastName');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sales record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: sale
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sales record',
      error: error.message
    });
  }
};

// @desc    Update daily sales record
// @route   PUT /api/locations/:locationId/sales/:salesId
// @access  Private
exports.updateDailySales = async (req, res) => {
  try {
    const { salesId } = req.params;
    const { totalSales, notes } = req.body;

    const sale = await DailySales.findById(salesId);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sales record not found'
      });
    }

    // Update fields
    if (totalSales !== undefined) sale.totalSales = totalSales;
    if (notes !== undefined) sale.notes = notes;

    await sale.save();

    res.status(200).json({
      success: true,
      message: 'Sales record updated successfully',
      data: sale
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating sales record',
      error: error.message
    });
  }
};

// @desc    Delete daily sales record
// @route   DELETE /api/locations/:locationId/sales/:salesId
// @access  Private
exports.deleteDailySales = async (req, res) => {
  try {
    const { salesId } = req.params;

    const sale = await DailySales.findByIdAndDelete(salesId);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sales record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sales record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting sales record',
      error: error.message
    });
  }
};

// @desc    Get sales summary/analytics
// @route   GET /api/locations/:locationId/sales/summary
// @access  Private
exports.getSalesSummary = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { startDate, endDate } = req.query;

    const filter = { locationId };

    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.saleDate.$lte = end;
      }
    }

    const sales = await DailySales.find(filter).sort({ saleDate: 1 });

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalSales, 0);
    const averageDailySales = sales.length > 0 ? totalRevenue / sales.length : 0;

    // Get highest and lowest sales days
    const sortedSales = [...sales].sort((a, b) => b.totalSales - a.totalSales);
    const highestSalesDay = sortedSales[0] || null;
    const lowestSalesDay = sortedSales[sortedSales.length - 1] || null;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        averageDailySales,
        numberOfDays: sales.length,
        highestSalesDay: highestSalesDay ? {
          date: highestSalesDay.saleDate,
          amount: highestSalesDay.totalSales
        } : null,
        lowestSalesDay: lowestSalesDay ? {
          date: lowestSalesDay.saleDate,
          amount: lowestSalesDay.totalSales
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating sales summary',
      error: error.message
    });
  }
};
