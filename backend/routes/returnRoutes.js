const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Return = require('../models/Return');
const Order = require('../models/Order');
const User = require('../models/User');
const { sendReturnEmail } = require('../utils/emailService');

/* ── POST /api/returns/create ───────────────────────────────────────────────
   Creates a return or refund request for a delivered product.
────────────────────────────────────────────────────────────────────────────── */
router.post('/create', protect, async (req, res) => {
  try {
    const { orderId, productId, reason, description, images, refundMethod } = req.body;

    if (!orderId || !productId || !reason || !refundMethod) {
      return res.status(400).json({ message: 'orderId, productId, reason, and refundMethod are required' });
    }

    // 1. Fetch Order and verify owner
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId && order.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only return items from your own orders' });
    }

    // 2. Verify status is Delivered
    if (order.status !== 'Delivered') {
      return res.status(400).json({ message: 'Returns can only be requested for delivered products' });
    }

    // 3. Verify Return Window (7 Days)
    const deliveryDate = new Date(order.updatedAt);
    const timeDiff = Math.abs(new Date() - deliveryDate);
    const diffDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    if (diffDays > 7) {
      return res.status(400).json({ message: 'Return window of 7 days has expired' });
    }

    // 4. Verify product exists in the order
    const orderedItem = order.items.find(item => item.productId === productId);
    if (!orderedItem) {
      return res.status(400).json({ message: 'Product not found in this order' });
    }

    // 5. Verify duplicate return request
    const existingReturn = await Return.findOne({ orderId, productId });
    if (existingReturn) {
      return res.status(400).json({ message: 'A return or refund request has already been submitted for this product' });
    }

    // Calculate refund amount
    const refundAmount = orderedItem.price * orderedItem.quantity;

    // Create the Return Request
    const returnRequest = new Return({
      userId: req.userId,
      orderId,
      productId,
      productName: orderedItem.name,
      productImage: orderedItem.image || '',
      reason,
      description: description || '',
      images: images || [],
      status: 'Requested',
      refundMethod,
      refundAmount
    });

    await returnRequest.save();

    // Fetch user details for email
    const user = await User.findById(req.userId);
    const emailToNotify = order.customer?.email || user?.email;

    if (emailToNotify) {
      await sendReturnEmail(
        emailToNotify,
        `Return request submitted for Order #${orderId}`,
        'Return Request Received',
        `Your return request for product "${orderedItem.name}" (Order #${orderId}) has been successfully submitted. We are processing it and our support team will update you shortly.`,
        'Requested',
        `<p style="margin:0;font-size:14px;color:#78716c;"><strong>Refund Amount:</strong> ₹${refundAmount}</p>
         <p style="margin:0 0 8px;font-size:14px;color:#78716c;"><strong>Refund Method:</strong> ${refundMethod}</p>`
      );
    }

    res.status(201).json({
      success: true,
      message: 'Return request submitted successfully',
      returnRequest
    });

  } catch (err) {
    console.error('Create return error:', err);
    res.status(500).json({ message: err.message || 'Failed to submit return request' });
  }
});

/* ── GET /api/returns/user ──────────────────────────────────────────────────
   Fetches all return requests for the currently logged-in user.
────────────────────────────────────────────────────────────────────────────── */
router.get('/user', protect, async (req, res) => {
  try {
    const returns = await Return.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(returns);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch returns' });
  }
});

module.exports = router;
