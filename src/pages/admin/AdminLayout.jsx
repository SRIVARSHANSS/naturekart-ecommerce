import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const navItems = [
  { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/admin/products',  icon: '📦', label: 'Products' },
  { path: '/admin/orders',    icon: '📑', label: 'Orders' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [sideOpen, setSideOpen] = useState(true);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="flex h-screen bg-[#0d1117] text-white overflow-hidden font-sans">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <motion.aside
        initial={{ x: -240 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`flex-shrink-0 ${sideOpen ? 'w-60' : 'w-[72px]'} transition-all duration-300 flex flex-col bg-[#161b22] border-r border-white/5`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
            <span className="text-lg">🌿</span>
          </div>
          {sideOpen && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-black text-base text-white tracking-tight">
              Nature<span className="text-emerald-400">Kart</span> <span className="text-xs font-semibold text-stone-400">Admin</span>
            </motion.span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map(({ path, icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link to={path} key={path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    active
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-stone-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  {sideOpen && <span className="text-sm font-semibold">{label}</span>}
                  {active && sideOpen && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Toggle */}
        <div className="p-3 border-t border-white/5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSideOpen(!sideOpen)}
            className="w-full py-2 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-white/5 transition-all text-sm font-medium flex items-center justify-center gap-2"
          >
            <span>{sideOpen ? '◀' : '▶'}</span>
            {sideOpen && <span>Collapse</span>}
          </motion.button>
        </div>
      </motion.aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <motion.header
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="h-16 flex items-center justify-between px-6 bg-[#161b22] border-b border-white/5 flex-shrink-0"
        >
          <div>
            <h1 className="text-base font-bold text-white">
              {navItems.find(n => n.path === location.pathname)?.label || 'Admin Panel'}
            </h1>
            <p className="text-xs text-stone-500">NatureKart Management System</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            {sideOpen && (
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-white leading-tight">{user?.name || 'Admin'}</p>
                <p className="text-xs text-emerald-400">Administrator</p>
              </div>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-semibold text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-all"
            >
              Logout
            </motion.button>
          </div>
        </motion.header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0d1117]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
