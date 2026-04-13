import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CartPage = ({ onNavigate }) => {
  const { cartItems, cartTotal, updateQuantity, removeFromCart, setLoading } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/checkout');
    }, 800);
  };

  const handleContinueShopping = () => {
    navigate('/shop');
  };

  const shipping = cartTotal > 299 ? 0 : 49;
  const total = cartTotal + shipping;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-stone-100 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-stone-600 hover:text-green-700">
            <span className="text-xl">←</span>
            <span className="font-semibold">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <span className="text-white text-base">🌿</span>
            </div>
            <span className="text-lg font-bold text-green-800">Nature<span className="text-emerald-500">Kart</span></span>
          </div>
          <div className="w-16" />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold text-stone-800 mb-8"
        >
          Shopping Cart
        </motion.h1>

        {cartItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-bold text-stone-700 mb-2">Your cart is empty</h3>
            <p className="text-stone-400 mb-6">Looks like you haven't added any products yet</p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleContinueShopping}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl shadow-lg"
            >
              Start Shopping
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="popLayout">
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.productId || item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white rounded-2xl border border-stone-100 p-4 flex gap-4 shadow-sm"
                  >
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-green-50 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-stone-800 text-sm line-clamp-2">{item.name}</h3>
                      <p className="text-lg font-extrabold text-green-700 mt-1">₹{item.price}</p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
                          <button 
                            onClick={() => updateQuantity(item.productId || item.id, (item.quantity || 1) - 1)}
                            className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-50"
                          >
                            −
                          </button>
                          <span className="w-8 h-8 flex items-center justify-center font-bold text-stone-800">
                            {item.quantity || 1}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.productId || item.id, (item.quantity || 1) + 1)}
                            className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-50"
                          >
                            +
                          </button>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => removeFromCart(item.productId || item.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-semibold"
                        >
                          Remove
                        </motion.button>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-stone-800">
                        ₹{(item.price * (item.quantity || 1)).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <motion.button
                whileHover={{ x: -5 }}
                onClick={handleContinueShopping}
                className="flex items-center gap-2 text-green-600 font-semibold mt-4"
              >
                ← Continue Shopping
              </motion.button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm sticky top-24"
              >
                <h2 className="text-xl font-extrabold text-stone-800 mb-6">Order Summary</h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Subtotal ({cartItems.length} items)</span>
                    <span className="font-semibold text-stone-800">₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Shipping</span>
                    <span className="font-semibold text-stone-800">
                      {shipping === 0 ? <span className="text-green-600">FREE</span> : `₹${shipping}`}
                    </span>
                  </div>
                  {cartTotal < 299 && (
                    <p className="text-xs text-green-600 bg-green-50 p-2 rounded-lg">
                      Add ₹{299 - cartTotal} more for free shipping!
                    </p>
                  )}
                  <div className="border-t border-stone-100 pt-3 flex justify-between">
                    <span className="font-bold text-stone-800">Total</span>
                    <span className="text-2xl font-extrabold text-green-700">₹{total.toLocaleString()}</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold rounded-xl shadow-xl shadow-green-200"
                >
                  Proceed to Checkout →
                </motion.button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-stone-400">
                  <span>🔒</span>
                  <span>Secure checkout powered by Razorpay</span>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;