import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * OTPVerificationModal — Sage Green Theme
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
    if (!clean && val) return;
    const next = [...digits];

    if (clean.length > 1) {
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
          style={{ background: 'rgba(27,54,38,0.35)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 32 }}
            animate={{ scale: 1,    opacity: 1, y: 0  }}
            exit={{    scale: 0.88, opacity: 0, y: 32  }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{ backgroundColor: '#E5EFE9', borderColor: 'rgba(27,54,38,0.2)' }}
            className="w-full max-w-sm border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1B3626 0%, #2D543B 100%)' }}
              className="px-8 pt-8 pb-6 text-center relative">
              <button
                onClick={onClose}
                style={{ backgroundColor: 'rgba(210,229,216,0.15)', color: '#D2E5D8' }}
                className="absolute top-4 right-4 w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition-all text-sm font-bold"
              >✕</button>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-4xl mb-3"
              >📧</motion.div>
              <h2 style={{ color: '#D2E5D8' }} className="font-black text-xl mb-1">{title}</h2>
              <p style={{ color: 'rgba(210,229,216,0.75)' }} className="text-sm">
                {subtitle || `We sent a 6-digit code to`}
              </p>
              {maskedEmail && (
                <p style={{ color: '#A8D5B5' }} className="font-bold text-sm mt-1">{maskedEmail}</p>
              )}
            </div>

            {/* Body */}
            <div className="px-8 py-7" style={{ backgroundColor: '#E5EFE9' }}>
              {/* Alerts */}
              <AnimatePresence>
                {(error || success) && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{
                      backgroundColor: success ? 'rgba(27,54,38,0.08)' : 'rgba(239,68,68,0.08)',
                      borderColor: success ? 'rgba(27,54,38,0.3)' : 'rgba(239,68,68,0.3)',
                      color: success ? '#1B3626' : '#dc2626',
                    }}
                    className="mb-5 p-3 rounded-xl text-sm font-medium text-center border"
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
                    style={{
                      backgroundColor: d ? 'rgba(27,54,38,0.1)' : '#F4F8F6',
                      borderColor: d ? '#1B3626' : error ? '#ef4444' : 'rgba(27,54,38,0.2)',
                      color: '#1B3626',
                      outline: 'none',
                    }}
                    className="w-11 h-14 text-center text-xl font-black rounded-xl border-2 transition-all"
                  />
                ))}
              </div>

              {/* Verify Button */}
              <motion.button
                onClick={handleVerify}
                disabled={loading || otp.length < 6}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{ backgroundColor: '#1B3626', color: '#ffffff' }}
                className="w-full py-3.5 font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shimmer-btn-glow"
              >
                {loading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full inline-block"
                    />
                    <span style={{ color: '#ffffff' }}>Verifying…</span>
                  </>
                ) : <span style={{ color: '#ffffff' }}>✅ Verify OTP</span>}
              </motion.button>

              {/* Resend */}
              <div className="mt-5 text-center">
                {canResend ? (
                  <motion.button
                    onClick={handleResend}
                    disabled={resendLoading}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{ color: '#1B3626' }}
                    className="font-bold text-sm hover:opacity-70 transition-opacity disabled:opacity-60 flex items-center gap-1 mx-auto"
                  >
                    {resendLoading ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full inline-block"
                        />
                        <span style={{ color: '#1B3626' }}>Sending…</span>
                      </>
                    ) : '🔄 Resend OTP'}
                  </motion.button>
                ) : (
                  <p style={{ color: '#5C7C68' }} className="text-sm">
                    Resend OTP in{' '}
                    <span style={{ color: '#1B3626' }} className="font-bold">
                      {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
                    </span>
                  </p>
                )}
              </div>

              <p style={{ color: '#5C7C68' }} className="mt-4 text-center text-xs opacity-70">
                Check spam folder if email not received
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
