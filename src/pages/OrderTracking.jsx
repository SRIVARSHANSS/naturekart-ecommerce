import { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext.jsx';

/* ── Status steps ─────────────────────────────────────────────────────────── */
const STEPS = [
  { key: 'placed',          icon: '📋', title: 'Order Placed',       sub: 'Your order has been received and confirmed.' },
  { key: 'packed',          icon: '📦', title: 'Order Packed',       sub: 'Our team is carefully packing your items.'   },
  { key: 'shipped',         icon: '🚚', title: 'Shipped',            sub: 'Order handed to the delivery partner.'       },
  { key: 'outfordelivery',  icon: '🛵', title: 'Out for Delivery',   sub: 'Your order is on the way to you!'           },
  { key: 'delivered',       icon: '✅', title: 'Delivered',          sub: 'Order delivered successfully. Enjoy! 🌿'    },
];

/* Mock order DB */
const MOCK_ORDERS = {
  'ORD87234561': { status: 'delivered',     date: '12 Apr 2025', items: ['Ashwagandha Capsules ×2', 'Moringa Powder ×1'], total: 847 },
  'ORD76543210': { status: 'shipped',        date: '28 Mar 2025', items: ['Turmeric Extract ×1'],                         total: 499 },
  'ORD65432109': { status: 'outfordelivery', date: '12 Apr 2025', items: ['Neem Face Wash ×2'],                           total: 598 },
  'ORD54321098': { status: 'placed',         date: '13 Apr 2025', items: ['Rosehip Oil ×1', 'Tulsi Green Tea ×3'],        total: 1049 },
};

const getActiveIndex = (status) =>
  STEPS.findIndex(s => s.key === status.replace(/\s/g, '').toLowerCase());

/* ── Step Row ─────────────────────────────────────────────────────────────── */
const StepRow = ({ step, active, done, index }) => {
  const ref   = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, x: -24 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.45, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-4">

      {/* Icon circle */}
      <div className="flex flex-col items-center flex-shrink-0">
        <motion.div
          animate={active ? { scale: [1, 1.12, 1], boxShadow: ['0 0 0 0 rgba(16,185,129,0)', '0 0 0 10px rgba(16,185,129,0.15)', '0 0 0 0 rgba(16,185,129,0)'] } : {}}
          transition={{ duration: 1.6, repeat: active ? Infinity : 0 }}
          whileHover={{ scale: 1.1 }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-md transition-all duration-300
            ${done   ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-green-200'
            : active ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-300/50'
            :          'bg-stone-100 text-stone-400'}`}>
          {step.icon}
        </motion.div>
      </div>

      {/* Content */}
      <div className={`pb-8 flex-1 ${/* remove padding for last */ ''}`}>
        <p className={`font-extrabold text-base ${active ? 'text-green-700' : done ? 'text-stone-700' : 'text-stone-400'}`}>
          {step.title}
          {active && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Current</span>}
          {done && !active && <span className="ml-2 text-xs text-emerald-500">✓</span>}
        </p>
        <p className={`text-sm mt-0.5 ${active || done ? 'text-stone-500' : 'text-stone-300'}`}>{step.sub}</p>
      </div>
    </motion.div>
  );
};

/* ── Navbar ───────────────────────────────────────────────────────────────── */
const Navbar = () => {
  const { cartCount } = useCart();
  return (
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
          <span className="text-stone-700 font-semibold px-2">Order Tracking</span>
        </div>
        <Link to="/cart" className="relative w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:text-green-700 hover:bg-green-50">
          <span>🛒</span>
          {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
        </Link>
      </div>
    </motion.nav>
  );
};

/* ── MAIN ─────────────────────────────────────────────────────────────────── */
export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate    = useNavigate();
  const order       = orderId ? MOCK_ORDERS[orderId] : null;
  const activeIdx   = order ? getActiveIndex(order.status) : -1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white font-sans antialiased">
      <Navbar />
      <div className="pt-20 pb-20 max-w-2xl mx-auto px-4">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }} className="py-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-xl shadow-green-300/40">
            📦
          </div>
          <h1 className="text-3xl font-extrabold text-stone-800">Order Tracking</h1>
          {order
            ? <p className="text-stone-400 mt-1">Order <span className="font-bold text-stone-600">#{orderId}</span> · {order.date}</p>
            : <p className="text-stone-400 mt-1">Enter your order ID to track your delivery</p>
          }
        </motion.div>

        {/* Search box when no orderId */}
        {!orderId && <SearchBox navigate={navigate} />}

        {/* Order not found */}
        {orderId && !order && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-stone-100 shadow-md p-10 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-extrabold text-stone-700 mb-2">Order Not Found</h2>
            <p className="text-stone-400 text-sm mb-6">We couldn't find order <strong>#{orderId}</strong>. Try one of these:</p>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {Object.keys(MOCK_ORDERS).map(id => (
                <motion.button key={id} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(`/order-tracking/${id}`)}
                  className="px-3 py-1.5 bg-green-50 text-green-700 font-bold text-xs rounded-xl border border-green-200 hover:bg-green-100">
                  #{id}
                </motion.button>
              ))}
            </div>
            <button onClick={() => navigate('/order-tracking')}
              className="text-sm text-emerald-600 font-bold hover:underline">← Search again</button>
          </motion.div>
        )}

        {/* Order found — timeline */}
        {order && (
          <>
            {/* Order summary */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-5 mb-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-green-200 font-medium">Order Total</p>
                  <p className="text-3xl font-extrabold">₹{order.total}</p>
                </div>
                <div className="px-3 py-1.5 bg-white/20 rounded-xl text-sm font-bold capitalize">
                  {order.status.replace(/([A-Z])/g, ' $1')}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/20">
                <p className="text-green-200 text-xs font-medium mb-1">Items</p>
                {order.items.map((item, i) => (
                  <p key={i} className="text-sm font-semibold text-white">• {item}</p>
                ))}
              </div>
            </motion.div>

            {/* Timeline */}
            <div className="bg-white rounded-3xl border border-stone-100 shadow-md p-6 relative">
              {/* Vertical progress bar */}
              <div className="absolute left-[42px] top-[72px] bottom-6 w-0.5 bg-stone-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ height: '0%' }}
                  animate={{ height: `${Math.max(0, (activeIdx / (STEPS.length - 1)) * 100)}%` }}
                  transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full bg-gradient-to-b from-green-400 to-emerald-500 rounded-full"
                />
              </div>

              <div className="space-y-0">
                {STEPS.map((step, i) => (
                  <StepRow key={step.key} step={step} index={i}
                    active={i === activeIdx} done={i < activeIdx} />
                ))}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
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
          </>
        )}
      </div>
    </div>
  );
}

function SearchBox({ navigate }) {
  const [input, setInput] = useState('');
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="bg-white rounded-3xl border border-stone-100 shadow-md p-6">
      <p className="text-stone-600 font-bold mb-4">Enter your Order ID</p>
      <div className="flex gap-3">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && input.trim() && navigate(`/order-tracking/${input.trim()}`)}
          placeholder="e.g. ORD87234561"
          className="flex-1 px-4 py-3 border-2 border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all" />
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={() => input.trim() && navigate(`/order-tracking/${input.trim()}`)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-green-200/50 text-sm">
          Track →
        </motion.button>
      </div>
      <p className="mt-4 text-xs text-stone-400">Try: ORD87234561, ORD76543210, ORD65432109, ORD54321098</p>
    </motion.div>
  );
}


