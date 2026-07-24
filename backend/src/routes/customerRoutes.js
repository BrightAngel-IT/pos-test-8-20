const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { requireAuth } = require('../middleware/auth');

/**
 * Customer Routes
 * 
 * Defines the REST API endpoints for managing customers in the database.
 * All routes require the user to be authenticated via the `requireAuth` middleware.
 */

// ==========================================
// FETCH ALL CUSTOMERS
// ==========================================
// GET /api/customers
router.get('/', requireAuth, async (req, res) => {
  const customers = await Customer.find();
  res.json(customers);
});

// ==========================================
// FETCH A SINGLE CUSTOMER
// ==========================================
// GET /api/customers/:id
router.get('/:id', requireAuth, async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  res.json(customer);
});

// ==========================================
// CREATE A NEW CUSTOMER
// ==========================================
// POST /api/customers
router.post('/', requireAuth, async (req, res) => {
  const customer = new Customer(req.body);
  await customer.save();
  res.json(customer);
});

// ==========================================
// UPDATE A CUSTOMER (PUT)
// ==========================================
// PUT /api/customers/:id
// Overwrites or fully updates the customer record
router.put('/:id', requireAuth, async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(customer);
});

// ==========================================
// UPDATE A CUSTOMER (PATCH)
// ==========================================
// PATCH /api/customers/:id
// Partially updates the customer record
router.patch('/:id', requireAuth, async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(customer);
});

// ==========================================
// DELETE A CUSTOMER
// ==========================================
// DELETE /api/customers/:id
router.delete('/:id', requireAuth, async (req, res) => {
  await Customer.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
