import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

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

/* ── Leaf SVG decoration ── */
const LeafDecor = () => (
  <svg className="absolute opacity-5 pointer-events-none" width="320" height="320"
    viewBox="0 0 320 320" fill="none" aria-hidden="true">
    <path d="M160 10 C80 10 10 80 10 160 C10 240 80 310 160 310 C240 310 310 240 310 160 C310 80 240 10 160 10Z"
      stroke="#C9A84C" strokeWidth="1" fill="none"/>
    <path d="M160 40 C100 40 40 100 40 160 C40 220 100 280 160 280 C220 280 280 220 280 160 C280 100 220 40 160 40Z"
      stroke="#C9A84C" strokeWidth="0.5" fill="none"/>
    <line x1="160" y1="10" x2="160" y2="310" stroke="#C9A84C" strokeWidth="0.5"/>
    <line x1="10" y1="160" x2="310" y2="160" stroke="#C9A84C" strokeWidth="0.5"/>
  </svg>
);

const tagColors = {
  Bestseller: "bg-surface-light text-gold border border-gold/25",
  New:        "bg-surface-light text-gold border border-gold/25",
  "Top Rated":"bg-surface-light text-gold border border-gold/25",
  Premium:    "bg-surface-light text-gold border border-gold/25",
  Sale:       "bg-surface-light text-gold border border-gold/25",
};

