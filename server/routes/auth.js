const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const signToken = (userId) => {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

router.post(
  '/signup',
  [
    body('name').isString().trim().isLength({ min: 2, max: 80 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 6, max: 100 })
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    try {
      const { name, email, password } = req.body;
      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ error: 'Email already registered' });

      const passwordHash = await User.hashPassword(password);
      const user = await User.create({ name, email, passwordHash });

      const token = signToken(user._id);
      res.status(201).json({ token, user: user.toSafeJSON() });
    } catch (e) { next(e); }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString().notEmpty()
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed' });
    }
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+passwordHash');
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const ok = await user.checkPassword(password);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

      const token = signToken(user._id);
      res.json({ token, user: user.toSafeJSON() });
    } catch (e) { next(e); }
  }
);

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

module.exports = router;
