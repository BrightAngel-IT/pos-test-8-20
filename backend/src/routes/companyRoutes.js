const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getCompany, updateCompany } = require('../services/store');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * Company Routes
 * 
 * Handles the retrieval and updating of the global company/store settings, 
 * including the store name, contact info, and logo.
 */

// ==========================================
// GET COMPANY INFO
// ==========================================
// GET /api/company
// Public route to get company info (needed for the login page branding and receipt headers)
router.get('/', async (req, res, next) => {
  try {
    const company = await getCompany();
    res.json(company);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// UPDATE COMPANY INFO
// ==========================================
// POST /api/company
// Admin only route to update company settings. Also handles logo image uploads.
router.post('/', requireAuth, requireRole(['admin']), upload.single('logo'), async (req, res, next) => {
  try {
    const payload = { ...req.body };
    // If a new logo was uploaded via Multer, append the path to the payload
    if (req.file) {
      payload.logo = `/uploads/${req.file.filename}`;
    }
    const company = await updateCompany(payload);
    res.json(company);
  } catch (error) {
    next(error);
  }
});

module.exports = router;