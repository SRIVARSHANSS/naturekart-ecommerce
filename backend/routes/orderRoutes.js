const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

function generateOrderId() {
  return 'NK' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
}

function getDeliveryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 5);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

router.post('/', async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress, paymentMethod } = req.body;
    
    const order = new Order({
      orderId: generateOrderId(),
      items,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'Razorpay',
      paymentStatus: 'Paid',
      orderStatus: 'Processing',
      estimatedDelivery: getDeliveryDate()
    });
    
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;