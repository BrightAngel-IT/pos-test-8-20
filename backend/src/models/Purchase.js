/**
 * Module: Purchase
 * 
 * Mongoose database schema and model definition for Purchase.
 */

// Purchase model
const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    costPrice: { type: Number, required: true }
  }],
  date: { type: Date, default: Date.now },
  branch: { type: String, default: 'Main Branch' },
  total: Number
});

module.exports = mongoose.model('Purchase', purchaseSchema);