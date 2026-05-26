import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useAuth }     from '../context/AuthContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart }     from '../context/CartContext.jsx';
import { getUserOrders, createReturn, getUserReturns } from '../services/api.js';
import Navbar from '../components/Navbar.jsx';

/* ── Helpers ── */
const FadeUp = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
};

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

/* ── Status color in dark theme ── */
const STATUS_STYLE = {
  delivered:      'border-gold/30 text-gold/70 bg-gold/5',
  shipped:        'border-orange-500/30 text-orange-400/80 bg-orange-500/5',
  placed:         'border-blue-500/30 text-blue-400/80 bg-blue-500/5',
  outfordelivery: 'border-emerald-500/30 text-emerald-400/80 bg-emerald-500/5',
  packed:         'border-purple-500/30 text-purple-400/80 bg-purple-500/5',
  cancelled:      'border-red-500/30 text-red-400/80 bg-red-500/5',
};

const RETURN_STATUS_STYLE = {
  Requested:           'border-[#F5F0E8]/15 text-[#F5F0E8]/50',
  Approved:            'border-gold/30 text-gold/70',
  'Pickup Scheduled':  'border-cyan-500/30 text-cyan-400/70',
  'Refund Processing': 'border-amber-500/30 text-amber-400/70',
  'Refund Completed':  'border-gold/40 text-gold/80',
  Rejected:            'border-red-500/30 text-red-400/70',
};

/* ── Dark toggle ── */
const SettingsToggle = ({ label, sub, defaultOn }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-4 border-b border-gold/8 last:border-0">
      <div>
        <p className="text-sm text-[#F5F0E8]/70 font-sans">{label}</p>
        <p className="text-xs text-[#F5F0E8]/30 mt-0.5">{sub}</p>
      </div>
      <div onClick={() => setOn(v => !v)}
        className={`w-11 h-6 relative cursor-pointer border transition-all duration-300
          ${on ? 'border-gold/50 bg-gold/10' : 'border-gold/10 bg-transparent'}`}>
        <motion.div animate={{ x: on ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`absolute top-1 w-4 h-4 transition-colors ${on ? 'bg-gold' : 'bg-gold/20'}`} />
      </div>
    </div>
  );
};

