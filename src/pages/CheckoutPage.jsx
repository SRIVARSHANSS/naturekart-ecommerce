import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart }   from '../context/CartContext';
import { useAuth }   from '../context/AuthContext';
import { createRazorpayOrder, verifyPayment } from '../services/api';

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

/* Load Razorpay checkout script dynamically */
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(true); return; }
    const script = document.createElement('script');
    script.id  = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

/* ── Floating Label Input ──────────────────────────────────────────────────── */
const Field = ({ label, name, type = 'text', value, onChange, required, placeholder, textarea }) => (
  <div>
    <label className="block text-sm font-semibold text-stone-700 mb-1">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
    {textarea ? (
      <textarea name={name} value={value} onChange={onChange} required={required} rows={3}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none text-sm" />
    ) : (
      <input type={type} name={name} value={value} onChange={onChange} required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
    )}
  </div>
);

/* ── Main Component ────────────────────────────────────────────────────────── */
const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step,       setStep]       = useState('address');
  const [processing, setProcessing] = useState(false);
  const [error,      setError]      = useState('');

  const [formData, setFormData] = useState({
    name:    user?.name    || '',
    email:   user?.email   || '',
    phone:   user?.phone   || '',
    address: '',
    city:    '',
    state:   '',
    pincode: '',
  });

  const shipping = cartItems.length > 0 ? 49 : 0;
  const total    = cartTotal + shipping;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Razorpay Payment Handler ──────────────────────────────────────────── */
  const handlePayment = async () => {
    if (!RAZORPAY_KEY || RAZORPAY_KEY.includes('PASTE')) {
      setError('⚠️ Razorpay key not configured. Please add VITE_RAZORPAY_KEY_ID to your .env file and restart the dev server.');
      return;
    }
    setError('');
    setProcessing(true);

    try {
      /* 1. Load Razorpay script */
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Razorpay SDK failed to load. Check your internet connection.');

      /* 2. Create order on backend */
      const orderData = await createRazorpayOrder(total);

      /* 3. Open Razorpay popup */
      await new Promise((resolve, reject) => {
        const options = {
          key:         RAZORPAY_KEY,
          amount:      orderData.amount,
          currency:    orderData.currency || 'INR',
          name:        'NatureKart',
          description: 'Organic & Natural Products',
          image:       '/favicon.ico',
          order_id:    orderData.orderId,
          prefill: {
            name:    formData.name,
            email:   formData.email,
            contact: formData.phone,
          },
          notes: { address: formData.address },
          theme: { color: '#10b981' },
          modal: {
            ondismiss: () => {
              setProcessing(false);
              reject(new Error('Payment cancelled'));
            },
          },
          handler: async (response) => {
            try {
              /* 4. Verify on backend and save order */
              const result = await verifyPayment({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                orderData: {
                  items:         cartItems,
                  totalAmount:   total,
                  address:       formData,
                  paymentMethod: 'UPI / Razorpay',
                  userId:        user?._id || null,
                },
              });

              /* 5. Save to localStorage for confirmation page */
              localStorage.setItem('lastOrder', JSON.stringify({
                orderId:          result.orderId,
                items:            cartItems,
                total,
                address:          formData,
                paymentMethod:    result.paymentMethod || 'UPI / Razorpay',
                razorpayOrderId:  response.razorpay_order_id,
                razorpayPaymentId:response.razorpay_payment_id,
                estimatedDelivery:result.estimatedDelivery,
              }));

              clearCart();
              resolve(result);

              /* 6. Navigate to confirmation */
              navigate('/order-confirmation', {
                state: {
                  orderId:          result.orderId,
                  estimatedDelivery:result.estimatedDelivery,
                  paymentMethod:    result.paymentMethod || 'UPI / Razorpay',
                  razorpayPaymentId:response.razorpay_payment_id,
                },
              });
            } catch (err) {
              reject(err);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp) => {
          setError(`Payment failed: ${resp.error.description}`);
          setProcessing(false);
          reject(new Error(resp.error.description));
        });
        rzp.open();
      });
    } catch (err) {
      if (err.message !== 'Payment cancelled') {
        setError(err.response?.data?.message || err.message || 'Payment failed. Please try again.');
      }
      setProcessing(false);
    }
  };

  /* ── Render ────────────────────────────────────────────────────────────── */
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-stone-50 to-white">
        <span className="text-6xl">🛒</span>
        <h2 className="text-2xl font-extrabold text-stone-700">Your cart is empty</h2>
        <motion.button whileHover={{ scale: 1.04 }} onClick={() => navigate('/shop')}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl">
          Browse Shop
        </motion.button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-stone-100 px-4 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-stone-600 hover:text-green-700 font-semibold transition-colors">
            <span className="text-xl">←</span> Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
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
          {['address', 'payment'].map((s, i) => (
            <div key={s} className="flex items-center">
              <motion.div animate={{ scale: step === s ? 1.1 : 1 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step === s ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-200' :
                  i === 0 && step === 'payment' ? 'bg-green-500 text-white' : 'bg-stone-200 text-stone-500'
                }`}>
                {i === 0 && step === 'payment' ? '✓' : i + 1}
              </motion.div>
              <div className="ml-2 mr-4 hidden sm:block">
                <p className={`text-xs font-bold ${step === s ? 'text-green-700' : 'text-stone-400'}`}>
                  {s === 'address' ? 'Delivery Address' : 'Payment'}
                </p>
              </div>
              {i < 1 && <div className={`w-16 h-1 mr-4 rounded-full transition-all ${step === 'payment' ? 'bg-green-500' : 'bg-stone-200'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── STEP 1: ADDRESS ── */}
          {step === 'address' && (
            <motion.div key="address" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
              className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-extrabold text-stone-800 mb-6">📍 Delivery Address</h2>
              <form onSubmit={handleAddressSubmit} className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full Name"  name="name"  value={formData.name}  onChange={handleChange} required placeholder="Your full name" />
                  <Field label="Phone"      name="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder="10-digit mobile" />
                </div>
                <Field label="Email"   name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="your@email.com" />
                <Field label="Address" name="address" value={formData.address} onChange={handleChange} required placeholder="House no, Street, Area" textarea />
                <div className="grid grid-cols-3 gap-4">
                  <Field label="City"    name="city"    value={formData.city}    onChange={handleChange} required placeholder="City" />
                  <Field label="State"   name="state"   value={formData.state}   onChange={handleChange} required placeholder="State" />
                  <Field label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} required placeholder="6-digit" />
                </div>
                <motion.button whileHover={{ scale: 1.02, boxShadow: '0 16px 32px rgba(16,185,129,0.3)' }} whileTap={{ scale: 0.97 }}
                  type="submit" className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold rounded-xl shadow-xl shadow-green-200 mt-2">
                  Continue to Payment →
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* ── STEP 2: PAYMENT ── */}
          {step === 'payment' && (
            <motion.div key="payment" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-extrabold text-stone-800 mb-6">💳 Payment</h2>

              <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm space-y-6">

                {/* Order Summary */}
                <div className="border-b border-stone-100 pb-5">
                  <h3 className="font-bold text-stone-700 mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm max-h-40 overflow-y-auto pr-1">
                    {cartItems.map(item => (
                      <div key={item.productId || item._id || item.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                          <span className="text-stone-600 line-clamp-1">{item.name} × {item.quantity}</span>
                        </div>
                        <span className="font-semibold text-stone-800 ml-2">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-stone-500 pt-3 text-sm">
                    <span>Shipping</span><span>₹{shipping}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-lg text-stone-800 pt-2 border-t border-stone-100 mt-2">
                    <span>Total</span>
                    <span className="text-green-700">₹{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-stone-50 rounded-xl p-4 text-sm flex items-start gap-3">
                  <span className="text-xl mt-0.5">📍</span>
                  <div>
                    <p className="font-bold text-stone-800">{formData.name}</p>
                    <p className="text-stone-500">{formData.address}</p>
                    <p className="text-stone-500">{formData.city}, {formData.state} — {formData.pincode}</p>
                    <p className="text-stone-500">📞 {formData.phone}</p>
                  </div>
                  <button onClick={() => setStep('address')} className="ml-auto text-emerald-600 text-xs font-bold hover:text-emerald-700">Edit</button>
                </div>

                {/* Payment Options Banner */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-emerald-200 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow flex items-center justify-center">
                      <span className="text-xl">💳</span>
                    </div>
                    <div>
                      <p className="font-bold text-stone-800 text-sm">Pay via Razorpay</p>
                      <p className="text-xs text-stone-500">Google Pay · PhonePe · UPI · Cards · Net Banking</p>
                    </div>
                    <span className="ml-auto w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { icon: '🟢', label: 'Google Pay' },
                      { icon: '🔵', label: 'PhonePe' },
                      { icon: '🟠', label: 'UPI' },
                      { icon: '💳', label: 'Cards' },
                      { icon: '🏦', label: 'Net Banking' },
                    ].map(({ icon, label }) => (
                      <span key={label} className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-stone-600 shadow-sm border border-stone-100 flex items-center gap-1">
                        {icon} {label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm font-medium">
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pay Button */}
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(16,185,129,0.35)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold text-lg rounded-2xl shadow-xl shadow-green-200 flex items-center justify-center gap-3 disabled:opacity-70 transition-all">
                  {processing ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="block w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />
                      Initializing Payment…
                    </>
                  ) : (
                    <><span>🔒</span> Pay ₹{total.toLocaleString()} Securely</>
                  )}
                </motion.button>

                {/* Security note */}
                <div className="flex items-center justify-center gap-2 text-xs text-stone-400">
                  <span>🔒</span>
                  <span>256-bit SSL secured · Powered by Razorpay</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CheckoutPage;