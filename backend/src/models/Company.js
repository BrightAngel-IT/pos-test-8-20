/**
 * Module: Company
 * 
 * Mongoose database schema and model definition for Company.
 */

const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: 'Inventory System' },
    tagline: { type: String, default: 'Excellence in Management' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    logo: { type: String, default: '' }, // URL or path to logo
    watermark: { type: String, default: '' },
    loyaltyCardCode: { type: String, default: 'NILMA-2026-DISC295' },
    invoicePrefix: { type: String, default: 'C-INV-' },
    nextInvoiceNumber: { type: Number, default: 1000 },  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.models.Company || mongoose.model('Company', companySchema);