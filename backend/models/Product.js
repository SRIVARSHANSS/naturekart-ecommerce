const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  mrp: { type: Number },
  image: { type: String },
  category: { type: String },
  description: { type: String },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  inStock: { type: Boolean, default: true },
  tag: { type: String },
  benefits: [String],
  ingredients: [String],
  usage: [String],
  qty: { type: Number, default: 1 },
  unit: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);