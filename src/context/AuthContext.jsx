import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const API = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '') + '/api/auth'
  : 'http://localhost:5001/api/auth';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem('nk_token') || null);
  const [loading, setLoading] = useState(true);
  const inactivityTimer = useRef(null);

  /* ── Restore session on mount ─────────────────────────────────────────────── */
  useEffect(() => {
    if (token) {
      axios.get(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r  => setUser(r.data))
        .catch(() => { localStorage.removeItem('nk_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  /* ── Session inactivity auto-logout ───────────────────────────────────────── */
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (user) {
      inactivityTimer.current = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [user, resetInactivityTimer]);

  /* ── Helpers ──────────────────────────────────────────────────────────────── */
  const save = (tok, usr) => {
    localStorage.setItem('nk_token', tok);
    setToken(tok);
    setUser(usr);
  };

  /* ── Auth methods ─────────────────────────────────────────────────────────── */

  /** Step 1 of registration — returns { requiresVerification, email } */
  const register = async (name, email, password, mobile) => {
    const { data } = await axios.post(`${API}/register`, { name, email, password, mobile });
    return data; // { message, email, requiresVerification }
  };

  /** Step 2 of registration — verify OTP, receive JWT */
  const verifyOtp = async (email, otp) => {
    const { data } = await axios.post(`${API}/verify-otp`, { email, otp });
    if (data.token) save(data.token, data.user);
    return data;
  };

  /** Resend OTP */
  const resendOtp = async (email) => {
    const { data } = await axios.post(`${API}/resend-otp`, { email });
    return data;
  };

  /** Login */
  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/login`, { email, password });
    save(data.token, data.user);
    return data.user;
  };

  /** Logout */
  const logout = () => {
    localStorage.removeItem('nk_token');
    setToken(null);
    setUser(null);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  };

  /** Forgot password — sends reset OTP */
  const forgotPassword = async (email) => {
    const { data } = await axios.post(`${API}/forgot-password`, { email });
    return data;
  };

  /** Reset password with OTP */
  const resetPassword = async (email, otp, newPassword) => {
    const { data } = await axios.post(`${API}/reset-password`, { email, otp, newPassword });
    return data;
  };

  /** Called after Google token verified by backend */
  const loginWithGoogle = (tok, usr) => save(tok, usr);

  /** Update profile */
  const updateProfile = async (fields) => {
    const { data } = await axios.put(`${API}/profile`, fields, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUser(prev => ({ ...prev, ...data }));
    return data;
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      register, verifyOtp, resendOtp,
      login, logout,
      forgotPassword, resetPassword,
      loginWithGoogle, updateProfile,
      isLoggedIn: !!user,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
