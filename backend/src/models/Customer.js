/**
 * Module: Customer
 * 
 * Mongoose database schema and model definition for Customer.
 */

// Customer model
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: String,
  address: String,
  email: String,
  phone: String,
  balance: { type: Number, default: 0 }
});

module.exports = mongoose.model('Customer', customerSchema);