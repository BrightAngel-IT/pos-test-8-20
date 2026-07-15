const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getUsers, saveUser, deleteUser } = require('../services/store');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['super_admin', 'admin']));

router.get('/', async (req, res, next) => {
  try {
    const users = await getUsers(req.user);
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const user = await saveUser(req.body, req.user);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await deleteUser(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
