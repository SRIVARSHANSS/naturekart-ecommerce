import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Botanical Confetti ── */
const ConfettiLeaf = ({ delay, x, duration, size, rotate }) => (
  <motion.div
    initial={{ y: -60, x, opacity: 0, rotate: rotate - 30 }}
    animate={{
      y: typeof window !== 'undefined' ? window.innerHeight + 60 : 900,
      opacity: [0, 0.6, 0.4, 0],
      rotate: rotate + 180,
    }}
    transition={{ duration, delay, ease: 'linear', repeat: Infinity, repeatDelay: Math.random() * 3 }}
    className="fixed pointer-events-none z-0"
    style={{ left: 0 }}
  >
    <svg width={size} height={size * 1.6} viewBox="0 0 14 22" fill="none">
      <path
        d="M7 21 C7 21 2 14 2 8 C2 4 4 1 7 1 C10 1 12 4 12 8 C12 14 7 21 7 21Z"
        fill="#C9A84C"
        fillOpacity="0.35"
        stroke="#C9A84C"
        strokeWidth="0.5"
        strokeOpacity="0.5"
      />
      <line x1="7" y1="2" x2="7" y2="20" stroke="#C9A84C" strokeWidth="0.4" strokeOpacity="0.5"/>
    </svg>
  </motion.div>
);

const LEAVES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  delay: i * 0.7 + Math.random() * 1.2,
  x:    Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
  duration: 5 + Math.random() * 5,
  size: 8 + Math.random() * 10,
  rotate: Math.random() * 360,
}));

/* ── SVG Check path animation ── */
const AnimatedCheck = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto">
    <motion.circle
      cx="32" cy="32" r="30"
      stroke="#C9A84C"
      strokeWidth="1"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    />
    <motion.path
      d="M18 33 L27 42 L46 22"
      stroke="#C9A84C"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.6, delay: 0.8, ease: 'easeOut' }}
    />
  </svg>
);

