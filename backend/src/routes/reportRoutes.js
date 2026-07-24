const express = require('express');

const { requireAuth, requireRole } = require('../middleware/auth');
const { getSalesReport } = require('../services/store');

const router = express.Router();

/**
 * Report Routes
 * 
 * Generates various financial and inventory reports.
 */

router.get('/sales', requireAuth, requireRole(['super_admin', 'admin']), async (req, res, next) => {
  try {
    const range = req.query.range || 'weekly';
    const branchFilter = req.query.branch || (req.user.role !== 'super_admin' ? req.user.branch : null);
    const report = await getSalesReport(range, branchFilter);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
