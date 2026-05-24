/**
 * NatureKart — Payment Routes
 * Real Razorpay integration with HMAC signature verification
 * Order is created in DB ONLY after payment is verified
 */
const express   = require('express');
const Razorpay  = require('razorpay');
const crypto    = require('crypto');
const Order     = require('../models/Order');
const User      = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendOrderConfirmationEmail } = require('../utils/emailService');

const router = express.Router();

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function generateOrderId() {
  return 'NK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function generateInvoiceNumber() {
  return 'INV-NK-' + Date.now().toString().slice(-8);
}

function calcEstimatedDelivery(deliveryType) {
  const now = new Date();
  if (deliveryType === 'Same-Day') {
    // Same day only if ordered before 2 PM
    const cutoff = new Date();
    cutoff.setHours(14, 0, 0, 0);
    if (now < cutoff) {
      const d = new Date(); d.setHours(20, 0, 0, 0); return d;
    } else {
      const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(20, 0, 0, 0); return d;
    }
  }
  if (deliveryType === 'One-Day') {
    const d = new Date(); d.setDate(d.getDate() + 1); return d;
  }
  // Standard: 5-7 days
  const d = new Date(); d.setDate(d.getDate() + 6); return d;
}

/* ── POST /api/payment/create-order ─────────────────────────────────────────
   Step 1: Create a Razorpay order → return razorpay_order_id to frontend
   Frontend opens Razorpay checkout modal with this
──────────────────────────────────────────────────────────────────────────── */
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', notes = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount:   Math.round(amount * 100), // paise
      currency,
      notes,
      payment_capture: 1,
    });

    res.json({
      success:         true,
      razorpayOrderId: razorpayOrder.id,
      amount:          razorpayOrder.amount,
      currency:        razorpayOrder.currency,
      keyId:           process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    res.status(500).json({ message: err.message || 'Failed to create payment order' });
  }
});

/* ── POST /api/payment/verify ───────────────────────────────────────────────
   Step 2: Verify HMAC signature → create NatureKart order in DB
   Order appears in Admin Panel ONLY after this succeeds
──────────────────────────────────────────────────────────────────────────── */
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,          // { items, address, deliveryType, shippingCost, subtotal, totalAmount, userId }
    } = req.body;

    /* ── 1. Verify signature ── */
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed — signature mismatch' });
    }

    /* ── 2. Fetch payment details for method ── */
    let paymentMethod = 'Razorpay';
    try {
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      const methodMap = { card: 'Card', netbanking: 'Net Banking', upi: 'UPI', wallet: 'Wallet', emi: 'EMI' };
      paymentMethod = methodMap[payment.method] || payment.method || 'Razorpay';
    } catch (_) {}

    /* ── 3. Calculate delivery date ── */
    const estimatedDelivery = calcEstimatedDelivery(orderData.deliveryType || 'Standard');
    const orderId      = generateOrderId();
    const invoiceNumber = generateInvoiceNumber();

    /* ── 4. Create order in DB ── */
    const newOrder = await Order.create({
      orderId,
      invoiceNumber,
      customer: {
        name:    orderData.address.name,
        email:   orderData.address.email,
        phone:   orderData.address.phone,
        address: orderData.address.address,
        city:    orderData.address.city,
        state:   orderData.address.state,
        pincode: orderData.address.pincode,
      },
      userId:        orderData.userId || null,
      items: orderData.items.map(i => ({
        productId: String(i._id || i.productId || i.id),
        name:      i.name,
        price:     i.price,
        quantity:  i.quantity,
        image:     i.image || '',
      })),
      subtotal:          orderData.subtotal || orderData.totalAmount,
      shippingCost:      orderData.shippingCost || 0,
      totalAmount:       orderData.totalAmount,
      deliveryType:      orderData.deliveryType || 'Standard',
      estimatedDelivery,
      status:            'Placed',
      paymentMethod,
      paymentStatus:     'paid',
      razorpayOrderId:   razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      trackingHistory: [{ status: 'Placed', note: 'Order placed and payment received', timestamp: new Date() }],
    });

    /* ── 5. Send order confirmation email ── */
    try {
      await sendOrderConfirmationEmail(
        orderData.address.email,
        orderData.address.name,
        orderId,
        invoiceNumber,
        newOrder.items,
        newOrder.totalAmount,
        newOrder.shippingCost,
        estimatedDelivery,
        paymentMethod,
        razorpay_payment_id
      );
    } catch (emailErr) {
      console.error('Order confirmation email error:', emailErr.message);
    }

    res.json({
      success:           true,
      orderId,
      invoiceNumber,
      estimatedDelivery,
      paymentMethod,
      totalAmount:       newOrder.totalAmount,
    });
  } catch (err) {
    console.error('Payment verify error:', err);
    res.status(500).json({ success: false, message: err.message || 'Payment verification failed' });
  }
});

/* ── GET /api/payment/key ───────────────────────────────────────────────────
   Return Razorpay key ID to frontend safely
──────────────────────────────────────────────────────────────────────────── */
router.get('/key', (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

module.exports = router;
