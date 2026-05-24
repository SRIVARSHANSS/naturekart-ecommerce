import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext.jsx';
import { getUserOrderById } from '../services/api';

/* ── Status steps matching backend enum ─────────────────────────────────────── */
const STEPS = [
  { key: 'Placed',            icon: '📋', title: 'Order Placed',       sub: 'Payment received & order confirmed.' },
  { key: 'Processing',        icon: '⚙️',  title: 'Processing',         sub: 'Our team is preparing your order.' },
  { key: 'Packed',            icon: '📦', title: 'Packed',             sub: 'Items carefully packed and ready.' },
  { key: 'Shipped',           icon: '🚚', title: 'Shipped',            sub: 'Handed to delivery partner.' },
  { key: 'Out for Delivery',  icon: '🛵', title: 'Out for Delivery',   sub: 'On the way to your doorstep!' },
  { key: 'Delivered',         icon: '✅', title: 'Delivered',          sub: 'Order delivered successfully. Enjoy! 🌿' },
];

const RETURN_STEPS = [
  { key: 'Return Requested',       icon: '↩️', title: 'Return Requested',       sub: 'Return request submitted.' },
  { key: 'Return Pickup Scheduled',icon: '📅', title: 'Pickup Scheduled',        sub: 'Our team will pick up your item.' },
  { key: 'Return Received',        icon: '🏭', title: 'Product Received',        sub: 'We received your returned item.' },
  { key: 'Refund Initiated',       icon: '💰', title: 'Refund Initiated',        sub: 'Refund in process — 5-7 business days.' },
  { key: 'Refund Completed',       icon: '✅', title: 'Refund Completed',        sub: 'Refund has been credited to your account.' },
];

const getActiveIndex = (steps, status) => steps.findIndex(s => s.key === status);

const STATUS_COLORS = {
  Placed:              'bg-amber-100 text-amber-700 border-amber-200',
  Processing:          'bg-blue-100 text-blue-700 border-blue-200',
  Packed:              'bg-purple-100 text-purple-700 border-purple-200',
  Shipped:             'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Out for Delivery':  'bg-orange-100 text-orange-700 border-orange-200',
  Delivered:           'bg-green-100 text-green-700 border-green-200',
  Cancelled:           'bg-red-100 text-red-700 border-red-200',
  'Return Requested':  'bg-rose-100 text-rose-700 border-rose-200',
  'Refund Initiated':  'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Refund Completed':  'bg-green-100 text-green-700 border-green-200',
};

