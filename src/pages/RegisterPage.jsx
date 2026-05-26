import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import OTPVerificationModal from '../components/OTPVerificationModal.jsx';

/* ── Float Label Input ──────────────────────────────────────────────────────── */
const FloatInput = ({ id, label, type = 'text', value, onChange, error, rightEl, hint }) => {
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
      {hint && !error && (
        <p style={{ color: '#5C7C68' }} className="text-[10px] mt-1 ml-1 font-sans tracking-wide opacity-70">{hint}</p>
      )}
    </div>
  );
};

/* ── Password Strength Meter ────────────────────────────────────────────────── */
const getStrength = (p) => {
  if (!p) return { score: 0, label: '', color: '' };
  let s = 0;
  if (p.length >= 8)               s++;
  if (p.length >= 12)              s++;
  if (/[A-Z]/.test(p))             s++;
  if (/[0-9]/.test(p))             s++;
  if (/[^A-Za-z0-9]/.test(p))      s++;
  const levels = [
    { label: '',           color: '#D2E5D8',  bg: 'rgba(27,54,38,0.1)'  },
    { label: 'Weak',       color: '#ef4444',  bg: '#ef4444' },
    { label: 'Fair',       color: '#f97316',  bg: '#f97316' },
    { label: 'Good',       color: '#2D543B',  bg: '#2D543B' },
    { label: 'Strong',     color: '#1B3626',  bg: '#1B3626' },
    { label: 'Very Strong',color: '#4A7C59',  bg: '#4A7C59' },
  ];
  return { score: s, ...levels[s] };
};

const PasswordStrengthBar = ({ password }) => {
  const { score, label, color, bg } = getStrength(password);
  if (!password) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 px-1">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map(i => (
          <motion.div key={i}
            animate={{ scaleX: score >= i ? 1 : 0.3, opacity: score >= i ? 1 : 0.2 }}
            transition={{ duration: 0.25 }}
            style={{ backgroundColor: score >= i ? bg : 'rgba(27,54,38,0.1)' }}
            className="h-1 flex-1 rounded-full"
          />
        ))}
      </div>
      <p style={{ color }} className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
    </motion.div>
  );
};

/* ── Toast ──────────────────────────────────────────────────────────────────── */
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

