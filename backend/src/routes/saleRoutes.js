const express = require('express');

const { requireAuth } = require('../middleware/auth');
const { createSale, getRecentSales, getSales } = require('../services/store');

const router = express.Router();

/**
 * Sale Routes
 * 
 * Defines endpoints for fetching historical sales and creating new ones.
 * Integrates tightly with the store service to update inventory levels 
 * and generate invoices when a sale is finalized.
 */

// ==========================================
// FETCH SALES
// ==========================================
// GET /api/sales
// Fetches sales optionally filtered by date, specific cashier, or text query.
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { date, cashierId, query } = req.query;
    const sales = await getSales({ date, cashierId, query });
    res.json({ sales });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// CREATE NEW SALE (POS Checkout)
// ==========================================
// POST /api/sales
// Registers a new point-of-sale transaction, attaching the current user as the cashier.
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const sale = await createSale({
      ...req.body,
      cashier: req.user,
    });

    res.status(201).json({
      sale,
      message: 'Sale completed successfully.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
