import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext.jsx';
import { getUserOrderById } from '../services/api';
import Navbar from '../components/Navbar.jsx';

/* ── Status steps ── */
const STEPS = [
  { key: 'Placed',           title: 'Order Placed',      sub: 'Payment received & order confirmed.' },
  { key: 'Processing',       title: 'Processing',         sub: 'Our team is preparing your order.' },
  { key: 'Packed',           title: 'Packed',             sub: 'Items carefully packed and ready.' },
  { key: 'Shipped',          title: 'Shipped',            sub: 'Handed to delivery partner.' },
  { key: 'Out for Delivery', title: 'Out for Delivery',   sub: 'On the way to your doorstep.' },
  { key: 'Delivered',        title: 'Delivered',          sub: 'Order delivered successfully.' },
];

const RETURN_STEPS = [
  { key: 'Return Requested',        title: 'Return Requested',   sub: 'Return request submitted.' },
  { key: 'Return Pickup Scheduled', title: 'Pickup Scheduled',   sub: 'Our team will pick up your item.' },
  { key: 'Return Received',         title: 'Product Received',   sub: 'We received your returned item.' },
  { key: 'Refund Initiated',        title: 'Refund Initiated',   sub: 'Refund in process — 5–7 business days.' },
  { key: 'Refund Completed',        title: 'Refund Completed',   sub: 'Refund has been credited to your account.' },
];

const getActiveIndex = (steps, status) => steps.findIndex(s => s.key === status);

/* ── Robust product image helper ── */
const getProductImage = (item) => {
  if (!item) return null;
  const name = (item.name || '').trim();
  const nameMap = {
    "Ashwagandha Powder": "/images/Ashwagandha Powder.png",
    "Turmeric Gold Capsules": "/images/Turmeric Gold Capsules.png",
    "Moringa Leaf Extract": "/images/Moringa Leaf Extract.png",
    "Neem Face Wash": "/images/Neem Face Wash.png",
    "Triphala Churna": "/images/Triphala Churna.png",
    "Rose Hip Face Oil": "/images/Rose Hip Face Oil.png",
    "Tulsi Green Tea": "/images/Tulsi Green Tea.png",
    "Amla Hair Serum": "/images/Amla Hair Serum.png",
    "Brahmi Memory Capsules": "/images/Brahmi Memory Capsules.png",
    "Shilajit Resin": "/images/Shilajit Resin.png",
    "Aloe Vera Gel": "/images/Aloe Vera Gel.png",
    "Chamomile Sleep Tea": "/images/Chamomile Sleep Tea.png",
    "Argan Hair Oil": "/images/Argan Hair Oil.png",
    "Digestive Enzymes Mix": "/images/Digestive Enzymes Mix.png",
    "Ginger Lemon Detox Tea": "/images/Ginger Lemon Detox Tea.png",
    "Vitamin C Face Serum": "/images/Vitamin C Face Serum.png",
    "Ginkgo Biloba": "/images/Ginkgo Biloba.png",
    "Coconut Oil": "/images/Coconut Oil.png",
    "Asafoetida Powder": "/images/Asafoetida Powder.png",
    "Vitamin E Capsule": "/images/Vitamin E Capsule.png",
    "Cinnamon Tea": "/images/Cinnamon Tea.png",
    "Manjistha Capsule": "/images/Manjistha Capsule.png",
    "Neem Powder": "/images/Neem Powder.png",
    "Green Coffee Extract": "/images/Green Coffee Extract.png",
    "Tulsi Kadha": "/images/Tulsi Kadha.png",
    "Bhringraj Oil": "/images/Bhringraj Oil.png",
    "Amla Powder": "/images/Amla Powder.png",
    "Kesar Spice": "/images/Kesar Spice.png",
    "Kesar spice": "/images/Kesar Spice.png",
    "Psyllium Husk": "/images/Psyllium Husk.png",
    "Tea Tree Face Wash": "/images/Tea Tree Face Wash.png",
    "Garcinia Cambogia": "/images/Garcinia Cambogia.png",
    "Mulethi Powder": "/images/Mulethi Powder.png",
    "Lavender Essential Oil": "/images/Lavender Essential Oil.png",
    "Tulsi Masala Tea": "/images/Tulsi Masala Tea.png",
    "Saw Palmetto": "/images/Saw Palmetto.png",
    "Cucumber Face Pack": "/images/Cucumber Face Pack.png",
    "Black Seed Oil": "/images/Black Seed Oil.png",
    "Ginseng Extract": "/images/Ginseng Extract.png",
    "Rose Water": "/images/Rose Water.png",
    "Black Pepper Powder": "/images/Black Pepper Powder.png",
    "Ginger Capsules": "/images/Ginger Capsules.png",
    "Clove Essential Oil": "/images/Clove Essential Oil.png",
    "Basil Seeds": "/images/Basil Seeds.png",
    "Multivitamin Complex": "/images/Multivitamin Complex.png",
    "Beetroot Powder": "/images/Beetroot Powder.png",
    "Orange Peel Powder": "/images/Orange Peel Powder.png",
    "Tulsi Classic Tea": "/images/Tulsi Classic Tea.png",
    "Amla Candy": "/images/Amla Candy.png",
    "Ashwagandha Roots": "/images/Ashwagandha Roots.png",
    "Turmeric Soap": "/images/Turmeric Soap.png",
    "Moringa Capsules": "/images/Moringa Leaf Extract.png",
    "Neem Tablets": "/images/Neem Tablets.png",
    "Saffron Hair Oil": "/images/Saffron Hair Oil.png",
    "Peppermint Tea": "/images/Peppermint Tea.png",
    "Karela Juice": "/images/Cucumber Face Pack.png",
    "Tulsi Drop": "/images/Tulsi Green Tea.png",
    "Shikakai Powder": "/images/Neem Powder.png",
    "Reetha Powder": "/images/Moringa Leaf Extract.png",
    "Giloy Capsules": "/images/Ashwagandha Powder.png",
    "Kesar Milk Powder": "/images/Kesar Spice.png",
  };
  if (nameMap[name]) return nameMap[name];
  if (item.image && item.image.trim()) return item.image;
  return `/images/${name}.png`;
};

