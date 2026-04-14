const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

/* ── DB ─────────────────────────────────────────────────────────────────────── */
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/naturekart')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err.message));

/* ── Routes ─────────────────────────────────────────────────────────────────── */
app.use('/api/products',  require('./routes/productRoutes'));
app.use('/api/cart',      require('./routes/cartRoutes'));
app.use('/api/orders',    require('./routes/orderRoutes'));
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/wishlist',  require('./routes/wishlistRoutes'));
app.use('/api/admin',     require('./routes/adminRoutes'));

/* ── Health check ───────────────────────────────────────────────────────────── */
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

/* ── Start ──────────────────────────────────────────────────────────────────── */
const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`🚀 NatureKart backend running → http://localhost:${PORT}`)
);