export default function OrderConfirmation() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  useEffect(() => {
    if (!state?.orderId) navigate('/shop');
  }, [state, navigate]);

  if (!state?.orderId) return null;

  const {
    orderId, invoiceNumber, estimatedDelivery, paymentMethod,
    totalAmount, deliveryType, items = [], address = {},
  } = state;

  const etaStr = estimatedDelivery
    ? new Date(estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '5–7 business days';

  const deliveryConfig = {
    'Standard': { label: 'Standard',   accent: 'border-[#F5F0E8]/20 text-[#F5F0E8]/60' },
    'One-Day':  { label: 'Express',    accent: 'border-gold/40 text-gold' },
    'Same-Day': { label: 'Same-Day',   accent: 'border-gold/60 text-gold' },
  }[deliveryType] || { label: deliveryType, accent: 'border-[#F5F0E8]/20 text-[#F5F0E8]/60' };

  return (
    <div className="min-h-screen bg-bg text-[#F5F0E8] font-sans antialiased overflow-hidden relative">

      {/* Botanical falling leaves */}
      {LEAVES.map(l => <ConfettiLeaf key={l.id} {...l} />)}

      {/* Minimal nav */}
      <nav className="relative z-10 border-b border-gold/10 px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <div className="w-6 h-6 border border-gold/40 flex items-center justify-center">
            <span className="text-gold text-xs">✦</span>
          </div>
          <span className="font-serif text-lg tracking-wide">
            Nature<span className="text-gold">Kart</span>
          </span>
        </div>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-16">

        {/* ── Hero confirmation ── */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 160, damping: 18 }}
          className="text-center mb-14"
        >
          {/* Animated SVG check */}
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(201,168,76,0)',
                '0 0 0 20px rgba(201,168,76,0.08)',
                '0 0 0 0 rgba(201,168,76,0)',
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="inline-flex items-center justify-center w-28 h-28 border border-gold/20 bg-surface mb-8"
          >
            <AnimatedCheck />
          </motion.div>

          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gold/60 text-xs tracking-[0.35em] uppercase mb-3 italic font-sans"
          >
            — Order Confirmed
          </motion.p>

          <motion.h1
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="font-serif text-4xl md:text-5xl text-[#F5F0E8] leading-tight mb-4"
          >
            Thank You,<br />
            <span className="text-gold">{address.name?.split(' ')[0] || 'Valued Patron'}</span>
          </motion.h1>

          <motion.p
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-[#F5F0E8]/40 text-sm max-w-sm mx-auto leading-relaxed"
          >
            Your botanical selection has been received. A confirmation receipt has been sent to{' '}
            <span className="text-[#F5F0E8]/70">{address.email}</span>
          </motion.p>
        </motion.div>

        {/* ── Order Details Card ── */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-surface border border-gold/15 p-6 mb-6 relative"
        >
          {/* corner accents */}
          <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-gold/40 pointer-events-none" />
          <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-gold/40 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-gold/40 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-gold/40 pointer-events-none" />

          {/* Order ID + Delivery type */}
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-gold/10">
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-gold/40 mb-1">Order Reference</p>
              <p className="font-serif text-2xl text-gold tracking-wide">{orderId}</p>
              {invoiceNumber && (
                <p className="text-[10px] text-[#F5F0E8]/30 mt-0.5 tracking-wider">{invoiceNumber}</p>
              )}
            </div>
            <div className={`px-4 py-2 border text-xs tracking-[0.15em] uppercase font-sans ${deliveryConfig.accent}`}>
              {deliveryConfig.label} Delivery
            </div>
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div className="py-5 border-b border-gold/10">
              <p className="text-[10px] tracking-[0.25em] uppercase text-gold/40 mb-4">Items Ordered</p>
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item._id || item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-surface-light border border-gold/10 flex-shrink-0 overflow-hidden">
                        {item.image
                          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gold/20 text-[10px]">✦</div>
                        }
                      </div>
                      <span className="text-[#F5F0E8]/70">
                        {item.name} <span className="text-[#F5F0E8]/30">× {item.quantity}</span>
                      </span>
                    </div>
                    <span className="text-[#F5F0E8]/60 font-sans">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery + Payment meta */}
          <div className="grid sm:grid-cols-2 gap-6 pt-5">
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-gold/40 mb-2">Estimated Delivery</p>
              <p className="font-sans text-sm text-[#F5F0E8]/80">{etaStr}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-gold/40 mb-2">Payment</p>
              <p className="font-sans text-sm text-[#F5F0E8]/80">{paymentMethod || 'Razorpay'}</p>
              <p className="font-serif text-xl text-gold mt-1">₹{(totalAmount || 0).toLocaleString()}</p>
            </div>
            {address.name && (
              <div className="sm:col-span-2 pt-4 border-t border-gold/10">
                <p className="text-[10px] tracking-[0.25em] uppercase text-gold/40 mb-2">Delivering to</p>
                <p className="text-sm text-[#F5F0E8]/70">{address.name}</p>
                <p className="text-xs text-[#F5F0E8]/40 mt-0.5">
                  {address.address}, {address.city}, {address.state} — {address.pincode}
                </p>
                <p className="text-xs text-[#F5F0E8]/40">{address.phone}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── CTA Buttons ── */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/order-tracking/${orderId}`)}
            className="flex-1 py-4 bg-gold hover:bg-gold/90 text-bg font-bold text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-2 shimmer-btn-glow transition-all"
          >
            Track My Order →
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/profile')}
            className="flex-1 py-4 border border-gold/20 hover:border-gold/40 text-[#F5F0E8]/60 hover:text-[#F5F0E8] font-sans text-xs tracking-[0.2em] uppercase transition-all"
          >
            View All Orders
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/shop')}
            className="flex-1 py-4 border border-gold/20 hover:border-gold/40 text-[#F5F0E8]/60 hover:text-[#F5F0E8] font-sans text-xs tracking-[0.2em] uppercase transition-all"
          >
            Continue Shopping
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}