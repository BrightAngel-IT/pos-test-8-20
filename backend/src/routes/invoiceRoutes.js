const express = require('express');
const router = express.Router();

/**
 * Invoice Routes
 * 
 * Handles general invoice generation and retrieval.
 */

const Invoice = require('../models/Invoice');

// CRUD routes for Invoice
router.get('/', async (req, res) => {
  const invoices = await Invoice.find().populate('customer').populate('sales.sale');
  res.json(invoices);
});

router.post('/', async (req, res) => {
  const invoice = new Invoice(req.body);
  await invoice.save();
  res.json(invoice);
});

router.put('/:id', async (req, res) => {
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(invoice);
});

router.delete('/:id', async (req, res) => {
  await Invoice.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
