import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function OrderConfirmation() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  useEffect(() => {
    if (!state?.orderId) navigate('/shop');
  }, [state, navigate]);

  if (!state?.orderId) return null;

  const {
    orderId, invoiceNumber, estimatedDelivery, paymentMethod,
    totalAmount, deliveryType, items = [], address = {},
  } = state;

  const etaStr = estimatedDelivery
    ? new Date(estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '5–7 business days';

  const deliveryBadge = {
    'Standard': { icon: '📦', color: 'bg-stone-100 text-stone-600' },
    'One-Day':  { icon: '⚡', color: 'bg-amber-100 text-amber-700' },
    'Same-Day': { icon: '🚀', color: 'bg-blue-100 text-blue-700' },
  }[deliveryType] || { icon: '📦', color: 'bg-stone-100 text-stone-600' };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white font-sans">
      <nav className="bg-white border-b border-stone-100 px-4 py-4 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
            <span className="text-white">🌿</span>
          </div>
          <span className="text-lg font-bold text-green-800">Nature<span className="text-emerald-500">Kart</span></span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Success animation */}
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center mb-10">
          <div className="relative inline-block">
            <motion.div
              animate={{ scale: [1, 1.08, 1], boxShadow: ['0 0 0 0 rgba(16,185,129,0)', '0 0 0 24px rgba(16,185,129,0.12)', '0 0 0 0 rgba(16,185,129,0)'] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-300/50">
              <span className="text-5xl">✅</span>
            </motion.div>
          </div>
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-3xl font-black text-stone-800 mt-6">Order Placed Successfully!</motion.h1>
          <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-stone-500 mt-2">
            Thank you for your order. A confirmation has been sent to <strong>{address.email}</strong>
          </motion.p>
        </motion.div>

        {/* Order details card */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl border border-stone-100 shadow-xl p-6 mb-6">

          {/* Order ID + Invoice */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-stone-100">
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1">Order ID</p>
              <p className="text-2xl font-black text-green-700 font-mono">{orderId}</p>
              {invoiceNumber && <p className="text-xs text-stone-400 mt-0.5">{invoiceNumber}</p>}
            </div>
            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm ${deliveryBadge.color}`}>
              <span>{deliveryBadge.icon}</span> {deliveryType} Delivery
            </div>
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div className="py-5 border-b border-stone-100">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-3">Items Ordered</p>
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item._id || item.id} className="flex justify-between text-sm">
                    <span className="text-stone-600">{item.name} <span className="text-stone-400">×{item.quantity}</span></span>
                    <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery + Payment info */}
          <div className="grid sm:grid-cols-2 gap-5 pt-5">
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">📅 Estimated Delivery</p>
              <p className="font-bold text-stone-800">{etaStr}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">💳 Payment</p>
              <p className="font-bold text-stone-800">{paymentMethod || 'Razorpay'}</p>
              <p className="text-green-600 font-extrabold text-lg">₹{(totalAmount || 0).toLocaleString()}</p>
            </div>
            {address.name && (
              <div className="sm:col-span-2">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">📍 Delivering to</p>
                <p className="text-sm font-semibold text-stone-700">{address.name}</p>
                <p className="text-sm text-stone-500">{address.address}, {address.city}, {address.state} — {address.pincode}</p>
                <p className="text-sm text-stone-500">{address.phone}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-3">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/order-tracking/${orderId}`)}
            className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold rounded-2xl shadow-xl shadow-green-200/60 flex items-center justify-center gap-2">
            📦 Track My Order
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/profile')}
            className="flex-1 py-4 bg-stone-100 text-stone-700 font-bold rounded-2xl hover:bg-stone-200 transition-colors flex items-center justify-center gap-2">
            👤 View All Orders
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/shop')}
            className="flex-1 py-4 bg-stone-100 text-stone-700 font-bold rounded-2xl hover:bg-stone-200 transition-colors flex items-center justify-center gap-2">
            🛍️ Continue Shopping
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}