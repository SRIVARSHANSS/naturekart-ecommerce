const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'naturekart_jwt_secret_2024';

/* helpers */
const sign   = (id)  => jwt.sign({ id }, SECRET, { expiresIn: '7d' });
const safe   = (u)   => ({ id: u._id, name: u.name, email: u.email, phone: u.phone });
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    req.userId = jwt.verify(token, SECRET).id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/* POST /api/auth/register */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email is already registered' });

    const user = await new User({ name, email, password }).save();
    res.status(201).json({ token: sign(user._id), user: safe(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* POST /api/auth/login */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    res.json({ token: sign(user._id), user: safe(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/auth/me */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* PUT /api/auth/profile */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, phone },
      { new: true, runValidators: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
