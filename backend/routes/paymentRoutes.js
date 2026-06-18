/**
 * NatureKart — Payment Routes
 * Real Razorpay integration with HMAC signature verification
 * Order is created in DB immediately with 'Payment Pending' on /create-order
 * Verified on /verify or via Webhook safety net
 */
const express   = require('express');
const Razorpay  = require('razorpay');
const crypto    = require('crypto');
const Order     = require('../models/Order');
const User      = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendOrderConfirmationEmail } = require('../utils/emailService');

const router = express.Router();

/* Lazy Razorpay instance — only created when keys are present */
function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  if (!getRazorpay._instance) {
    getRazorpay._instance = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return getRazorpay._instance;
}

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
   Step 1: Create a Razorpay order & pre-create order document in DB
 ──────────────────────────────────────────────────────────────────────────── */
router.post('/create-order', async (req, res) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) return res.status(503).json({ message: 'Payment gateway not configured' });

    const { amount, currency = 'INR', notes = {}, orderData } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount:   Math.round(amount * 100), // paise
      currency,
      notes,
      payment_capture: 1,
    });

    // Webhook safety net: Create Order document immediately with pending status
    if (orderData) {
      let authUserId = orderData.userId || null;
      try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
          const jwt = require('jsonwebtoken');
          const SECRET = process.env.JWT_SECRET || 'naturekart_jwt_secret_2024';
          const decoded = jwt.verify(token, SECRET);
          if (decoded.id) authUserId = decoded.id;
        }
      } catch (_) {}

      const estimatedDelivery = calcEstimatedDelivery(orderData.deliveryType || 'Standard');
      const orderId = generateOrderId();
      const invoiceNumber = generateInvoiceNumber();

      await Order.create({
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
        userId:        authUserId,
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
        status:            'Payment Pending',
        paymentMethod:     'Razorpay',
        paymentStatus:     'pending',
        razorpayOrderId:   razorpayOrder.id,
        trackingHistory: [{ status: 'Payment Pending', note: 'Order created, awaiting payment', timestamp: new Date() }],
      });
    }

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
   Step 2: Verify HMAC signature → Update existing order in DB to placed/paid
 ──────────────────────────────────────────────────────────────────────────── */
router.post('/verify', async (req, res) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) return res.status(503).json({ success: false, message: 'Payment gateway not configured' });

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = req.body;

    /* ── 0. Extract userId from JWT (more reliable than frontend) ── */
    let authUserId = orderData?.userId || null;
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const jwt = require('jsonwebtoken');
        const SECRET = process.env.JWT_SECRET || 'naturekart_jwt_secret_2024';
        const decoded = jwt.verify(token, SECRET);
        if (decoded.id) authUserId = decoded.id;
      }
    } catch (_) {}

    /* ── 1. Verify signature ── */
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed — signature mismatch' });
    }

    // Idempotency check: If the webhook safety net already marked the order paid, return success details
    let order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (order && order.paymentStatus === 'paid') {
      console.log(`ℹ️ /verify: Order ${order.orderId} was already paid via webhook. Returning success directly.`);
      return res.json({
        success:           true,
        orderId:           order.orderId,
        invoiceNumber:     order.invoiceNumber,
        estimatedDelivery: order.estimatedDelivery,
        paymentMethod:     order.paymentMethod,
        totalAmount:       order.totalAmount,
      });
    }

    /* ── 2. Fetch payment details for method ── */
    let paymentMethod = 'Razorpay';
    try {
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      const methodMap = { card: 'Card', netbanking: 'Net Banking', upi: 'UPI', wallet: 'Wallet', emi: 'EMI' };
      paymentMethod = methodMap[payment.method] || payment.method || 'Razorpay';
    } catch (_) {}

    /* ── 3. Update or Fallback Create order in DB ── */
    if (!order) {
      // Fallback: create order if pre-creation was skipped/failed
      const estimatedDelivery = calcEstimatedDelivery(orderData?.deliveryType || 'Standard');
      const orderId = generateOrderId();
      const invoiceNumber = generateInvoiceNumber();

      order = await Order.create({
        orderId,
        invoiceNumber,
        customer: {
          name:    orderData?.address?.name || 'Customer',
          email:   orderData?.address?.email || '',
          phone:   orderData?.address?.phone || '',
          address: orderData?.address?.address || '',
          city:    orderData?.address?.city || '',
          state:   orderData?.address?.state || '',
          pincode: orderData?.address?.pincode || '',
        },
        userId:        authUserId,
        items: (orderData?.items || []).map(i => ({
          productId: String(i._id || i.productId || i.id),
          name:      i.name,
          price:     i.price,
          quantity:  i.quantity,
          image:     i.image || '',
        })),
        subtotal:          orderData?.subtotal || orderData?.totalAmount || 0,
        shippingCost:      orderData?.shippingCost || 0,
        totalAmount:       orderData?.totalAmount || 0,
        deliveryType:      orderData?.deliveryType || 'Standard',
        estimatedDelivery,
        status:            'Placed',
        paymentMethod,
        paymentStatus:     'paid',
        razorpayOrderId:   razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        trackingHistory: [{ status: 'Placed', note: 'Order placed and payment received', timestamp: new Date() }],
      });
    } else {
      // Order exists and is pending, update it
      order.status = 'Placed';
      order.paymentStatus = 'paid';
      order.razorpayPaymentId = razorpay_payment_id;
      order.razorpaySignature = razorpay_signature;
      order.paymentMethod = paymentMethod;
      order.trackingHistory.push({ status: 'Placed', note: 'Order placed and payment received', timestamp: new Date() });
      await order.save();
    }

    /* ── 4. Send order confirmation email ── */
    try {
      await sendOrderConfirmationEmail(
        order.customer.email,
        order.customer.name,
        order.orderId,
        order.invoiceNumber,
        order.items,
        order.totalAmount,
        order.shippingCost,
        order.estimatedDelivery,
        paymentMethod,
        razorpay_payment_id
      );
    } catch (emailErr) {
      console.error('Order confirmation email error:', emailErr.message);
    }

    res.json({
      success:           true,
      orderId:           order.orderId,
      invoiceNumber:     order.invoiceNumber,
      estimatedDelivery: order.estimatedDelivery,
      paymentMethod,
      totalAmount:       order.totalAmount,
    });
  } catch (err) {
    console.error('Payment verify error:', err);
    res.status(500).json({ success: false, message: err.message || 'Payment verification failed' });
  }
});

