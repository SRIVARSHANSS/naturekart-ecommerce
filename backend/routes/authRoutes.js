/**
 * NatureKart — Auth Routes (Production-Level)
 * All endpoints:
 *   POST /api/auth/register          — create account, send OTP
 *   POST /api/auth/verify-otp        — verify OTP, activate account, return JWT
 *   POST /api/auth/resend-otp        — resend verification OTP
 *   POST /api/auth/login             — email+password login (verified users only)
 *   GET  /api/auth/me                — get current user profile
 *   PUT  /api/auth/profile           — update profile
 *   POST /api/auth/forgot-password   — send reset OTP
 *   POST /api/auth/reset-password    — verify reset OTP, update password
 *   POST /api/auth/google            — Google ID token login
 *   POST /api/auth/google-token      — Google access_token login
 *   POST /api/auth/make-admin        — dev helper
 */
const express = require('express');
const jwt     = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User    = require('../models/User');
const { sendOTPEmail, sendPasswordResetEmail, generateOTP } = require('../utils/emailService');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'naturekart_jwt_secret_2024';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const sign = (id) => jwt.sign({ id }, SECRET, { expiresIn: '7d' });

const safe = (u) => ({
  id:           u._id,
  name:         u.name,
  email:        u.email,
  phone:        u.phone,
  mobile:       u.mobile,
  role:         u.role,
  isVerified:   u.isVerified,
  profileImage: u.profileImage,
  authProvider: u.authProvider,
});

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    req.userId = jwt.verify(token, SECRET).id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/* ── Validation helpers ─────────────────────────────────────────────────────── */
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isValidMobile = (m) => /^[6-9]\d{9}$/.test(m);
const isStrongPassword = (p) => p && p.length >= 8;

/* ══ POST /api/auth/register ═════════════════════════════════════════════════ */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    /* Field validation */
    if (!name?.trim())           return res.status(400).json({ message: 'Full name is required' });
    if (!email || !isValidEmail(email)) return res.status(400).json({ message: 'Enter a valid email address' });
    if (!mobile || !isValidMobile(mobile)) return res.status(400).json({ message: 'Enter a valid 10-digit mobile number' });
    if (!isStrongPassword(password))    return res.status(400).json({ message: 'Password must be at least 8 characters' });

    /* Check existing */
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && existing.isVerified) {
      return res.status(400).json({ message: 'This email is already registered. Please login.' });
    }

    /* Generate OTP */
    const otp       = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    if (existing && !existing.isVerified) {
      /* Re-registration: update fields and resend OTP */
      existing.name      = name.trim();
      existing.mobile    = mobile;
      existing.password  = password;   // will be hashed by pre-save
      existing.otp       = otp;
      existing.otpExpiry = otpExpiry;
      await existing.save();
    } else {
      /* New user */
      await User.create({
        name: name.trim(),
        email: email.toLowerCase(),
        password,
        mobile,
        authProvider: 'local',
        isVerified:   false,
        otp,
        otpExpiry,
      });
    }

    /* Send OTP email */
    try {
      await sendOTPEmail(email, otp);
    } catch (mailErr) {
      console.error('⚠️  OTP email failed:', mailErr.message);
      /* Don't block registration if email fails in dev — log OTP */
      console.log(`🔑 DEV OTP for ${email}: ${otp}`);
    }

    res.status(201).json({
      message:       'Account created! Check your email for the 6-digit OTP.',
      email,
      requiresVerification: true,
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

/* ══ POST /api/auth/verify-otp ═══════════════════════════════════════════════ */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'Account not found. Please register first.' });
    if (user.isVerified) return res.status(400).json({ message: 'Account is already verified. Please login.' });

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    }
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    /* Activate account */
    user.isVerified = true;
    user.otp        = null;
    user.otpExpiry  = null;
    await user.save();

    res.json({
      message: '✅ Email verified! Welcome to NatureKart.',
      token:   sign(user._id),
      user:    safe(user),
    });
  } catch (err) {
    console.error('Verify OTP error:', err.message);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
});

