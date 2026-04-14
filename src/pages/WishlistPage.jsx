import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart } from '../context/CartContext.jsx';

/* ── FadeUp ───────────────────────────────────────────────────────────────── */
const FadeUp = ({ children, delay = 0, className = '' }) => {
  const ref    = useRef(null);
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

/* ── Navbar ───────────────────────────────────────────────────────────────── */
const Navbar = () => {
  const { cartCount } = useCart();
  return (
    <motion.nav initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-stone-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
            <span className="text-white text-sm">🌿</span>
          </div>
          <span className="text-lg font-black text-green-800">Nature<span className="text-emerald-500">Kart</span></span>
        </Link>
        <div className="hidden sm:flex items-center gap-1 text-sm text-stone-400">
          <Link to="/" className="hover:text-green-700 font-medium">Home</Link>
          <span className="mx-1">/</span>
          <span className="text-stone-700 font-semibold">Wishlist</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:text-green-700 hover:bg-green-50 transition-all">
            <span>🛒</span>
            {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
          </Link>
          <Link to="/shop">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="px-4 py-2 text-sm font-bold text-green-700 border-2 border-green-200 rounded-xl hover:bg-green-50 transition-all">
              ← Shop
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

/* ── Wishlist Card ────────────────────────────────────────────────────────── */
const WishlistCard = ({ item, index }) => {
  const { removeFromWishlist } = useWishlist();
  const { addToCart }          = useCart();
  const [moved, setMoved]      = useState(false);
  const [leaving, setLeaving]  = useState(false);

  const discount = item.mrp && item.mrp > item.price
    ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;

  const handleMoveToCart = () => {
    addToCart(item);
    setMoved(true);
    setTimeout(() => {
      setLeaving(true);
      setTimeout(() => removeFromWishlist(item.id), 380);
    }, 900);
  };

  const handleRemove = () => {
    setLeaving(true);
    setTimeout(() => removeFromWishlist(item.id), 380);
  };

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 20 }}
      animate={leaving ? { opacity: 0, scale: 0.9, y: -10 } : { opacity: 1, y: 0 }}
      transition={{ duration: leaving ? 0.35 : 0.45, delay: leaving ? 0 : index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, boxShadow: '0 24px 48px rgba(0,0,0,0.10)' }}
      className="bg-white rounded-2xl border border-stone-100 overflow-hidden group flex flex-col">

      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <motion.img whileHover={{ scale: 1.06 }} transition={{ duration: 0.4 }}
          src={item.image} alt={item.name}
          className="w-full h-full object-cover"
          onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
        <div className="hidden w-full h-48 items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-5xl">
          🌿
        </div>

        {/* Remove btn */}
        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}
          onClick={handleRemove}
          className="absolute top-2 right-2 w-8 h-8 bg-white/95 rounded-xl shadow-md flex items-center justify-center text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity text-sm">
          ✕
        </motion.button>

        {discount > 0 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
            {discount}% OFF
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <span className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase">{item.category}</span>
        <h3 className="font-bold text-stone-800 text-sm leading-tight mt-1 mb-2 line-clamp-2">{item.name}</h3>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg font-extrabold text-green-700">₹{item.price}</span>
          {item.mrp > item.price && <span className="text-xs text-stone-400 line-through">₹{item.mrp}</span>}
        </div>
        <div className="mt-auto space-y-2">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleMoveToCart} disabled={moved}
            className={`w-full py-3 rounded-xl text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              moved
                ? 'bg-green-100 text-green-700'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-200/60'
            }`}>
            {moved ? '✓ Added to Cart!' : '🛒 Move to Cart'}
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleRemove}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-stone-500 border-2 border-stone-200 hover:border-red-300 hover:text-red-500 transition-all">
            Remove
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

/* ── MAIN PAGE ────────────────────────────────────────────────────────────── */
export default function WishlistPage() {
  const { wishlist }  = useWishlist();
  const { addToCart } = useCart();
  const navigate      = useNavigate();

  const addAll = () => {
    wishlist.forEach(item => addToCart(item));
    setTimeout(() => navigate('/cart'), 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white font-sans antialiased">
      <Navbar />
      <div className="pt-20 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <FadeUp className="py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-800">Your Wishlist ❤️</h1>
            <p className="text-stone-400 mt-1 text-sm">
              {wishlist.length > 0 ? `${wishlist.length} item${wishlist.length > 1 ? 's' : ''} saved` : 'Your wishlist is empty'}
            </p>
          </div>
          {wishlist.length > 1 && (
            <motion.button whileHover={{ scale: 1.04, boxShadow: '0 16px 32px rgba(16,185,129,0.25)' }}
              whileTap={{ scale: 0.96 }} onClick={addAll}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-green-200/60">
              🛒 Add All to Cart
            </motion.button>
          )}
        </FadeUp>

        {/* Empty state */}
        {wishlist.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <motion.div animate={{ y: [-8, 8, -8] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="text-7xl mb-6">❤️</motion.div>
            <h2 className="text-2xl font-extrabold text-stone-700 mb-3">Nothing saved yet</h2>
            <p className="text-stone-400 mb-8 max-w-sm text-sm">Tap the ♡ heart on any product to add it here.</p>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link to="/shop"
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-green-200/60 inline-block">
                Explore Products →
              </Link>
            </motion.div>
          </motion.div>
        )}

        {/* Grid */}
        {wishlist.length > 0 && (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {wishlist.map((item, i) => (
                <WishlistCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
