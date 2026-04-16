import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const FloatInput = ({ id, label, type = 'text', value, onChange, error }) => {
  const [focused, setFocused] = useState(false);
  const up = focused || value;
  return (
    <div className="relative">
      <motion.label htmlFor={id}
        animate={{ top: up ? '6px' : '50%', fontSize: up ? '10px' : '14px', color: up ? '#10b981' : '#a8a29e' }}
        transition={{ duration: 0.18 }}
        style={{ position: 'absolute', left: '16px', translateY: up ? '0%' : '-50%', pointerEvents: 'none', fontWeight: 600 }}>
        {label}
      </motion.label>
      <input id={id} type={type} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className={`w-full pt-6 pb-2 px-4 rounded-xl border-2 text-sm bg-white transition-all outline-none
          ${focused ? 'border-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]' : 'border-stone-200'}
          ${error ? 'border-red-400' : ''}`}
      />
      {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
    </div>
  );
};

export default function LoginPage() {
  const navigate        = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess]   = useState('');

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
      setSuccess('🎉 Login successful!');
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* Google One-Tap using access_token flow */
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGLoading(true); setApiError('');
      try {
        /* Get user info from Google */
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        }).then(r => r.json());

        /* Send to our backend as a pseudo-credential object */
        const res = await api.post('/auth/google-token', { userInfo });
        loginWithGoogle(res.data.token, res.data.user);
        setSuccess('🎉 Welcome to NatureKart!');
        setTimeout(() => navigate('/'), 800);
      } catch {
        setApiError('Google login failed. Please try again.');
      } finally {
        setGLoading(false);
      }
    },
    onError: () => setApiError('Google sign-in was cancelled.'),
  });

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
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="relative w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
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
            {(apiError || success) && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`mb-5 p-3.5 rounded-xl text-sm font-medium text-center ${
                  success ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'
                }`}>
                {success || `⚠️ ${apiError}`}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google Button */}
          {GOOGLE_CLIENT_ID ? (
            <motion.button onClick={() => googleLogin()} disabled={gLoading}
              whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 mb-5 flex items-center justify-center gap-3 bg-white border-2 border-stone-200 rounded-2xl font-bold text-stone-700 text-sm shadow-sm hover:border-stone-300 transition-all disabled:opacity-70">
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
              {gLoading ? 'Signing in…' : 'Continue with Google'}
            </motion.button>
          ) : (
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 text-center font-medium">
              ⚠️ Google login: Add <code>VITE_GOOGLE_CLIENT_ID</code> to <code>.env</code> to enable
            </div>
          )}

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs text-stone-400 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

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
