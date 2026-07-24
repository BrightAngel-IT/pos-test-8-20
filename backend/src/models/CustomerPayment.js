/**
 * Module: CustomerPayment
 * 
 * Mongoose database schema and model definition for CustomerPayment.
 */

const mongoose = require('mongoose');

const customerPaymentSchema = new mongoose.Schema(
  {
    paymentNo: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    paymentDate: { type: Date, default: Date.now },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CARD', 'CHEQUE', 'CREDIT_NOTE'],
      required: true,
    },
    chequeNumber: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.CustomerPayment || mongoose.model('CustomerPayment', customerPaymentSchema);