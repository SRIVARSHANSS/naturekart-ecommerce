import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CartPopup = () => {
  const { showCartPopup, popupProduct, closePopup, setLoading } = useCart();
  const navigate = useNavigate();

  const handleGoToCart = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/cart');
      closePopup();
    }, 800);
  };

  return (
    <AnimatePresence>
      {showCartPopup && popupProduct && (
        <motion.div
          initial={{ opacity: 0, x: 100, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 100, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-24 right-6 z-[100] w-80 bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-green-50 flex-shrink-0">
                <img 
                  src={popupProduct.image} 
                  alt={popupProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-green-600 font-bold uppercase tracking-wide">Added to Cart</p>
                <h4 className="text-sm font-bold text-stone-800 mt-1 line-clamp-2">{popupProduct.name}</h4>
                <p className="text-lg font-extrabold text-green-700 mt-1">₹{popupProduct.price}</p>
              </div>
              <button 
                onClick={closePopup}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoToCart}
              className="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-green-200"
            >
              Go to Cart →
            </motion.button>
          </div>
          
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 4 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-green-400 to-emerald-500"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartPopup;