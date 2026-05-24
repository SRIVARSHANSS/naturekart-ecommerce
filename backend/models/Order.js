const mongoose = require('mongoose');

/* ── Order Item ──────────────────────────────────────────────────────────────── */
const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name:      { type: String, required: true },
  price:     { type: Number, required: true },
  quantity:  { type: Number, required: true, min: 1 },
  image:     { type: String, default: '' },
});

/* ── Tracking History ────────────────────────────────────────────────────────── */
const trackingEventSchema = new mongoose.Schema({
  status:    { type: String, required: true },
  note:      { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});

/* ── Order ───────────────────────────────────────────────────────────────────── */
const orderSchema = new mongoose.Schema({
  orderId:     { type: String, required: true, unique: true },
  invoiceNumber: { type: String, default: '' },

  /* Customer details */
  customer: {
    name:    { type: String, required: true },
    email:   { type: String, required: true },
    phone:   { type: String, default: '' },
    address: { type: String, required: true },
    city:    { type: String, default: '' },
    state:   { type: String, default: '' },
    pincode: { type: String, default: '' },
  },

  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  /* Items */
  items: [orderItemSchema],

  /* Pricing */
  subtotal:     { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  totalAmount:  { type: Number, required: true },

  /* Delivery */
  deliveryType: {
    type: String,
    enum: ['Standard', 'One-Day', 'Same-Day'],
    default: 'Standard',
  },
  estimatedDelivery: { type: Date },

  /* Full order lifecycle status */
  status: {
    type: String,
    enum: [
      'Placed',
      'Processing',
      'Packed',
      'Shipped',
      'Out for Delivery',
      'Delivered',
      'Cancelled',
      'Return Requested',
      'Return Pickup Scheduled',
      'Return Received',
      'Refund Initiated',
      'Refund Completed',
    ],
    default: 'Placed',
  },

  /* Payment */
  paymentMethod:       { type: String, default: 'Razorpay' },
  paymentStatus:       { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  razorpayOrderId:     { type: String, default: '' },
  razorpayPaymentId:   { type: String, default: '' },
  razorpaySignature:   { type: String, default: '' },

  /* Delivery OTP (admin verifies with customer when delivering) */
  deliveryOtp:       { type: String, default: null },
  deliveryOtpExpiry: { type: Date,   default: null },
  deliveryOtpVerified: { type: Boolean, default: false },

  /* Return OTP (admin verifies with customer when picking up returned product) */
  returnOtp:         { type: String, default: null },
  returnOtpExpiry:   { type: Date,   default: null },
  returnOtpVerified: { type: Boolean, default: false },

  /* Delivery date (actual) */
  deliveredAt: { type: Date, default: null },

  /* Tracking history log */
  trackingHistory: [trackingEventSchema],
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);