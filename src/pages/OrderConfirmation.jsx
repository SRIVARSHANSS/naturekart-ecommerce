import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

/* ── Confetti-style floating emojis ── */
const Confetti = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    {['🌿','✨','🎉','🌱','💚','⭐','🍃'].map((e, i) => (
      <motion.div key={i}
        initial={{ y: -20, x: `${10 + i * 13}vw`, opacity: 0, rotate: 0 }}
        animate={{ y: '110vh', opacity: [0, 1, 1, 0], rotate: 360 * (i % 2 === 0 ? 1 : -1) }}
        transition={{ duration: 3 + i * 0.4, delay: i * 0.2, ease: 'linear' }}
        className="absolute text-2xl"
      >
        {e}
      </motion.div>
    ))}
  </div>
);

const OrderConfirmation = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [showConf,  setShowConf]  = useState(true);

  useEffect(() => {
    const data = localStorage.getItem('lastOrder');
    if (data) setOrderData(JSON.parse(data));
    const timer = setTimeout(() => setShowConf(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const {
    orderId, estimatedDelivery, paymentMethod, razorpayPaymentId,
  } = location.state || {};

  const displayOrder   = orderId          || orderData?.orderId          || 'N/A';
  const displayDate    = estimatedDelivery|| orderData?.estimatedDelivery|| '5–7 Business Days';
  const displayMethod  = paymentMethod    || orderData?.paymentMethod    || 'UPI / Razorpay';
  const displayPayId   = razorpayPaymentId|| orderData?.razorpayPaymentId|| '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50 to-white font-sans relative flex items-center justify-center px-4 py-10">
      <AnimatePresence>{showConf && <Confetti />}</AnimatePresence>

      <motion.div initial={{ opacity: 0, scale: 0.92, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-lg w-full">

        {/* Success icon */}
        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-300/50">
          <span className="text-6xl">✅</span>
        </motion.div>

        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-stone-800 mb-2">Order Placed! 🎉</h1>
          <p className="text-stone-500">Thank you for shopping with <span className="font-bold text-green-700">NatureKart 🌿</span></p>
        </motion.div>

        {/* Order Details Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl border border-stone-100 shadow-xl p-6 mb-4 space-y-4">

          {/* Order ID */}
          <div className="flex justify-between items-center pb-4 border-b border-stone-100">
            <span className="text-stone-500 text-sm">Order ID</span>
            <span className="font-extrabold text-stone-800 text-sm font-mono">{displayOrder}</span>
          </div>

          {/* Payment Method */}
          <div className="flex justify-between items-center">
            <span className="text-stone-500 text-sm">Payment</span>
            <span className="flex items-center gap-1.5 font-bold text-emerald-700 text-sm">
              <span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-xs">✓</span>
              {displayMethod}
            </span>
          </div>

          {/* Payment ID */}
          {displayPayId && (
            <div className="flex justify-between items-center">
              <span className="text-stone-500 text-sm">Payment Ref</span>
              <span className="font-mono text-xs text-stone-600 bg-stone-50 px-2 py-1 rounded-lg">{displayPayId}</span>
            </div>
          )}

          {/* Items */}
          {orderData?.items && (
            <div className="border-t border-stone-100 pt-4">
              <p className="text-stone-500 text-xs font-bold uppercase tracking-wide mb-2">Items Ordered</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {orderData.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-stone-600 line-clamp-1">{item.name} × {item.quantity}</span>
                    <span className="font-semibold text-stone-800 ml-2">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          {orderData?.total && (
            <div className="flex justify-between items-center pt-3 border-t border-stone-100">
              <span className="text-stone-500 font-semibold">Total Paid</span>
              <span className="text-2xl font-black text-green-700">₹{orderData.total.toLocaleString()}</span>
            </div>
          )}

          {/* Delivery */}
          <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚚</span>
              <div>
                <p className="text-xs text-stone-500 font-medium">Estimated Delivery</p>
                <p className="font-extrabold text-emerald-700 text-sm">{displayDate}</p>
              </div>
            </div>
            <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full font-bold">On Track</span>
          </div>
        </motion.div>

        {/* Address */}
        {orderData?.address && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl border border-stone-100 p-4 shadow-sm mb-5 text-sm">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">📍 Shipping To</p>
            <p className="font-bold text-stone-800">{orderData.address.name}</p>
            <p className="text-stone-500">{orderData.address.address}</p>
            <p className="text-stone-500">{orderData.address.city}, {orderData.address.state} — {orderData.address.pincode}</p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="flex gap-3">
          <motion.button whileHover={{ scale: 1.03, boxShadow: '0 16px 32px rgba(16,185,129,0.3)' }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/')}
            className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold rounded-2xl shadow-xl shadow-green-200">
            🛍️ Continue Shopping
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/order-tracking')}
            className="flex-1 py-4 bg-stone-800 hover:bg-stone-700 text-white font-extrabold rounded-2xl transition-colors">
            Track Order →
          </motion.button>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="text-center text-stone-400 text-xs mt-5">
          📧 A confirmation has been sent to <strong>{orderData?.address?.email || 'your email'}</strong>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default OrderConfirmation;