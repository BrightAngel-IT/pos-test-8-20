/**
 * Module: Transfer
 * 
 * Mongoose database schema and model definition for Transfer.
 */

const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  sourceBranch: {
    type: String,
    required: true,
  },
  destBranch: {
    type: String,
    required: true,
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    }
  }],
  status: {
    type: String,
    default: 'COMPLETED'
  }
}, { timestamps: true });

module.exports = mongoose.model('Transfer', transferSchema);
