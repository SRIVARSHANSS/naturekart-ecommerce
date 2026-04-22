const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  price:       { type: Number, required: true, min: 0 },
  category:    { type: String, required: true },
  description: { type: String, default: '' },
  image:       { type: String, default: '' },
  icon:        { type: String, default: '🌿' },
  tag:         { type: String, default: '' },
  rating:      { type: Number, default: 4.5, min: 0, max: 5 },
  reviews:     { type: Number, default: 0 },
  inStock:     { type: Boolean, default: true },
  aiReason:    { type: String, default: '' },
  benefits:    [String],
  tags:        [String],
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);