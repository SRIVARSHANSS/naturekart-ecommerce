import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from './AdminLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { adminGetReturns, adminUpdateReturn, sendReturnOtp, verifyReturnOtp } from '../../services/api.js';

const STATUS_STYLE = {
  'Requested':       { bg: 'bg-amber-500/20',   text: 'text-amber-400',   border: 'border-amber-500/30'  },
  'Approved':        { bg: 'bg-blue-500/20',    text: 'text-blue-400',    border: 'border-blue-500/30'   },
  'Pickup Scheduled':{ bg: 'bg-purple-500/20',  text: 'text-purple-400',  border: 'border-purple-500/30' },
  'Product Received':{ bg: 'bg-orange-500/20',  text: 'text-orange-400',  border: 'border-orange-500/30' },
  'Refund Initiated':{ bg: 'bg-cyan-500/20',    text: 'text-cyan-400',    border: 'border-cyan-500/30'   },
  'Refund Completed':{ bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30'},
  'Rejected':        { bg: 'bg-red-500/20',     text: 'text-red-400',     border: 'border-red-500/30'    },
};

const STATUSES = ['Requested', 'Approved', 'Pickup Scheduled', 'Product Received', 'Refund Initiated', 'Refund Completed', 'Rejected'];

/* ── Return OTP Modal ────────────────────────────────────────────────────── */
function ReturnOtpModal({ orderId, onSendOtp, onVerify, onClose, sending, verifying }) {
  const [otp,         setOtp]         = useState('');
  const [otpSent,     setOtpSent]     = useState(false);
  const [sendError,   setSendError]   = useState('');
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
            <h3 className="text-lg font-bold text-white">Return Pickup OTP</h3>
            <p className="text-xs text-stone-400 mt-1">Verify product receipt · Order: {orderId}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 text-stone-400 hover:text-white flex items-center justify-center">✕</button>
        </div>

        <div className="space-y-4">
          <div className={`p-4 rounded-xl border transition-all ${otpSent ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-white/3'}`}>
            <p className="text-sm font-bold text-white mb-1">{otpSent ? '✅' : '1️⃣'} Send Return OTP to Customer</p>
            <p className="text-xs text-stone-400 mb-3">Customer receives OTP to confirm return pickup</p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleSend} disabled={sending || otpSent}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {sending ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} className="block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" /> Sending…</> : otpSent ? '✅ OTP Sent' : '📧 Send OTP Email'}
            </motion.button>
            {sendError && <p className="text-red-400 text-xs mt-2">{sendError}</p>}
          </div>

          <div className={`p-4 rounded-xl border transition-all ${!otpSent ? 'border-white/5 opacity-50' : 'border-white/10 bg-white/3'}`}>
            <p className="text-sm font-bold text-white mb-1">2️⃣ Enter OTP from Customer</p>
            <p className="text-xs text-stone-400 mb-3">Ask customer for OTP — this will initiate the refund</p>
            <div className="flex gap-3">
              <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={!otpSent} placeholder="6-digit OTP"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-stone-600 focus:outline-none focus:border-cyan-500/60 text-center text-xl font-mono tracking-widest transition-all disabled:opacity-50" />
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handleVerify} disabled={!otpSent || verifying || otp.length !== 6}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-sm disabled:opacity-50">
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

