import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * OTPVerificationModal
 * Props:
 *   isOpen        — boolean
 *   onClose       — fn()
 *   onVerify      — async fn(otp: string) → throws on failure
 *   onResend      — async fn() → throws on failure
 *   email         — string (masked display)
 *   title         — string
 *   subtitle      — string
 */
export default function OTPVerificationModal({
  isOpen, onClose, onVerify, onResend,
  email = '', title = 'Verify Your Email', subtitle,
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  /* Reset state when modal opens */
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setError('');
      setSuccess('');
      setCountdown(60);
      setCanResend(false);
      startCountdown();
      setTimeout(() => inputRefs.current[0]?.focus(), 300);
    }
    return () => clearInterval(timerRef.current);
  }, [isOpen]);

  const startCountdown = () => {
    clearInterval(timerRef.current);
    setCountdown(60);
    setCanResend(false);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /* Mask email for display */
  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c)
    : '';

  const handleDigitChange = (idx, val) => {
    const clean = val.replace(/\D/g, '');
    if (!clean && val) return; // reject non-digits
    const next = [...digits];

    if (clean.length > 1) {
      /* Handle paste */
      const pasted = clean.slice(0, 6).split('');
      const filled = [...digits];
      pasted.forEach((d, i) => { if (idx + i < 6) filled[idx + i] = d; });
      setDigits(filled);
      const nextFocus = Math.min(idx + pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    next[idx] = clean;
    setDigits(next);
    setError('');
    if (clean && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits]; next[idx] = ''; setDigits(next);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft'  && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (e.key === 'Enter') handleVerify();
  };

  const handleVerify = async () => {
    const otp = digits.join('');
    if (otp.length < 6) { setError('Please enter all 6 digits'); return; }
    setLoading(true); setError('');
    try {
      await onVerify(otp);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Invalid OTP. Try again.');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true); setError(''); setSuccess('');
    try {
      await onResend();
      setSuccess('✅ New OTP sent to your email!');
      setDigits(['', '', '', '', '', '']);
      startCountdown();
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not resend OTP. Try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const otp = digits.join('');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 32 }}
            animate={{ scale: 1,    opacity: 1, y: 0  }}
            exit={{    scale: 0.88, opacity: 0, y: 32  }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-green-800 to-emerald-600 px-8 pt-8 pb-6 text-center relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
              >✕</button>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-4xl mb-3"
              >📧</motion.div>
              <h2 className="text-white font-black text-xl mb-1">{title}</h2>
              <p className="text-emerald-200 text-sm">
                {subtitle || `We sent a 6-digit code to`}
              </p>
              {maskedEmail && (
                <p className="text-white font-bold text-sm mt-1">{maskedEmail}</p>
              )}
            </div>

            {/* Body */}
            <div className="px-8 py-7">
              {/* Alerts */}
              <AnimatePresence>
                {(error || success) && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={`mb-5 p-3 rounded-xl text-sm font-medium text-center ${
                      success
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-red-50 border border-red-200 text-red-600'
                    }`}
                  >
                    {success || `⚠️ ${error}`}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* OTP Digits */}
              <div className="flex gap-2 justify-center mb-6">
                {digits.map((d, i) => (
                  <motion.input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    value={d}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    maxLength={6}
                    inputMode="numeric"
                    whileFocus={{ scale: 1.08 }}
                    className={`w-11 h-14 text-center text-xl font-black rounded-xl border-2 outline-none transition-all
                      ${d ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-md shadow-emerald-100'
                          : 'border-stone-200 bg-stone-50 text-stone-800'}
                      ${error ? 'border-red-300 bg-red-50' : ''}
                      focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.18)]`}
                  />
                ))}
              </div>

              {/* Verify Button */}
              <motion.button
                onClick={handleVerify}
                disabled={loading || otp.length < 6}
                whileHover={{ scale: 1.02, boxShadow: '0 16px 32px rgba(16,185,129,0.3)' }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-extrabold rounded-2xl shadow-lg shadow-green-200/60 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full inline-block"
                    />
                    Verifying…
                  </>
                ) : '✅ Verify OTP'}
              </motion.button>

              {/* Resend */}
              <div className="mt-5 text-center">
                {canResend ? (
                  <motion.button
                    onClick={handleResend}
                    disabled={resendLoading}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="text-emerald-600 font-bold text-sm hover:text-emerald-700 transition-colors disabled:opacity-60 flex items-center gap-1 mx-auto"
                  >
                    {resendLoading ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full inline-block"
                        />
                        Sending…
                      </>
                    ) : '🔄 Resend OTP'}
                  </motion.button>
                ) : (
                  <p className="text-stone-400 text-sm">
                    Resend OTP in{' '}
                    <span className="font-bold text-emerald-600">
                      {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
                    </span>
                  </p>
                )}
              </div>

              <p className="mt-4 text-center text-xs text-stone-400">
                Check spam folder if email not received
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
