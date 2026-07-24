/**
 * Module: Allocation
 * 
 * Mongoose database schema and model definition for Allocation.
 */

const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema(
  {
    paymentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true,
      refPath: 'paymentType'
    },
    paymentType: {
      type: String,
      required: true,
      enum: ['CustomerPayment', 'SupplierPayment']
    },
    invoiceId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true,
      refPath: 'invoiceType'
    },
    invoiceType: {
      type: String,
      required: true,
      enum: ['CustomerInvoice', 'SupplierInvoice']
    },
    allocatedAmount: { type: Number, required: true, min: 0 },
    allocationDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Allocation || mongoose.model('Allocation', allocationSchema);
