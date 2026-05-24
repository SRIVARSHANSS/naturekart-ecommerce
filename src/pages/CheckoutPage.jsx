import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  getDeliveryOptions,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayKey,
} from '../services/api';

/* ── Load Razorpay SDK ── */
const loadRazorpay = () =>
  new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

/* ── Field component ── */
const Field = ({ label, name, type = 'text', value, onChange, error, placeholder, textarea, required }) => (
  <div>
    <label className="block text-xs font-bold text-stone-500 mb-1 uppercase tracking-wide">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {textarea ? (
      <textarea name={name} value={value} onChange={onChange} rows={3} placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border text-sm bg-stone-50 focus:bg-white transition-all resize-none focus:outline-none focus:ring-2 ${error ? 'border-red-300 focus:ring-red-300' : 'border-stone-200 focus:ring-green-400'}`} />
    ) : (
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border text-sm bg-stone-50 focus:bg-white transition-all focus:outline-none focus:ring-2 ${error ? 'border-red-300 focus:ring-red-300' : 'border-stone-200 focus:ring-green-400'}`} />
    )}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

/* ── Step indicator ── */
const StepBar = ({ step }) => {
  const steps = [
    { key: 'address',  label: 'Address',  icon: '📍', num: 1 },
    { key: 'delivery', label: 'Delivery', icon: '🚚', num: 2 },
    { key: 'payment',  label: 'Payment',  icon: '💳', num: 3 },
  ];
  const idx = steps.findIndex(s => s.key === step);
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <motion.div animate={{ scale: i === idx ? 1.1 : 1 }}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow transition-all
                ${i < idx  ? 'bg-green-500 text-white' :
                  i === idx ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-200' :
                               'bg-stone-100 text-stone-400'}`}>
              {i < idx ? '✓' : s.icon}
            </motion.div>
            <span className={`text-xs font-bold hidden sm:block ${i === idx ? 'text-green-700' : i < idx ? 'text-green-500' : 'text-stone-400'}`}>
              {s.label}
            </span>
          </div>
          {i < 2 && (
            <div className={`w-16 h-1 mx-2 rounded-full transition-all mt-[-14px] ${i < idx ? 'bg-green-400' : 'bg-stone-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Main Checkout ── */
export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]               = useState('address');
  const [fieldErrors, setFieldErrors] = useState({});
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [processing, setProcessing]   = useState(false);
  const [error, setError]             = useState('');

  const [form, setForm] = useState({
    name:    user?.name  || '',
    email:   user?.email || '',
    phone:   user?.phone || user?.mobile || '',
    address: '',
    city:    '',
    state:   '',
    pincode: '',
  });

  /* Pre-fill saved address */
  useEffect(() => {
    if (user?.addresses?.length > 0) {
      const def = user.addresses.find(a => a.isDefault) || user.addresses[0];
      if (def) {
        const parts = (def.address || '').split(',');
        setForm(f => ({
          ...f,
          address: parts[0]?.trim() || def.address || '',
          city:    parts[1]?.trim() || '',
          state:   parts[2]?.trim() || '',
          pincode: def.pincode || '',
        }));
      }
    }
  }, [user]);

  /* Fetch delivery options when moving to delivery step */
  useEffect(() => {
    if (step === 'delivery') {
      getDeliveryOptions().then(data => {
        setDeliveryOptions(data.options || []);
        setSelectedDelivery(data.options?.[0] || null);
      }).catch(() => {
        setDeliveryOptions([
          { id: 'Standard', label: 'Standard Delivery', description: '5-7 days', cost: 0, costLabel: 'FREE', icon: '📦' },
          { id: 'One-Day',  label: 'One-Day Delivery',  description: 'Tomorrow', cost: 50, costLabel: '+₹50', icon: '⚡' },
          { id: 'Same-Day', label: 'Same-Day Delivery', description: 'Today by 8PM', cost: 150, costLabel: '+₹150', icon: '🚀' },
        ]);
        setSelectedDelivery({ id: 'Standard', cost: 0 });
      });
    }
  }, [step]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  /* ── Step 1: Validate address ── */
  const handleAddressNext = e => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Enter full name';
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) errs.phone = 'Valid 10-digit mobile required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required';
    if (!form.address.trim() || form.address.trim().length < 10) errs.address = 'Enter complete address';
    if (!form.city.trim()) errs.city = 'City required';
    if (!form.state.trim()) errs.state = 'State required';
    if (!/^\d{6}$/.test(form.pincode.trim())) errs.pincode = 'Valid 6-digit pincode required';
    setFieldErrors(errs);
    if (Object.keys(errs).length === 0) {
      setStep('delivery');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /* ── Step 2: Select delivery ── */
  const handleDeliveryNext = () => {
    if (!selectedDelivery) return;
    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const shippingCost = selectedDelivery?.cost || 0;
  const subtotal     = cartTotal;
  const total        = subtotal + shippingCost;

  /* ── Step 3: Razorpay payment ── */
  const handlePayNow = useCallback(async () => {
    setProcessing(true);
    setError('');
    try {
      const sdkLoaded = await loadRazorpay();
      if (!sdkLoaded) throw new Error('Failed to load payment gateway. Check internet connection.');

      /* Create Razorpay order on backend */
      const orderData = await createRazorpayOrder({
        amount:   total,
        currency: 'INR',
        notes:    { customerName: form.name, customerEmail: form.email },
      });

      /* Get key */
      const { keyId } = await getRazorpayKey();

      /* Open Razorpay modal */
      const options = {
        key:         keyId,
        amount:      orderData.amount,
        currency:    orderData.currency,
        name:        'NatureKart',
        description: `Order of ${cartItems.length} item(s)`,
        image:       'https://naturekart.in/logo.png',
        order_id:    orderData.razorpayOrderId,
        prefill: {
          name:    form.name,
          email:   form.email,
          contact: form.phone,
        },
        theme: { color: '#059669' },
        handler: async function (response) {
          try {
            /* Verify payment on backend — creates order in DB */
            const result = await verifyRazorpayPayment({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              orderData: {
                items:        cartItems,
                address:      form,
                deliveryType: selectedDelivery.id,
                shippingCost,
                subtotal,
                totalAmount:  total,
                userId:       user?.id || user?._id || null,
              },
            });

            clearCart();
            navigate('/order-confirmation', {
              state: {
                orderId:           result.orderId,
                invoiceNumber:     result.invoiceNumber,
                estimatedDelivery: result.estimatedDelivery,
                paymentMethod:     result.paymentMethod,
                totalAmount:       result.totalAmount,
                deliveryType:      selectedDelivery.id,
                items:             cartItems,
                address:           form,
              },
            });
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.message || 'Payment verification failed. Contact support.');
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            setError('Payment cancelled. Your cart is safe — try again when ready.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setError(`Payment failed: ${response.error.description}`);
        setProcessing(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  }, [total, form, cartItems, selectedDelivery, shippingCost, subtotal, user, clearCart, navigate]);

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
          <button onClick={() => step === 'address' ? navigate(-1) : setStep(step === 'payment' ? 'delivery' : 'address')}
            className="flex items-center gap-2 text-stone-600 hover:text-green-700 font-semibold transition-colors">
            <span className="text-xl">←</span>
            <span className="hidden sm:block">{step === 'address' ? 'Back' : step === 'delivery' ? 'Edit Address' : 'Change Delivery'}</span>
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
        <StepBar step={step} />

        <div className="grid lg:grid-cols-[1fr_340px] gap-6">

          {/* ── Left: Steps ── */}
          <AnimatePresence mode="wait">

            {/* STEP 1: ADDRESS */}
            {step === 'address' && (
              <motion.div key="address" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h2 className="text-2xl font-extrabold text-stone-800 mb-5">📍 Delivery Address</h2>
                <form onSubmit={handleAddressNext} className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Full Name" name="name" value={form.name} onChange={handleChange} required placeholder="Your full name" error={fieldErrors.name} />
                    <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required placeholder="10-digit mobile" error={fieldErrors.phone} />
                  </div>
                  <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="your@email.com" error={fieldErrors.email} />
                  <Field label="Full Address" name="address" value={form.address} onChange={handleChange} required placeholder="House no, Street, Landmark, Area" textarea error={fieldErrors.address} />
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="City"    name="city"    value={form.city}    onChange={handleChange} required placeholder="City"    error={fieldErrors.city} />
                    <Field label="State"   name="state"   value={form.state}   onChange={handleChange} required placeholder="State"   error={fieldErrors.state} />
                    <Field label="Pincode" name="pincode" value={form.pincode} onChange={handleChange} required placeholder="6-digit" error={fieldErrors.pincode} />
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit"
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold text-base rounded-xl shadow-xl shadow-green-200">
                    Continue to Delivery →
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* STEP 2: DELIVERY */}
            {step === 'delivery' && (
              <motion.div key="delivery" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h2 className="text-2xl font-extrabold text-stone-800 mb-5">🚚 Choose Delivery</h2>
                <div className="space-y-3">
                  {deliveryOptions.map(opt => (
                    <motion.button key={opt.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedDelivery(opt)}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all shadow-sm ${
                        selectedDelivery?.id === opt.id
                          ? 'border-green-500 bg-green-50 shadow-green-100'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{opt.icon}</span>
                          <div>
                            <p className="font-bold text-stone-800">{opt.label}</p>
                            <p className="text-sm text-stone-500 mt-0.5">{opt.description}</p>
                            {opt.eta && <p className="text-xs text-green-600 font-semibold mt-1">📅 {opt.eta}</p>}
                            {opt.note && <p className="text-xs text-amber-600 mt-1">⚠️ {opt.note}</p>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <span className={`font-extrabold text-lg ${opt.cost === 0 ? 'text-green-600' : 'text-stone-700'}`}>
                            {opt.costLabel}
                          </span>
                          <div className={`w-5 h-5 rounded-full border-2 mt-2 ml-auto flex items-center justify-center ${
                            selectedDelivery?.id === opt.id ? 'border-green-500 bg-green-500' : 'border-stone-300'
                          }`}>
                            {selectedDelivery?.id === opt.id && <span className="text-white text-xs">✓</span>}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleDeliveryNext} disabled={!selectedDelivery}
                  className="w-full mt-5 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold text-base rounded-xl shadow-xl shadow-green-200 disabled:opacity-60">
                  Continue to Payment →
                </motion.button>
              </motion.div>
            )}

            {/* STEP 3: PAYMENT */}
            {step === 'payment' && (
              <motion.div key="payment" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h2 className="text-2xl font-extrabold text-stone-800 mb-5">💳 Secure Payment</h2>
                <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
                  {/* Razorpay branding */}
                  <div className="bg-gradient-to-r from-[#3395FF] to-[#0064E0] rounded-xl p-5 mb-6 text-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                        <span className="text-[#3395FF] font-black text-lg">R</span>
                      </div>
                      <div>
                        <p className="font-black text-lg">Razorpay</p>
                        <p className="text-blue-200 text-xs">India's most trusted payment gateway</p>
                      </div>
                      <div className="ml-auto bg-white/20 px-3 py-1 rounded-full">
                        <span className="text-xs font-bold">🔒 256-bit SSL</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {['💳 Cards', '📱 UPI', '🏦 Netbanking', '👛 Wallets'].map(m => (
                        <div key={m} className="bg-white/15 rounded-lg py-2 px-1 text-center text-xs font-semibold">{m}</div>
                      ))}
                    </div>
                  </div>

                  {/* Order summary in payment step */}
                  <div className="bg-stone-50 rounded-xl p-4 mb-5 space-y-2">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">Paying for</p>
                    {cartItems.map(item => (
                      <div key={item._id || item.id} className="flex justify-between text-sm">
                        <span className="text-stone-600 truncate mr-2">{item.name} × {item.quantity}</span>
                        <span className="font-semibold flex-shrink-0">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    {shippingCost > 0 && (
                      <div className="flex justify-between text-sm border-t border-stone-200 pt-2 mt-2">
                        <span className="text-stone-500">{selectedDelivery?.label}</span>
                        <span className="text-stone-600">+₹{shippingCost}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-extrabold text-stone-800 border-t border-stone-200 pt-2">
                      <span>Total</span>
                      <span className="text-green-700">₹{total.toLocaleString()}</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm font-medium mb-4">
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(16,185,129,0.3)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handlePayNow}
                    disabled={processing}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold text-lg rounded-2xl shadow-xl shadow-green-200 flex items-center justify-center gap-3 disabled:opacity-70">
                    {processing ? (
                      <>
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          className="block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                        Opening Payment…
                      </>
                    ) : (
                      <><span>🔒</span> Pay ₹{total.toLocaleString()} Securely</>
                    )}
                  </motion.button>
                  <p className="text-center text-xs text-stone-400 mt-3">
                    🛡️ Secured by Razorpay — Supports UPI, Cards, Net Banking & Wallets
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Right: Order Summary ── */}
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm sticky top-24">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-4">Order Summary</p>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cartItems.map(item => (
                  <div key={item._id || item.id} className="flex gap-3 items-start">
                    <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                      {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" /> : '🌿'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-700 line-clamp-2">{item.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-stone-800 flex-shrink-0">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-stone-100 mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-stone-500">
                  <span>Subtotal ({cartItems.length} item{cartItems.length > 1 ? 's' : ''})</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                {step !== 'address' && (
                  <div className="flex justify-between text-sm text-stone-500">
                    <span>Shipping ({selectedDelivery?.id})</span>
                    <span className={shippingCost === 0 ? 'text-green-600 font-semibold' : ''}>{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-stone-800 border-t border-stone-100 pt-2">
                  <span>Total</span>
                  <span className="text-green-700 text-lg">₹{total.toLocaleString()}</span>
                </div>
              </div>
              {/* Delivery address preview */}
              {step !== 'address' && form.name && (
                <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-xs font-bold text-green-700 mb-1">📍 Delivering to</p>
                  <p className="text-xs text-stone-600">{form.name}</p>
                  <p className="text-xs text-stone-500">{form.address}, {form.city}, {form.state} - {form.pincode}</p>
                  <p className="text-xs text-stone-500">{form.phone}</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}