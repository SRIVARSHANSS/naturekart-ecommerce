import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar.jsx';

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

const CartPage = () => {
  const { cartItems, cartTotal, updateQuantity, removeFromCart, setLoading } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/checkout');
    }, 800);
  };

  const handleContinueShopping = () => navigate('/shop');

  const shipping = cartTotal > 299 ? 0 : 49;
  const total = cartTotal + shipping;

  return (
    <div className="min-h-screen bg-bg text-[#F5F0E8] font-sans antialiased">
      <Navbar />

      {/* Hero strip */}
      <div className="relative border-b border-gold/10 bg-bigbox overflow-hidden">
        <LeafDecor />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 pt-28">
          <p className="text-gold/60 text-xs tracking-[0.3em] uppercase font-sans mb-2 italic">
            — Your Selection
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-[#F5F0E8] tracking-tight leading-none">
            Shopping Bag
          </h1>
          {cartItems.length > 0 && (
            <p className="mt-2 text-sm text-[#F5F0E8]/40 font-sans">
              {cartItems.length} item{cartItems.length > 1 ? 's' : ''} in your curation
            </p>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ── Empty State ── */}
        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-28 relative"
          >
            <div className="relative inline-block mb-8">
              <div className="w-28 h-28 rounded-sm border border-gold/20 bg-bigbox flex items-center justify-center mx-auto">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-30">
                  <path d="M6 6h4l6 24h20l4-16H14" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="20" cy="36" r="2" stroke="#C9A84C" strokeWidth="1.5"/>
                  <circle cx="32" cy="36" r="2" stroke="#C9A84C" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 border border-gold/40 bg-bg" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border border-gold/40 bg-bg" />
            </div>
            <h3 className="font-serif text-2xl text-[#F5F0E8] mb-3">Your bag is empty</h3>
            <p className="text-[#F5F0E8]/40 text-sm mb-10 max-w-xs mx-auto leading-relaxed">
              Explore our botanical apothecary collection and add formulations to your personal curation.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleContinueShopping}
              className="px-10 py-3.5 bg-gold hover:bg-gold/90 text-bg font-sans font-bold text-xs tracking-[0.2em] uppercase rounded-sm transition-all duration-300 shimmer-btn-glow"
            >
              Explore Collection
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-10">

            {/* ── Cart Items ── */}
            <div className="lg:col-span-2 space-y-0">
              {/* Header row */}
              <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 pb-3 border-b border-gold/10 text-[10px] tracking-[0.2em] uppercase text-[#F5F0E8]/30 font-sans">
                <span>Product</span>
                <span className="text-center w-24">Qty</span>
                <span className="text-right w-20">Total</span>
              </div>

              <AnimatePresence mode="popLayout">
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.productId || item.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -60, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.04 }}
                    className="group relative grid sm:grid-cols-[1fr_auto_auto] gap-4 items-center py-6 border-b border-gold/10 hover:border-gold/20 transition-all duration-300"
                  >
                    {/* Product info */}
                    <div className="flex gap-4 items-start">
                      {/* Image */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-surface border border-gold/10 overflow-hidden relative">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gold/20">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                              <path d="M16 4 C8 4 4 10 4 16 C4 22 8 28 16 28 C24 28 28 22 28 16" stroke="#C9A84C" strokeWidth="1" strokeLinecap="round"/>
                              <path d="M16 8 L16 24 M10 16 L22 16" stroke="#C9A84C" strokeWidth="0.8" strokeLinecap="round"/>
                            </svg>
                          </div>
                        )}
                        {/* corner accents */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold/30" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold/30" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-base text-[#F5F0E8] leading-snug line-clamp-2 mb-1">
                          {item.name}
                        </p>
                        <p className="text-gold text-sm font-sans font-medium">
                          ₹{Number(item.price).toLocaleString()}
                        </p>
                        {/* Mobile qty + remove */}
                        <div className="flex items-center gap-4 mt-3 sm:hidden">
                          <div className="flex items-center border border-gold/20 bg-surface">
                            <button
                              onClick={() => updateQuantity(item.productId || item.id, (item.quantity || 1) - 1)}
                              className="w-7 h-7 flex items-center justify-center text-[#F5F0E8]/60 hover:text-gold hover:bg-gold/5 transition-colors text-sm"
                            >−</button>
                            <span className="w-7 h-7 flex items-center justify-center text-[#F5F0E8] text-xs font-medium border-x border-gold/10">
                              {item.quantity || 1}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId || item.id, (item.quantity || 1) + 1)}
                              className="w-7 h-7 flex items-center justify-center text-[#F5F0E8]/60 hover:text-gold hover:bg-gold/5 transition-colors text-sm"
                            >+</button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.productId || item.id)}
                            className="text-[#F5F0E8]/30 hover:text-red-400/70 text-xs tracking-wider uppercase transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Qty (desktop) */}
                    <div className="hidden sm:flex items-center gap-0 border border-gold/20 bg-surface w-24">
                      <button
                        onClick={() => updateQuantity(item.productId || item.id, (item.quantity || 1) - 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#F5F0E8]/50 hover:text-gold hover:bg-gold/5 transition-colors"
                      >−</button>
                      <span className="flex-1 h-8 flex items-center justify-center text-[#F5F0E8] text-xs font-medium border-x border-gold/10">
                        {item.quantity || 1}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId || item.id, (item.quantity || 1) + 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#F5F0E8]/50 hover:text-gold hover:bg-gold/5 transition-colors"
                      >+</button>
                    </div>

                    {/* Price + remove (desktop) */}
                    <div className="hidden sm:flex flex-col items-end w-20 gap-2">
                      <p className="text-[#F5F0E8] font-sans font-medium text-sm">
                        ₹{(item.price * (item.quantity || 1)).toLocaleString()}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.productId || item.id)}
                        className="text-[#F5F0E8]/20 hover:text-red-400/60 text-xs transition-colors"
                        title="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <motion.button
                whileHover={{ x: -4 }}
                onClick={handleContinueShopping}
                className="mt-6 flex items-center gap-2 text-gold/60 hover:text-gold text-xs tracking-[0.15em] uppercase transition-colors font-sans"
              >
                <span>←</span> Continue Shopping
              </motion.button>
            </div>

            {/* ── Order Summary ── */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-bigbox border border-gold/15 p-6 sticky top-28 relative overflow-hidden"
              >
                {/* corner accents */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/40" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/40" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold/40" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/40" />

                <p className="text-[10px] tracking-[0.3em] uppercase text-gold/50 font-sans mb-5">
                  — Order Summary
                </p>
                <h2 className="font-serif text-xl text-[#F5F0E8] mb-6">Your Receipt</h2>

                <div className="space-y-3 text-sm border-b border-gold/10 pb-4 mb-4">
                  <div className="flex justify-between">
                    <span className="text-[#F5F0E8]/50">
                      Subtotal ({cartItems.length} item{cartItems.length > 1 ? 's' : ''})
                    </span>
                    <span className="text-[#F5F0E8] font-medium">₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#F5F0E8]/50">Shipping</span>
                    <span className={shipping === 0 ? 'text-gold font-medium' : 'text-[#F5F0E8] font-medium'}>
                      {shipping === 0 ? 'Complimentary' : `₹${shipping}`}
                    </span>
                  </div>
                  {cartTotal < 299 && (
                    <p className="text-[10px] text-gold/50 border border-gold/10 px-3 py-2 bg-gold/3 tracking-wide">
                      Add ₹{299 - cartTotal} more for complimentary shipping
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-baseline mb-8">
                  <span className="font-serif text-base text-[#F5F0E8]">Total</span>
                  <span className="font-serif text-2xl text-gold">₹{total.toLocaleString()}</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className="w-full py-4 bg-gold hover:bg-gold/90 text-bg font-sans font-bold text-xs tracking-[0.2em] uppercase transition-all duration-300 shimmer-btn-glow relative overflow-hidden"
                >
                  Proceed to Checkout
                  <span className="ml-2">→</span>
                </motion.button>

                {/* Security note */}
                <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-[#F5F0E8]/20 tracking-wider">
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                    <path d="M5 1L1 3v4c0 2 2 3.5 4 4 2-.5 4-2 4-4V3L5 1z" stroke="currentColor" strokeWidth="0.8"/>
                  </svg>
                  <span>Secured by Razorpay · SSL Encrypted</span>
                </div>

                {/* Gold divider */}
                <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;