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

/* ── Dark luxury field component ── */
const Field = ({ label, name, type = 'text', value, onChange, error, placeholder, textarea, required }) => (
  <div>
    <label className="block text-[10px] font-sans font-medium text-[#F5F0E8]/40 mb-1.5 uppercase tracking-[0.2em]">
      {label}{required && <span className="text-gold/60 ml-1">*</span>}
    </label>
    {textarea ? (
      <textarea name={name} value={value} onChange={onChange} rows={3} placeholder={placeholder}
        className={`w-full px-4 py-3 bg-surface-light border text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 font-sans
          focus:outline-none resize-none transition-all duration-200
          ${error
            ? 'border-red-500/50 focus:border-red-400/70'
            : 'border-gold/15 focus:border-gold/50 hover:border-gold/25'}`}
      />
    ) : (
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
        className={`w-full px-4 py-3 bg-surface-light border text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 font-sans
          focus:outline-none transition-all duration-200
          ${error
            ? 'border-red-500/50 focus:border-red-400/70'
            : 'border-gold/15 focus:border-gold/50 hover:border-gold/25'}`}
      />
    )}
    {error && <p className="text-red-400/80 text-xs mt-1.5 font-sans">{error}</p>}
  </div>
);

/* ── Step indicator ── */
const StepBar = ({ step }) => {
  const steps = [
    { key: 'address',  label: 'Address',  num: 1 },
    { key: 'delivery', label: 'Delivery', num: 2 },
    { key: 'payment',  label: 'Payment',  num: 3 },
  ];
  const idx = steps.findIndex(s => s.key === step);
  return (
    <div className="flex items-center justify-center gap-0 mb-12">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div className="flex flex-col items-center gap-2">
            <motion.div
              animate={{ scale: i === idx ? 1.05 : 1 }}
              className={`w-9 h-9 flex items-center justify-center font-serif text-sm border transition-all duration-300
                ${i < idx
                  ? 'border-gold bg-gold text-bg'
                  : i === idx
                  ? 'border-gold bg-transparent text-gold shadow-[0_0_16px_rgba(201,168,76,0.2)]'
                  : 'border-gold/15 bg-transparent text-[#F5F0E8]/20'}`}
            >
              {i < idx ? '✓' : s.num}
            </motion.div>
            <span className={`text-[10px] tracking-[0.15em] uppercase font-sans hidden sm:block
              ${i === idx ? 'text-gold' : i < idx ? 'text-gold/50' : 'text-[#F5F0E8]/20'}`}>
              {s.label}
            </span>
          </div>
          {i < 2 && (
            <div className={`w-20 h-px mx-3 mt-[-18px] transition-all duration-500
              ${i < idx ? 'bg-gold/40' : 'bg-gold/10'}`}
            />
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
          { id: 'Standard', label: 'Standard Delivery', description: '5–7 business days', cost: 0, costLabel: 'Complimentary', icon: '◈' },
          { id: 'One-Day',  label: 'Express Delivery',  description: 'Arrives tomorrow',  cost: 50,  costLabel: '+₹50',  icon: '◆' },
          { id: 'Same-Day', label: 'Same-Day Courier',  description: 'Today by 8 PM',     cost: 150, costLabel: '+₹150', icon: '◉' },
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
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Enter your full name';
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) errs.phone = 'Valid 10-digit mobile required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required';
    if (!form.address.trim() || form.address.trim().length < 10) errs.address = 'Please enter a complete address';
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

      const orderData = await createRazorpayOrder({
        amount:   total,
        currency: 'INR',
        notes:    { customerName: form.name, customerEmail: form.email },
      });

      const { keyId } = await getRazorpayKey();

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
        theme: { color: '#C9A84C' },
        handler: async function (response) {
          try {
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-bg text-[#F5F0E8]">
        <div className="w-20 h-20 border border-gold/20 flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M4 4h4l5 18h16l3-12H10" stroke="#C9A84C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="15" cy="29" r="2" stroke="#C9A84C" strokeWidth="1.2"/>
            <circle cx="25" cy="29" r="2" stroke="#C9A84C" strokeWidth="1.2"/>
          </svg>
        </div>
        <h2 className="font-serif text-2xl">Your cart is empty</h2>
        <motion.button whileHover={{ scale: 1.03 }} onClick={() => navigate('/shop')}
          className="px-8 py-3 bg-gold text-bg font-sans font-bold text-xs tracking-[0.2em] uppercase">
          Browse Collection
        </motion.button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-[#F5F0E8] font-sans antialiased">
      {/* Minimal checkout nav */}
      <nav className="bg-bg border-b border-gold/10 px-6 py-5 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => step === 'address' ? navigate(-1) : setStep(step === 'payment' ? 'delivery' : 'address')}
            className="flex items-center gap-2 text-[#F5F0E8]/40 hover:text-gold transition-colors text-xs tracking-[0.15em] uppercase"
          >
            <span>←</span>
            <span className="hidden sm:block">
              {step === 'address' ? 'Back' : step === 'delivery' ? 'Edit Address' : 'Change Delivery'}
            </span>
          </button>

          {/* Wordmark */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border border-gold/40 flex items-center justify-center">
              <span className="text-gold text-xs">✦</span>
            </div>
            <span className="font-serif text-lg tracking-wide text-[#F5F0E8]">
              Nature<span className="text-gold">Kart</span>
            </span>
          </div>

          <div className="w-20" />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <StepBar step={step} />

        <div className="grid lg:grid-cols-[1fr_320px] gap-8">

          {/* ── Left: Steps ── */}
          <AnimatePresence mode="wait">

            {/* STEP 1: ADDRESS */}
            {step === 'address' && (
              <motion.div key="address" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                <div className="mb-6">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-gold/50 mb-1">Step 01</p>
                  <h2 className="font-serif text-2xl text-[#F5F0E8]">Delivery Address</h2>
                </div>
                <form onSubmit={handleAddressNext} className="bg-bigbox border border-gold/10 p-6 space-y-5 relative">
                  {/* corner accents */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/30 pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/30 pointer-events-none" />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Full Name" name="name" value={form.name} onChange={handleChange} required placeholder="Your full name" error={fieldErrors.name} />
                    <Field label="Mobile" name="phone" type="tel" value={form.phone} onChange={handleChange} required placeholder="10-digit number" error={fieldErrors.phone} />
                  </div>
                  <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="your@email.com" error={fieldErrors.email} />
                  <Field label="Full Address" name="address" value={form.address} onChange={handleChange} required placeholder="House no, Street, Landmark, Area" textarea error={fieldErrors.address} />
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="City"    name="city"    value={form.city}    onChange={handleChange} required placeholder="City"    error={fieldErrors.city} />
                    <Field label="State"   name="state"   value={form.state}   onChange={handleChange} required placeholder="State"   error={fieldErrors.state} />
                    <Field label="Pincode" name="pincode" value={form.pincode} onChange={handleChange} required placeholder="6-digit" error={fieldErrors.pincode} />
                  </div>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit"
                    className="w-full py-4 bg-gold hover:bg-gold/90 text-bg font-bold text-xs tracking-[0.2em] uppercase transition-all shimmer-btn-glow">
                    Continue to Delivery →
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* STEP 2: DELIVERY */}
            {step === 'delivery' && (
              <motion.div key="delivery" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                <div className="mb-6">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-gold/50 mb-1">Step 02</p>
                  <h2 className="font-serif text-2xl text-[#F5F0E8]">Choose Delivery</h2>
                </div>
                <div className="space-y-3">
                  {deliveryOptions.map(opt => (
                    <motion.button key={opt.id} whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.998 }}
                      onClick={() => setSelectedDelivery(opt)}
                      className={`w-full text-left p-5 border transition-all duration-200 relative
                        ${selectedDelivery?.id === opt.id
                          ? 'border-gold/60 bg-gold/5 shadow-[0_0_20px_rgba(201,168,76,0.08)]'
                          : 'border-gold/10 bg-bigbox hover:border-gold/25'}`}
                    >
                      {/* selected indicator corner */}
                      {selectedDelivery?.id === opt.id && (
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-gold" />
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-gold font-serif text-lg">{opt.icon}</span>
                          <div>
                            <p className="font-sans font-medium text-[#F5F0E8] text-sm">{opt.label}</p>
                            <p className="text-xs text-[#F5F0E8]/40 mt-0.5">{opt.description}</p>
                            {opt.eta && <p className="text-xs text-gold/60 mt-1">{opt.eta}</p>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4 flex flex-col items-end gap-2">
                          <span className={`font-serif text-base ${opt.cost === 0 ? 'text-gold' : 'text-[#F5F0E8]'}`}>
                            {opt.costLabel}
                          </span>
                          <div className={`w-4 h-4 border flex items-center justify-center transition-all
                            ${selectedDelivery?.id === opt.id ? 'border-gold bg-gold' : 'border-gold/20'}`}>
                            {selectedDelivery?.id === opt.id && <span className="text-bg text-[8px]">✓</span>}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={handleDeliveryNext} disabled={!selectedDelivery}
                  className="w-full mt-5 py-4 bg-gold hover:bg-gold/90 text-bg font-bold text-xs tracking-[0.2em] uppercase transition-all shimmer-btn-glow disabled:opacity-40">
                  Continue to Payment →
                </motion.button>
              </motion.div>
            )}

            {/* STEP 3: PAYMENT */}
            {step === 'payment' && (
              <motion.div key="payment" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                <div className="mb-6">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-gold/50 mb-1">Step 03</p>
                  <h2 className="font-serif text-2xl text-[#F5F0E8]">Secure Payment</h2>
                </div>
                <div className="bg-bigbox border border-gold/10 p-6 relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/30 pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/30 pointer-events-none" />

                  {/* Payment methods */}
                  <div className="border border-gold/15 p-4 mb-6 bg-surface-light">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gold/10 border border-gold/20 flex items-center justify-center">
                        <span className="text-gold font-serif text-sm font-bold">R</span>
                      </div>
                      <div>
                        <p className="font-sans font-semibold text-[#F5F0E8] text-sm">Razorpay</p>
                        <p className="text-[#F5F0E8]/30 text-[10px]">India's trusted payment gateway</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1 text-[10px] text-gold/50 border border-gold/15 px-2 py-1">
                        <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
                          <path d="M4 1L1 2.5v4c0 1.5 1.5 2.5 3 3 1.5-.5 3-1.5 3-3v-4L4 1z" stroke="currentColor" strokeWidth="0.8"/>
                        </svg>
                        256-bit SSL
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {['Cards', 'UPI', 'Netbanking', 'Wallets'].map(m => (
                        <div key={m} className="border border-gold/10 py-1.5 text-center text-[10px] text-[#F5F0E8]/40 tracking-wider">
                          {m}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Items in payment step */}
                  <div className="border-t border-gold/10 pt-4 mb-5 space-y-2">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-gold/40 mb-3">Paying for</p>
                    {cartItems.map(item => (
                      <div key={item._id || item.id} className="flex justify-between text-xs text-[#F5F0E8]/60">
                        <span>{item.name} × {item.quantity}</span>
                        <span className="text-[#F5F0E8]/80">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    {shippingCost > 0 && (
                      <div className="flex justify-between text-xs text-[#F5F0E8]/60 border-t border-gold/10 pt-2 mt-2">
                        <span>{selectedDelivery?.label}</span>
                        <span>+₹{shippingCost}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-serif text-base text-[#F5F0E8] border-t border-gold/10 pt-3">
                      <span>Total</span>
                      <span className="text-gold">₹{total.toLocaleString()}</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="border border-red-500/30 bg-red-500/5 text-red-400/80 p-3 text-xs mb-4">
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.01, boxShadow: '0 8px 32px rgba(201,168,76,0.25)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePayNow}
                    disabled={processing}
                    className="w-full py-4 bg-gold hover:bg-gold/90 text-bg font-bold text-sm tracking-[0.15em] uppercase flex items-center justify-center gap-3 disabled:opacity-60 shimmer-btn-glow transition-all">
                    {processing ? (
                      <>
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          className="block w-4 h-4 border border-bg/30 border-t-bg rounded-full" />
                        Connecting to Gateway…
                      </>
                    ) : (
                      <>
                        <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                          <path d="M6 1L1 3.5v5c0 2.5 2 4 5 4.5 3-.5 5-2 5-4.5v-5L6 1z" stroke="currentColor" strokeWidth="1.2"/>
                        </svg>
                        Pay ₹{total.toLocaleString()} Securely
                      </>
                    )}
                  </motion.button>
                  <p className="text-center text-[10px] text-[#F5F0E8]/20 mt-3 tracking-wider">
                    Secured by Razorpay — UPI · Cards · Net Banking · Wallets
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Right: Order Summary ── */}
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-bigbox border border-gold/10 p-5 sticky top-28 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold/30 pointer-events-none" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-gold/30 pointer-events-none" />

              <p className="text-[10px] tracking-[0.25em] uppercase text-gold/40 mb-4">Order Summary</p>

              {/* Items */}
              <div className="space-y-3 max-h-52 overflow-y-auto pr-1 mb-4">
                {cartItems.map(item => (
                  <div key={item._id || item.id} className="flex gap-3 items-start">
                    <div className="w-11 h-11 bg-surface-light border border-gold/10 flex-shrink-0 overflow-hidden">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gold/20 text-xs">✦</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#F5F0E8]/80 line-clamp-2 leading-snug">{item.name}</p>
                      <p className="text-[10px] text-[#F5F0E8]/30 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs text-[#F5F0E8]/70 flex-shrink-0">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gold/10 pt-4 space-y-2 text-xs text-[#F5F0E8]/50">
                <div className="flex justify-between">
                  <span>Subtotal ({cartItems.length} item{cartItems.length > 1 ? 's' : ''})</span>
                  <span className="text-[#F5F0E8]/70">₹{subtotal.toLocaleString()}</span>
                </div>
                {step !== 'address' && (
                  <div className="flex justify-between">
                    <span>Shipping ({selectedDelivery?.id})</span>
                    <span className={shippingCost === 0 ? 'text-gold' : 'text-[#F5F0E8]/70'}>
                      {shippingCost === 0 ? 'Complimentary' : `₹${shippingCost}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-serif text-sm text-[#F5F0E8] border-t border-gold/10 pt-3">
                  <span>Total</span>
                  <span className="text-gold">₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Address preview */}
              {step !== 'address' && form.name && (
                <div className="mt-4 p-3 border border-gold/10 bg-surface-light">
                  <p className="text-[10px] tracking-[0.15em] uppercase text-gold/40 mb-1.5">Delivering to</p>
                  <p className="text-xs text-[#F5F0E8]/70">{form.name}</p>
                  <p className="text-[10px] text-[#F5F0E8]/40 mt-0.5">{form.address}, {form.city}, {form.state} — {form.pincode}</p>
                  <p className="text-[10px] text-[#F5F0E8]/40">{form.phone}</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}