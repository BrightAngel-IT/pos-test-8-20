const express = require('express');
const router = express.Router();

/**
 * Payment Routes
 * 
 * Handles customer payments against their invoices.
 */

const { requireAuth } = require('../middleware/auth');
const { 
  createPaymentWithAllocations, 
  getPaymentDetails,
  getPaymentsWithAllocations,
  getUnpaidInvoices 
} = require('../services/paymentAllocationService');
const CustomerPayment = require('../models/CustomerPayment');

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { customerId } = req.query;
    const filter = customerId ? { customerId } : {};
    const payments = await getPaymentsWithAllocations(filter);
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const payment = await createPaymentWithAllocations(req.body);
    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const payment = await getPaymentDetails(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
