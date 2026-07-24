const mongoose = require('mongoose');

/**
 * Module: BranchStock
 * 
 * Mongoose database schema and model definition for BranchStock.
 */

const branchStockSchema = new mongoose.Schema(
  {
    branch: { type: String, required: true, trim: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantityInStock: { type: Number, required: true, default: 0, min: 0 },
    reorderLevel: { type: Number, required: true, default: 0, min: 0 },
    rack: {
      rowNumber: { type: Number, required: true, default: 1, min: 1 },
      columnNumber: { type: Number, required: true, default: 1, min: 1 },
      shelfNumber: { type: Number, required: true, default: 1, min: 1 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness of product stock per branch
branchStockSchema.index({ branch: 1, productId: 1 }, { unique: true });

module.exports = mongoose.models.BranchStock || mongoose.model('BranchStock', branchStockSchema);