/* ── Step Row ── */
const StepRow = ({ step, active, done, index, isLast }) => {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, x: -16 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="flex items-start gap-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <motion.div
          animate={active ? {
            boxShadow: ['0 0 0 0 rgba(201,168,76,0)', '0 0 0 10px rgba(201,168,76,0.15)', '0 0 0 0 rgba(201,168,76,0)'],
          } : {}}
          transition={{ duration: 1.8, repeat: active ? Infinity : 0 }}
          className={`w-10 h-10 flex items-center justify-center font-serif text-sm border transition-all duration-300
            ${done
              ? 'border-gold bg-gold text-bg'
              : active
              ? 'border-gold/80 bg-gold/10 text-gold'
              : 'border-gold/10 bg-transparent text-[#F5F0E8]/20'}`}>
          {done ? '✓' : index + 1}
        </motion.div>
        {!isLast && (
          <div className={`w-px mt-1 mb-0 flex-1 min-h-[32px] transition-all duration-500
            ${done ? 'bg-gold/40' : 'bg-gold/8'}`} />
        )}
      </div>
      <div className="pb-8 flex-1 pt-1.5">
        <div className="flex items-center gap-2">
          <p className={`font-sans text-sm font-medium transition-colors
            ${active ? 'text-gold' : done ? 'text-[#F5F0E8]/80' : 'text-[#F5F0E8]/25'}`}>
            {step.title}
          </p>
          {active && (
            <span className="text-[10px] border border-gold/30 text-gold/70 px-2 py-0.5 tracking-wider uppercase animate-pulse">
              Current
            </span>
          )}
        </div>
        <p className={`text-xs mt-1 leading-snug ${active || done ? 'text-[#F5F0E8]/40' : 'text-[#F5F0E8]/15'}`}>
          {step.sub}
        </p>
      </div>
    </motion.div>
  );
};

