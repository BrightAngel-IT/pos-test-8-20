const express = require('express');
const router = express.Router();

/**
 * Supplier Routes
 * 
 * Manages supplier profiles and vendor details.
 */

const Supplier = require('../models/Supplier');
const { requireAuth, requireRole } = require('../middleware/auth');

// CRUD routes for Supplier
router.get('/', requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
  const suppliers = await Supplier.find();
  res.json(suppliers);
});

router.get('/:id', requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  res.json(supplier);
});

router.post('/', requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
  const supplier = new Supplier(req.body);
  await supplier.save();
  res.json(supplier);
});

router.put('/:id', requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(supplier);
});

router.patch('/:id', requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(supplier);
});

router.delete('/:id', requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
  await Supplier.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
