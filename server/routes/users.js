const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/search', requireAuth, async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json({ users: [] });
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await User.find({ $or: [{ name: rx }, { email: rx }] }).limit(8);
    res.json({ users: users.map(u => u.toSafeJSON()) });
  } catch (e) { next(e); }
});

module.exports = router;
