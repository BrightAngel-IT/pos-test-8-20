/**
 * Module: Sale
 * 
 * Mongoose database schema and model definition for Sale.
 */

const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    barcode: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: 0 },
    loyaltyDiscount: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
    rack: {
      rowNumber: { type: Number, required: true },
      columnNumber: { type: Number, required: true },
      shelfNumber: { type: Number, required: true },
    },
  },
  { _id: false },
);

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customerName: { type: String, default: 'Walk-in customer' },
    loyaltyCard: { type: String, default: '' },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'credit', 'split'],
      default: 'cash',
    },
    splitPayments: [
      {
        method: { type: String, enum: ['cash', 'card', 'credit'] },
        amount: { type: Number, required: true }
      }
    ],
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    items: { type: [saleItemSchema], default: [] },
    cashier: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true },
      username: { type: String, required: true },
    },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    branch: { type: String, default: 'Main Branch' },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.models.Sale || mongoose.model('Sale', saleSchema);
