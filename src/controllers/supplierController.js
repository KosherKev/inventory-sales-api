const Supplier = require('../models/Supplier');

// @desc    Create supplier
// @route   POST /api/locations/:locationId/suppliers
// @access  Private (Manage Inventory)
exports.createSupplier = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { name, contactName, phone, email, address, notes } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Supplier name is required' });
    }
    const supplier = await Supplier.create({
      locationId,
      name,
      contactName,
      phone,
      email,
      address,
      notes,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating supplier', error: error.message });
  }
};

// @desc    Get suppliers (paginated)
// @route   GET /api/locations/:locationId/suppliers
// @access  Private
exports.getSuppliers = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { page = 1, limit = 25, q } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const filter = { locationId };
    if (q) {
      const regex = new RegExp(String(q), 'i');
      filter.$or = [{ name: regex }, { contactName: regex }, { notes: regex }];
    }

    const total = await Supplier.countDocuments(filter);
    const suppliers = await Supplier.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.status(200).json({ data: suppliers, meta: { total, page: pageNum, totalPages: Math.ceil(total / limitNum), limit: limitNum } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching suppliers', error: error.message });
  }
};

// @desc    Get supplier detail
// @route   GET /api/locations/:locationId/suppliers/:supplierId
// @access  Private
exports.getSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching supplier', error: error.message });
  }
};

// @desc    Update supplier
// @route   PUT /api/locations/:locationId/suppliers/:supplierId
// @access  Private (Manage Inventory)
exports.updateSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { name, contactName, phone, email, address, notes, isActive } = req.body;
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    if (name !== undefined) supplier.name = name;
    if (contactName !== undefined) supplier.contactName = contactName;
    if (phone !== undefined) supplier.phone = phone;
    if (email !== undefined) supplier.email = email;
    if (address !== undefined) supplier.address = address;
    if (notes !== undefined) supplier.notes = notes;
    if (isActive !== undefined) supplier.isActive = !!isActive;
    await supplier.save();
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating supplier', error: error.message });
  }
};

// @desc    Delete supplier
// @route   DELETE /api/locations/:locationId/suppliers/:supplierId
// @access  Private (Manage Inventory)
exports.deleteSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    await supplier.deleteOne();
    res.status(200).json({ success: true, message: 'Supplier deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting supplier', error: error.message });
  }
};