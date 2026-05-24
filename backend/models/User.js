const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label:     { type: String, default: 'Home' },
  address:   { type: String, required: true },
  pincode:   { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, default: null, select: true },
  phone:        { type: String, default: '' },
  mobile:       { type: String, default: '' },
  role:         { type: String, enum: ['user', 'admin'], default: 'user' },
  addresses:    [addressSchema],

  /* Email Verification */
  isVerified:   { type: Boolean, default: false },
  otp:          { type: String, default: null },
  otpExpiry:    { type: Date,   default: null },

  /* Password Reset */
  resetOtp:         { type: String, default: null },
  resetOtpExpiry:   { type: Date,   default: null },

  /* Google OAuth fields */
  googleId:     { type: String, default: null },
  profileImage: { type: String, default: null },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  recentSearches: [{ type: String, trim: true }],
}, { timestamps: true });

/* Only hash password for local auth users */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
