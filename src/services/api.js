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

/* Products */
export const getProducts  = ()   => api.get('/products').then(r => r.data);
export const getProduct   = (id) => api.get(`/products/${id}`).then(r => r.data);

/* Orders */
export const createOrder  = (data) => api.post('/orders', data).then(r => r.data);
export const getOrder     = (id)   => api.get(`/orders/${id}`).then(r => r.data);

/* Auth */
export const loginApi     = (body) => api.post('/auth/login',    body).then(r => r.data);
export const registerApi  = (body) => api.post('/auth/register', body).then(r => r.data);
export const getMeApi     = ()     => api.get('/auth/me').then(r => r.data);

/* Admin */
export const adminGetProducts    = ()         => api.get('/admin/products').then(r => r.data);
export const adminAddProduct     = (body)     => api.post('/admin/products', body).then(r => r.data);
export const adminUpdateProduct  = (id, body) => api.put(`/admin/products/${id}`, body).then(r => r.data);
export const adminDeleteProduct  = (id)       => api.delete(`/admin/products/${id}`).then(r => r.data);
export const adminGetOrders      = ()         => api.get('/admin/orders').then(r => r.data);
export const adminUpdateOrder    = (id, body) => api.put(`/admin/orders/${id}`, body).then(r => r.data);
export const adminGetDashboard   = ()         => api.get('/admin/dashboard').then(r => r.data);
export const adminSeedOrders     = ()         => api.post('/admin/seed-orders', {}).then(r => r.data);

/* Payment — Razorpay */
export const createRazorpayOrder = (amount)  => api.post('/payment/create-order', { amount }).then(r => r.data);
export const verifyPayment       = (body)    => api.post('/payment/verify', body).then(r => r.data);
