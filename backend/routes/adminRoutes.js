const express = require('express');
const Product = require('../models/Product');
const Order   = require('../models/Order');
const User    = require('../models/User');
const { adminOnly } = require('../middleware/auth');

const router = express.Router();

/* ── DASHBOARD ─────────────────────────────────────────────────────────────── */
router.get('/dashboard', adminOnly, async (req, res) => {
  try {
    const [orders, products, users] = await Promise.all([
      Order.find().sort({ createdAt: -1 }),
      Product.countDocuments(),
      User.countDocuments({ role: 'user' }),
    ]);

    const totalSales   = orders.reduce((s, o) => s + o.totalAmount, 0);
    const totalOrders  = orders.length;
    const recentOrders = orders.slice(0, 10);

    /* Revenue by month (last 6 months) */
    const now = new Date();
    const revenueData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = d.toLocaleString('default', { month: 'short' });
      const monthOrders = orders.filter(o => new Date(o.createdAt) >= d && new Date(o.createdAt) < next);
      revenueData.push({
        month:   label,
        revenue: monthOrders.reduce((s, o) => s + o.totalAmount, 0),
        orders:  monthOrders.length,
      });
    }

    /* Status distribution */
    const statusMap = {};
    orders.forEach(o => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
    const statusData = Object.entries(statusMap).map(([name, count]) => ({ name, count }));

    res.json({ totalSales, totalOrders, totalProducts: products, totalUsers: users, recentOrders, revenueData, statusData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── PRODUCTS ──────────────────────────────────────────────────────────────── */
router.get('/products', adminOnly, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/products', adminOnly, async (req, res) => {
  try {
    const product = await new Product(req.body).save();
    res.status(201).json(product);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/products/:id', adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/products/:id', adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ── ORDERS ────────────────────────────────────────────────────────────────── */
router.get('/orders', adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/orders/:id', adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

/* ── USERS ─────────────────────────────────────────────────────────────────── */
router.get('/users', adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ── SEED ORDERS (dev helper) ──────────────────────────────────────────────── */
router.post('/seed-orders', adminOnly, async (req, res) => {
  try {
    const count = await Order.countDocuments();
    if (count > 0) return res.json({ message: 'Already seeded', count });

    const statuses = ['Placed', 'Shipped', 'Out for Delivery', 'Delivered'];
    const names    = ['Arjun Sharma', 'Priya Patel', 'Rahul Kumar', 'Anita Singh', 'Vijay Reddy'];
    const products = [
      { productId: '1', name: 'Ashwagandha Root Extract', price: 599, image: '' },
      { productId: '2', name: 'Turmeric Gold Capsules',   price: 449, image: '' },
      { productId: '3', name: 'Neem & Tulsi Face Wash',   price: 299, image: '' },
    ];

    const orders = [];
    for (let i = 0; i < 20; i++) {
      const name  = names[Math.floor(Math.random() * names.length)];
      const item  = products[Math.floor(Math.random() * products.length)];
      const qty   = Math.floor(Math.random() * 3) + 1;
      const date  = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
      orders.push({
        orderId:     `NK${Date.now()}${i}`,
        customer:    { name, email: `${name.split(' ')[0].toLowerCase()}@email.com`, phone: '9876543210', address: 'Chennai, Tamil Nadu', pincode: '600001' },
        items:       [{ ...item, quantity: qty }],
        totalAmount: item.price * qty,
        status:      statuses[Math.floor(Math.random() * statuses.length)],
        createdAt:   date,
      });
    }
    await Order.insertMany(orders);
    res.json({ message: 'Seeded 20 demo orders', count: 20 });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
