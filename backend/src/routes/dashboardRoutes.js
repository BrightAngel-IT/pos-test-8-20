const express = require('express');

const { requireAuth } = require('../middleware/auth');
const { getOverviewData } = require('../services/store');

const router = express.Router();

router.get('/overview', requireAuth, async (req, res, next) => {
  try {
    const overview = await getOverviewData(req.user, req.query.branch);
    res.json(overview);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
