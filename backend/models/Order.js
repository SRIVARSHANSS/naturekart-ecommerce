const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId:   { type: String, required: true },
  name:        { type: String, required: true },
  price:       { type: Number, required: true },
  quantity:    { type: Number, required: true, min: 1 },
  image:       { type: String, default: '' },
});

const orderSchema = new mongoose.Schema({
  orderId:     { type: String, required: true, unique: true },
  customer: {
    name:    { type: String, required: true },
    email:   { type: String, required: true },
    phone:   { type: String, default: '' },
    address: { type: String, required: true },
    pincode: { type: String, default: '' },
  },
  items:       [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Placed',
  },
  paymentMethod: { type: String, default: 'COD' },
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);