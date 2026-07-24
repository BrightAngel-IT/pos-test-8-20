/**
 * Module: Return
 * 
 * Mongoose database schema and model definition for Return.
 */

const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true }
}, { _id: false });

const returnSchema = new mongoose.Schema({
  returnNo: { type: String, required: true, unique: true },
  type: { type: String, enum: ['customer', 'supplier'], required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId }, // Customer or Supplier ID
  entityName: String,
  referenceNo: String, // Original Invoice Number
  items: [returnItemSchema],
  totalAmount: { type: Number, required: true },
  reason: String,
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  refundMethod: { type: String, enum: ['cash', 'credit-note', 'bank-transfer'], default: 'credit-note' },
  branch: { type: String, default: 'Main Branch' },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.models.Return || mongoose.model('Return', returnSchema);
