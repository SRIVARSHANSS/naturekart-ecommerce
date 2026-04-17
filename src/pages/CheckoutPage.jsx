import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { useCart }  from '../context/CartContext';
import { useAuth }  from '../context/AuthContext';
import { saveUpiOrder } from '../services/api';

const MERCHANT_UPI  = import.meta.env.VITE_MERCHANT_UPI_ID  || 'naturekart@upi';
const MERCHANT_NAME = import.meta.env.VITE_MERCHANT_NAME     || 'NatureKart';

/* ── Build UPI Deep Link ── */
const buildUpiLink = (amount, orderId, note = '') =>
  `upi://pay?pa=${encodeURIComponent(MERCHANT_UPI)}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note || 'NatureKart Order ' + orderId)}`;

/* ── Floating Label Input ── */
const Field = ({ label, name, type = 'text', value, onChange, required, placeholder, textarea }) => (
  <div>
    <label className="block text-xs font-bold text-stone-500 mb-1 uppercase tracking-wide">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {textarea ? (
      <textarea name={name} value={value} onChange={onChange} required={required} rows={3}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none text-sm bg-stone-50 focus:bg-white transition-all" />
    ) : (
      <input type={type} name={name} value={value} onChange={onChange} required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm bg-stone-50 focus:bg-white transition-all" />
    )}
  </div>
);

