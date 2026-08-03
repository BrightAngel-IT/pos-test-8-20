const express = require('express');
const router = express.Router();

/**
 * Return Routes
 * 
 * Handles returns from customers or to suppliers.
 */

const { requireAuth } = require('../middleware/auth');
const { createReturn, getReturns, settleReturn } = require('../services/store');

router.get('/', requireAuth, async (req, res, next) => {
  try {
    // If fetching for a specific customer statement (entityId is present), bypass the branch filter 
    // so the statement is the exact same for Cashiers and Admins.
    const branchFilter = req.query.branch || (req.query.entityId ? null : (req.user.role !== 'super_admin' ? req.user.branch : null));
    const returns = await getReturns({ ...req.query, branch: branchFilter });
    res.json(returns);
  } catch (error) {
    console.error('Return Fetch Error:', error);
    next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const returnDoc = await createReturn({
      ...req.body,
      processedBy: req.user._id
    });
    res.status(201).json(returnDoc);
  } catch (error) {
    next(error);
  }
});

router.put('/:id/settle', requireAuth, async (req, res, next) => {
  try {
    const amount = req.body.amount;
    const updatedReturn = await settleReturn(req.params.id, amount);
    res.json(updatedReturn);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
