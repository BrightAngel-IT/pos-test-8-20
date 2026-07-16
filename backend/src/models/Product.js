const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    barcode: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    unit: { type: String, default: 'pcs' },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    latestPurchaseCost: { type: Number, default: 0, min: 0 },
    loyaltyDiscount: { type: Number, default: 0, min: 0 },
    quantityInStock: { type: Number, required: true, min: 0 },
    reorderLevel: { type: Number, default: 0, min: 0 },
    rack: {
      rowNumber: { type: Number, required: true, min: 1 },
      columnNumber: { type: Number, required: true, min: 1 },
      shelfNumber: { type: Number, default: 1, min: 1 },
    },
    image: { type: String, default: '' },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
