import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CheckoutPage = () => {
  const { cartItems, cartTotal, setLoading, clearCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState('address');
  const [processing, setProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      const orderId = 'NK' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 5);
      const formattedDate = deliveryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      
      localStorage.setItem('lastOrder', JSON.stringify({
        orderId,
        items: cartItems,
        total: cartTotal + 49,
        address: formData,
        estimatedDelivery: formattedDate
      }));
      
      clearCart();
      setProcessing(false);
      navigate('/order-confirmation', { 
        state: { 
          orderId,
          estimatedDelivery: formattedDate 
        } 
      });
    }, 2000);
  };

  const shipping = 49;
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
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10">
          {['address', 'payment', 'confirm'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                step === s 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                  : ['address', 'payment', 'confirm'].indexOf(step) > i
                    ? 'bg-green-500 text-white'
                    : 'bg-stone-200 text-stone-500'
              }`}>
                {['address', 'payment', 'confirm'].indexOf(step) > i ? '✓' : i + 1}
              </div>
              {i < 2 && (
                <div className={`w-16 h-1 ${['address', 'payment', 'confirm'].indexOf(step) > i ? 'bg-green-500' : 'bg-stone-200'}`} />
              )}
            </div>
          ))}
        </div>

        {step === 'address' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-2xl font-extrabold text-stone-800 mb-6">Shipping Address</h2>
            
            <form onSubmit={handleAddressSubmit} className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Enter your full address"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="State"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Enter pincode"
                />
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold rounded-xl shadow-xl shadow-green-200"
              >
                Continue to Payment →
              </motion.button>
            </form>
          </motion.div>
        )}

        {step === 'payment' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-2xl font-extrabold text-stone-800 mb-6">Payment Method</h2>
            
            <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm space-y-6">
              {/* Order Summary */}
              <div className="border-b border-stone-100 pb-4">
                <h3 className="font-bold text-stone-700 mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  {cartItems.map(item => (
                    <div key={item.productId || item.id} className="flex justify-between">
                      <span className="text-stone-500">{item.name} x {item.quantity}</span>
                      <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-stone-500 pt-2">
                    <span>Shipping</span>
                    <span>₹{shipping}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-stone-800 pt-2 border-t border-stone-100">
                    <span>Total</span>
                    <span className="text-green-700">₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-bold text-stone-700 mb-2">Shipping To</h3>
                <div className="bg-stone-50 rounded-xl p-4 text-sm">
                  <p className="font-semibold text-stone-800">{formData.name}</p>
                  <p className="text-stone-500">{formData.address}</p>
                  <p className="text-stone-500">{formData.city}, {formData.state} - {formData.pincode}</p>
                  <p className="text-stone-500 mt-1">📞 {formData.phone}</p>
                </div>
              </div>

              {/* Razorpay Option */}
              <div className="border-2 border-green-500 rounded-xl p-4 bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-2xl">💳</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-stone-800">Razorpay</p>
                    <p className="text-xs text-stone-500">Secure payment via Razorpay</p>
                  </div>
                  <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePayment}
                disabled={processing}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold rounded-xl shadow-xl shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {processing ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                    Processing...
                  </>
                ) : (
                  <>Pay Now ₹{total.toLocaleString()}</>
                )}
              </motion.button>

              <div className="flex items-center justify-center gap-2 text-xs text-stone-400">
                <span>🔒</span>
                <span>Your payment is secured with 256-bit SSL encryption</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;