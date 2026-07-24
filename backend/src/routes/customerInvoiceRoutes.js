const express = require('express');
const router = express.Router();

/**
 * CustomerInvoice Routes
 * 
 * Manages invoices specifically bound to customers.
 */

const CustomerInvoice = require('../models/CustomerInvoice');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  const invoices = await CustomerInvoice.find().populate('customerId').sort({ date: -1 });
  res.json(invoices);
});

router.get('/customer/:customerId', requireAuth, async (req, res) => {
  const invoices = await CustomerInvoice.find({ customerId: req.params.customerId }).sort({ date: -1 });
  res.json(invoices);
});

module.exports = router;
