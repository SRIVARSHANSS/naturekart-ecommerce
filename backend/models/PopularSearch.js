const mongoose = require('mongoose');

const popularSearchSchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  count: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

module.exports = mongoose.model('PopularSearch', popularSearchSchema);
