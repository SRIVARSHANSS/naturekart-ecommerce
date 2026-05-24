const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId:      { type: String, required: true },
  productId:    { type: String, required: true },
  productName:  { type: String, required: true },
  productImage: { type: String, default: '' },

  reason: {
    type: String,
    required: true,
    enum: [
      'Damaged product',
      'Wrong item delivered',
      'Product quality issue',
      'Size mismatch',
      'Changed mind',
      'Missing items',
      'Product expired',
    ],
  },
  description: { type: String, default: '' },
  images: [{ type: String }],

  status: {
    type: String,
    enum: [
      'Requested',
      'Approved',
      'Pickup Scheduled',
      'Product Received',
      'Refund Initiated',
      'Refund Completed',
      'Rejected',
    ],
    default: 'Requested',
  },

  refundMethod: {
    type: String,
    enum: ['Original Payment Method', 'Wallet', 'Bank Transfer'],
    required: true,
  },
  refundAmount:  { type: Number, required: true },
  adminRemarks:  { type: String, default: '' },
  pickupDate:    { type: Date },
  collectionDate:{ type: Date },

  /* OTP for return pickup verification */
  returnOtp:         { type: String, default: null },
  returnOtpExpiry:   { type: Date,   default: null },
  returnOtpVerified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Return', returnSchema);