/* ── Step Row ─────────────────────────────────────────────────────────────── */
const StepRow = ({ step, active, done, index, isLast }) => {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="flex items-start gap-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <motion.div
          animate={active ? { scale: [1, 1.12, 1], boxShadow: ['0 0 0 0 rgba(16,185,129,0)', '0 0 0 10px rgba(16,185,129,0.2)', '0 0 0 0 rgba(16,185,129,0)'] } : {}}
          transition={{ duration: 1.8, repeat: active ? Infinity : 0 }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-md transition-all
            ${done   ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-green-200'
            : active ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-300/50'
            :          'bg-stone-100 text-stone-400'}`}>
          {done && !active ? '✓' : step.icon}
        </motion.div>
        {!isLast && <div className={`w-0.5 h-8 mt-1 rounded-full ${done ? 'bg-gradient-to-b from-green-400 to-emerald-400' : 'bg-stone-200'}`} />}
      </div>
      <div className="pb-8 flex-1">
        <p className={`font-extrabold text-base ${active ? 'text-green-700' : done ? 'text-stone-700' : 'text-stone-400'}`}>
          {step.title}
          {active && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold animate-pulse">Current</span>}
          {done && !active && <span className="ml-2 text-xs text-emerald-500">✓</span>}
        </p>
        <p className={`text-sm mt-0.5 ${active || done ? 'text-stone-500' : 'text-stone-300'}`}>{step.sub}</p>
      </div>
    </motion.div>
  );
};

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function OrderTrackingPage() {
  const { orderId }  = useParams();
  const navigate     = useNavigate();
  const { cartCount } = useCart();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [input,   setInput]   = useState(orderId || '');

  const fetchOrder = async (id) => {
    if (!id?.trim()) return;
    setLoading(true); setNotFound(false); setOrder(null);
    try {
      const data = await getUserOrderById(id.trim());
      setOrder(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (orderId) fetchOrder(orderId); }, [orderId]);

  const handleSearch = () => {
    if (!input.trim()) return;
    navigate(`/order-tracking/${input.trim()}`);
  };

  const isReturnFlow = order && [
    'Return Requested', 'Return Pickup Scheduled', 'Return Received', 'Refund Initiated', 'Refund Completed'
  ].includes(order.status);

  const steps     = isReturnFlow ? RETURN_STEPS : STEPS;
  const activeIdx = order ? getActiveIndex(steps, order.status) : -1;

  /* Return eligibility */
  const returnEligible = order?.status === 'Delivered' && (() => {
    const deliveredAt = new Date(order.deliveredAt || order.updatedAt);
    const days = Math.ceil((new Date() - deliveredAt) / (1000 * 60 * 60 * 24));
    return days <= 30;
  })();

  const returnDaysLeft = order?.status === 'Delivered' && (() => {
    const deliveredAt = new Date(order.deliveredAt || order.updatedAt);
    return 30 - Math.ceil((new Date() - deliveredAt) / (1000 * 60 * 60 * 24));
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white font-sans antialiased">
      {/* Navbar */}
      <motion.nav initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-stone-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
              <span className="text-white text-sm">🌿</span>
            </div>
            <span className="text-lg font-black text-green-800">Nature<span className="text-emerald-500">Kart</span></span>
          </Link>
          <div className="flex items-center gap-1 text-sm text-stone-400">
            <Link to="/" className="hover:text-green-700 font-medium px-2 py-1">Home</Link>
            <span>/</span>
            <span className="text-stone-700 font-semibold px-2">Track Order</span>
          </div>
          <Link to="/cart" className="relative w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:text-green-700">
            <span>🛒</span>
            {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
          </Link>
        </div>
      </motion.nav>

      <div className="pt-24 pb-20 max-w-2xl mx-auto px-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-xl shadow-green-300/40">📦</div>
          <h1 className="text-3xl font-extrabold text-stone-800">Order Tracking</h1>
          <p className="text-stone-400 mt-1">
            {order ? <>Order <span className="font-bold text-stone-600">#{order.orderId}</span></> : 'Enter your Order ID to track'}
          </p>
        </motion.div>

        {/* Search box */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-stone-100 shadow-md p-5 mb-6">
          <p className="text-stone-600 font-bold mb-3 text-sm">Enter Order ID</p>
          <div className="flex gap-3">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. NK1716392017ABC"
              className="flex-1 px-4 py-3 border-2 border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all" />
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={handleSearch} disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-green-200/50 text-sm disabled:opacity-60">
              {loading ? '...' : 'Track →'}
            </motion.button>
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border-2 border-green-200 border-t-green-500 rounded-full" />
          </div>
        )}

        {/* Not found */}
        {notFound && !loading && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-stone-100 shadow-md p-10 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-extrabold text-stone-700 mb-2">Order Not Found</h2>
            <p className="text-stone-400 text-sm">We couldn't find order <strong>#{input}</strong>. Check the ID and try again.</p>
          </motion.div>
        )}

        {/* Order found */}
        {order && !loading && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

              {/* Status banner */}
              <div className={`rounded-2xl p-5 border ${STATUS_COLORS[order.status] || 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-black text-xl">{order.status}</p>
                    {order.estimatedDelivery && order.status !== 'Delivered' && (
                      <p className="text-sm mt-1 opacity-80">
                        Est. delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                    )}
                    {order.status === 'Delivered' && order.deliveredAt && (
                      <p className="text-sm mt-1 opacity-80">
                        Delivered on {new Date(order.deliveredAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold opacity-70 mb-1">Order Total</p>
                    <p className="text-2xl font-black">₹{order.totalAmount?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Order info */}
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-wide mb-1">Order ID</p>
                  <p className="font-bold text-stone-800 font-mono">{order.orderId}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-wide mb-1">Payment</p>
                  <p className="font-bold text-stone-800">{order.paymentMethod} <span className="text-green-600">✓ Paid</span></p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-wide mb-1">Delivery Type</p>
                  <p className="font-bold text-stone-800">{order.deliveryType || 'Standard'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-wide mb-1">Placed On</p>
                  <p className="font-bold text-stone-800">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                {order.customer?.address && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wide mb-1">Delivery Address</p>
                    <p className="text-sm text-stone-600">{order.customer.name} · {order.customer.address}, {order.customer.city}, {order.customer.pincode}</p>
                  </div>
                )}
              </div>

              {/* Items */}
              {order.items?.length > 0 && (
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-wide mb-3">Items</p>
                  <div className="space-y-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.image ? <img src={item.image} alt="" className="w-8 h-8 rounded object-cover" /> : '🌿'}</span>
                          <span className="text-stone-700">{item.name} <span className="text-stone-400">×{item.quantity}</span></span>
                        </div>
                        <span className="font-bold">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="bg-white rounded-3xl border border-stone-100 shadow-md p-6">
                <p className="text-xs text-stone-400 font-bold uppercase tracking-wide mb-5">
                  {isReturnFlow ? 'Return Status' : 'Order Timeline'}
                </p>
                <div className="space-y-0">
                  {steps.map((s, i) => (
                    <StepRow key={s.key} step={s} index={i} isLast={i === steps.length - 1}
                      active={i === activeIdx} done={i < activeIdx} />
                  ))}
                </div>
              </div>

              {/* Refund message */}
              {order.status === 'Refund Initiated' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-cyan-50 border border-cyan-200 rounded-2xl p-5 text-center">
                  <p className="text-2xl mb-2">💰</p>
                  <p className="font-bold text-cyan-700">Your money will be refunded within 7 business days</p>
                  <p className="text-sm text-cyan-600 mt-1">The amount will be credited to your original payment method.</p>
                </motion.div>
              )}

              {/* Return eligibility */}
              {returnEligible && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-amber-800 flex items-center gap-2"><span>↩️</span> Return Eligible</p>
                      <p className="text-sm text-amber-700 mt-1">{returnDaysLeft} days left in your 30-day return window</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => navigate('/profile')}
                      className="px-4 py-2 bg-amber-500 text-white font-bold text-sm rounded-xl hover:bg-amber-600 transition-colors">
                      Return
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/profile')}
                  className="flex-1 py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-green-200/60 text-sm">
                  View All Orders
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/shop')}
                  className="flex-1 py-3.5 bg-stone-100 text-stone-700 font-bold rounded-2xl text-sm hover:bg-stone-200 transition-colors">
                  Continue Shopping
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
