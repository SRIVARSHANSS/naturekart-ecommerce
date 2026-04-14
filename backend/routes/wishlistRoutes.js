const express = require('express');
const jwt     = require('jsonwebtoken');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'naturekart_jwt_secret_2024';

/* In-memory store per user – swap for a DB model in production */
const store = {};

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    req.userId = jwt.verify(token, SECRET).id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

/* GET /api/wishlist */
router.get('/', auth, (req, res) => {
  res.json(store[req.userId] || []);
});

/* POST /api/wishlist */
router.post('/', auth, (req, res) => {
  if (!store[req.userId]) store[req.userId] = [];
  const item = req.body;
  const exists = store[req.userId].find(i => String(i.id) === String(item.id));
  if (!exists) store[req.userId].push(item);
  res.json(store[req.userId]);
});

/* DELETE /api/wishlist/:id */
router.delete('/:id', auth, (req, res) => {
  if (!store[req.userId]) store[req.userId] = [];
  store[req.userId] = store[req.userId].filter(
    i => String(i.id) !== req.params.id
  );
  res.json(store[req.userId]);
});

module.exports = router;
