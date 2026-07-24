const express = require('express');

const { requireAuth } = require('../middleware/auth');
const { getOverviewData } = require('../services/store');

const router = express.Router();

/**
 * Dashboard Routes
 * 
 * Provides API endpoints for fetching high-level analytics and aggregate data 
 * used in the frontend dashboard views.
 */

// ==========================================
// FETCH DASHBOARD OVERVIEW DATA
// ==========================================
// GET /api/dashboard/overview
// Retrieves aggregate data (sales, inventory stats) scoped by the user's role and branch.
router.get('/overview', requireAuth, async (req, res, next) => {
  try {
    // getOverviewData handles the business logic of aggregating the stats
    const overview = await getOverviewData(req.user, req.query.branch);
    res.json(overview);
  } catch (error) {
    // Pass errors to the global error handler
    next(error);
  }
});

module.exports = router;