/* ── Return Detail Drawer ─────────────────────────────────────────────────── */
function ReturnDrawer({ ret, onClose, onStatusChange, onSendReturnOtp, onVerifyReturnOtp, onRefundComplete }) {
  const [status,       setStatus]       = useState(ret.status);
  const [adminRemarks, setAdminRemarks] = useState(ret.adminRemarks || '');
  const [pickupDate,   setPickupDate]   = useState(ret.pickupDate ? ret.pickupDate.substring(0, 10) : '');
  const [saving,       setSaving]       = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [sending,      setSending]      = useState(false);
  const [verifying,    setVerifying]    = useState(false);

  const st = STATUS_STYLE[status] || STATUS_STYLE['Requested'];

  const handleSave = async () => {
    setSaving(true);
    await onStatusChange(ret._id, { status, adminRemarks, pickupDate: pickupDate || undefined });
    setSaving(false);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {showOtpModal && (
          <ReturnOtpModal
            orderId={ret.orderId}
            sending={sending}
            verifying={verifying}
            onClose={() => setShowOtpModal(false)}
            onSendOtp={async () => {
              setSending(true);
              try { await onSendReturnOtp(ret.orderId); }
              finally { setSending(false); }
            }}
            onVerify={async (otp) => {
              setVerifying(true);
              try { await onVerifyReturnOtp(ret.orderId, otp); onClose(); }
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
          <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-[#161b22] z-10">
            <div>
              <h3 className="text-base font-bold text-white">Return Request</h3>
              <p className="text-xs text-stone-500 mt-0.5 font-mono">{ret.orderId}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 text-stone-400 hover:text-white flex items-center justify-center">✕</button>
          </div>

          <div className="p-5 space-y-5">
            {/* Current status badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${st.bg} ${st.text} ${st.border}`}>{status}</span>

            {/* Product info */}
            <div className="bg-white/3 rounded-xl p-4 border border-white/5">
              <p className="text-xs text-stone-500 font-semibold uppercase tracking-wide mb-2">Product</p>
              <p className="text-sm font-bold text-white">{ret.productName}</p>
              <p className="text-xs text-stone-400 mt-1">Order: {ret.orderId}</p>
              <p className="text-xs text-stone-400">Return reason: <span className="text-amber-400">{ret.reason}</span></p>
              {ret.description && <p className="text-xs text-stone-400 mt-1">"{ret.description}"</p>}
            </div>

            {/* Refund info */}
            <div className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-3">
              <div>
                <p className="text-xs text-stone-400">Refund Amount</p>
                <p className="text-xs text-stone-400">Method: {ret.refundMethod}</p>
              </div>
              <span className="text-lg font-black text-cyan-400">₹{ret.refundAmount?.toLocaleString()}</span>
            </div>

            {/* Return OTP button — show when Product Received */}
            {ret.status === 'Product Received' && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowOtpModal(true)}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                🔐 Verify Return with OTP → Initiate Refund
              </motion.button>
            )}

            {/* Refund complete button */}
            {ret.status === 'Refund Initiated' && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => onRefundComplete(ret._id)}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                ✅ Mark Refund Completed
              </motion.button>
            )}

            {/* Pickup date (for Pickup Scheduled) */}
            {(status === 'Approved' || status === 'Pickup Scheduled') && (
              <div>
                <label className="text-xs text-stone-500 font-semibold uppercase tracking-wide mb-2 block">Pickup Date</label>
                <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/60 text-sm transition-all" />
              </div>
            )}

            {/* Admin remarks */}
            <div>
              <label className="text-xs text-stone-500 font-semibold uppercase tracking-wide mb-2 block">Admin Remarks (optional)</label>
              <textarea value={adminRemarks} onChange={e => setAdminRemarks(e.target.value)} rows={3}
                placeholder="Add notes for the customer…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500/60 text-sm resize-none transition-all" />
            </div>

            {/* Status update */}
            <div>
              <p className="text-xs text-stone-500 font-semibold uppercase tracking-wide mb-2">Update Status</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map(s => {
                  const sst = STATUS_STYLE[s];
                  return (
                    <motion.button key={s} whileTap={{ scale: 0.96 }}
                      onClick={() => setStatus(s)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        status === s ? `${sst.bg} ${sst.text} ${sst.border}` : 'bg-white/3 text-stone-500 border-white/5 hover:bg-white/5'
                      }`}>{s}</motion.button>
                  );
                })}
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleSave} disabled={saving}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} className="block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : '✓ Save Changes'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function AdminReturns() {
  const [returns,      setReturns]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selected,     setSelected]     = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast,        setToast]        = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const fetchReturns = () =>
    adminGetReturns().then(data => setReturns(data)).finally(() => setLoading(false));

  useEffect(() => { fetchReturns(); }, []);

  const handleStatusChange = async (id, body) => {
    await adminUpdateReturn(id, body);
    await fetchReturns();
    showToast(`Return status updated to "${body.status}"`);
  };

  const handleSendReturnOtp = async (orderId) => {
    await sendReturnOtp({ orderId });
    showToast('Return OTP sent to customer email!');
  };

  const handleVerifyReturnOtp = async (orderId, otp) => {
    await verifyReturnOtp({ orderId, otp });
    await fetchReturns();
    showToast('✅ Return OTP verified — Refund Initiated!');
  };

  const handleRefundComplete = async (id) => {
    await adminUpdateReturn(id, { status: 'Refund Completed' });
    await fetchReturns();
    setSelected(null);
    showToast('✅ Refund marked as Completed!');
  };

  const filtered = returns.filter(r =>
    statusFilter === 'All' || r.status === statusFilter
  );

  return (
    <AdminLayout>
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
          <ReturnDrawer
            ret={selected}
            onClose={() => setSelected(null)}
            onStatusChange={handleStatusChange}
            onSendReturnOtp={handleSendReturnOtp}
            onVerifyReturnOtp={handleVerifyReturnOtp}
            onRefundComplete={handleRefundComplete}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-black text-white">Returns & Refunds</h2>
          <p className="text-stone-400 text-sm mt-0.5">{returns.length} total requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Pending Review', count: returns.filter(r => r.status === 'Requested').length, color: 'text-amber-400' },
          { label: 'Pickup Scheduled', count: returns.filter(r => r.status === 'Pickup Scheduled').length, color: 'text-purple-400' },
          { label: 'Refund Initiated', count: returns.filter(r => r.status === 'Refund Initiated').length, color: 'text-cyan-400' },
          { label: 'Completed', count: returns.filter(r => r.status === 'Refund Completed').length, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/3 border border-white/5 rounded-xl p-4 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
            <p className="text-xs text-stone-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {['All', ...STATUSES].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              statusFilter === s ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/3 text-stone-500 border-white/5 hover:bg-white/5'
            }`}>{s}</button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-500">
          <p className="text-4xl mb-3">↩️</p>
          <p className="font-semibold text-white">No return requests</p>
          <p className="text-sm mt-1">Return requests from customers will appear here.</p>
        </div>
      ) : (
        <div className="bg-[#161b22] border border-white/5 rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] gap-4 px-4 py-3 border-b border-white/5 text-xs text-stone-500 font-semibold uppercase tracking-wide">
            <span>Product / Order</span><span>Reason</span><span>Refund</span><span>Status</span><span>Date</span>
          </div>
          <AnimatePresence>
            {filtered.map((ret, i) => {
              const st = STATUS_STYLE[ret.status] || STATUS_STYLE['Requested'];
              return (
                <motion.div key={ret._id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelected(ret)}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                  className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1.5fr_1fr_1fr_80px] gap-4 px-4 py-3.5 border-b border-white/5 cursor-pointer transition-colors items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{ret.productName}</p>
                    <p className="text-xs text-stone-500 font-mono">{ret.orderId}</p>
                  </div>
                  <p className="text-xs text-stone-400 hidden md:block truncate">{ret.reason}</p>
                  <p className="text-sm font-bold text-cyan-400 hidden md:block">₹{ret.refundAmount?.toLocaleString()}</p>
                  <div className="hidden md:flex">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${st.bg} ${st.text} ${st.border}`}>{ret.status}</span>
                  </div>
                  <p className="text-xs text-stone-500 hidden md:block">
                    {new Date(ret.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </p>
                  <div className="md:hidden flex flex-col items-end gap-1">
                    <p className="text-sm font-bold text-cyan-400">₹{ret.refundAmount?.toLocaleString()}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.bg} ${st.text} ${st.border}`}>{ret.status}</span>
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
