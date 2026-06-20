import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import OTPVerificationModal from '../components/OTPVerificationModal.jsx';

/* ── Float Label Input ──────────────────────────────────────────────────────── */
const FloatInput = ({ id, label, type = 'text', value, onChange, error, rightEl }) => {
  const [focused, setFocused] = useState(false);
  const up = focused || value;
  return (
    <div className="relative">
      <motion.label
        htmlFor={id}
        animate={{
          top:      up ? '7px'  : '50%',
          fontSize: up ? '10px' : '13px',
          color:    up ? '#1B3626' : '#5C7C68',
        }}
        transition={{ duration: 0.18 }}
        style={{ position: 'absolute', left: '16px', translateY: up ? '0%' : '-50%', pointerEvents: 'none', fontWeight: 700, zIndex: 1 }}
      >
        {label}
      </motion.label>
      <input
        id={id} type={type} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          backgroundColor: '#F4F8F6',
          color: '#1B3626',
          borderColor: focused ? '#1B3626' : error ? '#ef4444' : 'rgba(27,54,38,0.2)',
          boxShadow: focused ? '0 0 0 2px rgba(27,54,38,0.08)' : error ? '0 0 0 2px rgba(239,68,68,0.08)' : 'none',
        }}
        className="w-full pt-6 pb-2 pl-4 pr-12 rounded-sm border text-sm transition-all outline-none"
      />
      {rightEl && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>
      )}
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="text-red-600 text-[11px] mt-1 ml-1 font-medium">⚠ {error}</motion.p>
      )}
    </div>
  );
};

/* ── Toast Notification ─────────────────────────────────────────────────────── */
const Toast = ({ message, type }) => (
  <motion.div
    initial={{ opacity: 0, y: 40, scale: 0.9 }}
    animate={{ opacity: 1, y: 0,  scale: 1   }}
    exit={{    opacity: 0, y: 40, scale: 0.9  }}
    style={{
      backgroundColor: type === 'success' ? '#E5EFE9' : '#fef2f2',
      borderColor: type === 'success' ? '#1B3626' : '#ef4444',
      color: type === 'success' ? '#1B3626' : '#dc2626',
    }}
    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3.5 rounded-sm border font-sans font-bold text-xs tracking-wider uppercase flex items-center gap-2.5 shadow-2xl"
  >
    {type === 'success' ? '✅' : '⚠️'} {message}
  </motion.div>
);

