import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('et_token') || null);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('et_user')) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(()=>{
    if (token) localStorage.setItem('et_token', token); else localStorage.removeItem('et_token');
    if (user) localStorage.setItem('et_user', JSON.stringify(user)); else localStorage.removeItem('et_user');
  }, [token, user]);

  async function login(username, password) {
    setLoading(true); setError(null);
    try {
      const res = await api.login(username, password);
      setToken(res.token); setUser(res.user);
    } catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  }

  async function register(username, password) {
    setLoading(true); setError(null);
    try {
      const res = await api.register(username, password);
      setToken(res.token); setUser(res.user);
    } catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  }

  function logout(){ setToken(null); setUser(null); }

  return <AuthContext.Provider value={{ token, user, login, register, logout, loading, error }}>{children}</AuthContext.Provider>;
}

export function useAuth(){ return useContext(AuthContext); }
