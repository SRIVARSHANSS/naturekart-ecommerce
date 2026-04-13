import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem('lastOrder');
    if (data) {
      setOrderData(JSON.parse(data));
    }
  }, []);

  const { orderId, estimatedDelivery } = location.state || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white font-sans flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full mx-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center"
        >
          <span className="text-5xl">✓</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <h1 className="text-3xl font-extrabold text-stone-800 mb-2">Order Placed Successfully!</h1>
          <p className="text-stone-500 mb-8">Thank you for shopping with NatureKart 🌿</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm mb-6"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-stone-100">
              <span className="text-stone-500">Order ID</span>
              <span className="font-bold text-stone-800">{orderId || orderData?.orderId || 'N/A'}</span>
            </div>
            
            {orderData?.items && (
              <div>
                <span className="text-stone-500 text-sm">Items</span>
                <div className="mt-2 space-y-2">
                  {orderData.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-stone-600">{item.name} x {item.quantity}</span>
                      <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {orderData?.total && (
              <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                <span className="text-stone-500">Total Paid</span>
                <span className="text-2xl font-extrabold text-green-700">₹{orderData.total.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-stone-100">
              <span className="text-stone-500">Estimated Delivery</span>
              <span className="font-bold text-green-600">{estimatedDelivery || orderData?.estimatedDelivery || '5-7 days'}</span>
            </div>
          </div>
        </motion.div>

        {orderData?.address && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl border border-stone-100 p-4 shadow-sm mb-6"
          >
            <h3 className="font-bold text-stone-800 text-sm mb-2">Shipping Address</h3>
            <p className="text-stone-600 text-sm">{orderData.address.name}</p>
            <p className="text-stone-500 text-sm">{orderData.address.address}</p>
            <p className="text-stone-500 text-sm">{orderData.address.city}, {orderData.address.state} - {orderData.address.pincode}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold rounded-xl shadow-xl shadow-green-200"
          >
            Continue Shopping
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/cart')}
            className="flex-1 py-4 bg-stone-800 text-white font-extrabold rounded-xl"
          >
            View Order
          </motion.button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-stone-400 text-sm mt-6"
        >
          A confirmation email has been sent to your registered email address.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default OrderConfirmation;