/* ══ POST /api/auth/resend-otp ═══════════════════════════════════════════════ */
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)             return res.status(404).json({ message: 'Account not found' });
    if (user.isVerified)   return res.status(400).json({ message: 'Account is already verified' });

    const otp       = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otp        = otp;
    user.otpExpiry  = otpExpiry;
    await user.save();

    try {
      await sendOTPEmail(email, otp);
    } catch (mailErr) {
      console.error('⚠️  OTP email failed:', mailErr.message);
      console.log(`🔑 DEV OTP for ${email}: ${otp}`);
    }

    res.json({ message: 'A new OTP has been sent to your email.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not resend OTP. Please try again.' });
  }
});

/* ══ POST /api/auth/login ════════════════════════════════════════════════════ */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    /* Block unverified local accounts (bypass for admin role/email) */
    if (!user.isVerified && user.authProvider === 'local' && user.role !== 'admin' && user.email !== 'admin@naturekart.com') {
      return res.status(403).json({
        message:              'Please verify your email first.',
        requiresVerification: true,
        email:                user.email,
      });
    }

    res.json({ token: sign(user._id), user: safe(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ══ GET /api/auth/me ════════════════════════════════════════════════════════ */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -otp -resetOtp');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(safe(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ══ PUT /api/auth/profile ═══════════════════════════════════════════════════ */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, mobile } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId, { name, phone, mobile }, { new: true, runValidators: true }
    ).select('-password -otp -resetOtp');
    res.json(safe(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ══ POST /api/auth/forgot-password ══════════════════════════════════════════ */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    /* Always return same message to prevent email enumeration */
    if (!user || user.authProvider === 'google') {
      return res.json({ message: 'If this email exists, a reset OTP has been sent.' });
    }

    const otp           = generateOTP();
    user.resetOtp       = otp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetEmail(email, otp);
    } catch (mailErr) {
      console.error('⚠️  Reset email failed:', mailErr.message);
      console.log(`🔑 DEV Reset OTP for ${email}: ${otp}`);
    }

    res.json({ message: 'If this email exists, a reset OTP has been sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not process request. Please try again.' });
  }
});

/* ══ POST /api/auth/reset-password ══════════════════════════════════════════ */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });

    if (!isStrongPassword(newPassword))
      return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'Account not found' });

    if (!user.resetOtp || user.resetOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    }
    if (user.resetOtpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    user.password       = newPassword; // pre-save will hash it
    user.resetOtp       = null;
    user.resetOtpExpiry = null;
    await user.save();

    res.json({ message: '✅ Password reset successfully! You can now login.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not reset password. Please try again.' });
  }
});

/* ══ Google OAuth ═══════════════════════════════════════════════════════════ */

/* POST /api/auth/google — ID token flow */
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'No Google credential received' });

    const client  = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket  = await client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: profileImage } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (user) {
      if (!user.googleId) {
        user.googleId     = googleId;
        user.profileImage = profileImage;
        user.authProvider = 'google';
        user.isVerified   = true;
        await user.save();
      }
    } else {
      user = await User.create({
        name, email, googleId, profileImage,
        authProvider: 'google',
        isVerified:   true,
        password:     null,
      });
    }

    res.json({ token: sign(user._id), user: safe(user) });
  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(401).json({ message: 'Google login failed. Please try again.' });
  }
});

/* POST /api/auth/google-token — access_token flow */
router.post('/google-token', async (req, res) => {
  try {
    const { userInfo } = req.body;
    if (!userInfo?.email) return res.status(400).json({ message: 'Invalid Google user info' });

    const { sub: googleId, email, name, picture: profileImage } = userInfo;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (user) {
      if (!user.googleId) {
        user.googleId     = googleId;
        user.profileImage = profileImage;
        user.authProvider = 'google';
        user.isVerified   = true;
        await user.save();
      }
    } else {
      user = await User.create({
        name, email, googleId, profileImage,
        authProvider: 'google',
        isVerified:   true,
        password:     null,
      });
    }
    res.json({ token: sign(user._id), user: safe(user) });
  } catch (err) {
    console.error('Google token auth error:', err.message);
    res.status(401).json({ message: 'Google login failed. Please try again.' });
  }
});

/* POST /api/auth/make-admin (dev helper) */
router.post('/make-admin', async (req, res) => {
  try {
    const { email, secret } = req.body;
    if (secret !== 'naturekart_admin_2024') return res.status(403).json({ message: 'Wrong secret' });
    const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `${user.email} is now an admin`, user: safe(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
