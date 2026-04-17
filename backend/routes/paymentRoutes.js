const express  = require('express');
const Razorpay = require('razorpay');
const crypto   = require('crypto');
const Order    = require('../models/Order');

const router = express.Router();

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ── POST /api/payment/create-order ─────────────────────────────────────────── */
router.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body; // amount in INR (we convert to paise)
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const options = {
      amount:   Math.round(amount * 100), // paise
      currency: 'INR',
      receipt:  `nk_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    res.status(500).json({ message: err.message || 'Payment initialization failed' });
  }
});

/* ── POST /api/payment/verify ────────────────────────────────────────────────── */
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,          // { items, totalAmount, address, userId }
    } = req.body;

    /* 1. Verify signature */
    const body      = razorpay_order_id + '|' + razorpay_payment_id;
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed — invalid signature' });
    }

    /* 2. Save order to MongoDB */
    const nkOrderId = 'NK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    const estimatedDelivery = deliveryDate.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

    const newOrder = await Order.create({
      orderId:           nkOrderId,
      customer: {
        name:    orderData.address.name,
        email:   orderData.address.email || 'guest@naturekart.com',
        phone:   orderData.address.phone,
        address: `${orderData.address.address}, ${orderData.address.city}, ${orderData.address.state}`,
        pincode: orderData.address.pincode,
      },
      items:             orderData.items.map(i => ({
        productId: String(i._id || i.productId || i.id),
        name:      i.name,
        price:     i.price,
        quantity:  i.quantity,
        image:     i.image || '',
      })),
      totalAmount:       orderData.totalAmount,
      status:            'Placed',
      paymentMethod:     orderData.paymentMethod || 'UPI / Razorpay',
      paymentStatus:     'paid',
      razorpayOrderId:   razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      userId:            orderData.userId || null,
    });

    res.json({
      success:  true,
      orderId:  nkOrderId,
      dbId:     newOrder._id,
      estimatedDelivery,
      paymentMethod: newOrder.paymentMethod,
    });
  } catch (err) {
    console.error('Payment verify error:', err);
    res.status(500).json({ message: err.message || 'Order saving failed' });
  }
});

module.exports = router;
