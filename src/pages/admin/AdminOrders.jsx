import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import AdminLayout from './AdminLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const API = 'http://localhost:5001/api/admin';

const STATUSES = ['Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
const STATUS_STYLE = {
  Placed:           { bg: 'bg-amber-500/20',  text: 'text-amber-400',  border: 'border-amber-500/30'  },
  Shipped:          { bg: 'bg-blue-500/20',   text: 'text-blue-400',   border: 'border-blue-500/30'   },
  'Out for Delivery':{ bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  Delivered:        { bg: 'bg-emerald-500/20', text: 'text-emerald-400',border: 'border-emerald-500/30'},
  Cancelled:        { bg: 'bg-red-500/20',    text: 'text-red-400',    border: 'border-red-500/30'    },
};

/* ── Order Detail Drawer ─────────────────────────────────────────────────── */
function OrderDrawer({ order, onClose, onStatusChange }) {
  const [status, setStatus]   = useState(order.status);
  const [saving, setSaving]   = useState(false);
  const style = STATUS_STYLE[status] || STATUS_STYLE.Placed;

  const handleSave = async () => {
    setSaving(true);
    await onStatusChange(order._id, status);
    setSaving(false);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#161b22] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:w-[440px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h3 className="text-base font-bold text-white">Order Details</h3>
            <p className="text-xs text-stone-500 mt-0.5 font-mono">{order.orderId}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 text-stone-400 hover:text-white flex items-center justify-center">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Customer Info */}
          <div className="bg-white/3 rounded-xl p-4 border border-white/5">
            <p className="text-xs text-stone-500 font-semibold uppercase tracking-wide mb-3">Customer</p>
            <p className="text-sm font-bold text-white">{order.customer?.name}</p>
            <p className="text-xs text-stone-400 mt-1">{order.customer?.email}</p>
            <p className="text-xs text-stone-400">{order.customer?.phone}</p>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">{order.customer?.address}, {order.customer?.pincode}</p>
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
                    <p className="text-xs text-stone-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-emerald-400 flex-shrink-0">₹{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <span className="text-sm font-semibold text-stone-300">Total Amount</span>
            <span className="text-lg font-black text-emerald-400">₹{order.totalAmount?.toLocaleString()}</span>
          </div>

          {/* Status update */}
          <div>
            <p className="text-xs text-stone-500 font-semibold uppercase tracking-wide mb-2">Update Status</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map(s => {
                const st = STATUS_STYLE[s];
                return (
                  <motion.button key={s} whileTap={{ scale: 0.96 }}
                    onClick={() => setStatus(s)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      status === s ? `${st.bg} ${st.text} ${st.border}` : 'bg-white/3 text-stone-500 border-white/5 hover:bg-white/5'
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
            {saving ? (
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                className="block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : '✓ Save Status'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchOrders = () =>
    axios.get(`${API}/orders`, { headers }).then(r => setOrders(r.data)).finally(() => setLoading(false));

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (id, status) => {
    await axios.put(`${API}/orders/${id}`, { status }, { headers });
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
  };

  const filtered = orders.filter(o =>
    (statusFilter === 'All' || o.status === statusFilter) &&
    (o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
     o.orderId?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout>
      <AnimatePresence>
        {selected && (
          <OrderDrawer
            order={selected}
            onClose={() => setSelected(null)}
            onStatusChange={handleStatusChange}
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
          Click any row to view & update
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name or order ID..."
          className="flex-1 min-w-[180px] bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500/60 transition-all" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-all">
          <option className="bg-[#1f2937]" value="All">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s} className="bg-[#1f2937]">{s}</option>)}
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
          <p className="text-sm mt-1">Seed demo data from the Dashboard to get started.</p>
        </div>
      ) : (
        <div className="bg-[#161b22] border border-white/5 rounded-2xl overflow-hidden">
          {/* Table head */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_80px] gap-4 px-4 py-3 border-b border-white/5 text-xs text-stone-500 font-semibold uppercase tracking-wide">
            <span>Customer</span>
            <span>Items</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Date</span>
          </div>

          <AnimatePresence>
            {filtered.map((order, i) => {
              const st = STATUS_STYLE[order.status] || STATUS_STYLE.Placed;
              return (
                <motion.div key={order._id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelected(order)}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                  className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1fr_1fr_1fr_80px] gap-4 px-4 py-3.5 border-b border-white/5 cursor-pointer transition-colors items-center">
                  {/* Customer */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{order.customer?.name}</p>
                    <p className="text-xs text-stone-500 font-mono truncate">{order.orderId}</p>
                  </div>
                  {/* Items */}
                  <p className="text-sm text-stone-300 hidden md:block">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
                  {/* Amount */}
                  <p className="text-sm font-bold text-emerald-400 hidden md:block">₹{order.totalAmount?.toLocaleString()}</p>
                  {/* Status */}
                  <div className="hidden md:flex">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${st.bg} ${st.text} ${st.border}`}>
                      {order.status}
                    </span>
                  </div>
                  {/* Date */}
                  <p className="text-xs text-stone-500 hidden md:block">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </p>
                  {/* Mobile fallback */}
                  <div className="md:hidden flex flex-col items-end gap-1">
                    <p className="text-sm font-bold text-emerald-400">₹{order.totalAmount?.toLocaleString()}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.bg} ${st.text} ${st.border}`}>
                      {order.status}
                    </span>
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
