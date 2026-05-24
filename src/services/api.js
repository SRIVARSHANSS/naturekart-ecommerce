/**
 * NatureKart — Central API service
 * All API calls go through here. Change VITE_API_URL in .env to switch servers.
 */
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const api = axios.create({ baseURL: BASE });

/* Attach JWT on every request */
api.interceptors.request.use(config => {
  const token = localStorage.getItem('nk_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ── Products ───────────────────────────────────────────────────────────────── */
export const getProducts  = ()   => api.get('/products').then(r => r.data);
export const getProduct   = (id) => api.get(`/products/${id}`).then(r => r.data);

/* ── Orders ─────────────────────────────────────────────────────────────────── */
export const createOrder      = (data)    => api.post('/orders', data).then(r => r.data);
export const getOrder         = (id)      => api.get(`/orders/${id}`).then(r => r.data);
export const getUserOrders    = ()        => api.get('/orders/user').then(r => r.data);
export const getUserOrderById = (orderId) => api.get(`/orders/${orderId}`).then(r => r.data);

/* ── Delivery OTP ───────────────────────────────────────────────────────────── */
export const sendDeliveryOtp   = (body) => api.post('/orders/send-delivery-otp', body).then(r => r.data);
export const verifyDeliveryOtp = (body) => api.post('/orders/verify-delivery-otp', body).then(r => r.data);
export const sendReturnOtp     = (body) => api.post('/orders/send-return-otp', body).then(r => r.data);
export const verifyReturnOtp   = (body) => api.post('/orders/verify-return-otp', body).then(r => r.data);

/* ── Auth — Core ────────────────────────────────────────────────────────────── */
export const loginApi    = (body) => api.post('/auth/login',    body).then(r => r.data);
export const registerApi = (body) => api.post('/auth/register', body).then(r => r.data);
export const getMeApi    = ()     => api.get('/auth/me').then(r => r.data);

/* ── Auth — OTP ─────────────────────────────────────────────────────────────── */
export const verifyOtpApi = (body) => api.post('/auth/verify-otp', body).then(r => r.data);
export const resendOtpApi = (body) => api.post('/auth/resend-otp', body).then(r => r.data);

/* ── Auth — Password ────────────────────────────────────────────────────────── */
export const forgotPasswordApi = (body) => api.post('/auth/forgot-password', body).then(r => r.data);
export const resetPasswordApi  = (body) => api.post('/auth/reset-password',  body).then(r => r.data);

/* ── Checkout ───────────────────────────────────────────────────────────────── */
export const getDeliveryOptions = ()     => api.get('/checkout/delivery-options').then(r => r.data);
export const validateAddress    = (body) => api.post('/checkout/validate-address', body).then(r => r.data);

/* ── Payment (Razorpay) ─────────────────────────────────────────────────────── */
export const createRazorpayOrder  = (body) => api.post('/payment/create-order', body).then(r => r.data);
export const verifyRazorpayPayment = (body) => api.post('/payment/verify', body).then(r => r.data);
export const getRazorpayKey       = ()     => api.get('/payment/key').then(r => r.data);

/* ── Legacy UPI (kept for backward compat) ──────────────────────────────────── */
export const saveUpiOrder = (body) => api.post('/payment/create-upi-order', body).then(r => r.data);

/* ── Admin ──────────────────────────────────────────────────────────────────── */
export const adminGetProducts   = ()         => api.get('/admin/products').then(r => r.data);
export const adminAddProduct    = (body)     => api.post('/admin/products', body).then(r => r.data);
export const adminUpdateProduct = (id, body) => api.put(`/admin/products/${id}`, body).then(r => r.data);
export const adminDeleteProduct = (id)       => api.delete(`/admin/products/${id}`).then(r => r.data);
export const adminGetOrders     = ()         => api.get('/admin/orders').then(r => r.data);
export const adminUpdateOrder   = (id, body) => api.put(`/admin/orders/${id}`, body).then(r => r.data);
export const adminGetDashboard  = ()         => api.get('/admin/dashboard').then(r => r.data);
export const adminSeedOrders    = ()         => api.post('/admin/seed-orders', {}).then(r => r.data);
export const adminGetReturns    = ()         => api.get('/admin/returns').then(r => r.data);
export const adminUpdateReturn  = (id, body) => api.put(`/admin/returns/${id}`, body).then(r => r.data);

/* ── Returns & Refunds ──────────────────────────────────────────────────────── */
export const createReturn   = (body) => api.post('/returns/create', body).then(r => r.data);
export const getUserReturns = ()     => api.get('/returns/user').then(r => r.data);

/* ── Search ─────────────────────────────────────────────────────────────────── */
export const searchProductsApi      = (q)     => api.get(`/search?q=${encodeURIComponent(q)}`).then(r => r.data);
export const getSuggestionsApi      = (q)     => api.get(`/search/suggestions?q=${encodeURIComponent(q)}`).then(r => r.data);
export const getRecentSearchesApi   = ()      => api.get('/search/recent').then(r => r.data);
export const getTrendingSearchesApi = ()      => api.get('/search/trending').then(r => r.data);
export const clearRecentSearchesApi = (query) => api.delete('/search/recent', { data: { query } }).then(r => r.data);

/* ── AI — NatureBot ─────────────────────────────────────────────────────────── */
export const chatWithNatureBot  = (message, conversationHistory = []) =>
  api.post('/ai/chat',       { message, conversationHistory }).then(r => r.data);
export const quickChatNatureBot = (message, conversationHistory = []) =>
  api.post('/ai/quick-chat', { message, conversationHistory }).then(r => r.data);