/* ══ REGISTER PAGE ═══════════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, verifyOtp, resendOtp, loginWithGoogle } = useAuth();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [mobile,   setMobile]   = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [toast,    setToast]    = useState(null);
  const [showOTP,  setShowOTP]  = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const validate = () => {
    const e = {};
    if (!name.trim())   e.name    = 'Full name is required';
    if (!email)         e.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address';
    if (!mobile)        e.mobile  = 'Mobile number is required';
    else if (!/^[6-9]\d{9}$/.test(mobile)) e.mobile = 'Enter a valid 10-digit mobile number';
    if (!password)      e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setLoading(true);
    try {
      const data = await register(name, email, password, mobile);
      setPendingEmail(data.email || email);
      showToast('📧 OTP sent! Check your email.', 'success');
      setTimeout(() => setShowOTP(true), 500);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* OTP handlers */
  const handleOtpVerify = async (otp) => {
    const data = await verifyOtp(pendingEmail, otp);
    showToast('🎉 Account created! Welcome to NatureKart!', 'success');
    setShowOTP(false);
    setTimeout(() => navigate('/'), 1000);
  };

  const handleOtpResend = async () => {
    await resendOtp(pendingEmail);
  };

  /* Google */
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGLoading(true);
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(r => r.json());
        const res = await api.post('/auth/google-token', { userInfo });
        loginWithGoogle(res.data.token, res.data.user);
        showToast('🎉 Welcome to NatureKart!', 'success');
        setTimeout(() => navigate('/'), 900);
      } catch {
        showToast('Google signup failed. Please try again.', 'error');
      } finally { setGLoading(false); }
    },
    onError: () => showToast('Google sign-in was cancelled.', 'error'),
  });

  const strength = getStrength(password);

  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>

      {/* OTP Modal */}
      <OTPVerificationModal
        isOpen={showOTP}
        onClose={() => setShowOTP(false)}
        onVerify={handleOtpVerify}
        onResend={handleOtpResend}
        email={pendingEmail}
        title="Verify Your Email"
        subtitle="We sent a 6-digit OTP to"
      />

      {/* ── Page Layout ── */}
      <div className="min-h-screen flex font-sans antialiased" style={{ backgroundColor: '#D2E5D8' }}>

        {/* LEFT — Brand panel */}
        <div className="hidden lg:flex lg:w-[45%] relative flex-col items-center justify-center overflow-hidden px-14"
          style={{ backgroundColor: '#1B3626', borderRight: '1px solid rgba(27,54,38,0.3)' }}>
          {/* Background texture lines */}
          <div className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'linear-gradient(rgba(210,229,216,1) 1px,transparent 1px),linear-gradient(90deg,rgba(210,229,216,1) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

          {['🌿', '🍃', '🌱', '✨', '🌾', '🌻', '🍃', '🌿'].map((e, i) => (
            <motion.div key={i}
              className="absolute text-5xl opacity-10 select-none pointer-events-none"
              style={{ left: `${5 + (i * 13) % 90}%`, top: `${10 + (i * 17) % 80}%` }}
              animate={{ y: [0, -18, 0], rotate: [0, 12, -12, 0] }}
              transition={{ duration: 5 + i * 0.8, repeat: Infinity, ease: 'easeInOut' }}
            >{e}</motion.div>
          ))}

          <div className="relative z-10 text-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ backgroundColor: 'rgba(210,229,216,0.12)', border: '1px solid rgba(210,229,216,0.25)' }}
              className="w-24 h-24 mx-auto mb-8 rounded-2xl flex items-center justify-center shadow-2xl text-5xl"
            >🌿</motion.div>

            <h1 style={{ color: '#D2E5D8' }} className="text-4xl font-serif font-bold mb-3 tracking-tight">
              Join Nature<span style={{ color: '#A8D5B5' }}>Kart</span>
            </h1>
            <p style={{ color: 'rgba(210,229,216,0.7)' }} className="font-accent italic text-base mb-10 max-w-xs mx-auto">
              Start your organic wellness journey today
            </p>

            {[
              { icon: '✅', text: 'Free account — always' },
              { icon: '📧', text: 'Email OTP verification' },
              { icon: '🔒', text: 'bcrypt encrypted passwords' },
              { icon: '🛍️', text: 'Exclusive member discounts' },
            ].map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                style={{ backgroundColor: 'rgba(210,229,216,0.08)', border: '1px solid rgba(210,229,216,0.15)' }}
                className="flex items-center gap-3.5 mb-3.5 rounded-sm px-5 py-3"
              >
                <span className="text-xl">{f.icon}</span>
                <span style={{ color: '#D2E5D8' }} className="font-bold text-xs tracking-wider uppercase font-sans">{f.text}</span>
              </motion.div>
            ))}
          </div>

          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl"
            style={{ backgroundColor: 'rgba(168,213,181,0.08)' }} />
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl"
            style={{ backgroundColor: 'rgba(210,229,216,0.05)' }} />
        </div>

        {/* RIGHT — Register form */}
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
            className="w-full max-w-md py-8"
          >
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-7">
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
            <div className="mb-7">
              <h2 style={{ color: '#1B3626' }} className="text-3xl font-serif font-bold leading-tight">
                Create account
              </h2>
              <p style={{ color: '#5C7C68' }} className="mt-1.5 text-sm font-sans">
                Join 50,000+ wellness enthusiasts — it's free!
              </p>
            </div>

            {/* Card */}
            <div style={{ backgroundColor: '#E5EFE9', borderColor: 'rgba(27,54,38,0.2)' }}
              className="rounded-sm border shadow-2xl p-8">

              {/* Google Sign Up */}
              <motion.button
                onClick={() => googleLogin()}
                disabled={gLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{ backgroundColor: '#1B3626', color: '#ffffff', borderColor: 'rgba(27,54,38,0.3)' }}
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
                <span style={{ color: '#ffffff' }}>{gLoading ? 'Signing up…' : 'Continue with Google'}</span>
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(27,54,38,0.15)' }} />
                <span style={{ color: '#5C7C68' }} className="text-[10px] font-sans font-bold tracking-widest uppercase">or register with email</span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(27,54,38,0.15)' }} />
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <FloatInput
                  id="reg-name" label="Full Name"
                  value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
                  error={errors.name}
                />

                {/* Email */}
                <FloatInput
                  id="reg-email" label="Email Address" type="email"
                  value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                  error={errors.email}
                />

                {/* Mobile */}
                <FloatInput
                  id="reg-mobile" label="Mobile Number" type="tel"
                  value={mobile}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setMobile(v);
                    setErrors(p => ({ ...p, mobile: '' }));
                  }}
                  error={errors.mobile}
                  hint="10-digit Indian mobile number (starts with 6-9)"
                />

                {/* Password */}
                <div>
                  <FloatInput
                    id="reg-password" label="Password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                    error={errors.password}
                    rightEl={
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        style={{ color: '#5C7C68' }} className="transition-opacity hover:opacity-70 text-sm">
                        {showPass ? '🙈' : '👁'}
                      </button>
                    }
                  />
                  <PasswordStrengthBar password={password} />
                </div>

                {/* Confirm Password */}
                <FloatInput
                  id="reg-confirm" label="Confirm Password"
                  type={showConf ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: '' })); }}
                  error={errors.confirm}
                  rightEl={
                    <button type="button" onClick={() => setShowConf(p => !p)}
                      style={{ color: '#5C7C68' }} className="transition-opacity hover:opacity-70 text-sm">
                      {showConf ? '🙈' : '👁'}
                    </button>
                  }
                />

                {/* Password match indicator */}
                {confirm && password && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ color: confirm === password ? '#1B3626' : '#ef4444' }}
                    className="text-xs font-bold ml-1"
                  >
                    {confirm === password ? '✅ Passwords match' : '❌ Passwords do not match'}
                  </motion.p>
                )}

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading || (strength.score < 1 && password.length > 0)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ backgroundColor: '#1B3626', color: '#ffffff' }}
                  className="w-full py-4 mt-2 font-sans font-bold text-xs tracking-widest uppercase rounded-sm shadow-lg shimmer-btn-glow flex items-center justify-center gap-2 disabled:opacity-75 transition-all"
                >
                  {loading ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full inline-block" />
                      <span style={{ color: '#ffffff' }}>Creating account…</span>
                    </>
                  ) : <span style={{ color: '#ffffff' }}>🌿 Create My Account →</span>}
                </motion.button>
              </form>

              {/* Login link */}
              <div className="mt-6 text-center">
                <p style={{ color: '#5C7C68' }} className="text-xs font-sans tracking-wide">
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: '#1B3626' }} className="font-bold hover:opacity-70 transition-opacity">
                    Sign in
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
              <span>Passwords hashed with bcrypt · JWT secured</span>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