/* ── Main ── */
export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step,       setStep]       = useState('address');   // 'address' | 'pay' | 'confirm'
  const [saving,     setSaving]     = useState(false);
  const [utrNumber,  setUtrNumber]  = useState('');
  const [error,      setError]      = useState('');
  const [orderId,    setOrderId]    = useState('');
  const [isMobile,   setIsMobile]   = useState(false);

  const shipping   = cartItems.length > 0 ? 49 : 0;
  const total      = cartTotal + shipping;

  const [formData, setFormData] = useState({
    name:    user?.name  || '',
    email:   user?.email || '',
    phone:   '',
    address: '',
    city:    '',
    state:   '',
    pincode: '',
  });

  /* Detect mobile for UPI intent vs QR */
  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  /* Generate a temp order ID for QR note */
  useEffect(() => {
    if (step === 'pay') {
      setOrderId('NK' + Date.now().toString().slice(-8));
    }
  }, [step]);

  const upiLink = buildUpiLink(total, orderId);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setStep('pay');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* Open Google Pay intent on mobile */
  const openGooglePay = () => {
    window.location.href = upiLink;
  };

  /* Confirm payment and save order */
  const handleConfirmPayment = async () => {
    setSaving(true);
    setError('');
    try {
      const result = await saveUpiOrder({
        orderData: {
          items:       cartItems,
          totalAmount: total,
          address:     formData,
          userId:      user?._id || null,
        },
        utrNumber: utrNumber.trim(),
      });

      localStorage.setItem('lastOrder', JSON.stringify({
        orderId:          result.orderId,
        items:            cartItems,
        total,
        address:          formData,
        paymentMethod:    'Google Pay / UPI',
        utrNumber:        utrNumber.trim(),
        estimatedDelivery:result.estimatedDelivery,
      }));

      clearCart();
      navigate('/order-confirmation', {
        state: {
          orderId:          result.orderId,
          estimatedDelivery:result.estimatedDelivery,
          paymentMethod:    'Google Pay / UPI',
          utrNumber:        utrNumber.trim(),
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save order. Try again.');
      setSaving(false);
    }
  };

  /* ── Empty cart guard ── */
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
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => step === 'address' ? navigate(-1) : setStep('address')}
            className="flex items-center gap-2 text-stone-600 hover:text-green-700 font-semibold transition-colors">
            <span className="text-xl">←</span> {step === 'address' ? 'Back' : 'Edit Address'}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
              <span className="text-white">🌿</span>
            </div>
            <span className="text-lg font-bold text-green-800">Nature<span className="text-emerald-500">Kart</span></span>
          </div>
          <div className="w-20" />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[
            { key: 'address', label: 'Address', icon: '📍' },
            { key: 'pay',     label: 'Pay',     icon: '💸' },
          ].map(({ key, label, icon }, i) => (
            <div key={key} className="flex items-center gap-2">
              <motion.div animate={{ scale: step === key ? 1.1 : 1 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step === key ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-200' :
                  step === 'pay' && i === 0 ? 'bg-green-500 text-white' : 'bg-stone-100 text-stone-400'
                }`}>
                {step === 'pay' && i === 0 ? '✓' : icon}
              </motion.div>
              <span className={`hidden sm:block text-sm font-bold ${step === key ? 'text-green-700' : 'text-stone-400'}`}>{label}</span>
              {i < 1 && <div className={`w-10 h-1 rounded-full transition-all mx-1 ${step === 'pay' ? 'bg-green-400' : 'bg-stone-200'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ══ STEP 1: ADDRESS ══════════════════════════════════════════ */}
          {step === 'address' && (
            <motion.div key="address" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
              className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-extrabold text-stone-800 mb-6">📍 Delivery Address</h2>
              <form onSubmit={handleAddressSubmit} className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full Name" name="name"  value={formData.name}  onChange={handleChange} required placeholder="Your full name" />
                  <Field label="Phone"     name="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder="10-digit mobile" />
                </div>
                <Field label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="your@email.com" />
                <Field label="Full Address" name="address" value={formData.address} onChange={handleChange} required placeholder="House no, Street, Landmark, Area" textarea />
                <div className="grid grid-cols-3 gap-3">
                  <Field label="City"    name="city"    value={formData.city}    onChange={handleChange} required placeholder="City" />
                  <Field label="State"   name="state"   value={formData.state}   onChange={handleChange} required placeholder="State" />
                  <Field label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} required placeholder="6-digit" />
                </div>

                {/* Order total preview */}
                <div className="bg-stone-50 rounded-xl p-4 flex justify-between items-center">
                  <span className="text-stone-500 font-medium text-sm">{cartItems.length} item{cartItems.length > 1 ? 's' : ''} + ₹{shipping} shipping</span>
                  <span className="font-extrabold text-green-700 text-lg">₹{total.toLocaleString()}</span>
                </div>

                <motion.button whileHover={{ scale: 1.02, boxShadow: '0 16px 32px rgba(16,185,129,0.3)' }} whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold text-base rounded-xl shadow-xl shadow-green-200">
                  Continue to Pay →
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* ══ STEP 2: GOOGLE PAY ═══════════════════════════════════════ */}
          {step === 'pay' && (
            <motion.div key="pay" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="max-w-2xl mx-auto">

              {/* Amount pill */}
              <div className="text-center mb-6">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-green-200 font-extrabold text-xl">
                  <span>💰</span>
                  <span>Pay ₹{total.toLocaleString()}</span>
                </motion.div>
              </div>

              <div className="bg-white rounded-3xl border border-stone-100 shadow-xl overflow-hidden">

                {/* Google Pay Header */}
                <div className="bg-gradient-to-r from-[#1a73e8] to-[#4285f4] px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow flex items-center justify-center">
                      {/* Google Pay G logo */}
                      <svg viewBox="0 0 24 24" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-white font-black text-xl">Google Pay</h2>
                      <p className="text-blue-100 text-xs">Fast, secure UPI payment</p>
                    </div>
                    <div className="ml-auto bg-white/20 px-3 py-1 rounded-full">
                      <span className="text-white text-xs font-bold">🔒 Secure</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">

                  {/* QR Code section */}
                  <div className="text-center">
                    <p className="text-sm font-bold text-stone-600 mb-4">
                      {isMobile ? '👆 Tap the button below to pay with Google Pay' : '📱 Scan QR code with Google Pay or any UPI app'}
                    </p>

                    {!isMobile && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="inline-block p-4 bg-white border-2 border-stone-100 rounded-2xl shadow-lg">
                        <QRCode value={upiLink} size={180} fgColor="#1a73e8" />
                        <p className="text-xs text-stone-400 mt-2">Scan with Google Pay / PhonePe / Any UPI</p>
                      </motion.div>
                    )}
                  </div>

                  {/* UPI ID display */}
                  <div className="bg-stone-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-stone-400 font-medium mb-1">Paying to UPI ID</p>
                    <p className="font-extrabold text-stone-800 text-base tracking-wide">{MERCHANT_UPI}</p>
                    <p className="text-xs text-stone-500 mt-1">{MERCHANT_NAME}</p>
                  </div>

                  {/* Mobile: Open Google Pay button */}
                  {isMobile && (
                    <motion.a href={upiLink}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-[#1a73e8] hover:bg-[#1558b0] text-white font-extrabold text-lg rounded-2xl shadow-lg shadow-blue-200 transition-all">
                      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      </svg>
                      Open Google Pay
                    </motion.a>
                  )}

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-stone-100" />
                    <span className="text-xs text-stone-400 font-medium">After paying, confirm below</span>
                    <div className="flex-1 h-px bg-stone-100" />
                  </div>

                  {/* UTR Input */}
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1 uppercase tracking-wide">
                      Transaction / UTR Number <span className="text-stone-300">(optional)</span>
                    </label>
                    <input
                      value={utrNumber}
                      onChange={e => setUtrNumber(e.target.value)}
                      placeholder="e.g. 123456789012 (12-digit UPI ref)"
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm bg-stone-50 focus:bg-white transition-all"
                    />
                    <p className="text-xs text-stone-400 mt-1">Find this in Google Pay → Transaction History</p>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm font-medium">
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Confirm Payment Button */}
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(16,185,129,0.3)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleConfirmPayment}
                    disabled={saving}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-70">
                    {saving ? (
                      <>
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          className="block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                        Confirming…
                      </>
                    ) : (
                      <><span>✅</span> I Have Paid — Place Order</>
                    )}
                  </motion.button>

                  <p className="text-center text-xs text-stone-400">
                    🔒 Your order will be placed after payment confirmation
                  </p>
                </div>
              </div>

              {/* Order summary mini */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="mt-4 bg-white rounded-2xl border border-stone-100 p-4 shadow-sm">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-3">Order Summary</p>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {cartItems.map(item => (
                    <div key={item._id || item.id} className="flex justify-between text-sm">
                      <span className="text-stone-600 line-clamp-1">{item.name} × {item.quantity}</span>
                      <span className="font-semibold ml-2">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-extrabold text-stone-800 border-t border-stone-100 mt-3 pt-3">
                  <span>Total</span>
                  <span className="text-green-700">₹{total.toLocaleString()}</span>
                </div>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}