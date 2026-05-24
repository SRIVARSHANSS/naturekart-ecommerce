const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const PopularSearch = require('../models/PopularSearch');
const { protect } = require('../middleware/auth');
const { searchProducts, getAutoSuggestions } = require('../services/elasticSearchService');

const SECRET = process.env.JWT_SECRET || 'naturekart_jwt_secret_2024';

/* Optional auth middleware to track history if logged in */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.userId = jwt.verify(token, SECRET).id;
    } catch (e) {}
  }
  next();
};

/* ── GET /api/search?q= ──────────────────────────────────────────────────────
   Core search API executing fuzzy search across indexed fields.
────────────────────────────────────────────────────────────────────────────── */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const q = req.query.q || '';
    const normalizedQuery = q.trim().toLowerCase();

    if (!normalizedQuery) {
      return res.json({ products: [], correctedQuery: null });
    }

    // 1. Run search engine (Elasticsearch with MongoDB Fallback)
    const { products, correctedQuery } = await searchProducts(normalizedQuery);

    // 2. Globally track query search volume for Trending calculations
    if (normalizedQuery.length >= 3) {
      await PopularSearch.findOneAndUpdate(
        { query: normalizedQuery },
        { $inc: { count: 1 } },
        { upsert: true, new: true }
      );
    }

    // 3. Save to user-specific recent searches history
    if (req.userId) {
      await User.findByIdAndUpdate(req.userId, {
        $pull: { recentSearches: normalizedQuery }
      });
      await User.findByIdAndUpdate(req.userId, {
        $push: {
          recentSearches: {
            $each: [normalizedQuery],
            $position: 0,
            $slice: 8 // Keep latest 8 queries
          }
        }
      });
    }

    res.json({ products, correctedQuery });
  } catch (err) {
    console.error('Search router error:', err);
    res.status(500).json({ message: err.message || 'Failed to search products' });
  }
});

/* ── GET /api/search/suggestions?q= ─────────────────────────────────────────
   Auto-suggestions API returning instant typing autocompletes.
────────────────────────────────────────────────────────────────────────────── */
router.get('/suggestions', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json([]);
    const suggestions = await getAutoSuggestions(q);
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch suggestions' });
  }
});

/* ── GET /api/search/recent ──────────────────────────────────────────────────
   Returns logged-in user search history chips.
────────────────────────────────────────────────────────────────────────────── */
router.get('/recent', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json(user?.recentSearches || []);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch search history' });
  }
});

/* ── DELETE /api/search/recent ───────────────────────────────────────────────
   Clears all or a single specific search history chip.
────────────────────────────────────────────────────────────────────────────── */
router.delete('/recent', protect, async (req, res) => {
  try {
    const { query } = req.body;
    if (query) {
      await User.findByIdAndUpdate(req.userId, {
        $pull: { recentSearches: query.trim().toLowerCase() }
      });
    } else {
      await User.findByIdAndUpdate(req.userId, {
        $set: { recentSearches: [] }
      });
    }
    res.json({ success: true, message: 'Recent searches updated' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update search history' });
  }
});

/* ── GET /api/search/trending ────────────────────────────────────────────────
   Returns top global popular searches for "Trending Now" dropdown.
────────────────────────────────────────────────────────────────────────────── */
router.get('/trending', async (req, res) => {
  try {
    const trending = await PopularSearch.find()
      .sort({ count: -1 })
      .limit(6);
    
    // Seed default keywords if no searches tracked yet
    if (trending.length === 0) {
      return res.json(['stress relief', 'organic honey', 'herbal tea', 'neem wash', 'weight loss']);
    }
    
    res.json(trending.map(t => t.query));
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch trending searches' });
  }
});

module.exports = router;
