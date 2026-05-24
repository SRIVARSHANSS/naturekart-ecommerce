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
  .then(async () => {
    console.log('✅ MongoDB Connected');
    try {
      const Order = mongoose.model('Order');
      const User = mongoose.model('User');
      const users = await User.find({});
      let updatedCount = 0;
      for (const u of users) {
        if (!u.email) continue;
        const res = await Order.updateMany(
          {
            "customer.email": u.email.toLowerCase(),
            $or: [
              { userId: null },
              { userId: { $exists: false } }
            ]
          },
          { $set: { userId: u._id } }
        );
        updatedCount += res.modifiedCount || 0;
      }
      if (updatedCount > 0) {
        console.log(`🧹 DB Migration: Associated ${updatedCount} orphaned orders to user accounts.`);
      }
    } catch (migErr) {
      console.error('⚠️ DB Migration Error:', migErr.message);
    }
  })
  .catch(err => console.error('❌ MongoDB Error:', err.message));

/* ── Routes ─────────────────────────────────────────────────────────────────── */
app.use('/api/products',  require('./routes/productRoutes'));
app.use('/api/search',    require('./routes/searchRoutes'));
app.use('/api/cart',      require('./routes/cartRoutes'));
app.use('/api/orders',    require('./routes/orderRoutes'));
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/wishlist',  require('./routes/wishlistRoutes'));
app.use('/api/returns',   require('./routes/returnRoutes'));
app.use('/api/admin',     require('./routes/adminRoutes'));
app.use('/api/payment',   require('./routes/paymentRoutes'));
app.use('/api/checkout',  require('./routes/checkoutRoutes'));
app.use('/api/ai',        require('./routes/aiRoutes'));

/* ── Health check ───────────────────────────────────────────────────────────── */
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);


/* ── Start ──────────────────────────────────────────────────────────────────── */
const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`🚀 NatureKart backend running → http://localhost:${PORT}`)
);