const express = require('express');

const { requireAuth } = require('../middleware/auth');
const { loginUser } = require('../services/store');

const router = express.Router();

/**
 * Authentication Routes
 * 
 * Handles user login and session verification endpoints.
 */

// ==========================================
// USER LOGIN
// ==========================================
// POST /api/auth/login
// Accepts username and password, returns a signed JWT session if valid.
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    // loginUser validates credentials and generates the JWT
    const session = await loginUser(username, password);

    return res.json(session);
  } catch (error) {
    return next(error);
  }
});

// ==========================================
// VERIFY SESSION / GET CURRENT USER
// ==========================================
// GET /api/auth/me
// Requires a valid JWT token. Returns the decoded user profile data.
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
