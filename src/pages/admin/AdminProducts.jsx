import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import AdminLayout from './AdminLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const API = 'http://localhost:5001/api/admin';
const CATEGORIES = ['Ayurveda', 'Supplements', 'Skincare', 'Herbal Tea', 'Hair Care', 'Essential Oils'];

const emptyForm = { name: '', price: '', category: 'Ayurveda', description: '', image: '', icon: '🌿', inStock: true };

/* ── Modal ───────────────────────────────────────────────────────────────── */
function ProductModal({ product, onClose, onSave }) {
  const [form, setForm]     = useState(product || emptyForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      await onSave({ ...form, price: Number(form.price) });
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-all";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.85, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#161b22] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">{product ? '✏️ Edit Product' : '➕ Add Product'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 text-stone-400 hover:text-white flex items-center justify-center">✕</button>
        </div>

        {err && <p className="mb-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{err}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-stone-400 font-semibold uppercase tracking-wide block mb-1.5">Product Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Ashwagandha Extract" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-stone-400 font-semibold uppercase tracking-wide block mb-1.5">Price (₹) *</label>
              <input name="price" value={form.price} onChange={handleChange} type="number" min="0" required placeholder="599" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-stone-400 font-semibold uppercase tracking-wide block mb-1.5">Category *</label>
              <select name="category" value={form.category} onChange={handleChange} className={inputCls}>
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#1f2937]">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-400 font-semibold uppercase tracking-wide block mb-1.5">Icon (Emoji)</label>
              <input name="icon" value={form.icon} onChange={handleChange} placeholder="🌿" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-stone-400 font-semibold uppercase tracking-wide block mb-1.5">Tag</label>
              <input name="tag" value={form.tag || ''} onChange={handleChange} placeholder="Bestseller / New / Sale" className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-stone-400 font-semibold uppercase tracking-wide block mb-1.5">Image URL</label>
              <input name="image" value={form.image} onChange={handleChange} placeholder="https://..." className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-stone-400 font-semibold uppercase tracking-wide block mb-1.5">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Product description..." className={`${inputCls} resize-none`} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-stone-400 font-semibold uppercase tracking-wide block mb-1.5">AI Health Reason</label>
              <textarea name="aiReason" value={form.aiReason || ''} onChange={handleChange} rows={2} placeholder="Why is this product good for health..." className={`${inputCls} resize-none`} />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="inStock" checked={form.inStock} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
              <span className="text-sm text-stone-300 font-medium">In Stock</span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-stone-400 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold">
              Cancel
            </button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? (
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                  className="block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              ) : product ? 'Save Changes' : 'Add Product'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ── Delete Confirm ──────────────────────────────────────────────────────── */
function DeleteModal({ name, onConfirm, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-[#161b22] border border-red-500/20 rounded-2xl p-6 max-w-sm w-full">
        <div className="text-center mb-4">
          <span className="text-5xl">🗑️</span>
        </div>
        <h3 className="text-base font-bold text-white text-center mb-2">Delete Product?</h3>
        <p className="text-sm text-stone-400 text-center mb-6">
          <span className="text-white font-semibold">"{name}"</span> will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-stone-400 hover:text-white text-sm font-semibold">Cancel</button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm">
            Delete
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminProducts() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [editing, setEditing]   = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch]     = useState('');
  const [catFilter, setCatFilter] = useState('All');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchProducts = () =>
    axios.get(`${API}/products`, { headers }).then(r => setProducts(r.data)).finally(() => setLoading(false));

  useEffect(() => { fetchProducts(); }, []);

  const handleAdd = async (form) => {
    await axios.post(`${API}/products`, form, { headers });
    await fetchProducts();
  };

  const handleEdit = async (form) => {
    await axios.put(`${API}/products/${editing._id}`, form, { headers });
    await fetchProducts();
  };

  const handleDelete = async () => {
    await axios.delete(`${API}/products/${deleting._id}`, { headers });
    setDeleting(null);
    await fetchProducts();
  };

  const filtered = products.filter(p =>
    (catFilter === 'All' || p.category === catFilter) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <AnimatePresence>
        {showAdd  && <ProductModal onClose={() => setShowAdd(false)}  onSave={handleAdd} />}
        {editing  && <ProductModal product={editing} onClose={() => setEditing(null)}   onSave={handleEdit} />}
        {deleting && <DeleteModal name={deleting.name} onConfirm={handleDelete} onClose={() => setDeleting(null)} />}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-black text-white">Manage Products</h2>
          <p className="text-stone-400 text-sm mt-0.5">{products.length} products in database</p>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96, y: 2 }}
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2">
          ➕ Add Product
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search products..."
          className="flex-1 min-w-[180px] bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500/60 transition-all" />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-all">
          <option value="All" className="bg-[#1f2937]">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#1f2937]">{c}</option>)}
        </select>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-500">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-semibold text-white">No products found</p>
          <p className="text-sm mt-1">Add your first product to get started.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filtered.map((p, i) => (
              <motion.div key={p._id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -4 }}
                className="bg-[#161b22] border border-white/5 rounded-2xl overflow-hidden group">
                {/* Image */}
                <div className="relative h-36 bg-gradient-to-br from-green-950 to-emerald-950 flex items-center justify-center overflow-hidden">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <span className="text-5xl">{p.icon}</span>
                  )}
                  {!p.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-xs font-bold text-red-400 border border-red-400/40 px-2 py-1 rounded-lg">Out of Stock</span>
                    </div>
                  )}
                  {p.tag && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500/90 text-white text-[10px] font-bold rounded-full">{p.tag}</span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="font-bold text-white text-sm truncate">{p.name}</p>
                  <p className="text-xs text-stone-500 mb-2">{p.category}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-emerald-400 font-black text-base">₹{p.price?.toLocaleString()}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.inStock ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {p.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setEditing(p)}
                      className="flex-1 py-1.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/20 hover:bg-blue-500/30 transition-all">
                      ✏️ Edit
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setDeleting(p)}
                      className="flex-1 py-1.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 hover:bg-red-500/30 transition-all">
                      🗑️ Delete
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </AdminLayout>
  );
}