/* ── Forgot Password Modal ───────────────────────────────────────────────────── */
const ForgotPasswordFlow = ({ onClose, forgotPassword, resetPassword }) => {
  const [step, setStep]           = useState('email');
  const [email, setEmail]         = useState('');
  const [otp, setOtp]             = useState('');
  const [newPass, setNewPass]     = useState('');
  const [confirmPass, setConfirm] = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleSendOTP = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email address'); return;
    }
    setLoading(true); setError('');
    try {
      await forgotPassword(email);
      setStep('otp');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) { setError('Enter the 6-digit OTP'); return; }
    setStep('newpass'); setError('');
  };

  const handleReset = async () => {
    if (newPass.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPass !== confirmPass) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      await resetPassword(email, otp, newPass);
      setStep('done');
    } catch (err) {
      setError(err?.response?.data?.message || 'Reset failed. Check your OTP.');
    } finally { setLoading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99998] flex items-center justify-center p-4"
      style={{ background: 'rgba(27,54,38,0.25)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1,    opacity: 1, y: 0   }}
        exit={{    scale: 0.94, opacity: 0, y: 20   }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ backgroundColor: '#E5EFE9', borderColor: 'rgba(27,54,38,0.2)' }}
        className="w-full max-w-sm border rounded-sm shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div style={{ backgroundColor: '#D2E5D8', borderBottom: '1px solid rgba(27,54,38,0.15)' }}
          className="px-8 pt-7 pb-5 text-center relative">
          <button onClick={onClose}
            style={{ backgroundColor: '#E5EFE9', borderColor: 'rgba(27,54,38,0.2)', color: '#1B3626' }}
            className="absolute top-4 right-4 w-7 h-7 border rounded-sm flex items-center justify-center text-xs transition-colors hover:opacity-80">✕</button>
          <div className="text-3xl mb-2">🔐</div>
          <h2 style={{ color: '#1B3626' }} className="font-serif font-bold text-lg">
            {step === 'done' ? 'Password Reset!' : 'Forgot Password?'}
          </h2>
          <p style={{ color: '#5C7C68' }} className="text-xs mt-1">
            {step === 'email'   && 'Enter your email to receive a reset OTP'}
            {step === 'otp'     && `OTP sent to ${email}`}
            {step === 'newpass' && 'Set your new password'}
            {step === 'done'    && 'You can now login with your new password'}
          </p>
        </div>

        <div className="px-7 py-6 space-y-4" style={{ backgroundColor: '#E5EFE9' }}>
          {error && (
            <div style={{ backgroundColor: '#fef2f2', borderColor: 'rgba(239,68,68,0.35)', color: '#dc2626' }}
              className="p-3 border rounded-sm text-xs font-sans text-center">
              ⚠️ {error}
            </div>
          )}

          {step === 'email' && (
            <>
              <FloatInput id="fp-email" label="Email Address" type="email"
                value={email} onChange={e => { setEmail(e.target.value); setError(''); }} />
              <motion.button onClick={handleSendOTP} disabled={loading}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ backgroundColor: '#1B3626', color: '#ffffff' }}
                className="w-full py-3.5 font-sans font-bold text-xs tracking-widest uppercase rounded-sm shadow-lg shimmer-btn-glow flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <>
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full inline-block" /> Sending…
                </> : '📧 Send Reset OTP'}
              </motion.button>
            </>
          )}

          {step === 'otp' && (
            <>
              <p style={{ color: '#5C7C68' }} className="text-xs text-center font-sans tracking-wide">Enter the 6-digit OTP from your email</p>
              <input
                value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g,'').slice(0,6)); setError(''); }}
                placeholder="Enter 6-digit OTP"
                inputMode="numeric"
                style={{ backgroundColor: '#F4F8F6', color: '#1B3626', borderColor: 'rgba(27,54,38,0.2)' }}
                className="w-full py-3 px-4 text-center text-2xl font-bold font-sans rounded-sm border focus:outline-none tracking-[0.5em] placeholder-opacity-30"
              />
              <motion.button onClick={handleVerifyOTP} disabled={otp.length < 6}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ backgroundColor: '#1B3626', color: '#ffffff' }}
                className="w-full py-3.5 font-sans font-bold text-xs tracking-widest uppercase rounded-sm shadow-lg shimmer-btn-glow disabled:opacity-50">
                ✅ Verify OTP
              </motion.button>
              <button onClick={handleSendOTP} style={{ color: '#1B3626' }}
                className="w-full text-xs font-sans font-bold tracking-wider uppercase hover:opacity-70 transition-opacity">
                🔄 Resend OTP
              </button>
            </>
          )}

          {step === 'newpass' && (
            <>
              <div className="relative">
                <FloatInput id="fp-pass" label="New Password" type={showPass ? 'text' : 'password'}
                  value={newPass} onChange={e => { setNewPass(e.target.value); setError(''); }}
                  rightEl={
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      style={{ color: '#5C7C68' }} className="text-sm hover:opacity-80 transition-opacity">
                      {showPass ? '🙈' : '👁'}
                    </button>
                  }
                />
              </div>
              <FloatInput id="fp-confirm" label="Confirm Password" type="password"
                value={confirmPass} onChange={e => { setConfirm(e.target.value); setError(''); }} />
              <motion.button onClick={handleReset} disabled={loading}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ backgroundColor: '#1B3626', color: '#ffffff' }}
                className="w-full py-3.5 font-sans font-bold text-xs tracking-widest uppercase rounded-sm shadow-lg shimmer-btn-glow flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <>
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full inline-block" /> Resetting…
                </> : '🔒 Reset Password'}
              </motion.button>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🎉</div>
              <p style={{ color: '#1B3626' }} className="font-serif font-bold text-base">Password reset successfully!</p>
              <p style={{ color: '#5C7C68' }} className="text-xs mt-1">You can now login with your new password.</p>
              <motion.button onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ backgroundColor: '#1B3626', color: '#ffffff' }}
                className="mt-5 w-full py-3.5 font-sans font-bold text-xs tracking-widest uppercase rounded-sm shadow-lg shimmer-btn-glow">
                Go to Login →
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ══ LOGIN PAGE ═══════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, verifyOtp, resendOtp, forgotPassword, resetPassword, isLoggedIn } = useAuth();

  // If already logged in, redirect to homepage
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [toast,    setToast]    = useState(null);
  const [showForgot,     setShowForgot]     = useState(false);
  const [showOTPModal,   setShowOTPModal]   = useState(false);
  const [pendingEmail,   setPendingEmail]   = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const validate = () => {
    const e = {};
    if (!email)    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setLoading(true);
    try {
      const loggedUser = await login(email, password);
      showToast('🎉 Welcome back to NatureKart!');
      if (loggedUser?.role === 'admin') {
        setTimeout(() => navigate('/admin/dashboard'), 900);
      } else {
        const from = location.state?.from?.pathname || '/';
        setTimeout(() => navigate(from, { replace: true }), 900);
      }
    } catch (err) {
      const data = err?.response?.data;
      if (data?.requiresVerification) {
        setPendingEmail(data.email || email);
        setShowOTPModal(true);
      } else {
        showToast(data?.message || 'Login failed. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  /* Google OAuth */
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGLoading(true);
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(r => r.json());
        const res = await api.post('/auth/google-token', { userInfo });
        loginWithGoogle(res.data.token, res.data.user);
        showToast('🎉 Welcome to NatureKart!');
        const from = location.state?.from?.pathname || '/';
        setTimeout(() => navigate(from, { replace: true }), 900);
      } catch {
        showToast('Google login failed. Please try again.', 'error');
      } finally { setGLoading(false); }
    },
    onError: () => showToast('Google sign-in was cancelled.', 'error'),
  });

  /* OTP handlers for unverified-login flow */
  const handleOtpVerify = async (otp) => {
    const data = await verifyOtp(pendingEmail, otp);
    showToast('✅ Email verified! Welcome to NatureKart!');
    setShowOTPModal(false);
    const from = location.state?.from?.pathname || '/';
    setTimeout(() => navigate(from, { replace: true }), 900);
  };

  const handleOtpResend = async () => {
    await resendOtp(pendingEmail);
  };

  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <ForgotPasswordFlow
            onClose={() => setShowForgot(false)}
            forgotPassword={forgotPassword}
            resetPassword={resetPassword}
          />
        )}
      </AnimatePresence>

      {/* OTP Modal for unverified accounts */}
      <OTPVerificationModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerify={handleOtpVerify}
        onResend={handleOtpResend}
        email={pendingEmail}
        title="Verify Your Email"
        subtitle="Your account needs verification. Enter the OTP sent to"
      />

      {/* ── Page Layout ── */}
      <div className="min-h-screen flex font-sans antialiased" style={{ backgroundColor: '#D2E5D8' }}>

        {/* LEFT — Brand panel (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-[55%] relative flex-col items-center justify-center overflow-hidden px-16"
          style={{ backgroundColor: '#1B3626', borderRight: '1px solid rgba(27,54,38,0.3)' }}>


          {/* Animated background leaves */}
          {['🌿', '🍃', '🌱', '✨', '🌾', '🌿', '🍃', '🌱'].map((e, i) => (
            <motion.div key={i}
              className="absolute text-5xl opacity-10 select-none pointer-events-none"
              style={{ left: `${5 + (i * 13) % 90}%`, top: `${10 + (i * 17) % 80}%` }}
              animate={{ y: [0, -20, 0], rotate: [0, 15, -15, 0] }}
              transition={{ duration: 5 + i * 0.7, repeat: Infinity, ease: 'easeInOut' }}
            >{e}</motion.div>
          ))}

          <div className="relative z-10 text-center">
            {/* Logo */}
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              style={{ backgroundColor: 'rgba(210,229,216,0.12)', border: '1px solid rgba(210,229,216,0.25)' }}
              className="w-24 h-24 mx-auto mb-8 rounded-2xl flex items-center justify-center shadow-2xl text-5xl"
            >🌿</motion.div>

            <h1 style={{ color: '#D2E5D8' }} className="text-5xl font-serif font-bold mb-3 leading-tight tracking-tight">
              Nature<span style={{ color: '#A8D5B5' }}>Kart</span>
            </h1>
            <p style={{ color: 'rgba(210,229,216,0.7)' }} className="font-accent italic text-base mb-10 max-w-xs mx-auto leading-relaxed">
              India's Premium Organic Wellness Store
            </p>

            {/* Features */}
            {[
              { icon: '🛡️', text: 'Secure JWT Authentication' },
              { icon: '🌿', text: '100% Natural Products' },
              { icon: '🚚', text: 'Fast Delivery Across India' },
              { icon: '⭐', text: 'Trusted by 50,000+ Customers' },
            ].map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                style={{ backgroundColor: 'rgba(210,229,216,0.08)', border: '1px solid rgba(210,229,216,0.15)' }}
                className="flex items-center gap-3.5 mb-4 rounded-sm px-6 py-3"
              >
                <span className="text-xl">{f.icon}</span>
                <span style={{ color: '#D2E5D8' }} className="font-bold text-xs tracking-wider uppercase font-sans">{f.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Decorative gradient orbs */}
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl"
            style={{ backgroundColor: 'rgba(168,213,181,0.08)' }} />
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl"
            style={{ backgroundColor: 'rgba(210,229,216,0.05)' }} />
        </div>

        {/* RIGHT — Login form */}
        <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #D2E5D8 0%, #E5EFE9 50%, #D2E5D8 100%)' }}>
          {/* Mobile background leaves */}
          {['🌿', '🍃', '✨'].map((e, i) => (
            <motion.div key={i}
              className="lg:hidden absolute text-4xl opacity-[0.06] select-none pointer-events-none"
              style={{ left: `${10 + i * 35}%`, top: `${15 + i * 25}%` }}
              animate={{ y: [-8, 8, -8] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
            >{e}</motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-2">
                <div style={{ backgroundColor: '#1B3626', border: '1px solid rgba(27,54,38,0.3)' }}
                  className="w-11 h-11 rounded-md flex items-center justify-center shadow-xl">
                  <span className="text-2xl">🌿</span>
                </div>
                <span style={{ color: '#1B3626' }} className="text-2xl font-serif font-bold">
                  Nature<span style={{ color: '#2D543B' }}>Kart</span>
                </span>
              </Link>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h2 style={{ color: '#1B3626' }} className="text-3xl font-serif font-bold leading-tight">
                Welcome back
              </h2>
              <p style={{ color: '#5C7C68' }} className="mt-1.5 text-sm font-sans">
                Sign in to continue your wellness journey
              </p>
            </div>

            {/* Card */}
            <div style={{ backgroundColor: '#E5EFE9', borderColor: 'rgba(27,54,38,0.2)' }}
              className="rounded-sm border shadow-2xl p-8">

              {/* Google Button */}
              <motion.button
                onClick={() => googleLogin()}
                disabled={gLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  backgroundColor: '#1B3626',
                  color: '#ffffff',
                  borderColor: 'rgba(27,54,38,0.3)',
                }}
                className="w-full py-3.5 mb-5 flex items-center justify-center gap-3 border rounded-sm font-sans font-bold text-xs tracking-widest uppercase shadow-sm transition-all disabled:opacity-70 hover:opacity-90"
              >
                {gLoading ? (
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#ffffff"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#ffffff" fillOpacity="0.85"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#ffffff" fillOpacity="0.7"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#ffffff" fillOpacity="0.9"/>
                  </svg>
                )}
                <span style={{ color: '#ffffff' }}>{gLoading ? 'Signing in…' : 'Continue with Google'}</span>
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(27,54,38,0.15)' }} />
                <span style={{ color: '#5C7C68' }} className="text-[10px] font-sans font-bold tracking-widest uppercase">or sign in with email</span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(27,54,38,0.15)' }} />
              </div>

              {/* Email+Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <FloatInput
                  id="login-email" label="Email Address" type="email"
                  value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                  error={errors.email}
                />
                <FloatInput
                  id="login-password" label="Password"
                  type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                  error={errors.password}
                  rightEl={
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      style={{ color: '#5C7C68' }} className="transition-opacity hover:opacity-70 text-sm">
                      {showPass ? '🙈' : '👁'}
                    </button>
                  }
                />

                {/* Forgot Password */}
                <div className="text-right -mt-1">
                  <button type="button"
                    onClick={() => setShowForgot(true)}
                    style={{ color: '#1B3626' }}
                    className="text-xs font-sans font-bold tracking-wider uppercase hover:opacity-70 transition-opacity">
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={loading}
                  style={{ backgroundColor: '#1B3626', color: '#ffffff' }}
                  className="w-full py-4 mt-1 font-sans font-bold text-xs tracking-widest uppercase rounded-sm shadow-lg shimmer-btn-glow flex items-center justify-center gap-2 disabled:opacity-75 transition-all"
                >
                  {loading ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full inline-block" />
                      <span style={{ color: '#ffffff' }}>Signing in…</span>
                    </>
                  ) : <span style={{ color: '#ffffff' }}>Sign In →</span>}
                </motion.button>
              </form>

              {/* Register link */}
              <div className="mt-6 text-center">
                <p style={{ color: '#5C7C68' }} className="text-xs font-sans tracking-wide">
                  Don't have an account?{' '}
                  <Link to="/register" style={{ color: '#1B3626' }} className="font-bold hover:opacity-70 transition-opacity">
                    Create account free
                  </Link>
                </p>
              </div>
            </div>

            {/* Back link */}
            <p className="text-center mt-5">
              <Link to="/" style={{ color: '#1B3626' }} className="text-xs font-sans font-bold tracking-widest uppercase hover:opacity-70 transition-opacity">
                ← Back to NatureKart
              </Link>
            </p>

            {/* Security note */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-sans tracking-wider uppercase"
              style={{ color: '#5C7C68' }}>
              <span>🔒</span>
              <span>256-bit encrypted · JWT secured</span>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