/* ── POST /api/payment/webhook ──────────────────────────────────────────────
   Webhook Safety Net: Receives events directly from Razorpay
 ──────────────────────────────────────────────────────────────────────────── */
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ message: 'Missing signature header' });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('⚠️ Webhook secret not configured in .env (RAZORPAY_WEBHOOK_SECRET)');
      return res.status(500).json({ message: 'Webhook secret not configured' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.rawBody || '')
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('⚠️ Webhook signature verification failed');
      return res.status(400).json({ message: 'Invalid signature mismatch' });
    }

    const eventData = JSON.parse((req.rawBody || '{}').toString());
    const event = eventData.event;

    if (event === 'payment.captured') {
      const paymentEntity = eventData.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;
      const methodMap = { card: 'Card', netbanking: 'Net Banking', upi: 'UPI', wallet: 'Wallet', emi: 'EMI' };
      const paymentMethod = methodMap[paymentEntity?.method] || paymentEntity?.method || 'Razorpay';

      if (!razorpayOrderId) {
        console.log('⚠️ Webhook payment.captured received but no order_id in payload');
        return res.json({ status: 'ok' });
      }

      console.log(`🔔 Webhook payment.captured: orderId=${razorpayOrderId}, paymentId=${razorpayPaymentId}`);

      const order = await Order.findOne({ razorpayOrderId });
      if (!order) {
        // "do not throw if the order isn't found yet (race condition) — log it instead"
        console.log(`⚠️ Webhook: Order with razorpayOrderId "${razorpayOrderId}" not found in database yet.`);
        return res.json({ status: 'ok' });
      }

      // Check current status before updating (idempotent)
      if (order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.status = 'Placed';
        order.razorpayPaymentId = razorpayPaymentId || order.razorpayPaymentId;
        order.paymentMethod = paymentMethod;
        order.trackingHistory.push({
          status: 'Placed',
          note: 'Payment captured via Webhook safety net',
          timestamp: new Date()
        });
        await order.save();

        console.log(`✅ Webhook: Order ${order.orderId} updated to paid/Placed.`);

        // Send confirmation email
        try {
          await sendOrderConfirmationEmail(
            order.customer.email,
            order.customer.name,
            order.orderId,
            order.invoiceNumber,
            order.items,
            order.totalAmount,
            order.shippingCost,
            order.estimatedDelivery,
            paymentMethod,
            razorpayPaymentId
          );
          console.log(`📧 Webhook: Confirmation email sent for order ${order.orderId}`);
        } catch (emailErr) {
          console.error('📧 Webhook: Order confirmation email error:', emailErr.message);
        }
      } else {
        console.log(`ℹ️ Webhook: Order ${order.orderId} is already paid. Skipping update.`);
      }
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ message: err.message || 'Webhook internal error' });
  }
});

/* ── GET /api/payment/key ───────────────────────────────────────────────────
   Return Razorpay key ID to frontend safely
 ──────────────────────────────────────────────────────────────────────────── */
router.get('/key', (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

module.exports = router;
