import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import AdminLayout from './AdminLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const API = 'http://localhost:5001/api/admin';

/* ── Animated number ─────────────────────────────────────────────────────── */
function CountUp({ target, prefix = '', suffix = '', duration = 1500 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ── Stat card ───────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, prefix, suffix, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: `0 20px 40px ${color}25` }}
      className="bg-[#161b22] border border-white/5 rounded-2xl p-5 cursor-default"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        <div className={`w-2 h-8 rounded-full`} style={{ background: color }} />
      </div>
      <p className="text-stone-400 text-xs font-semibold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-white">
        <CountUp target={value} prefix={prefix} suffix={suffix} />
      </p>
    </motion.div>
  );
}

const STATUS_COLORS = {
  Placed: '#f59e0b',
  Shipped: '#3b82f6',
  'Out for Delivery': '#8b5cf6',
  Delivered: '#10b981',
  Cancelled: '#ef4444',
};

export default function AdminDashboard() {
  const { token } = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API}/dashboard`, { headers })
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const seedOrders = async () => {
    try {
      await axios.post(`${API}/seed-orders`, {}, { headers });
      const r = await axios.get(`${API}/dashboard`, { headers });
      setData(r.data);
    } catch (e) { setError(e.response?.data?.message || 'Seed failed'); }
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full" />
      </div>
    </AdminLayout>
  );

  if (error) return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-400 font-semibold">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm border border-emerald-500/30">Retry</button>
      </div>
    </AdminLayout>
  );

  const { totalSales, totalOrders, totalProducts, totalUsers, recentOrders = [], revenueData = [], statusData = [] } = data || {};

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-white">Dashboard Overview</h2>
          <p className="text-stone-400 text-sm mt-0.5">Welcome back! Here's what's happening today.</p>
        </div>
        {totalOrders === 0 && (
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={seedOrders}
            className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-semibold hover:bg-emerald-500/30 transition-all">
            🌱 Seed Demo Data
          </motion.button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="💰" label="Total Revenue"  value={totalSales}    prefix="₹" color="#10b981" delay={0}    />
        <StatCard icon="📦" label="Total Orders"   value={totalOrders}                 color="#3b82f6" delay={0.1}  />
        <StatCard icon="🏷️" label="Products"       value={totalProducts}               color="#8b5cf6" delay={0.2}  />
        <StatCard icon="👥" label="Customers"       value={totalUsers}                  color="#f59e0b" delay={0.3}  />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Revenue Area Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[#161b22] border border-white/5 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-stone-300 mb-4">📈 Revenue (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, color: '#fff' }}
                formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: '#10b981', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Orders Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-[#161b22] border border-white/5 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-stone-300 mb-4">📊 Orders (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, color: '#fff' }} />
              <Bar dataKey="orders" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Order Status Distribution */}
      {statusData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="bg-[#161b22] border border-white/5 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-bold text-stone-300 mb-4">🔢 Order Status Distribution</h3>
          <div className="flex flex-wrap gap-3">
            {statusData.map(({ name, count }) => (
              <div key={name} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[name] || '#6b7280' }} />
                <span className="text-xs text-stone-300 font-medium">{name}</span>
                <span className="text-xs font-bold text-white">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Orders */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="bg-[#161b22] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="text-sm font-bold text-stone-300">🕐 Recent Orders</h3>
        </div>
        <div className="divide-y divide-white/5">
          {recentOrders.length === 0 ? (
            <p className="text-stone-500 text-sm p-5 text-center">No orders yet. Click "Seed Demo Data" to add sample orders.</p>
          ) : recentOrders.map((order, i) => (
            <motion.div key={order._id}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.65 + i * 0.04 }}
              className="flex items-center gap-4 p-4 hover:bg-white/3 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-xs font-bold text-stone-400 flex-shrink-0">
                #{i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{order.customer?.name}</p>
                <p className="text-xs text-stone-500 truncate">{order.orderId}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-emerald-400">₹{order.totalAmount?.toLocaleString()}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: `${STATUS_COLORS[order.status]}20`, color: STATUS_COLORS[order.status] }}>
                  {order.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AdminLayout>
  );
}
