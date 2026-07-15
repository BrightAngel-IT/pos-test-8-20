const express = require('express');

const { requireAuth } = require('../middleware/auth');
const { loginUser } = require('../services/store');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const session = await loginUser(username, password);

    return res.json(session);
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
