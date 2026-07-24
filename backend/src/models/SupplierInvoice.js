/**
 * Module: SupplierInvoice
 * 
 * Mongoose database schema and model definition for SupplierInvoice.
 */

const mongoose = require('mongoose');

const supplierInvoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    date: { type: Date, default: Date.now },
    totalAmount: { type: Number, required: true, min: 0 },
    balanceAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PAID', 'PARTIAL', 'UNPAID'],
      default: 'UNPAID',
    },
    branch: { type: String, default: 'Main Branch' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.SupplierInvoice || mongoose.model('SupplierInvoice', supplierInvoiceSchema);
