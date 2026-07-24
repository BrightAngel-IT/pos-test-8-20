const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { getBranches, saveBranch, deleteBranch } = require('../services/store');

/**
 * Branch Routes
 * 
 * Defines endpoints for managing physical store branches. 
 * While reading is open to all authenticated staff, creating/updating/deleting 
 * branches is strictly restricted to 'super_admin' roles.
 */

// ==========================================
// GET ALL BRANCHES
// ==========================================
// GET /api/branches - List all branches (all authenticated users can read)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const branches = await getBranches();
    res.json(branches);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// CREATE A BRANCH
// ==========================================
// POST /api/branches - Create a new branch (super_admin only)
router.post('/', requireAuth, requireRole(['super_admin']), async (req, res, next) => {
  try {
    const branch = await saveBranch(req.body);
    res.status(201).json({ branch, message: 'Branch created successfully.' });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// UPDATE A BRANCH
// ==========================================
// PUT /api/branches/:id - Update branch details (super_admin only)
router.put('/:id', requireAuth, requireRole(['super_admin']), async (req, res, next) => {
  try {
    const branch = await saveBranch({ ...req.body, _id: req.params.id });
    res.json({ branch, message: 'Branch updated successfully.' });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// DELETE A BRANCH
// ==========================================
// DELETE /api/branches/:id - Delete branch (super_admin only)
router.delete('/:id', requireAuth, requireRole(['super_admin']), async (req, res, next) => {
  try {
    await deleteBranch(req.params.id);
    res.json({ message: 'Branch deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