/* ── Wishlist Card ────────────────────────────────────────────────────────── */
const WishlistCard = ({ item, index }) => {
  const { removeFromWishlist } = useWishlist();
  const { addToCart }          = useCart();
  const [moved, setMoved]      = useState(false);
  const [leaving, setLeaving]  = useState(false);
  const itemId = item._id || item.id;

  const discount = item.mrp && item.mrp > item.price
    ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;

  const handleMoveToCart = () => {
    addToCart(item);
    setMoved(true);
    setTimeout(() => {
      setLeaving(true);
      setTimeout(() => removeFromWishlist(itemId), 380);
    }, 900);
  };

  const handleRemove = () => {
    setLeaving(true);
    setTimeout(() => removeFromWishlist(itemId), 380);
  };

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 20 }}
      animate={leaving ? { opacity: 0, scale: 0.9, y: -10 } : { opacity: 1, y: 0 }}
      transition={{ duration: leaving ? 0.35 : 0.45, delay: leaving ? 0 : index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ 
        y: -6, 
        scale: 1.02,
        borderColor: "rgba(201, 168, 76, 0.6)",
        boxShadow: "0 8px 40px rgba(201,168,76,0.15)"
      }}
      className="relative bg-bigbox rounded-[2px] border border-gold/10 overflow-hidden group flex flex-col justify-between h-[420px]">

      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-bg border-b border-gold/10">
        <motion.img whileHover={{ scale: 1.08 }} transition={{ duration: 0.4, ease: "easeOut" }}
          src={item.image} alt={item.name}
          className="w-full h-full object-cover"
          onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
        <div className="hidden w-full h-full flex-col items-center justify-center bg-surface-light text-gold">
          <span className="text-4xl">🌿</span>
          <span className="text-[10px] mt-1 opacity-60 font-semibold tracking-wider uppercase">{item.name}</span>
        </div>

        {/* Remove btn */}
        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}
          onClick={handleRemove}
          className="absolute top-3 right-3 w-8 h-8 rounded-sm bg-surface-light border border-gold/10 hover:border-gold/30 flex items-center justify-center text-xs shadow-md transition-colors z-10 text-gold-dim hover:text-gold">
          ✕
        </motion.button>

        {discount > 0 && (
          <span className="absolute top-3 left-3 px-2 py-0.5 bg-red-950/40 border border-red-800/30 text-red-300 text-[8px] font-sans font-bold tracking-widest uppercase rounded-sm">
            {discount}% OFF
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <span className="text-[11px] font-accent italic text-gold-dim tracking-wider uppercase block mb-1">
            {item.category || "Organic Formula"}
          </span>
          <h3 className="font-serif font-bold text-gold text-base leading-snug line-clamp-2 hover:text-gold-light transition-colors duration-200">
            {item.name}
          </h3>
        </div>

        <div className="mt-4 pt-3 border-t border-gold/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-sans font-bold text-gold">₹{item.price}</span>
            {item.mrp > item.price && <span className="text-xs font-sans text-gold-dim line-through">₹{item.mrp}</span>}
          </div>
          <div className="space-y-1.5">
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={handleMoveToCart} disabled={moved}
              className={`w-full py-2.5 rounded-[2px] text-[10px] font-sans font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-1.5 ${
                moved
                  ? "bg-forest/20 border border-forest text-green-300"
                  : "bg-gradient-to-r from-gold via-gold-light to-gold text-bg shadow-md shimmer-btn-glow force-text-white"
              }`}>
              {moved ? '✓ Added to Cart!' : '🛒 Move to Cart'}
            </motion.button>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={handleRemove}
              className="w-full py-2 rounded-[2px] text-[10px] font-sans font-bold tracking-widest uppercase bg-surface-light border border-gold/10 hover:border-gold/30 text-gold-dim hover:text-gold transition-all">
              Remove
            </motion.button>
          </div>
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
    <div className="min-h-screen bg-bg text-[#F5F0E8] font-sans antialiased">
      <Navbar />

      {/* Hero strip */}
      <div className="relative border-b border-gold/10 bg-bigbox overflow-hidden">
        <LeafDecor />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 pt-28">
          <p className="text-gold/60 text-xs tracking-[0.3em] uppercase font-sans mb-2 italic">
            — Personal Curation
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-[#F5F0E8] tracking-tight leading-none">
            Saved Formulations
          </h1>
          {wishlist.length > 0 && (
            <p className="mt-2 text-sm text-[#F5F0E8]/40 font-sans">
              {wishlist.length} remedy{wishlist.length > 1 ? 's' : ''} in your wishlist
            </p>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header Actions */}
        {wishlist.length > 0 && (
          <FadeUp className="pb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gold/10 mb-10">
            <div>
              <h2 className="text-xl font-serif font-bold text-gold">Curation Management</h2>
              <p className="text-gold-dim/60 text-xs mt-1">Review or move your saved botanical remedies to the bag.</p>
            </div>
            {wishlist.length > 1 && (
              <motion.button whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }} onClick={addAll}
                className="px-6 py-3 bg-gradient-to-r from-gold via-gold-light to-gold text-bg font-sans font-bold text-xs tracking-widest uppercase rounded-[2px] shadow-lg shimmer-btn-glow">
                🛒 Add All to Cart
              </motion.button>
            )}
          </FadeUp>
        )}

        {/* Empty state */}
        {wishlist.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-28 relative">
            <div className="relative inline-block mb-8">
              <div className="w-28 h-28 rounded-sm border border-gold/20 bg-bigbox flex items-center justify-center mx-auto">
                <span className="text-5xl opacity-30 select-none">❤️</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 border border-gold/40 bg-bg" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border border-gold/40 bg-bg" />
            </div>
            <h3 className="font-serif text-2xl text-[#F5F0E8] mb-3">Nothing saved yet</h3>
            <p className="text-[#F5F0E8]/40 text-sm mb-10 max-w-xs mx-auto leading-relaxed">
              Tap the ♡ heart icon on any product to save it to your wishlist curation.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/shop')}
              className="px-10 py-3.5 bg-gold hover:bg-gold/90 text-bg font-sans font-bold text-xs tracking-[0.2em] uppercase rounded-sm transition-all duration-300 shimmer-btn-glow"
            >
              Explore Collection
            </motion.button>
          </motion.div>
        )}

        {/* Grid */}
        {wishlist.length > 0 && (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
              {wishlist.map((item, i) => (
                <WishlistCard key={item._id || item.id} item={item} index={i} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
      <Footer />
    </div>
  );
}
