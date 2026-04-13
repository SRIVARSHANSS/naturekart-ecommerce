const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  quantity: { type: Number, default: 1 }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  items: [cartItemSchema],
  totalAmount: { type: Number, default: 0 },
  userId: { type: String, default: 'guest' }
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);