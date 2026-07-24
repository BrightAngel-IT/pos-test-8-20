/**
 * Module: auth
 * 
 * Express middleware for auth operations (e.g., validation, auth, uploads).
 */

const jwt = require('jsonwebtoken');

const { getUserById } = require('../services/store');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is missing.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'inventory-demo-secret');
    const user = await getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User session is no longer valid.' });
    }

    req.user = user;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Authentication token is invalid.' });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have access to this resource.' });
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
