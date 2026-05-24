/**
 * NatureKart — Return Routes
 * 30-day return window, OTP-based verification
 */
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const Return  = require('../models/Return');
const Order   = require('../models/Order');
const User    = require('../models/User');
const { sendReturnEmail } = require('../utils/emailService');

/* ── POST /api/returns/create ───────────────────────────────────────────────── */
router.post('/create', protect, async (req, res) => {
  try {
    const { orderId, productId, reason, description, images, refundMethod } = req.body;

    if (!orderId || !productId || !reason || !refundMethod) {
      return res.status(400).json({ message: 'orderId, productId, reason, and refundMethod are required' });
    }

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.userId && order.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only return items from your own orders' });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({ message: 'Returns can only be requested for delivered orders' });
    }

    /* ── 30-day return window ── */
    const deliveryDate = new Date(order.deliveredAt || order.updatedAt);
    const diffDays = Math.ceil((new Date() - deliveryDate) / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      return res.status(400).json({ message: 'Return window of 30 days has expired' });
    }

    const orderedItem = order.items.find(item => item.productId === productId);
    if (!orderedItem) {
      return res.status(400).json({ message: 'Product not found in this order' });
    }

    const existingReturn = await Return.findOne({ orderId, productId });
    if (existingReturn) {
      return res.status(400).json({ message: 'A return request already exists for this product' });
    }

    const refundAmount = orderedItem.price * orderedItem.quantity;

    const returnRequest = new Return({
      userId:       req.userId,
      orderId,
      productId,
      productName:  orderedItem.name,
      productImage: orderedItem.image || '',
      reason,
      description:  description || '',
      images:       images || [],
      status:       'Requested',
      refundMethod,
      refundAmount,
    });

    await returnRequest.save();

    // Update order status
    order.status = 'Return Requested';
    order.trackingHistory.push({ status: 'Return Requested', note: `Return request submitted: ${reason}`, timestamp: new Date() });
    await order.save();

    // Email
    const user = await User.findById(req.userId);
    const emailToNotify = order.customer?.email || user?.email;
    if (emailToNotify) {
      await sendReturnEmail(
        emailToNotify,
        `Return request submitted for Order #${orderId}`,
        'Return Request Received',
        `Your return request for "${orderedItem.name}" (Order #${orderId}) has been submitted. Our team will review it shortly.`,
        'Requested',
        `<p style="margin:0 0 6px;font-size:14px;color:#78716c;"><strong>Refund Amount:</strong> ₹${refundAmount}</p>
         <p style="margin:0 0 8px;font-size:14px;color:#78716c;"><strong>Refund Method:</strong> ${refundMethod}</p>`
      );
    }

    res.status(201).json({ success: true, message: 'Return request submitted successfully', returnRequest });
  } catch (err) {
    console.error('Create return error:', err);
    res.status(500).json({ message: err.message || 'Failed to submit return request' });
  }
});

/* ── GET /api/returns/user ──────────────────────────────────────────────────── */
router.get('/user', protect, async (req, res) => {
  try {
    const returns = await Return.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(returns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
