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
          fontSize: up ? '10px' : '14px',
          color:    up ? '#10b981' : '#a8a29e',
        }}
        transition={{ duration: 0.18 }}
        style={{ position: 'absolute', left: '16px', translateY: up ? '0%' : '-50%', pointerEvents: 'none', fontWeight: 700, zIndex: 1 }}
      >
        {label}
      </motion.label>
      <input
        id={id} type={type} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className={`w-full pt-6 pb-2 pl-4 pr-12 rounded-xl border-2 text-sm bg-white/80 transition-all outline-none text-stone-800
          ${focused ? 'border-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]' : 'border-stone-200'}
          ${error   ? 'border-red-400 shadow-[0_0_0_4px_rgba(239,68,68,0.10)]' : ''}`}
      />
      {rightEl && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>
      )}
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-xs mt-1 ml-1 font-medium">⚠ {error}</motion.p>
      )}
      {hint && !error && (
        <p className="text-stone-400 text-xs mt-1 ml-1">{hint}</p>
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
    { label: '',          color: 'bg-stone-200' },
    { label: 'Weak',      color: 'bg-red-400'   },
    { label: 'Fair',      color: 'bg-orange-400' },
    { label: 'Good',      color: 'bg-yellow-400' },
    { label: 'Strong',    color: 'bg-emerald-400'},
    { label: 'Very Strong', color: 'bg-emerald-600' },
  ];
  return { score: s, ...levels[s] };
};

const PasswordStrengthBar = ({ password }) => {
  const { score, label, color } = getStrength(password);
  if (!password) return null;
  const textColors = { 'Weak': 'text-red-500', 'Fair': 'text-orange-500', 'Good': 'text-yellow-600', 'Strong': 'text-emerald-600', 'Very Strong': 'text-emerald-700' };
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 px-1">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map(i => (
          <motion.div key={i}
            animate={{ scaleX: score >= i ? 1 : 0.3, opacity: score >= i ? 1 : 0.25 }}
            transition={{ duration: 0.25 }}
            className={`h-1.5 flex-1 rounded-full ${score >= i ? color : 'bg-stone-200'}`}
          />
        ))}
      </div>
      <p className={`text-xs font-bold ${textColors[label] || 'text-stone-400'}`}>{label}</p>
    </motion.div>
  );
};

/* ── Toast ──────────────────────────────────────────────────────────────────── */
const Toast = ({ message, type }) => (
  <motion.div
    initial={{ opacity: 0, y: 40, scale: 0.9 }}
    animate={{ opacity: 1, y: 0,  scale: 1   }}
    exit={{    opacity: 0, y: 40, scale: 0.9  }}
    className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3.5 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-2 ${
      type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-300/50' : 'bg-red-600 text-white shadow-red-300/50'
    }`}
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
      <div className="min-h-screen flex">

        {/* LEFT — Brand panel */}
        <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 flex-col items-center justify-center overflow-hidden px-14">
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
              className="w-24 h-24 mx-auto mb-8 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl text-5xl"
            >🌿</motion.div>

            <h1 className="text-4xl font-black text-white mb-3">
              Join Nature<span className="text-emerald-300">Kart</span>
            </h1>
            <p className="text-emerald-200 text-base font-medium mb-10 max-w-xs mx-auto">
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
                className="flex items-center gap-3 mb-3.5 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/10"
              >
                <span className="text-xl">{f.icon}</span>
                <span className="text-white font-semibold text-sm">{f.text}</span>
              </motion.div>
            ))}
          </div>

          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl" />
          <div className="absolute -top-20 -right-20  w-64 h-64 bg-green-300/20  rounded-full blur-3xl" />
        </div>

        {/* RIGHT — Register form */}
        <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-stone-50 to-emerald-50/30 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md py-8"
          >
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-7">
              <Link to="/" className="inline-flex items-center gap-2">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-green-200/50">
                  <span className="text-2xl">🌿</span>
                </div>
                <span className="text-2xl font-black text-green-800">
                  Nature<span className="text-emerald-500">Kart</span>
                </span>
              </Link>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <h2 className="text-3xl font-black text-stone-800 leading-tight">
                Create account 🌱
              </h2>
              <p className="text-stone-400 mt-1.5 text-sm font-medium">
                Join 50,000+ wellness enthusiasts — it's free!
              </p>
            </div>

            {/* Card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-stone-200/60 border border-white/80 p-8">

              {/* Google Sign Up */}
              <motion.button
                onClick={() => googleLogin()}
                disabled={gLoading}
                whileHover={{ scale: 1.02, boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 mb-5 flex items-center justify-center gap-3 bg-white border-2 border-stone-200 hover:border-stone-300 rounded-2xl font-bold text-stone-700 text-sm shadow-sm transition-all disabled:opacity-70"
              >
                {gLoading ? (
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                {gLoading ? 'Signing up…' : 'Continue with Google'}
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-stone-100" />
                <span className="text-xs text-stone-400 font-semibold">or register with email</span>
                <div className="flex-1 h-px bg-stone-100" />
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
                        className="text-stone-400 hover:text-stone-600 transition-colors text-sm">
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
                      className="text-stone-400 hover:text-stone-600 transition-colors text-sm">
                      {showConf ? '🙈' : '👁'}
                    </button>
                  }
                />

                {/* Password match indicator */}
                {confirm && password && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={`text-xs font-bold ml-1 ${confirm === password ? 'text-emerald-600' : 'text-red-500'}`}
                  >
                    {confirm === password ? '✅ Passwords match' : '❌ Passwords do not match'}
                  </motion.p>
                )}

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading || (strength.score < 1 && password.length > 0)}
                  whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(16,185,129,0.28)' }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 mt-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-green-200/60 flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                >
                  {loading ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full inline-block" />
                      Creating account…
                    </>
                  ) : '🌿 Create My Account →'}
                </motion.button>
              </form>

              {/* Login link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-stone-400">
                  Already have an account?{' '}
                  <Link to="/login" className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Back link */}
            <p className="text-center mt-5">
              <Link to="/" className="text-sm text-stone-400 hover:text-green-600 font-medium transition-colors">
                ← Back to NatureKart
              </Link>
            </p>

            {/* Security note */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-stone-400">
              <span>🔒</span>
              <span>Passwords hashed with bcrypt · JWT secured · OTP verified</span>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
