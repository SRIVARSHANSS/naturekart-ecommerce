import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';

const FloatInput = ({ id, label, type = 'text', value, onChange, error }) => {
  const [focused, setFocused] = useState(false);
  const up = focused || value;
  return (
    <div className="relative">
      <motion.label
        htmlFor={id}
        animate={{ top: up ? '6px' : '50%', fontSize: up ? '10px' : '14px', color: up ? '#10b981' : '#a8a29e' }}
        transition={{ duration: 0.18 }}
        style={{ position: 'absolute', left: '16px', translateY: up ? '0%' : '-50%', pointerEvents: 'none', fontWeight: 600 }}
      >
        {label}
      </motion.label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full pt-6 pb-2 px-4 rounded-xl border-2 text-sm bg-white transition-all outline-none
          ${focused ? 'border-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]' : 'border-stone-200'}
          ${error ? 'border-red-400' : ''}`}
      />
      {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
    </div>
  );
};

export default function LoginPage() {
  const navigate     = useNavigate();
  const { login }    = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e = {};
    if (!email)    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setApiError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/profile');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['🌿','🍃','🌱','🌾','✨'].map((e, i) => (
          <motion.div key={i} className="absolute text-4xl opacity-10"
            style={{ left: `${10 + i * 20}%`, top: `${15 + (i % 3) * 25}%` }}
            animate={{ y: [-10, 10, -10], rotate: [-5, 5, -5] }}
            transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}>
            {e}
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 32, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <motion.div whileHover={{ scale: 1.1, rotate: -5 }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-green-300/40">
              <span className="text-2xl">🌿</span>
            </motion.div>
            <span className="text-2xl font-black text-green-800">Nature<span className="text-emerald-500">Kart</span></span>
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold text-stone-800">Welcome back</h1>
          <p className="text-stone-400 mt-1 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-stone-200/60 border border-white p-8">
          <AnimatePresence>
            {apiError && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium text-center">
                ⚠️ {apiError}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FloatInput id="email" label="Email address" type="email"
              value={email} onChange={e => setEmail(e.target.value)} error={errors.email} />
            <FloatInput id="password" label="Password" type="password"
              value={password} onChange={e => setPassword(e.target.value)} error={errors.password} />

            <motion.button type="submit" whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(16,185,129,0.3)' }}
              whileTap={{ scale: 0.97 }} disabled={loading}
              className="w-full py-4 mt-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-green-200/60 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
              {loading ? (
                <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full inline-block" /> Signing in…</>
              ) : 'Sign In →'}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-stone-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-4">
          <Link to="/" className="text-sm text-stone-400 hover:text-green-600 font-medium transition-colors">
            ← Back to NatureKart Home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
