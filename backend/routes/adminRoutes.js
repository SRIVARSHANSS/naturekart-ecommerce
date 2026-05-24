const express = require('express');
const Product = require('../models/Product');
const Order   = require('../models/Order');
const User    = require('../models/User');
const Return  = require('../models/Return');
const { adminOnly } = require('../middleware/auth');
const {
  sendReturnEmail,
  sendShippedEmail,
  sendRefundInitiatedEmail,
} = require('../utils/emailService');

const router = express.Router();

/* ── DASHBOARD ─────────────────────────────────────────────────────────────── */
router.get('/dashboard', adminOnly, async (req, res) => {
  try {
    const [orders, products, users, returns] = await Promise.all([
      Order.find().sort({ createdAt: -1 }),
      Product.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Return.countDocuments({ status: { $in: ['Requested', 'Approved', 'Pickup Scheduled'] } }),
    ]);

    const paidOrders   = orders.filter(o => o.paymentStatus === 'paid');
    const totalSales   = paidOrders.reduce((s, o) => s + o.totalAmount, 0);
    const totalOrders  = orders.length;
    const deliveredCount = orders.filter(o => o.status === 'Delivered').length;
    const recentOrders = orders.slice(0, 10);

    /* Revenue by month (last 6 months) */
    const now = new Date();
    const revenueData = [];
    for (let i = 5; i >= 0; i--) {
      const d    = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = d.toLocaleString('default', { month: 'short' });
      const monthOrders = paidOrders.filter(
        o => new Date(o.createdAt) >= d && new Date(o.createdAt) < next
      );
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

    res.json({
      totalSales,
      totalOrders,
      totalProducts: products,
      totalUsers:    users,
      deliveredCount,
      refundRequests: returns,
      recentOrders,
      revenueData,
      statusData,
    });
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
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const oldStatus = order.status;
    order.status = status;

    // Push to tracking history
    order.trackingHistory.push({
      status,
      note: `Status updated to ${status} by admin`,
      timestamp: new Date(),
    });

    await order.save();

    // Send shipped email when admin marks Shipped
    if (status === 'Shipped' && oldStatus !== 'Shipped') {
      try {
        await sendShippedEmail(order.customer.email, order.customer.name, order.orderId);
      } catch (e) { console.error('Shipped email failed:', e.message); }
    }

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

    const statuses = ['Placed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
    const names    = ['Arjun Sharma', 'Priya Patel', 'Rahul Kumar', 'Anita Singh', 'Vijay Reddy'];
    const products = [
      { productId: '1', name: 'Ashwagandha Root Extract', price: 599 },
      { productId: '2', name: 'Turmeric Gold Capsules',   price: 449 },
      { productId: '3', name: 'Neem & Tulsi Face Wash',   price: 299 },
    ];

    const orders = [];
    for (let i = 0; i < 20; i++) {
      const name  = names[i % names.length];
      const item  = products[i % products.length];
      const qty   = (i % 3) + 1;
      const status = statuses[i % statuses.length];
      const date  = new Date(Date.now() - (i * 3 + 1) * 24 * 60 * 60 * 1000);
      const subtotal = item.price * qty;
      orders.push({
        orderId:      `NK${Date.now()}${i}`,
        invoiceNumber:`INV-NK-${Date.now()}${i}`,
        customer:     { name, email: `${name.split(' ')[0].toLowerCase()}@email.com`, phone: '9876543210', address: 'Chennai, Tamil Nadu', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
        items:        [{ ...item, quantity: qty, image: '' }],
        subtotal,
        shippingCost: 0,
        totalAmount:  subtotal,
        deliveryType: 'Standard',
        status,
        paymentMethod: 'Razorpay',
        paymentStatus: 'paid',
        razorpayOrderId:   `order_demo_${i}`,
        razorpayPaymentId: `pay_demo_${i}`,
        estimatedDelivery: new Date(date.getTime() + 6 * 24 * 60 * 60 * 1000),
        trackingHistory: [{ status: 'Placed', note: 'Demo order', timestamp: date }],
        createdAt: date,
      });
    }
    await Order.insertMany(orders);
    res.json({ message: 'Seeded 20 demo orders', count: 20 });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ── RETURNS MANAGEMENT ────────────────────────────────────────────────────── */
router.get('/returns', adminOnly, async (req, res) => {
  try {
    const returns = await Return.find().sort({ createdAt: -1 });
    res.json(returns);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/returns/:id', adminOnly, async (req, res) => {
  try {
    const { status, adminRemarks, pickupDate } = req.body;
    const returnRequest = await Return.findById(req.params.id);
    if (!returnRequest) return res.status(404).json({ message: 'Return request not found' });

    if (status) returnRequest.status = status;
    if (adminRemarks !== undefined) returnRequest.adminRemarks = adminRemarks;
    if (pickupDate !== undefined) returnRequest.pickupDate = pickupDate;

    await returnRequest.save();

    // Fetch email
    const user  = await User.findById(returnRequest.userId);
    const order = await Order.findOne({ orderId: returnRequest.orderId });
    const emailToNotify = order?.customer?.email || user?.email;

    // Update parent order status to match
    if (order) {
      const orderStatusMap = {
        'Approved':          'Return Requested',
        'Pickup Scheduled':  'Return Pickup Scheduled',
        'Product Received':  'Return Received',
        'Refund Initiated':  'Refund Initiated',
        'Refund Completed':  'Refund Completed',
      };
      if (orderStatusMap[status]) {
        order.status = orderStatusMap[status];
        order.trackingHistory.push({ status: orderStatusMap[status], note: `Return status: ${status}`, timestamp: new Date() });
        if (status === 'Refund Completed') order.paymentStatus = 'refunded';
        await order.save();
      }
    }

    if (emailToNotify) {
      let subject = `Return request updated: ${returnRequest.status}`;
      let title   = `Return Request: ${returnRequest.status}`;
      let body    = `The return request for your product "${returnRequest.productName}" (Order #${returnRequest.orderId}) has been updated to: <strong>${returnRequest.status}</strong>.`;
      let trackingInfo = '';

      if (adminRemarks) body += `<br/><br/><strong>Admin Note:</strong> ${adminRemarks}`;

      if (status === 'Pickup Scheduled' && pickupDate) {
        const formattedDate = new Date(pickupDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        trackingInfo = `<p style="margin:0 0 6px;font-size:14px;color:#78716c;"><strong>Pickup Date:</strong> ${formattedDate}</p>`;
        body += `<br/><br/>Our delivery partner is scheduled to pick up the product on <strong>${formattedDate}</strong>. Please keep it packed and ready.`;
      } else if (status === 'Refund Completed') {
        trackingInfo = `<p style="margin:0 0 6px;font-size:14px;color:#78716c;"><strong>Refunded:</strong> ₹${returnRequest.refundAmount} via ${returnRequest.refundMethod}</p>`;
        body += `<br/><br/>A refund of <strong>₹${returnRequest.refundAmount}</strong> has been processed via <strong>${returnRequest.refundMethod}</strong>.`;
        // Send dedicated refund email
        try {
          await sendRefundInitiatedEmail(emailToNotify, order?.customer?.name || 'Customer', returnRequest.orderId, returnRequest.refundAmount, returnRequest.refundMethod);
        } catch (e) {}
      }

      await sendReturnEmail(emailToNotify, subject, title, body, returnRequest.status, trackingInfo);
    }

    res.json({ success: true, message: 'Return status updated', returnRequest });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
