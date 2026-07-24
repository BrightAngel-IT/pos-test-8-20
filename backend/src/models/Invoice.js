/**
 * Module: Invoice
 * 
 * Mongoose database schema and model definition for Invoice.
 */

// Invoice model
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  sales: [{
    sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true }
  }],
  date: { type: Date, default: Date.now },
  total: Number
});

module.exports = mongoose.model('Invoice', invoiceSchema);