/**
 * Module: database
 * 
 * Handles logic and operations for database.
 */

const mongoose = require('mongoose');

async function connectDatabase() {
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI not provided. Using in-memory demo store.');
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas.');
    return true;
  } catch (error) {
    console.warn('MongoDB connection failed. Falling back to in-memory demo store.');
    console.warn(error.message);
    return false;
  }
}

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

module.exports = {
  connectDatabase,
  isDatabaseReady,
};
