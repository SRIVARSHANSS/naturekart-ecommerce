const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: String, // custom human-readable ID e.g. NK171639201
    required: true
  },
  productId: {
    type: String, // product custom numeric ID or MongoDB _id
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productImage: {
    type: String,
    default: ''
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'Damaged product',
      'Wrong item delivered',
      'Product quality issue',
      'Size mismatch',
      'Changed mind'
    ]
  },
  description: {
    type: String,
    default: ''
  },
  images: [{
    type: String // base64 string or image url proof
  }],
  status: {
    type: String,
    enum: ['Requested', 'Approved', 'Pickup Scheduled', 'Refund Processing', 'Refund Completed', 'Rejected'],
    default: 'Requested'
  },
  refundMethod: {
    type: String,
    enum: ['Original Payment Method', 'Wallet', 'Bank Transfer'],
    required: true
  },
  refundAmount: {
    type: Number,
    required: true
  },
  adminRemarks: {
    type: String,
    default: ''
  },
  pickupDate: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Return', returnSchema);
