import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useAuth }     from '../context/AuthContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart }     from '../context/CartContext.jsx';
import { getUserOrders, createReturn, getUserReturns } from '../services/api.js';
import SearchOverlay from '../components/SearchOverlay.jsx';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const FadeUp = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
};

const STATUS_STYLE = {
  delivered: 'bg-green-100 text-green-700',
  shipped:   'bg-orange-100 text-orange-700',
  placed:    'bg-blue-100 text-blue-700',
  outfordelivery: 'bg-emerald-100 text-emerald-700',
  packed:    'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700'
};

const RETURN_STATUS_STYLE = {
  Requested: 'bg-gray-100 text-gray-700 border-gray-200',
  Approved: 'bg-green-100 text-green-700 border-green-200',
  'Pickup Scheduled': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Refund Processing': 'bg-amber-100 text-amber-700 border-amber-200',
  'Refund Completed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Rejected: 'bg-red-100 text-red-700 border-red-200',
};

/* ── Toggle component — must be a real component so hooks are always called ─ */
const SettingsToggle = ({ label, sub, icon, defaultOn }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="font-bold text-stone-800 text-sm">{label}</p>
          <p className="text-xs text-stone-400">{sub}</p>
        </div>
      </div>
      <div onClick={() => setOn(v => !v)}
        className={`w-12 h-6 rounded-full transition-all duration-300 relative cursor-pointer ${on ? 'bg-green-500' : 'bg-stone-200'}`}>
        <motion.div animate={{ x: on ? 24 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
      </div>
    </div>
  );
};

/* ── Edit Profile / Address Modal ────────────────────────────────────────── */
const EditModal = ({ title, fields, init, onSave, onClose }) => {
  const [vals, setVals] = useState(init || {});
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-stone-100 p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-extrabold text-stone-800 text-lg">{title}</h3>
          <button onClick={onClose} className="w-9 h-9 bg-stone-100 rounded-xl flex items-center justify-center text-stone-500 hover:bg-stone-200 transition-colors">✕</button>
        </div>
        <div className="space-y-4">
          {fields.map(({ key, label, type = 'text' }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wide">{label}</label>
              {type === 'textarea'
                ? <textarea value={vals[key] || ''} rows={3} onChange={e => setVals(v => ({ ...v, [key]: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 resize-none" />
                : <input type={type} value={vals[key] || ''} onChange={e => setVals(v => ({ ...v, [key]: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
              }
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-7">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => onSave(vals)}
            className="flex-1 py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold text-sm rounded-2xl shadow-lg">
            Save Changes ✓
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} onClick={onClose}
            className="px-6 py-3.5 bg-stone-100 text-stone-600 font-bold text-sm rounded-2xl hover:bg-stone-200 transition-colors">
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Return Timeline tracking UI ─────────────────────────────────────────── */
const ReturnTimeline = ({ currentStatus, remarks, pickupDate }) => {
  const steps = ['Requested', 'Approved', 'Pickup Scheduled', 'Refund Processing', 'Refund Completed'];
  const isRejected = currentStatus === 'Rejected';
  const currentIndex = steps.indexOf(currentStatus);

  if (isRejected) {
    return (
      <div className="mt-5 p-4 bg-red-50 border border-red-100 rounded-2xl">
        <div className="flex items-center gap-2 text-red-600 font-extrabold text-sm mb-1.5">
          <span>❌</span> Return Request Rejected
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">
          Remarks: <span className="font-semibold text-red-600">{remarks || 'Your request did not meet our return guidelines. Please reach out to customer service.'}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 pt-3 border-t border-stone-100">
      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">Refund Track Timeline</p>
      <div className="grid grid-cols-5 gap-1.5 relative">
        {/* Track Line */}
        <div className="absolute top-[18px] left-[10%] right-[10%] h-[3px] bg-stone-100 z-0">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${currentIndex >= 0 ? (currentIndex / 4) * 100 : 0}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
          />
        </div>
        {steps.map((step, idx) => {
          const completed = idx <= currentIndex;
          const active = idx === currentIndex;
          return (
            <div key={step} className="flex flex-col items-center z-10 text-center">
              <motion.div 
                animate={{ 
                  scale: active ? 1.15 : 1,
                  boxShadow: active ? '0 0 12px rgba(16,185,129,0.3)' : 'none'
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs transition-all duration-300 ${
                  completed ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' : 'bg-white border-2 border-stone-200 text-stone-400'
                }`}
              >
                {completed && !active ? '✓' : idx + 1}
              </motion.div>
              <span className={`text-[9px] font-bold mt-2 leading-tight block ${completed ? 'text-green-700 font-extrabold' : 'text-stone-400'}`}>
                {step}
              </span>
              {active && step === 'Pickup Scheduled' && pickupDate && (
                <span className="text-[8px] font-black text-emerald-600 mt-1 block">
                  Pickup: {new Date(pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Return Request Modal ────────────────────────────────────────────────── */
const RequestReturnModal = ({ orderId, item, onSave, onClose }) => {
  const [vals, setVals] = useState({
    reason: 'Damaged product',
    description: '',
    refundMethod: 'Original Payment Method',
    image: ''
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErr('Image must be smaller than 2MB');
        return;
      }
      setErr('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setVals(v => ({ ...v, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      await onSave({
        orderId,
        productId: item.productId,
        reason: vals.reason,
        description: vals.description,
        images: vals.image ? [vals.image] : [],
        refundMethod: vals.refundMethod
      });
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to submit return request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-stone-100 p-6 sm:p-8 w-full max-w-lg overflow-y-auto max-h-[90vh]">
        
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-extrabold text-stone-800 text-lg">Return & Refund Request</h3>
            <p className="text-xs text-stone-400 font-semibold mt-0.5">Order #{orderId}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-stone-100 rounded-xl flex items-center justify-center text-stone-500 hover:bg-stone-200 transition-colors">✕</button>
        </div>

        {/* Item summary */}
        <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl mb-5">
          <div className="w-12 h-12 bg-white rounded-xl border border-stone-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-lg">🌿</span>}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-stone-800 text-sm truncate">{item.name}</p>
            <p className="text-xs text-stone-500 mt-0.5">₹{item.price} · Qty: {item.quantity}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {err && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
              ⚠️ {err}
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-stone-500 mb-1.5 uppercase tracking-wide">Reason for Return</label>
            <select 
              value={vals.reason}
              onChange={e => setVals(v => ({ ...v, reason: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 bg-white"
            >
              <option value="Damaged product">Damaged product</option>
              <option value="Wrong item delivered">Wrong item delivered</option>
              <option value="Product quality issue">Product quality issue</option>
              <option value="Size mismatch">Size mismatch</option>
              <option value="Changed mind">Changed mind</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-stone-500 mb-1.5 uppercase tracking-wide">Details / Explanation</label>
            <textarea 
              value={vals.description}
              onChange={e => setVals(v => ({ ...v, description: e.target.value }))}
              required
              rows={3}
              placeholder="Explain the issue in detail..."
              className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-stone-500 mb-1.5 uppercase tracking-wide">Upload Photo Proof (Optional)</label>
            <div className="flex items-center gap-3">
              <label className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-xs rounded-xl cursor-pointer transition-colors border border-stone-200">
                📁 Choose File
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {vals.image && <span className="text-xs text-green-600 font-bold">✓ Photo Uploaded</span>}
            </div>
            {vals.image && (
              <div className="mt-3 relative w-20 h-20 rounded-xl border border-stone-200 overflow-hidden bg-stone-50">
                <img src={vals.image} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setVals(v => ({ ...v, image: '' }))} className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black rounded-full flex items-center justify-center text-white text-[9px]">✕</button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-black text-stone-500 mb-1.5 uppercase tracking-wide">Refund Method</label>
            <div className="grid grid-cols-3 gap-2.5">
              {['Original Payment Method', 'Wallet', 'Bank Transfer'].map(method => (
                <label 
                  key={method}
                  className={`border-2 rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    vals.refundMethod === method 
                      ? 'border-emerald-500 bg-emerald-50/40 text-emerald-700 font-extrabold' 
                      : 'border-stone-200 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="refundMethod" 
                    value={method} 
                    checked={vals.refundMethod === method}
                    onChange={() => setVals(v => ({ ...v, refundMethod: method }))}
                    className="hidden" 
                  />
                  <span className="text-[11px] leading-tight">{method}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-stone-100">
            <motion.button 
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.03 }} 
              whileTap={{ scale: 0.97 }} 
              className="flex-1 py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-green-100 disabled:opacity-75"
            >
              {loading ? 'Submitting Request…' : 'Submit Return Request ✓'}
            </motion.button>
            <motion.button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3.5 bg-stone-100 text-stone-600 font-bold text-sm rounded-2xl hover:bg-stone-200 transition-colors"
            >
              Cancel
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const TABS = [
  { key: 'profile',  label: 'Profile',        icon: '👤' },
  { key: 'orders',   label: 'Order History',  icon: '📦' },
  { key: 'returns',  label: 'My Returns & Refunds', icon: '🔄' },
  { key: 'address',  label: 'Addresses',       icon: '📍' },
  { key: 'settings', label: 'Settings',        icon: '⚙️' },
];

const SETTINGS = [
  { label: 'Email Notifications', sub: 'Order and offer updates',  icon: '📧', defaultOn: true  },
  { label: 'SMS Alerts',          sub: 'Delivery status via SMS',  icon: '📱', defaultOn: true  },
  { label: 'Promotional Emails',  sub: 'Deals, discounts & news',  icon: '🏷️', defaultOn: false },
  { label: 'Dark Mode',           sub: 'Switch to dark theme',     icon: '🌙', defaultOn: false },
];

/* ── Navbar ──────────────────────────────────────────────────────────────── */
const Navbar = () => {
  const { cartCount }   = useCart();
  const { wishlist }    = useWishlist();
  return (
    <motion.nav initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-stone-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
            <span className="text-white text-sm">🌿</span>
          </div>
          <span className="hidden sm:block text-lg font-black text-green-800">Nature<span className="text-emerald-500">Kart</span></span>
        </Link>

        {/* Search Bar — full width stretch in middle */}
        <div className="flex-1 max-w-xl">
          <SearchOverlay />
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to="/wishlist" className="relative w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:text-red-500 hover:bg-red-50 transition-all">
            <span>❤️</span>
            {wishlist.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{wishlist.length}</span>}
          </Link>
          <Link to="/cart" className="relative w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:text-green-700 hover:bg-green-50 transition-all">
            <span>🛒</span>
            {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

/* ── MAIN PAGE ───────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const navigate               = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const { wishlist }           = useWishlist();
  const { cartCount }          = useCart();

  const [tab,         setTab]      = useState('profile');
  const [modal,       setModal]    = useState(null);
  const [returnRequestModal, setReturnRequestModal] = useState(null);
  const [saved,       setSaved]    = useState(false);
  const [profile,     setProfile]  = useState({
    name:  user?.name  || 'Guest User',
    email: user?.email || 'guest@example.com',
    phone: user?.phone || '+91 98765 43210',
  });
  const [addresses, setAddresses] = useState([
    { id: 1, label: 'Home',   address: '12, Green Park Lane, Anna Nagar, Chennai', pincode: '600040', isDefault: true  },
    { id: 2, label: 'Office', address: '45, Tech Hub, OMR, Chennai',               pincode: '600119', isDefault: false },
  ]);

  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingReturns, setLoadingReturns] = useState(true);

  const fetchOrdersAndReturns = async () => {
    if (!user) return;
    try {
      setLoadingOrders(true);
      const ordersData = await getUserOrders();
      setOrders(ordersData);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoadingOrders(false);
    }

    try {
      setLoadingReturns(true);
      const returnsData = await getUserReturns();
      setReturns(returnsData);
    } catch (err) {
      console.error('Failed to load returns', err);
    } finally {
      setLoadingReturns(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndReturns();
  }, [user]);

  const handleLogout = () => { logout(); navigate('/'); };

  const saveProfile = async (vals) => {
    setProfile(p => ({ ...p, ...vals }));
    if (user) { try { await updateProfile(vals); } catch (_) {} }
    setModal(null); setSaved(true); setTimeout(() => setSaved(false), 2000);
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
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    // Refresh both orders and returns
    await fetchOrdersAndReturns();
  };

  const isReturnEligible = (order) => {
    if (order.status !== 'Delivered') return false;
    const deliveryDate = new Date(order.updatedAt);
    const diffTime = Math.abs(new Date() - deliveryDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  const getProductReturn = (orderId, productId) => {
    return returns.find(r => r.orderId === orderId && r.productId === productId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white font-sans antialiased">
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

      <div className="pt-20 pb-20 max-w-5xl mx-auto px-4 sm:px-6">

        {/* Hero banner */}
        <FadeUp className="py-8">
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <motion.div whileHover={{ scale: 1.06 }}
                className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl border-2 border-white/30 flex items-center justify-center text-4xl shadow-xl flex-shrink-0 font-extrabold text-white">
                {profile.name[0]?.toUpperCase()}
              </motion.div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{profile.name}</h1>
                <p className="text-green-200 text-sm mt-0.5">{profile.email}</p>
                <div className="flex flex-wrap gap-3 mt-3">
                  {[{ v: orders.length, l: 'Orders' }, { v: wishlist.length, l: 'Wishlist' }, { v: cartCount, l: 'In Cart' }].map(({ v, l }) => (
                    <div key={l} className="px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl">
                      <span className="text-white font-extrabold text-sm">{v} </span>
                      <span className="text-green-200 text-xs">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }} onClick={() =>
                setModal({ title: 'Edit Profile', type: 'profile', fields: [
                  { key: 'name',  label: 'Full Name' },
                  { key: 'email', label: 'Email', type: 'email' },
                  { key: 'phone', label: 'Phone',  type: 'tel'   },
                ], init: profile })}
                className="px-5 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold text-sm rounded-xl hover:bg-white/30 transition-all flex-shrink-0">
                ✏️ Edit Profile
              </motion.button>
            </div>
          </div>
        </FadeUp>

        {/* Success toast */}
        <AnimatePresence>
          {saved && (
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl text-center text-green-700 font-bold text-sm">
              ✅ Action completed successfully!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <FadeUp delay={0.1} className="flex gap-2 overflow-x-auto pb-1 mb-8">
          {TABS.map(t => (
            <motion.button key={t.key} onClick={() => setTab(t.key)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-extrabold whitespace-nowrap flex-shrink-0 transition-all ${
                tab === t.key
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-200'
                  : 'bg-white border-2 border-stone-200 text-stone-600 hover:border-green-300 hover:text-green-700'
              }`}>
              {t.icon} {t.label}
            </motion.button>
          ))}
        </FadeUp>

        {/* Tab content */}
        <AnimatePresence mode="wait">

          {/* Profile */}
          {tab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                {[{ l: 'Full Name', v: profile.name, i: '👤' }, { l: 'Email', v: profile.email, i: '✉️' }, { l: 'Phone', v: profile.phone, i: '📱' }].map(({ l, v, i }) => (
                  <motion.div key={l} whileHover={{ y: -4, boxShadow: '0 16px 32px rgba(0,0,0,0.07)' }}
                    className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{i}</span>
                      <span className="text-[10px] font-bold text-stone-400 tracking-widest uppercase">{l}</span>
                    </div>
                    <p className="font-bold text-stone-800">{v}</p>
                  </motion.div>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { l: 'My Orders',  i: '📦', action: () => setTab('orders')           },
                  { l: 'Returns',    i: '🔄', action: () => setTab('returns')          },
                  { l: 'Wishlist',   i: '❤️', action: () => navigate('/wishlist')       },
                  { l: 'Logout',     i: '🚪', action: handleLogout, danger: true        },
                ].map(({ l, i, action, danger }) => (
                  <motion.button key={l} onClick={action}
                    whileHover={{ y: -4, boxShadow: '0 16px 32px rgba(0,0,0,0.08)' }} whileTap={{ scale: 0.97 }}
                    className={`bg-white rounded-2xl border-2 p-5 flex flex-col items-center gap-2 text-center transition-all ${
                      danger ? 'border-red-100 hover:border-red-300 hover:bg-red-50' : 'border-stone-100 hover:border-green-200 hover:bg-green-50'
                    }`}>
                    <span className="text-3xl">{i}</span>
                    <span className={`text-sm font-bold ${danger ? 'text-red-600' : 'text-stone-700'}`}>{l}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Orders */}
          {tab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}
              className="space-y-5">
              {loadingOrders ? (
                <div className="text-center py-10 text-stone-400 font-semibold">Loading orders…</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-10 text-stone-400 bg-white rounded-3xl border border-stone-100 p-8 font-semibold">No orders found. Shop some green wellness goods!</div>
              ) : (
                orders.map((order, i) => (
                  <motion.div key={order.orderId} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6 space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-stone-100 pb-3 gap-2">
                      <div>
                        <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">Order ID</span>
                        <p className="font-black text-stone-800 text-sm">#{order.orderId}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Link 
                          to={`/order-tracking/${order.orderId}`} 
                          className="px-3.5 py-1.5 bg-stone-100 text-stone-600 text-xs font-extrabold rounded-xl hover:bg-stone-200 transition-colors flex items-center gap-1.5"
                        >
                          <span>📍</span> Track Order
                        </Link>
                        <span className={`px-3 py-1 rounded-xl text-xs font-extrabold ${STATUS_STYLE[order.status.toLowerCase().replace(/\s+/g, '')] || 'bg-stone-100 text-stone-600'}`}>
                          {order.status}
                        </span>
                        <span className="font-extrabold text-green-700 text-base sm:text-lg">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* Products List inside Order */}
                    <div className="space-y-4">
                      {order.items.map(item => {
                        const existingReturn = getProductReturn(order.orderId, item.productId);
                        const eligible = isReturnEligible(order);

                        return (
                          <div key={item.productId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 last:pb-0">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-xl border border-stone-100 flex items-center justify-center bg-stone-50 overflow-hidden flex-shrink-0">
                                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-xl">📦</span>}
                              </div>
                              <div>
                                <p className="font-extrabold text-stone-800 text-sm line-clamp-1">{item.name}</p>
                                <p className="text-xs text-stone-400 font-semibold mt-0.5">₹{item.price} · Qty: {item.quantity}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {existingReturn ? (
                                <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-black">
                                  🔄 Return Status: {existingReturn.status}
                                </div>
                              ) : order.status === 'Delivered' ? (
                                eligible ? (
                                  <>
                                    <motion.button 
                                      whileHover={{ scale: 1.04 }} 
                                      whileTap={{ scale: 0.96 }}
                                      onClick={() => setReturnRequestModal({ orderId: order.orderId, item })}
                                      className="px-3.5 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-green-100"
                                    >
                                      Return Item
                                    </motion.button>
                                    <motion.button 
                                      whileHover={{ scale: 1.04 }} 
                                      whileTap={{ scale: 0.96 }}
                                      onClick={() => setReturnRequestModal({ orderId: order.orderId, item })}
                                      className="px-3.5 py-1.5 border-2 border-stone-200 text-stone-600 text-xs font-extrabold rounded-xl hover:border-emerald-500 hover:text-emerald-700 transition-colors"
                                    >
                                      Request Refund
                                    </motion.button>
                                  </>
                                ) : (
                                  <span className="text-xs text-stone-400 font-semibold">
                                    Return window closed (30 days exceeded)
                                  </span>
                                )
                              ) : (
                                <span className="text-xs text-stone-400 font-semibold">
                                  Return available post-delivery
                                </span>
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

          {/* Returns & Refunds Tab (id="rr1") */}
          {tab === 'returns' && (
            <motion.div key="returns" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}
              className="space-y-5" id="rr1">
              {loadingReturns ? (
                <div className="text-center py-10 text-stone-400 font-semibold">Loading returns history…</div>
              ) : returns.length === 0 ? (
                <div className="text-center py-12 text-stone-400 bg-white rounded-3xl border border-stone-100 p-8 font-semibold">
                  <span className="text-4xl block mb-2">🔄</span>
                  No active returns or refunds requests.
                </div>
              ) : (
                returns.map((ret, i) => (
                  <motion.div 
                    key={ret._id} 
                    initial={{ opacity: 0, y: 16 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -2, boxShadow: '0 12px 24px rgba(0,0,0,0.04)' }}
                    className="bg-white rounded-3xl border border-stone-100 p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                      <div>
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Return ID / Order ID</span>
                        <span className="font-extrabold text-stone-800 text-sm">#{ret.orderId}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${RETURN_STATUS_STYLE[ret.status] || 'bg-stone-100 text-stone-600'}`}>
                          {ret.status}
                        </span>
                        <span className="font-black text-green-700 text-base">Refund Amount: ₹{ret.refundAmount}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl border border-stone-100 flex items-center justify-center bg-stone-50 overflow-hidden flex-shrink-0">
                        {ret.productImage ? <img src={ret.productImage} alt={ret.productName} className="w-full h-full object-cover" /> : <span className="text-2xl">🌿</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-stone-800 text-sm line-clamp-1">{ret.productName}</h4>
                        <p className="text-xs text-stone-400 mt-1 font-bold">Reason: <span className="text-stone-600">{ret.reason}</span></p>
                        {ret.description && (
                          <p className="text-xs text-stone-500 mt-1.5 italic bg-stone-50 p-2.5 rounded-xl border border-stone-100 leading-relaxed font-semibold">
                            "{ret.description}"
                          </p>
                        )}
                        <p className="text-[10px] text-stone-400 font-bold mt-2">Refund Method: <span className="text-stone-600">{ret.refundMethod}</span></p>
                      </div>
                    </div>

                    {/* Timeline Track Progress */}
                    <ReturnTimeline 
                      currentStatus={ret.status} 
                      remarks={ret.adminRemarks}
                      pickupDate={ret.pickupDate}
                    />
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* Addresses */}
          {tab === 'address' && (
            <motion.div key="address" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
              <div className="grid sm:grid-cols-2 gap-4">
                {addresses.map((addr, i) => (
                  <motion.div key={addr.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -4, boxShadow: '0 16px 32px rgba(0,0,0,0.07)' }}
                    className={`bg-white rounded-2xl border-2 p-5 ${addr.isDefault ? 'border-green-300 shadow-md shadow-green-100' : 'border-stone-100'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{addr.label === 'Home' ? '🏠' : '🏢'}</span>
                        <span className="font-extrabold text-stone-800 text-sm">{addr.label}</span>
                        {addr.isDefault && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">Default</span>}
                      </div>
                      <div className="flex gap-2">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setModal({ title: 'Edit Address', type: 'address', addrId: addr.id, fields: [
                            { key: 'label',   label: 'Label (Home/Office)' },
                            { key: 'address', label: 'Full Address', type: 'textarea' },
                            { key: 'pincode', label: 'Pincode' },
                          ], init: { label: addr.label, address: addr.address, pincode: addr.pincode } })}
                          className="w-8 h-8 bg-stone-100 rounded-xl flex items-center justify-center text-stone-500 hover:bg-green-100 hover:text-green-700 transition-all text-xs">
                          ✏️
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setAddresses(prev => prev.filter(a => a.id !== addr.id))}
                          className="w-8 h-8 bg-stone-100 rounded-xl flex items-center justify-center text-stone-500 hover:bg-red-100 hover:text-red-500 transition-all text-xs">
                          🗑
                        </motion.button>
                      </div>
                    </div>
                    <p className="text-sm text-stone-600 leading-relaxed">{addr.address}</p>
                    <p className="text-xs text-stone-400 mt-1">PIN: {addr.pincode}</p>
                    {!addr.isDefault && (
                      <button onClick={() => setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === addr.id })))}
                        className="mt-3 text-xs text-emerald-600 font-bold hover:text-emerald-800 transition-colors">
                        Set as default →
                      </button>
                    )}
                  </motion.div>
                ))}

                {/* Add new */}
                <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setModal({ title: 'Add New Address', type: 'address', fields: [
                    { key: 'label',   label: 'Label (Home/Office)' },
                    { key: 'address', label: 'Full Address', type: 'textarea' },
                    { key: 'pincode', label: 'Pincode' },
                  ], init: {} })}
                  className="bg-white rounded-2xl border-2 border-dashed border-stone-200 p-5 flex flex-col items-center justify-center gap-2 text-stone-400 hover:border-green-400 hover:text-green-600 transition-all min-h-[150px]">
                  <span className="text-4xl">+</span>
                  <span className="text-sm font-bold">Add New Address</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Settings */}
          {tab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
              {SETTINGS.map(s => <SettingsToggle key={s.label} {...s} />)}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleLogout}
                className="w-full mt-5 py-4 bg-red-50 border-2 border-red-200 text-red-600 font-extrabold text-sm rounded-2xl hover:bg-red-100 transition-colors">
                🚪 Logout from NatureKart
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
