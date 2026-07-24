/**
 * Module: User
 * 
 * Mongoose database schema and model definition for User.
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['super_admin', 'admin', 'cashier'], default: 'cashier' },
    branch: { type: String, default: 'Main Branch' },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
