import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import AdminLayout from './AdminLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const API = 'http://localhost:5001/api';

const ALL_STATUSES = [
  'Placed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery',
  'Delivered', 'Cancelled',
];

const STATUS_STYLE = {
  'Placed':             { bg: 'bg-amber-500/20',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  'Processing':         { bg: 'bg-blue-500/20',    text: 'text-blue-400',    border: 'border-blue-500/30'  },
  'Packed':             { bg: 'bg-purple-500/20',  text: 'text-purple-400',  border: 'border-purple-500/30'},
  'Shipped':            { bg: 'bg-indigo-500/20',  text: 'text-indigo-400',  border: 'border-indigo-500/30'},
  'Out for Delivery':   { bg: 'bg-orange-500/20',  text: 'text-orange-400',  border: 'border-orange-500/30'},
  'Delivered':          { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30'},
  'Cancelled':          { bg: 'bg-red-500/20',     text: 'text-red-400',     border: 'border-red-500/30'  },
  'Return Requested':   { bg: 'bg-rose-500/20',    text: 'text-rose-400',    border: 'border-rose-500/30' },
  'Refund Initiated':   { bg: 'bg-cyan-500/20',    text: 'text-cyan-400',    border: 'border-cyan-500/30' },
  'Refund Completed':   { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30'},
};

/* ── OTP Verification Modal ──────────────────────────────────────────────── */
function OtpModal({ title, subtitle, onSendOtp, onVerify, onClose, sending, verifying }) {
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendError, setSendError] = useState('');
  const [verifyError, setVerifyError] = useState('');

  const handleSend = async () => {
    setSendError('');
    try { await onSendOtp(); setOtpSent(true); }
    catch (e) { setSendError(e.response?.data?.message || e.message || 'Failed to send OTP'); }
  };

  const handleVerify = async () => {
    if (!otp.trim() || otp.length !== 6) { setVerifyError('Enter the 6-digit OTP'); return; }
    setVerifyError('');
    try { await onVerify(otp); onClose(); }
    catch (e) { setVerifyError(e.response?.data?.message || e.message || 'OTP verification failed'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-[#161b22] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-xs text-stone-400 mt-1">{subtitle}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 text-stone-400 hover:text-white flex items-center justify-center">✕</button>
        </div>

        <div className="space-y-4">
          {/* Step 1: Send OTP */}
          <div className={`p-4 rounded-xl border transition-all ${otpSent ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-white/3'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                {otpSent ? '✅' : '1️⃣'} Send OTP to Customer
              </p>
              {otpSent && <span className="text-xs text-emerald-400 font-bold">Sent!</span>}
            </div>
            <p className="text-xs text-stone-400 mb-3">System will email the OTP to the customer's registered Gmail</p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleSend} disabled={sending || otpSent}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {sending ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} className="block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" /> Sending…</> : otpSent ? '✅ OTP Sent' : '📧 Send OTP Email'}
            </motion.button>
            {sendError && <p className="text-red-400 text-xs mt-2">{sendError}</p>}
          </div>

          {/* Step 2: Enter OTP */}
          <div className={`p-4 rounded-xl border transition-all ${!otpSent ? 'border-white/5 opacity-50' : 'border-white/10 bg-white/3'}`}>
            <p className="text-sm font-bold text-white mb-1">2️⃣ Enter OTP from Customer</p>
            <p className="text-xs text-stone-400 mb-3">Ask the customer for the 6-digit OTP they received</p>
            <div className="flex gap-3">
              <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={!otpSent}
                placeholder="Enter 6-digit OTP"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500/60 text-center text-xl font-mono tracking-widest transition-all disabled:opacity-50" />
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handleVerify} disabled={!otpSent || verifying || otp.length !== 6}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm disabled:opacity-50 flex items-center gap-2">
                {verifying ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} className="block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : '✓'}
              </motion.button>
            </div>
            {verifyError && <p className="text-red-400 text-xs mt-2">{verifyError}</p>}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Order Detail Drawer ─────────────────────────────────────────────────── */
function OrderDrawer({ order, onClose, onStatusChange, onSendDeliveryOtp, onVerifyDeliveryOtp, headers }) {
  const [status,      setStatus]      = useState(order.status);
  const [saving,      setSaving]      = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [sending,     setSending]     = useState(false);
  const [verifying,   setVerifying]   = useState(false);

  const st = STATUS_STYLE[status] || STATUS_STYLE['Placed'];

  const handleSave = async () => {
    setSaving(true);
    await onStatusChange(order._id, status);
    setSaving(false);
    onClose();
  };

  const canSendOtp = order.status === 'Out for Delivery';

  return (
    <>
      <AnimatePresence>
        {showOtpModal && (
          <OtpModal
            title="Delivery OTP Verification"
            subtitle={`Order: ${order.orderId} · Customer: ${order.customer?.name}`}
            sending={sending}
            verifying={verifying}
            onClose={() => setShowOtpModal(false)}
            onSendOtp={async () => {
              setSending(true);
              try { await onSendDeliveryOtp(order.orderId); }
              finally { setSending(false); }
            }}
            onVerify={async (otp) => {
              setVerifying(true);
              try { await onVerifyDeliveryOtp(order.orderId, otp); onClose(); }
              finally { setVerifying(false); }
            }}
          />
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
        onClick={e => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="bg-[#161b22] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:w-[480px] max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-[#161b22] z-10">
            <div>
              <h3 className="text-base font-bold text-white">Order Details</h3>
              <p className="text-xs text-stone-500 mt-0.5 font-mono">{order.orderId}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 text-stone-400 hover:text-white flex items-center justify-center">✕</button>
          </div>

          <div className="p-5 space-y-5">
            {/* Payment status */}
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${st.bg} ${st.text} ${st.border}`}>{order.status}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                order.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                order.paymentStatus === 'refunded' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {order.paymentStatus === 'paid' ? '✓ Paid' : order.paymentStatus === 'refunded' ? '↩ Refunded' : '⏳ Pending'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border bg-blue-500/20 text-blue-400 border-blue-500/30`}>
                {order.deliveryType || 'Standard'}
              </span>
            </div>

            {/* Customer Info */}
            <div className="bg-white/3 rounded-xl p-4 border border-white/5">
              <p className="text-xs text-stone-500 font-semibold uppercase tracking-wide mb-3">Customer</p>
              <p className="text-sm font-bold text-white">{order.customer?.name}</p>
              <p className="text-xs text-stone-400 mt-1">{order.customer?.email}</p>
              <p className="text-xs text-stone-400">{order.customer?.phone}</p>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                {order.customer?.address}, {order.customer?.city}, {order.customer?.state} — {order.customer?.pincode}
              </p>
            </div>

            {/* Items */}
            <div>
              <p className="text-xs text-stone-500 font-semibold uppercase tracking-wide mb-3">Items Ordered</p>
              <div className="space-y-2">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/3 rounded-xl p-3 border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-lg flex-shrink-0">🌿</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                      <p className="text-xs text-stone-400">Qty: {item.quantity} · ₹{item.price}/unit</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-400 flex-shrink-0">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
              <div>
                <p className="text-xs text-stone-400">Subtotal + Shipping</p>
                <p className="text-xs text-stone-500">Payment: {order.paymentMethod}</p>
              </div>
              <span className="text-lg font-black text-emerald-400">₹{order.totalAmount?.toLocaleString()}</span>
            </div>

            {/* Delivery OTP button (only for Out for Delivery) */}
            {canSendOtp && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowOtpModal(true)}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                🔐 Verify Delivery with OTP
              </motion.button>
            )}

            {/* Status update */}
            <div>
              <p className="text-xs text-stone-500 font-semibold uppercase tracking-wide mb-2">Update Status</p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_STATUSES.map(s => {
                  const sst = STATUS_STYLE[s];
                  return (
                    <motion.button key={s} whileTap={{ scale: 0.96 }}
                      onClick={() => setStatus(s)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        status === s ? `${sst.bg} ${sst.text} ${sst.border}` : 'bg-white/3 text-stone-500 border-white/5 hover:bg-white/5'
                      }`}>
                      {s}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleSave} disabled={saving || status === order.status}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} className="block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : '✓ Save Status'}
            </motion.button>

            {/* Tracking history */}
            {order.trackingHistory?.length > 0 && (
              <div>
                <p className="text-xs text-stone-500 font-semibold uppercase tracking-wide mb-3">Tracking History</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {[...order.trackingHistory].reverse().map((event, i) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-white">{event.status}</p>
                        <p className="text-stone-500">{event.note}</p>
                        <p className="text-stone-600">{new Date(event.timestamp).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function AdminOrders() {
  const { token } = useAuth();
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selected,     setSelected]     = useState(null);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast,        setToast]        = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchOrders = () =>
    axios.get(`${API}/admin/orders`, { headers }).then(r => setOrders(r.data)).finally(() => setLoading(false));

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (id, status) => {
    await axios.put(`${API}/admin/orders/${id}`, { status }, { headers });
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
    showToast(`Order status updated to "${status}"`);
  };

  const handleSendDeliveryOtp = async (orderId) => {
    await axios.post(`${API}/orders/send-delivery-otp`, { orderId }, { headers });
    showToast('Delivery OTP sent to customer email!');
  };

  const handleVerifyDeliveryOtp = async (orderId, otp) => {
    await axios.post(`${API}/orders/verify-delivery-otp`, { orderId, otp }, { headers });
    await fetchOrders();
    showToast('✅ OTP verified — Order marked as Delivered!');
  };

  const filtered = orders.filter(o =>
    (statusFilter === 'All' || o.status === statusFilter) &&
    (o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
     o.orderId?.toLowerCase().includes(search.toLowerCase()) ||
     o.customer?.email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-[70] bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-xl font-semibold text-sm">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <OrderDrawer
            order={selected}
            headers={headers}
            onClose={() => setSelected(null)}
            onStatusChange={handleStatusChange}
            onSendDeliveryOtp={handleSendDeliveryOtp}
            onVerifyDeliveryOtp={handleVerifyDeliveryOtp}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-black text-white">Manage Orders</h2>
          <p className="text-stone-400 text-sm mt-0.5">{orders.length} total orders</p>
        </div>
        <span className="text-xs text-stone-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
          Click row to view & update
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name, email, order ID…"
          className="flex-1 min-w-[180px] bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500/60 transition-all" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-all">
          <option className="bg-[#1f2937]" value="All">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s} className="bg-[#1f2937]">{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-500">
          <p className="text-4xl mb-3">📑</p>
          <p className="font-semibold text-white">No orders found</p>
          <p className="text-sm mt-1">Try a different filter or seed demo orders from Dashboard.</p>
        </div>
      ) : (
        <div className="bg-[#161b22] border border-white/5 rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1.2fr_1fr_1fr_80px] gap-4 px-4 py-3 border-b border-white/5 text-xs text-stone-500 font-semibold uppercase tracking-wide">
            <span>Customer</span><span>Status</span><span>Amount</span><span>Payment</span><span>Date</span>
          </div>
          <AnimatePresence>
            {filtered.map((order, i) => {
              const st = STATUS_STYLE[order.status] || STATUS_STYLE['Placed'];
              return (
                <motion.div key={order._id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.025 }}
                  onClick={() => setSelected(order)}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                  className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1.2fr_1fr_1fr_80px] gap-4 px-4 py-3.5 border-b border-white/5 cursor-pointer transition-colors items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{order.customer?.name}</p>
                    <p className="text-xs text-stone-500 font-mono truncate">{order.orderId}</p>
                    <p className="text-xs text-stone-600 truncate hidden sm:block">{order.customer?.email}</p>
                  </div>
                  <div className="hidden md:flex">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${st.bg} ${st.text} ${st.border}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-emerald-400 hidden md:block">₹{order.totalAmount?.toLocaleString()}</p>
                  <div className="hidden md:block">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                      order.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      order.paymentStatus === 'refunded' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                      'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>{order.paymentStatus === 'paid' ? '✓ Paid' : order.paymentStatus === 'refunded' ? '↩ Refunded' : '⏳ Pending'}</span>
                  </div>
                  <p className="text-xs text-stone-500 hidden md:block">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </p>
                  {/* Mobile */}
                  <div className="md:hidden flex flex-col items-end gap-1">
                    <p className="text-sm font-bold text-emerald-400">₹{order.totalAmount?.toLocaleString()}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.bg} ${st.text} ${st.border}`}>{order.status}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </AdminLayout>
  );
}
