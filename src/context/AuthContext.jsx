import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const API = 'http://localhost:5001/api/auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('nk_token') || null);
  const [loading, setLoading] = useState(true);

  /* restore session on mount */
  useEffect(() => {
    if (token) {
      axios.get(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => setUser(r.data))
        .catch(() => { localStorage.removeItem('nk_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const save = (tok, usr) => {
    localStorage.setItem('nk_token', tok);
    setToken(tok);
    setUser(usr);
  };

  const register = async (name, email, password) => {
    const { data } = await axios.post(`${API}/register`, { name, email, password });
    save(data.token, data.user);
    return data.user;
  };

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/login`, { email, password });
    save(data.token, data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('nk_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (fields) => {
    const { data } = await axios.put(`${API}/profile`, fields, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUser(prev => ({ ...prev, ...data }));
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout, updateProfile, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
