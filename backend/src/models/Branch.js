const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    location: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    manager: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Branch || mongoose.model('Branch', branchSchema);
