/**
 * Module: CustomerInvoice
 * 
 * Mongoose database schema and model definition for CustomerInvoice.
 */

const mongoose = require('mongoose');

const customerInvoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    date: { type: Date, default: Date.now },
    totalAmount: { type: Number, required: true, min: 0 },
    balanceAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PAID', 'PARTIAL', 'UNPAID'],
      default: 'UNPAID',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.CustomerInvoice || mongoose.model('CustomerInvoice', customerInvoiceSchema);
