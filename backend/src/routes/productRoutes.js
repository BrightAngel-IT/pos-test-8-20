const express = require('express');

const { requireAuth, requireRole } = require('../middleware/auth');
const { getProducts, saveProduct, deleteProduct } = require('../services/store');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * Product Routes
 * 
 * Defines endpoints for managing inventory products. 
 * Includes logic for filtering by branch and role, as well as handling
 * image uploads and nested JSON fields (like warehouse rack locations).
 */

// ==========================================
// FETCH PRODUCTS (WITH FILTERS)
// ==========================================
// GET /api/products
// Returns a list of products. Can be filtered by query, category, and lowStock status.
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const filters = {
      query: req.query.q,
      category: req.query.category,
      lowStockOnly: req.query.lowStock === 'true',
    };

    if (req.user.role !== 'super_admin') {
      filters.branch = req.user.branch;
    } else if (req.query.branch) {
      filters.branch = req.query.branch;
    }

    const products = await getProducts(filters);

    res.json({ products });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// CREATE A NEW PRODUCT
// ==========================================
// POST /api/products
// Admin only. Also processes multipart/form-data for product images.
router.post('/', requireAuth, requireRole(['admin']), upload.single('image'), async (req, res, next) => {
  try {
    const payload = { ...req.body };

    // Handle nested rack object if sent as flattened FormData
    if (req.body['rack.rowNumber']) {
      payload.rack = {
        rowNumber: req.body['rack.rowNumber'],
        columnNumber: req.body['rack.columnNumber'],
        shelfNumber: req.body['rack.shelfNumber']
      };
    } else if (typeof req.body.rack === 'string') {
      try { payload.rack = JSON.parse(req.body.rack); } catch (e) { }
    }

    if (req.file) {
      payload.image = `/uploads/${req.file.filename}`;
    }

    const product = await saveProduct(payload);
    res.status(201).json({ product, message: 'Product created successfully.' });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// UPDATE A PRODUCT
// ==========================================
// PATCH /api/products/:id
// Admin only. Also processes multipart/form-data for product images.
router.patch('/:id', requireAuth, requireRole(['admin']), upload.single('image'), async (req, res, next) => {
  try {
    const payload = { ...req.body };

    // Handle nested rack object if sent as flattened FormData
    if (req.body['rack.rowNumber']) {
      payload.rack = {
        rowNumber: req.body['rack.rowNumber'],
        columnNumber: req.body['rack.columnNumber'],
        shelfNumber: req.body['rack.shelfNumber']
      };
    } else if (typeof req.body.rack === 'string') {
      try { payload.rack = JSON.parse(req.body.rack); } catch (e) { }
    }

    if (req.file) {
      payload.image = `/uploads/${req.file.filename}`;
    }

    const product = await saveProduct({ ...payload, _id: req.params.id });
    res.json({ product, message: 'Product updated successfully.' });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// DELETE A PRODUCT
// ==========================================
// DELETE /api/products/:id
// Admin only.
router.delete('/:id', requireAuth, requireRole(['admin']), async (req, res, next) => {
  try {
    await deleteProduct(req.params.id);
    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
