/**
 * Module: Shift
 * 
 * Mongoose database schema and model definition for Cashier Shifts (Daily Worksheets).
 */

const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cashierName: { type: String, required: true },
    cashierUsername: { type: String, required: true },
    branch: { type: String, required: true },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    totals: {
      cash: { type: Number, default: 0 },
      card: { type: Number, default: 0 },
      credit: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    salesCount: { type: Number, default: 0 },
    date: { type: String, required: true }, // Format: YYYY-MM-DD for easier querying
  },
  {
    timestamps: true,
  }
);

// Add an index to prevent multiple open shifts for the same cashier
shiftSchema.index(
  { cashierId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'open' } }
);

module.exports = mongoose.models.Shift || mongoose.model('Shift', shiftSchema);