/* ── Status badge color in dark theme ── */
const getStatusStyle = (status) => {
  const map = {
    Placed:              'border-amber-500/30 text-amber-400/80 bg-amber-500/5',
    Processing:          'border-blue-500/30 text-blue-400/80 bg-blue-500/5',
    Packed:              'border-purple-500/30 text-purple-400/80 bg-purple-500/5',
    Shipped:             'border-indigo-500/30 text-indigo-400/80 bg-indigo-500/5',
    'Out for Delivery':  'border-orange-500/30 text-orange-400/80 bg-orange-500/5',
    Delivered:           'border-gold/40 text-gold/80 bg-gold/5',
    Cancelled:           'border-red-500/30 text-red-400/80 bg-red-500/5',
    'Return Requested':  'border-rose-500/30 text-rose-400/80 bg-rose-500/5',
    'Refund Initiated':  'border-cyan-500/30 text-cyan-400/80 bg-cyan-500/5',
    'Refund Completed':  'border-gold/40 text-gold/80 bg-gold/5',
  };
  return map[status] || 'border-gold/10 text-[#F5F0E8]/50 bg-surface';
};

/* ── Main ── */
export default function OrderTrackingPage() {
  const { orderId }   = useParams();
  const navigate      = useNavigate();
  const [order,   setOrder]    = useState(null);
  const [loading, setLoading]  = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [input,   setInput]    = useState(orderId || '');

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

  const returnEligible = order?.status === 'Delivered' && (() => {
    const deliveredAt = new Date(order.deliveredAt || order.updatedAt);
    return Math.ceil((new Date() - deliveredAt) / (1000 * 60 * 60 * 24)) <= 30;
  })();

  const returnDaysLeft = order?.status === 'Delivered' && (() => {
    const deliveredAt = new Date(order.deliveredAt || order.updatedAt);
    return 30 - Math.ceil((new Date() - deliveredAt) / (1000 * 60 * 60 * 24));
  })();

  return (
    <div className="min-h-screen bg-bg text-[#F5F0E8] font-sans antialiased">
      <Navbar />

      <div className="pt-28 pb-20 max-w-2xl mx-auto px-4">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <p className="text-gold/50 text-xs tracking-[0.35em] uppercase italic mb-3">— Order Tracking</p>
          <h1 className="font-serif text-4xl text-[#F5F0E8] mb-2">
            {order ? <>Tracking <span className="text-gold">#{order.orderId}</span></> : 'Track Your Order'}
          </h1>
          <div className="w-12 h-px bg-gold/30 mx-auto mt-3" />
        </motion.div>

        {/* Search box */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-surface border border-gold/15 p-5 mb-6 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold/30 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gold/30 pointer-events-none" />
          <p className="text-[10px] tracking-[0.2em] uppercase text-gold/40 mb-3">Enter Order ID</p>
          <div className="flex gap-3">
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. NK1716392017ABC"
              className="flex-1 px-4 py-3 bg-surface-light border border-gold/15 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20
                focus:outline-none focus:border-gold/45 hover:border-gold/25 transition-all"
            />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleSearch} disabled={loading}
              className="px-6 py-3 bg-gold hover:bg-gold/90 text-bg font-bold text-xs tracking-[0.15em] uppercase
                transition-all shimmer-btn-glow disabled:opacity-50">
              {loading ? '…' : 'Track →'}
            </motion.button>
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-14">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border border-gold/10 border-t-gold/60 rounded-full" />
          </div>
        )}

        {/* Not found */}
        {notFound && !loading && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-gold/10 p-12 text-center relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/25" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/25" />
            <p className="text-gold text-3xl mb-4">◎</p>
            <h2 className="font-serif text-xl text-[#F5F0E8] mb-2">Order Not Found</h2>
            <p className="text-[#F5F0E8]/40 text-sm">
              We couldn't find order <span className="text-[#F5F0E8]/70">#{input}</span>. Please check the ID and try again.
            </p>
          </motion.div>
        )}

        {/* Order found */}
        {order && !loading && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

              {/* Status banner */}
              <div className={`border p-5 relative ${getStatusStyle(order.status)}`}>
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-current opacity-30" />
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] tracking-[0.2em] uppercase opacity-60 mb-1">Current Status</p>
                    <p className="font-serif text-xl">{order.status}</p>
                    {order.estimatedDelivery && order.status !== 'Delivered' && (
                      <p className="text-xs mt-1 opacity-60">
                        Est. delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                    )}
                    {order.status === 'Delivered' && order.deliveredAt && (
                      <p className="text-xs mt-1 opacity-60">
                        Delivered on {new Date(order.deliveredAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] tracking-[0.15em] uppercase opacity-50 mb-1">Order Total</p>
                    <p className="font-serif text-2xl">₹{order.totalAmount?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Order meta */}
              <div className="bg-surface border border-gold/10 p-5 grid sm:grid-cols-2 gap-4 relative">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold/20" />
                {[
                  { label: 'Order ID',      value: order.orderId },
                  { label: 'Payment',       value: `${order.paymentMethod} — Paid` },
                  { label: 'Delivery Type', value: order.deliveryType || 'Standard' },
                  { label: 'Placed On',     value: new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] tracking-[0.18em] uppercase text-gold/40 mb-1">{label}</p>
                    <p className="text-sm text-[#F5F0E8]/70 font-sans">{value}</p>
                  </div>
                ))}
                {order.customer?.address && (
                  <div className="sm:col-span-2 border-t border-gold/8 pt-4 mt-1">
                    <p className="text-[10px] tracking-[0.18em] uppercase text-gold/40 mb-1">Delivering to</p>
                    <p className="text-sm text-[#F5F0E8]/60">
                      {order.customer.name} · {order.customer.address}, {order.customer.city}, {order.customer.pincode}
                    </p>
                  </div>
                )}
              </div>

              {/* Items */}
              {order.items?.length > 0 && (
                <div className="bg-surface border border-gold/10 p-5 relative">
                  <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-gold/20" />
                  <p className="text-[10px] tracking-[0.2em] uppercase text-gold/40 mb-4">Items Ordered</p>
                  <div className="space-y-3">
                    {order.items.map((item, i) => {
                      const imgSrc = getProductImage(item);
                      return (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-surface-light border border-gold/10 flex-shrink-0 overflow-hidden">
                              {imgSrc
                                ? <img src={imgSrc} alt={item.name} className="w-full h-full object-cover"
                                    onError={e => { e.target.style.display = 'none'; }} />
                                : <div className="w-full h-full flex items-center justify-center text-gold/20 text-xs">✦</div>
                              }
                            </div>
                            <span className="text-sm text-[#F5F0E8]/70">
                              {item.name} <span className="text-[#F5F0E8]/30">×{item.quantity}</span>
                            </span>
                          </div>
                          <span className="text-sm text-[#F5F0E8]/60">₹{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="bg-surface border border-gold/10 p-6 relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/25" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/25" />
                <p className="text-[10px] tracking-[0.2em] uppercase text-gold/40 mb-6">
                  {isReturnFlow ? 'Return Timeline' : 'Order Timeline'}
                </p>
                <div>
                  {steps.map((s, i) => (
                    <StepRow key={s.key} step={s} index={i} isLast={i === steps.length - 1}
                      active={i === activeIdx} done={i < activeIdx} />
                  ))}
                </div>
              </div>

              {/* Refund note */}
              {order.status === 'Refund Initiated' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="border border-cyan-500/20 bg-cyan-500/5 p-5 text-center">
                  <p className="text-sm text-cyan-400/80 font-sans">
                    Your refund will be credited within 7 business days to your original payment method.
                  </p>
                </motion.div>
              )}

              {/* Return eligibility */}
              {returnEligible && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="border border-gold/20 bg-gold/4 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gold/80 font-sans font-medium">Return Eligible</p>
                      <p className="text-xs text-[#F5F0E8]/40 mt-0.5">{returnDaysLeft} days left in your 30-day return window</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => navigate('/profile')}
                      className="px-5 py-2 border border-gold/30 text-gold/70 hover:text-gold hover:border-gold/60 text-xs tracking-[0.15em] uppercase transition-all">
                      Request Return
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/profile')}
                  className="flex-1 py-4 bg-gold hover:bg-gold/90 text-bg font-bold text-xs tracking-[0.15em] uppercase shimmer-btn-glow transition-all">
                  View All Orders
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/shop')}
                  className="flex-1 py-4 border border-gold/20 hover:border-gold/40 text-[#F5F0E8]/50 hover:text-[#F5F0E8] text-xs tracking-[0.15em] uppercase transition-all">
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
