const express = require('express');
const router = express.Router();
const SupplierInvoice = require('../models/SupplierInvoice');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const branchFilter = req.query.branch || (req.user.role !== 'super_admin' ? req.user.branch : null);
    const query = branchFilter ? { branch: branchFilter } : {};
    const invoices = await SupplierInvoice.find(query).populate('supplierId').sort({ date: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/supplier/:supplierId', requireAuth, async (req, res) => {
  try {
    const branchFilter = req.query.branch || (req.user.role !== 'super_admin' ? req.user.branch : null);
    const query = { supplierId: req.params.supplierId };
    if (branchFilter) query.branch = branchFilter;
    const invoices = await SupplierInvoice.find(query).sort({ date: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
