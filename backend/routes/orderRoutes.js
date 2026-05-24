/**
 * NatureKart — Order Routes
 * User order fetch + Delivery OTP + Return OTP endpoints
 */
const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');
const {
  sendDeliveryOtpEmail,
  sendReturnOtpEmail,
  generateOTP,
} = require('../utils/emailService');

/* ── GET /api/orders/user ───────────────────────────────────────────────────
   Fetch all orders for the logged-in user (dynamic fallback to customer email)
──────────────────────────────────────────────────────────────────────────── */
router.get('/user', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const orders = await Order.find({
      $or: [
        { userId: req.userId },
        { "customer.email": user.email.toLowerCase() }
      ]
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── GET /api/orders/:orderId ───────────────────────────────────────────────
   Fetch a single order by orderId string (public — for tracking page)
──────────────────────────────────────────────────────────────────────────── */
router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // Omit sensitive OTP fields
    const safeOrder = order.toObject();
    delete safeOrder.deliveryOtp;
    delete safeOrder.deliveryOtpExpiry;
    delete safeOrder.returnOtp;
    delete safeOrder.returnOtpExpiry;
    res.json(safeOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── POST /api/orders/send-delivery-otp ─────────────────────────────────────
   Admin triggers: generate OTP, store in order, email to customer
   Body: { orderId }    (NatureKart orderId string)
──────────────────────────────────────────────────────────────────────────── */
router.post('/send-delivery-otp', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'Out for Delivery') {
      return res.status(400).json({ message: 'Delivery OTP can only be sent when status is Out for Delivery' });
    }

    const otp    = generateOTP();
    const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    order.deliveryOtp       = otp;
    order.deliveryOtpExpiry = expiry;
    order.deliveryOtpVerified = false;
    await order.save();

    await sendDeliveryOtpEmail(order.customer.email, order.customer.name, otp, order.orderId);

    res.json({ success: true, message: `Delivery OTP sent to ${order.customer.email}` });
  } catch (err) {
    console.error('Send delivery OTP error:', err);
    res.status(500).json({ message: err.message });
  }
});

/* ── POST /api/orders/verify-delivery-otp ───────────────────────────────────
   Admin enters OTP from customer → marks order Delivered
   Body: { orderId, otp }
──────────────────────────────────────────────────────────────────────────── */
router.post('/verify-delivery-otp', async (req, res) => {
  try {
    const { orderId, otp } = req.body;
    if (!orderId || !otp) return res.status(400).json({ message: 'orderId and otp are required' });

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!order.deliveryOtp) {
      return res.status(400).json({ message: 'No delivery OTP was generated. Send OTP first.' });
    }
    if (new Date() > new Date(order.deliveryOtpExpiry)) {
      return res.status(400).json({ message: 'OTP has expired. Please send a new OTP.' });
    }
    if (order.deliveryOtp !== otp.trim()) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    // Mark delivered
    order.status            = 'Delivered';
    order.deliveryOtpVerified = true;
    order.deliveredAt       = new Date();
    order.deliveryOtp       = null;
    order.deliveryOtpExpiry = null;
    order.trackingHistory.push({
      status:    'Delivered',
      note:      'Delivery OTP verified. Order delivered successfully.',
      timestamp: new Date(),
    });
    await order.save();

    res.json({ success: true, message: 'OTP verified — Order marked as Delivered!' });
  } catch (err) {
    console.error('Verify delivery OTP error:', err);
    res.status(500).json({ message: err.message });
  }
});

/* ── POST /api/orders/send-return-otp ───────────────────────────────────────
   Admin triggers when product is received back: generate OTP, email customer
   Body: { orderId }
──────────────────────────────────────────────────────────────────────────── */
router.post('/send-return-otp', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const otp    = generateOTP();
    const expiry = new Date(Date.now() + 30 * 60 * 1000);

    order.returnOtp       = otp;
    order.returnOtpExpiry = expiry;
    order.returnOtpVerified = false;
    order.status = 'Return Received';
    order.trackingHistory.push({
      status:    'Return Received',
      note:      'Product received back at warehouse. Return OTP sent to customer.',
      timestamp: new Date(),
    });
    await order.save();

    await sendReturnOtpEmail(order.customer.email, order.customer.name, otp, order.orderId);

    res.json({ success: true, message: `Return OTP sent to ${order.customer.email}` });
  } catch (err) {
    console.error('Send return OTP error:', err);
    res.status(500).json({ message: err.message });
  }
});

/* ── POST /api/orders/verify-return-otp ─────────────────────────────────────
   Admin enters OTP from customer → marks refund initiated
   Body: { orderId, otp }
──────────────────────────────────────────────────────────────────────────── */
router.post('/verify-return-otp', async (req, res) => {
  try {
    const { orderId, otp } = req.body;
    if (!orderId || !otp) return res.status(400).json({ message: 'orderId and otp are required' });

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!order.returnOtp) {
      return res.status(400).json({ message: 'No return OTP generated. Send OTP first.' });
    }
    if (new Date() > new Date(order.returnOtpExpiry)) {
      return res.status(400).json({ message: 'OTP has expired. Please send a new OTP.' });
    }
    if (order.returnOtp !== otp.trim()) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    order.status           = 'Refund Initiated';
    order.returnOtpVerified = true;
    order.returnOtp        = null;
    order.returnOtpExpiry  = null;
    order.paymentStatus    = 'refunded';
    order.trackingHistory.push({
      status:    'Refund Initiated',
      note:      'Return OTP verified. Refund will be processed within 7 days.',
      timestamp: new Date(),
    });
    await order.save();

    res.json({ success: true, message: 'Return OTP verified — Refund Initiated!' });
  } catch (err) {
    console.error('Verify return OTP error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;