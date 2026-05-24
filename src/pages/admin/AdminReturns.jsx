import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from './AdminLayout.jsx';
import { adminGetReturns, adminUpdateReturn } from '../../services/api';

const STATUS_BADGE = {
  Requested: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  Approved: 'bg-green-500/10 text-green-400 border border-green-500/20',
  'Pickup Scheduled': 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  'Refund Processing': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  'Refund Completed': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  Rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

export default function AdminReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusVal, setStatusVal] = useState('');
  const [remarksVal, setRemarksVal] = useState('');
  const [pickupDateVal, setPickupDateVal] = useState('');

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const data = await adminGetReturns();
      setReturns(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const openManageModal = (ret) => {
    setSelectedReturn(ret);
    setStatusVal(ret.status);
    setRemarksVal(ret.adminRemarks || '');
    if (ret.pickupDate) {
      setPickupDateVal(new Date(ret.pickupDate).toISOString().split('T')[0]);
    } else {
      setPickupDateVal('');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminUpdateReturn(selectedReturn._id, {
        status: statusVal,
        adminRemarks: remarksVal,
        pickupDate: statusVal === 'Pickup Scheduled' && pickupDateVal ? new Date(pickupDateVal) : undefined
      });
      setSelectedReturn(null);
      await fetchReturns();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update return request');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">🔄 Return & Refund Requests</h2>
          <p className="text-xs text-stone-500 mt-1">Review, approve/reject, and track return orders</p>
        </div>
        <button 
          onClick={fetchReturns} 
          className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold rounded-xl transition-all"
        >
          🔄 Refresh List
        </button>
      </div>

      {/* Main Table/Grid */}
      <div className="bg-[#161b22] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="text-center py-16 text-stone-500 font-bold">Loading returns data…</div>
        ) : error ? (
          <div className="text-center py-16 text-red-400 font-bold">⚠️ {error}</div>
        ) : returns.length === 0 ? (
          <div className="text-center py-16 text-stone-500 font-bold">No return or refund requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase font-black tracking-widest text-stone-500 bg-white/[0.01]">
                  <th className="py-4 px-6">Product Details</th>
                  <th className="py-4 px-6">Order ID</th>
                  <th className="py-4 px-6">Refund Amount</th>
                  <th className="py-4 px-6">Refund Method</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {returns.map((ret) => (
                  <tr key={ret._id} className="hover:bg-white/[0.01] transition-colors text-sm">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {ret.productImage ? (
                            <img src={ret.productImage} alt={ret.productName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-stone-600">🌿</span>
                          )}
                        </div>
                        <div className="min-w-0 max-w-[200px]">
                          <p className="font-extrabold text-white truncate">{ret.productName}</p>
                          <p className="text-stone-500 text-xs mt-0.5 truncate">Reason: {ret.reason}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-stone-300">
                      #{ret.orderId}
                    </td>
                    <td className="py-4 px-6 font-black text-green-400">
                      ₹{ret.refundAmount}
                    </td>
                    <td className="py-4 px-6 text-stone-400 font-semibold text-xs">
                      {ret.refundMethod}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${STATUS_BADGE[ret.status]}`}>
                        {ret.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <motion.button 
                        whileHover={{ scale: 1.05 }} 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openManageModal(ret)}
                        className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white text-xs font-black rounded-xl transition-all border border-emerald-500/30"
                      >
                        ✏️ Manage
                      </motion.button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit/Manage Modal */}
      <AnimatePresence>
        {selectedReturn && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedReturn(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 15 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#161b22] border border-white/5 rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-lg text-white max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg">Manage Return Request</h3>
                  <p className="text-xs text-stone-500 mt-0.5">Order #{selectedReturn.orderId}</p>
                </div>
                <button 
                  onClick={() => setSelectedReturn(null)} 
                  className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-stone-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Request detail summary */}
              <div className="bg-white/[0.02] p-4 border border-white/5 rounded-2xl mb-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {selectedReturn.productImage ? (
                      <img src={selectedReturn.productImage} alt={selectedReturn.productName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">🌿</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm truncate max-w-[240px]">{selectedReturn.productName}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">Refund: <span className="font-black text-green-400">₹{selectedReturn.refundAmount}</span> via {selectedReturn.refundMethod}</p>
                  </div>
                </div>
                <div className="text-xs text-stone-400 space-y-1">
                  <p><strong>Reason:</strong> {selectedReturn.reason}</p>
                  {selectedReturn.description && (
                    <p className="bg-[#0d1117] p-2.5 rounded-xl border border-white/5 mt-1.5 italic font-semibold text-stone-300">
                      "{selectedReturn.description}"
                    </p>
                  )}
                </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-stone-400 mb-1.5 uppercase tracking-wider">Update Status</label>
                  <select 
                    value={statusVal}
                    onChange={e => setStatusVal(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0d1117] border-2 border-white/5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white font-semibold cursor-pointer"
                  >
                    <option value="Requested">Requested</option>
                    <option value="Approved">Approved</option>
                    <option value="Pickup Scheduled">Pickup Scheduled</option>
                    <option value="Refund Processing">Refund Processing</option>
                    <option value="Refund Completed">Refund Completed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {statusVal === 'Pickup Scheduled' && (
                  <div>
                    <label className="block text-xs font-black text-stone-400 mb-1.5 uppercase tracking-wider">Pickup Date</label>
                    <input 
                      type="date"
                      required
                      value={pickupDateVal}
                      onChange={e => setPickupDateVal(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0d1117] border-2 border-white/5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white font-semibold"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-stone-400 mb-1.5 uppercase tracking-wider">Admin Remarks / Instructions</label>
                  <textarea 
                    value={remarksVal}
                    onChange={e => setRemarksVal(e.target.value)}
                    placeholder="Enter remarks for the user dashboard & email update..."
                    rows={3}
                    className="w-full px-4 py-3 bg-[#0d1117] border-2 border-white/5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <motion.button 
                    type="submit"
                    disabled={saving}
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3.5 bg-emerald-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-500/20 disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {saving ? 'Saving changes…' : 'Save & Notify User ✓'}
                  </motion.button>
                  <motion.button 
                    type="button" 
                    onClick={() => setSelectedReturn(null)}
                    className="px-6 py-3.5 bg-white/5 text-stone-300 font-bold text-sm rounded-2xl hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </AdminLayout>
  );
}