/* ── Edit Modal ── */
const EditModal = ({ title, fields, init, onSave, onClose }) => {
  const [vals, setVals] = useState(init || {});
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        onClick={e => e.stopPropagation()}
        className="bg-bg border border-gold/20 shadow-2xl p-8 w-full max-w-md relative">
        <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-gold/40" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-gold/40" />
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-gold/40" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-gold/40" />

        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-lg text-[#F5F0E8]">{title}</h3>
          <button onClick={onClose}
            className="w-8 h-8 border border-gold/20 flex items-center justify-center text-[#F5F0E8]/40 hover:text-[#F5F0E8] transition-colors text-xs">
            ✕
          </button>
        </div>
        <div className="space-y-4">
          {fields.map(({ key, label, type = 'text' }) => (
            <div key={key}>
              <label className="block text-[10px] font-sans tracking-[0.2em] uppercase text-gold/40 mb-1.5">{label}</label>
              {type === 'textarea'
                ? <textarea value={vals[key] || ''} rows={3} onChange={e => setVals(v => ({ ...v, [key]: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface-light border border-gold/15 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-gold/45 resize-none transition-all" />
                : <input type={type} value={vals[key] || ''} onChange={e => setVals(v => ({ ...v, [key]: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface-light border border-gold/15 text-sm text-[#F5F0E8] focus:outline-none focus:border-gold/45 transition-all" />
              }
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-7">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => onSave(vals)}
            className="flex-1 py-3.5 bg-gold hover:bg-gold/90 text-bg font-bold text-xs tracking-[0.15em] uppercase shimmer-btn-glow transition-all">
            Save Changes
          </motion.button>
          <motion.button whileHover={{ scale: 1.01 }} onClick={onClose}
            className="px-6 py-3.5 border border-gold/20 text-[#F5F0E8]/50 hover:text-[#F5F0E8] text-xs tracking-wider uppercase transition-all">
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Return Timeline ── */
const ReturnTimeline = ({ currentStatus, remarks, pickupDate }) => {
  const steps = ['Requested', 'Approved', 'Pickup Scheduled', 'Refund Processing', 'Refund Completed'];
  const isRejected = currentStatus === 'Rejected';
  const currentIndex = steps.indexOf(currentStatus);

  if (isRejected) return (
    <div className="mt-4 p-4 border border-red-500/20 bg-red-500/5">
      <p className="text-xs text-red-400/80 font-sans">Return Rejected: {remarks || 'Request did not meet return guidelines.'}</p>
    </div>
  );

  return (
    <div className="mt-4 pt-4 border-t border-gold/8">
      <p className="text-[10px] tracking-[0.2em] uppercase text-gold/40 mb-4">Refund Timeline</p>
      <div className="grid grid-cols-5 gap-1 relative">
        <div className="absolute top-[16px] left-[10%] right-[10%] h-px bg-gold/10 z-0">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${currentIndex >= 0 ? (currentIndex / 4) * 100 : 0}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gold/40"
          />
        </div>
        {steps.map((step, idx) => {
          const completed = idx <= currentIndex;
          const active = idx === currentIndex;
          return (
            <div key={step} className="flex flex-col items-center z-10 text-center">
              <div className={`w-8 h-8 border flex items-center justify-center text-xs font-sans transition-all
                ${completed ? 'border-gold bg-gold text-bg' : 'border-gold/10 bg-transparent text-[#F5F0E8]/20'}`}>
                {completed && !active ? '✓' : idx + 1}
              </div>
              <span className={`text-[9px] mt-2 leading-tight block tracking-wide
                ${completed ? 'text-gold/70' : 'text-[#F5F0E8]/20'}`}>
                {step.split(' ')[0]}
              </span>
              {active && step === 'Pickup Scheduled' && pickupDate && (
                <span className="text-[8px] text-gold/60 mt-0.5 block">
                  {new Date(pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Return Request Modal ── */
const RequestReturnModal = ({ orderId, item, onSave, onClose }) => {
  const [vals, setVals] = useState({ reason: 'Damaged product', description: '', refundMethod: 'Original Payment Method', image: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { setErr('Image must be smaller than 2MB'); return; }
      setErr('');
      const reader = new FileReader();
      reader.onloadend = () => setVals(v => ({ ...v, image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      await onSave({ orderId, productId: item.productId, reason: vals.reason, description: vals.description, images: vals.image ? [vals.image] : [], refundMethod: vals.refundMethod });
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to submit return request');
    } finally { setLoading(false); }
  };

  const imgSrc = getProductImage(item);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        onClick={e => e.stopPropagation()}
        className="bg-bg border border-gold/20 p-6 sm:p-8 w-full max-w-lg overflow-y-auto max-h-[90vh] relative shadow-2xl">
        <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-gold/40" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-gold/40" />

        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-serif text-lg text-[#F5F0E8]">Return & Refund</h3>
            <p className="text-xs text-gold/40 tracking-wider mt-0.5">Order #{orderId}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 border border-gold/20 flex items-center justify-center text-[#F5F0E8]/40 hover:text-[#F5F0E8] transition-colors text-xs">
            ✕
          </button>
        </div>

        {/* Item summary */}
        <div className="flex items-center gap-3 border border-gold/10 bg-surface p-3 mb-5">
          <div className="w-12 h-12 border border-gold/10 bg-surface-light flex items-center justify-center overflow-hidden flex-shrink-0">
            {imgSrc
              ? <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
              : <span className="text-gold/20 text-xs">✦</span>}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[#F5F0E8]/80 truncate">{item.name}</p>
            <p className="text-xs text-[#F5F0E8]/30 mt-0.5">₹{item.price} · Qty: {item.quantity}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {err && <div className="p-3 border border-red-500/30 bg-red-500/5 text-red-400/80 text-xs">{err}</div>}

          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-gold/40 mb-1.5">Reason for Return</label>
            <select value={vals.reason} onChange={e => setVals(v => ({ ...v, reason: e.target.value }))}
              className="w-full px-4 py-3 bg-surface-light border border-gold/15 text-sm text-[#F5F0E8] focus:outline-none focus:border-gold/45 transition-all">
              {['Damaged product', 'Wrong item delivered', 'Product quality issue', 'Size mismatch', 'Changed mind'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-gold/40 mb-1.5">Details / Explanation</label>
            <textarea value={vals.description} onChange={e => setVals(v => ({ ...v, description: e.target.value }))} required rows={3}
              placeholder="Explain the issue in detail…"
              className="w-full px-4 py-3 bg-surface-light border border-gold/15 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/15 focus:outline-none focus:border-gold/45 resize-none transition-all" />
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-gold/40 mb-1.5">Upload Photo Proof (Optional)</label>
            <div className="flex items-center gap-3">
              <label className="px-4 py-2.5 border border-gold/15 hover:border-gold/35 text-[#F5F0E8]/40 hover:text-[#F5F0E8]/70 text-xs cursor-pointer transition-all">
                Choose File
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {vals.image && <span className="text-xs text-gold/60">✓ Photo Uploaded</span>}
            </div>
            {vals.image && (
              <div className="mt-3 relative w-16 h-16 border border-gold/10 overflow-hidden">
                <img src={vals.image} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setVals(v => ({ ...v, image: '' }))}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 flex items-center justify-center text-white text-[8px]">✕</button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-gold/40 mb-2">Refund Method</label>
            <div className="grid grid-cols-3 gap-2">
              {['Original Payment Method', 'Wallet', 'Bank Transfer'].map(method => (
                <label key={method}
                  className={`border p-2.5 flex items-center justify-center text-center cursor-pointer transition-all text-[10px] tracking-wide
                    ${vals.refundMethod === method ? 'border-gold/50 bg-gold/5 text-gold/80' : 'border-gold/10 text-[#F5F0E8]/30 hover:border-gold/25'}`}>
                  <input type="radio" name="refundMethod" value={method}
                    checked={vals.refundMethod === method} onChange={() => setVals(v => ({ ...v, refundMethod: method }))} className="hidden" />
                  {method}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gold/10">
            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="flex-1 py-3.5 bg-gold hover:bg-gold/90 text-bg font-bold text-xs tracking-[0.15em] uppercase shimmer-btn-glow disabled:opacity-60 transition-all">
              {loading ? 'Submitting…' : 'Submit Return Request'}
            </motion.button>
            <button type="button" onClick={onClose}
              className="px-6 py-3.5 border border-gold/20 text-[#F5F0E8]/40 hover:text-[#F5F0E8] text-xs tracking-wider uppercase transition-all">
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

/* ── TABS ── */
const TABS = [
  { key: 'profile',  label: 'Profile'            },
  { key: 'orders',   label: 'Order History'       },
  { key: 'returns',  label: 'Returns & Refunds'   },
  { key: 'address',  label: 'Addresses'           },
  { key: 'settings', label: 'Settings'            },
];

const SETTINGS = [
  { label: 'Email Notifications', sub: 'Order and offer updates',  defaultOn: true  },
  { label: 'SMS Alerts',          sub: 'Delivery status via SMS',  defaultOn: true  },
  { label: 'Promotional Emails',  sub: 'Deals, discounts & news',  defaultOn: false },
  { label: 'Dark Mode',           sub: 'Botanical dark theme',     defaultOn: true  },
];

/* ── MAIN PAGE ── */
export default function ProfilePage() {
  const navigate                        = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const { wishlist }                    = useWishlist();
  const { cartCount }                   = useCart();

  const [tab,               setTab]              = useState('profile');
  const [modal,             setModal]            = useState(null);
  const [returnRequestModal, setReturnRequestModal] = useState(null);
  const [saved,             setSaved]            = useState(false);
  const [profile,           setProfile]          = useState({
    name:  user?.name  || 'Guest User',
    email: user?.email || 'guest@example.com',
    phone: user?.phone || '+91 98765 43210',
  });
  const [addresses, setAddresses] = useState([
    { id: 1, label: 'Home',   address: '12, Green Park Lane, Anna Nagar, Chennai', pincode: '600040', isDefault: true  },
    { id: 2, label: 'Office', address: '45, Tech Hub, OMR, Chennai',               pincode: '600119', isDefault: false },
  ]);
  const [orders,         setOrders]         = useState([]);
  const [returns,        setReturns]        = useState([]);
  const [loadingOrders,  setLoadingOrders]  = useState(true);
  const [loadingReturns, setLoadingReturns] = useState(true);

  const fetchOrdersAndReturns = async () => {
    if (!user) { setLoadingOrders(false); setLoadingReturns(false); return; }
    try {
      setLoadingOrders(true);
      const ordersData = await getUserOrders();
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch { setOrders([]); } finally { setLoadingOrders(false); }
    try {
      setLoadingReturns(true);
      const returnsData = await getUserReturns();
      setReturns(Array.isArray(returnsData) ? returnsData : []);
    } catch { setReturns([]); } finally { setLoadingReturns(false); }
  };

  useEffect(() => { fetchOrdersAndReturns(); }, [user]);
  useEffect(() => { if ((tab === 'orders' || tab === 'returns') && user) fetchOrdersAndReturns(); }, [tab]);

  const handleLogout = () => { logout(); navigate('/'); };

  const saveProfile = async (vals) => {
    setProfile(p => ({ ...p, ...vals }));
    if (user) { try { await updateProfile(vals); } catch (_) {} }
    setModal(null); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const saveAddress = (vals) => {
    if (modal?.addrId) {
      setAddresses(prev => prev.map(a => a.id === modal.addrId ? { ...a, ...vals } : a));
    } else {
      setAddresses(prev => [...prev, { id: Date.now(), ...vals, isDefault: false }]);
    }
    setModal(null);
  };

  const handleReturnSubmit = async (data) => {
    await createReturn(data);
    setSaved(true); setTimeout(() => setSaved(false), 3000);
    await fetchOrdersAndReturns();
  };

  const isReturnEligible = (order) => {
    if (order.status !== 'Delivered') return false;
    return Math.ceil(Math.abs(new Date() - new Date(order.updatedAt)) / (1000 * 60 * 60 * 24)) <= 30;
  };

  const getProductReturn = (orderId, productId) => returns.find(r => r.orderId === orderId && r.productId === productId);

  return (
    <div className="min-h-screen bg-bg text-[#F5F0E8] font-sans antialiased">
      <Navbar />

      <AnimatePresence>
        {modal && (
          <EditModal title={modal.title} fields={modal.fields} init={modal.init}
            onSave={modal.type === 'address' ? saveAddress : saveProfile}
            onClose={() => setModal(null)} />
        )}
        {returnRequestModal && (
          <RequestReturnModal
            orderId={returnRequestModal.orderId}
            item={returnRequestModal.item}
            onSave={handleReturnSubmit}
            onClose={() => setReturnRequestModal(null)}
          />
        )}
      </AnimatePresence>

      <div className="pt-28 pb-20 max-w-5xl mx-auto px-4 sm:px-6">

        {/* Hero banner */}
        <FadeUp className="mb-8">
          <div className="bg-surface border border-gold/15 p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-gold/40" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-gold/40" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-gold/40" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-gold/40" />
            {/* Grid texture */}
            <div className="absolute inset-0 opacity-[0.02]"
              style={{ backgroundImage: 'linear-gradient(#C9A84C 1px,transparent 1px),linear-gradient(90deg,#C9A84C 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="w-18 h-18 w-[72px] h-[72px] border border-gold/40 bg-gold/5 flex items-center justify-center flex-shrink-0">
                <span className="font-serif text-3xl text-gold">{profile.name[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <p className="text-[10px] tracking-[0.3em] uppercase text-gold/40 mb-1 italic">— Member Profile</p>
                <h1 className="font-serif text-2xl sm:text-3xl text-[#F5F0E8]">{profile.name}</h1>
                <p className="text-[#F5F0E8]/40 text-sm mt-0.5">{profile.email}</p>
                <div className="flex flex-wrap gap-3 mt-4">
                  {[{ v: orders.length, l: 'Orders' }, { v: wishlist.length, l: 'Wishlist' }, { v: cartCount, l: 'In Cart' }].map(({ v, l }) => (
                    <div key={l} className="border border-gold/15 px-3 py-1.5">
                      <span className="text-gold font-serif text-sm">{v} </span>
                      <span className="text-[#F5F0E8]/30 text-xs tracking-wider">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setModal({
                  title: 'Edit Profile', type: 'profile',
                  fields: [{ key: 'name', label: 'Full Name' }, { key: 'email', label: 'Email', type: 'email' }, { key: 'phone', label: 'Phone', type: 'tel' }],
                  init: profile,
                })}
                className="px-5 py-2.5 border border-gold/25 hover:border-gold/50 text-[#F5F0E8]/60 hover:text-gold text-xs tracking-[0.15em] uppercase transition-all flex-shrink-0">
                Edit Profile
              </motion.button>
            </div>
          </div>
        </FadeUp>

        {/* Success toast */}
        <AnimatePresence>
          {saved && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-5 p-4 border border-gold/25 bg-gold/5 text-center text-gold/70 text-xs tracking-[0.2em] uppercase">
              ✦ Action completed successfully
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <FadeUp delay={0.1} className="flex gap-0 overflow-x-auto mb-8 border-b border-gold/10">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`relative px-5 py-3.5 text-xs tracking-[0.15em] uppercase whitespace-nowrap flex-shrink-0 transition-all duration-200
                ${tab === t.key
                  ? 'text-gold border-b-2 border-gold -mb-px'
                  : 'text-[#F5F0E8]/35 hover:text-[#F5F0E8]/70'}`}>
              {t.label}
            </button>
          ))}
        </FadeUp>

        {/* Tab content */}
        <AnimatePresence mode="wait">

          {/* Profile tab */}
          {tab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                {[{ l: 'Full Name', v: profile.name }, { l: 'Email', v: profile.email }, { l: 'Phone', v: profile.phone }].map(({ l, v }) => (
                  <motion.div key={l} whileHover={{ y: -3, borderColor: 'rgba(201,168,76,0.3)' }}
                    className="border border-gold/10 bg-surface p-5 transition-all duration-200 relative">
                    <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-gold/20" />
                    <p className="text-[10px] tracking-[0.2em] uppercase text-gold/40 mb-2">{l}</p>
                    <p className="text-sm text-[#F5F0E8]/80 font-sans">{v}</p>
                  </motion.div>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { l: 'My Orders',  action: () => setTab('orders')   },
                  { l: 'Returns',    action: () => setTab('returns')  },
                  { l: 'Wishlist',   action: () => navigate('/wishlist') },
                  { l: 'Logout',     action: handleLogout, danger: true },
                ].map(({ l, action, danger }) => (
                  <motion.button key={l} onClick={action}
                    whileHover={{ y: -4, borderColor: danger ? 'rgba(239,68,68,0.3)' : 'rgba(201,168,76,0.35)' }}
                    whileTap={{ scale: 0.97 }}
                    className={`border p-5 flex flex-col items-center gap-3 text-center transition-all duration-200
                      ${danger ? 'border-red-500/15 hover:bg-red-500/5' : 'border-gold/10 bg-surface hover:bg-gold/3'}`}>
                    <span className={`text-xs tracking-[0.15em] uppercase ${danger ? 'text-red-400/70' : 'text-[#F5F0E8]/50'}`}>{l}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Orders tab */}
          {tab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-5">
              {loadingOrders ? (
                <div className="flex justify-center py-14">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 border border-gold/10 border-t-gold/60 rounded-full" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 border border-gold/10 bg-surface">
                  <p className="text-gold/30 text-3xl mb-3">◎</p>
                  <p className="text-[#F5F0E8]/30 text-sm">No orders found. Start your botanical journey!</p>
                  <motion.button whileHover={{ scale: 1.02 }} onClick={() => navigate('/shop')}
                    className="mt-6 px-8 py-3 bg-gold text-bg font-bold text-xs tracking-[0.15em] uppercase shimmer-btn-glow">
                    Explore Shop
                  </motion.button>
                </div>
              ) : (
                orders.map((order, i) => (
                  <motion.div key={order.orderId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="border border-gold/10 bg-surface p-6 relative">
                    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold/20" />

                    {/* Order header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gold/8 pb-4 mb-4 gap-3">
                      <div>
                        <p className="text-[10px] tracking-[0.18em] uppercase text-gold/40 mb-1">Order Reference</p>
                        <p className="text-sm text-[#F5F0E8]/80 font-sans">#{order.orderId}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Link to={`/order-tracking/${order.orderId}`}
                          className="px-3 py-1.5 border border-gold/20 text-gold/60 hover:text-gold hover:border-gold/50 text-[10px] tracking-[0.15em] uppercase transition-all">
                          Track →
                        </Link>
                        <span className={`px-3 py-1 border text-[10px] tracking-wider uppercase font-sans
                          ${STATUS_STYLE[order.status.toLowerCase().replace(/\s+/g, '')] || 'border-gold/10 text-[#F5F0E8]/40'}`}>
                          {order.status}
                        </span>
                        <span className="font-serif text-base text-gold">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* Order items */}
                    <div className="space-y-4">
                      {order.items.map(item => {
                        const existingReturn = getProductReturn(order.orderId, item.productId);
                        const eligible = isReturnEligible(order);
                        const imgSrc = getProductImage(item);
                        return (
                          <div key={item.productId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 border border-gold/10 bg-surface-light flex-shrink-0 overflow-hidden">
                                {imgSrc
                                  ? <img src={imgSrc} alt={item.name} className="w-full h-full object-cover"
                                      onError={e => { e.target.style.display = 'none'; }} />
                                  : <div className="w-full h-full flex items-center justify-center text-gold/15 text-xs">✦</div>
                                }
                              </div>
                              <div>
                                <p className="text-sm text-[#F5F0E8]/75 font-sans line-clamp-1">{item.name}</p>
                                <p className="text-xs text-[#F5F0E8]/30 mt-0.5">₹{item.price} · Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {existingReturn ? (
                                <span className="px-3 py-1 border border-gold/20 text-gold/60 text-[10px] tracking-wider uppercase">
                                  Return: {existingReturn.status}
                                </span>
                              ) : order.status === 'Delivered' ? (
                                eligible ? (
                                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => setReturnRequestModal({ orderId: order.orderId, item })}
                                    className="px-3.5 py-1.5 border border-gold/25 hover:border-gold/50 text-gold/60 hover:text-gold text-[10px] tracking-wider uppercase transition-all">
                                    Return Item
                                  </motion.button>
                                ) : (
                                  <span className="text-[10px] text-[#F5F0E8]/25 tracking-wider">Return window closed</span>
                                )
                              ) : (
                                <span className="text-[10px] text-[#F5F0E8]/25 tracking-wider">Return post-delivery</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* Returns tab */}
          {tab === 'returns' && (
            <motion.div key="returns" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-5">
              {loadingReturns ? (
                <div className="flex justify-center py-14">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 border border-gold/10 border-t-gold/60 rounded-full" />
                </div>
              ) : returns.length === 0 ? (
                <div className="text-center py-16 border border-gold/10 bg-surface">
                  <p className="text-gold/30 text-3xl mb-3">◎</p>
                  <p className="text-[#F5F0E8]/30 text-sm">No active returns or refund requests.</p>
                </div>
              ) : (
                returns.map((ret, i) => (
                  <motion.div key={ret._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className="border border-gold/10 bg-surface p-6 space-y-4 relative">
                    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold/20" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gold/8 pb-3">
                      <div>
                        <p className="text-[10px] tracking-[0.18em] uppercase text-gold/40 mb-1">Return / Order</p>
                        <p className="text-sm text-[#F5F0E8]/70">#{ret.orderId}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 border text-[10px] tracking-wider uppercase ${RETURN_STATUS_STYLE[ret.status] || 'border-gold/10 text-[#F5F0E8]/30'}`}>
                          {ret.status}
                        </span>
                        <span className="font-serif text-base text-gold">₹{ret.refundAmount}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 border border-gold/10 bg-surface-light flex-shrink-0 overflow-hidden">
                        {ret.productImage
                          ? <img src={ret.productImage} alt={ret.productName} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gold/15 text-xs">✦</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#F5F0E8]/75 line-clamp-1">{ret.productName}</p>
                        <p className="text-xs text-[#F5F0E8]/35 mt-1">Reason: {ret.reason}</p>
                        {ret.description && (
                          <p className="text-xs text-[#F5F0E8]/30 mt-1 italic border-l border-gold/15 pl-2 leading-relaxed">
                            "{ret.description}"
                          </p>
                        )}
                        <p className="text-[10px] text-[#F5F0E8]/25 mt-1.5 tracking-wider">Refund: {ret.refundMethod}</p>
                      </div>
                    </div>
                    <ReturnTimeline currentStatus={ret.status} remarks={ret.adminRemarks} pickupDate={ret.pickupDate} />
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* Addresses tab */}
          {tab === 'address' && (
            <motion.div key="address" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <div className="grid sm:grid-cols-2 gap-4">
                {addresses.map((addr, i) => (
                  <motion.div key={addr.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -3, borderColor: 'rgba(201,168,76,0.3)' }}
                    className={`border p-5 transition-all duration-200 relative ${addr.isDefault ? 'border-gold/30 bg-gold/3' : 'border-gold/10 bg-surface'}`}>
                    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold/25" />
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-[#F5F0E8]/80 font-sans">{addr.label}</p>
                        {addr.isDefault && <span className="px-2 py-0.5 border border-gold/30 text-gold/60 text-[9px] tracking-wider uppercase">Default</span>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setModal({ title: 'Edit Address', type: 'address', addrId: addr.id,
                          fields: [{ key: 'label', label: 'Label' }, { key: 'address', label: 'Full Address', type: 'textarea' }, { key: 'pincode', label: 'Pincode' }],
                          init: { label: addr.label, address: addr.address, pincode: addr.pincode } })}
                          className="w-7 h-7 border border-gold/15 flex items-center justify-center text-[#F5F0E8]/30 hover:text-gold text-[10px] transition-all">
                          ✎
                        </button>
                        <button onClick={() => setAddresses(prev => prev.filter(a => a.id !== addr.id))}
                          className="w-7 h-7 border border-gold/15 flex items-center justify-center text-[#F5F0E8]/30 hover:text-red-400/70 text-[10px] transition-all">
                          ✕
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[#F5F0E8]/50 leading-relaxed">{addr.address}</p>
                    <p className="text-[10px] text-[#F5F0E8]/30 mt-1 tracking-wider">PIN: {addr.pincode}</p>
                    {!addr.isDefault && (
                      <button onClick={() => setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === addr.id })))}
                        className="mt-3 text-[10px] text-gold/50 hover:text-gold tracking-[0.15em] uppercase transition-colors">
                        Set as default →
                      </button>
                    )}
                  </motion.div>
                ))}

                {/* Add new */}
                <motion.button whileHover={{ y: -3, borderColor: 'rgba(201,168,76,0.3)' }} whileTap={{ scale: 0.98 }}
                  onClick={() => setModal({ title: 'Add New Address', type: 'address',
                    fields: [{ key: 'label', label: 'Label' }, { key: 'address', label: 'Full Address', type: 'textarea' }, { key: 'pincode', label: 'Pincode' }],
                    init: {} })}
                  className="border border-dashed border-gold/15 flex flex-col items-center justify-center gap-2 text-[#F5F0E8]/25 hover:text-gold/50 transition-all min-h-[140px]">
                  <span className="text-2xl">+</span>
                  <span className="text-[10px] tracking-[0.2em] uppercase">Add New Address</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Settings tab */}
          {tab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}
              className="border border-gold/10 bg-surface p-6 relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/25" />
              {SETTINGS.map(s => <SettingsToggle key={s.label} {...s} />)}
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleLogout}
                className="w-full mt-6 py-4 border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 text-xs tracking-[0.2em] uppercase transition-all">
                Logout from NatureKart
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
