const express = require('express');
const router = express.Router();

/**
 * SupplierPayment Routes
 * 
 * Handles outbound payments to suppliers.
 */

const { 
  createSupplierPaymentWithAllocations, 
  getSupplierPaymentDetails,
  getSupplierPaymentsWithAllocations,
  getUnpaidSupplierInvoices 
} = require('../services/supplierPaymentService');
const SupplierPayment = require('../models/SupplierPayment');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { supplierId } = req.query;
    const filter = supplierId ? { supplierId } : {};
    const payments = await getSupplierPaymentsWithAllocations(filter);
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const payment = await createSupplierPaymentWithAllocations(req.body);
    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const payment = await getSupplierPaymentDetails(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
