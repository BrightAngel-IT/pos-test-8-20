const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { transferInventory, getTransfers } = require('../services/store');

const router = express.Router();

router.get('/', requireAuth, requireRole(['super_admin']), async (req, res, next) => {
  try {
    const transfers = await getTransfers();
    res.json(transfers);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requireRole(['super_admin']), async (req, res, next) => {
  try {
    const { sourceBranch, destBranch, products } = req.body;
    
    if (!sourceBranch || !destBranch || !products || products.length === 0) {
      return res.status(400).json({ message: 'Missing required fields for transfer.' });
    }

    if (sourceBranch === destBranch) {
      return res.status(400).json({ message: 'Source and destination branches must be different.' });
    }

    await transferInventory({ sourceBranch, destBranch, products });
    
    res.status(201).json({ message: 'Inventory transferred successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
