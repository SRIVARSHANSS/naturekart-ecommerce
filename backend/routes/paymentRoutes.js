const express = require('express');
const Order   = require('../models/Order');

const router = express.Router();

/* ── POST /api/payment/create-upi-order ─────────────────────────────────────
   Saves an order after the user confirms UPI payment on their device.
   Marks paymentStatus as 'pending_verification' — admin can verify via UTR.
────────────────────────────────────────────────────────────────────────────── */
router.post('/create-upi-order', async (req, res) => {
  try {
    const { orderData, utrNumber } = req.body;

    if (!orderData?.items?.length) {
      return res.status(400).json({ message: 'No items in order' });
    }

    const nkOrderId = 'NK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    const estimatedDelivery = deliveryDate.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

    const newOrder = await Order.create({
      orderId:  nkOrderId,
      customer: {
        name:    orderData.address.name,
        email:   orderData.address.email || 'guest@naturekart.com',
        phone:   orderData.address.phone,
        address: `${orderData.address.address}, ${orderData.address.city}, ${orderData.address.state}`,
        pincode: orderData.address.pincode,
      },
      items: orderData.items.map(i => ({
        productId: String(i._id || i.productId || i.id),
        name:      i.name,
        price:     i.price,
        quantity:  i.quantity,
        image:     i.image || '',
      })),
      totalAmount:    orderData.totalAmount,
      status:         'Placed',
      paymentMethod:  'Google Pay / UPI',
      paymentStatus:  utrNumber ? 'pending_verification' : 'pending',
      razorpayOrderId:   utrNumber || '',   // reusing field to store UTR
      razorpayPaymentId: '',
      userId:         orderData.userId || null,
    });

    res.json({
      success:          true,
      orderId:          nkOrderId,
      dbId:             newOrder._id,
      estimatedDelivery,
      paymentMethod:    'Google Pay / UPI',
      utrNumber:        utrNumber || '',
    });
  } catch (err) {
    console.error('UPI order save error:', err);
    res.status(500).json({ message: err.message || 'Failed to save order' });
  }
});

module.exports = router;
