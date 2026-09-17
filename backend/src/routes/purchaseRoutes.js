const express = require('express');
const router = express.Router();

/**
 * Purchase Routes
 * 
 * Handles inventory procurement and purchase orders.
 */

const { requireAuth } = require('../middleware/auth');
const { getPurchases, createPurchase } = require('../services/store');

// CRUD routes for Purchase
router.get('/', requireAuth, async (req, res) => {
  try {
    const branchFilter = req.query.branch || (req.user.role !== 'super_admin' ? req.user.branch : null);
    const purchases = await getPurchases({ branch: branchFilter });
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const branchName = req.user.role === 'super_admin' ? (req.body.branch || 'Main Branch') : (req.user?.branch || 'Main Branch');
    const purchase = await createPurchase({ ...req.body, branch: branchName });
    res.status(201).json(purchase);
  } catch (err) {
    console.error('Purchase creation error:', err);
    res.status(500).json({ message: 'Critical failure during procurement processing.' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const Purchase = require('../models/Purchase');
    const { isDatabaseReady } = require('../config/database');
    if (isDatabaseReady()) {
      const purchase = await Purchase.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(purchase);
    } else {
      const { memoryStore } = require('../services/store');
      const index = memoryStore.purchases.findIndex(p => String(p._id) === String(req.params.id));
      if (index >= 0) {
        memoryStore.purchases[index] = { ...memoryStore.purchases[index], ...req.body };
        res.json(memoryStore.purchases[index]);
      } else {
        res.status(404).json({ message: 'Purchase not found' });
      }
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const Purchase = require('../models/Purchase');
    const { isDatabaseReady } = require('../config/database');
    if (isDatabaseReady()) {
      await Purchase.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } else {
      const { memoryStore } = require('../services/store');
      memoryStore.purchases = memoryStore.purchases.filter(p => String(p._id) !== String(req.params.id));
      res.json({ success: true });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
