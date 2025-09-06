// Auth context: manages tokens, user state, refresh & logout
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('et_token') || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('et_refresh') || null);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('et_user')) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(()=>{
    if (token) localStorage.setItem('et_token', token); else localStorage.removeItem('et_token');
    if (user) localStorage.setItem('et_user', JSON.stringify(user)); else localStorage.removeItem('et_user');
    if (refreshToken) localStorage.setItem('et_refresh', refreshToken); else localStorage.removeItem('et_refresh');
  }, [token, user, refreshToken]);

  async function login(username, password) {
    setLoading(true); setError(null);
    try {
  const res = await api.login(username, password);
  setToken(res.token); setUser(res.user); setRefreshToken(res.refreshToken || null);
    } catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  }

  async function register(username, password) {
    setLoading(true); setError(null);
    try {
  const res = await api.register(username, password);
  setToken(res.token); setUser(res.user); setRefreshToken(res.refreshToken || null);
    } catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  }

  const logout = useCallback(()=>{ setToken(null); setUser(null); setRefreshToken(null); }, []);

  // Global fetch wrapper interception could be added; here we just watch error state.
  // Listen for global API events signalling token problems.
  useEffect(()=>{
    function handler(e){
      const code = e.detail?.code;
      if (code === 'TOKEN_EXPIRED') {
        if (refreshToken) {
          api.refresh(refreshToken).then(r => {
            setToken(r.token); setRefreshToken(r.refreshToken);
          }).catch(()=> logout());
        } else {
          logout();
        }
      } else if (code === 'TOKEN_INVALID') {
        logout();
      }
    }
    window.addEventListener('auth-token-problem', handler);
    return () => window.removeEventListener('auth-token-problem', handler);
  }, [logout, refreshToken]);

  useEffect(()=>{
    let cancelled = false;
    (async ()=>{
      if (!token) return;
      try {
        const res = await api.me(token);
        if (!cancelled) setUser(res.user);
      } catch (e) {
        // try refresh path once
        if (refreshToken) {
          try {
            const r = await api.refresh(refreshToken);
            if (!cancelled) { setToken(r.token); setRefreshToken(r.refreshToken); }
          } catch { if (!cancelled) logout(); }
        } else if (!cancelled) logout();
      }
    })();
    return () => { cancelled = true; };
  }, [token, refreshToken, logout]);

  return <AuthContext.Provider value={{ token, refreshToken, user, login, register, logout, loading, error }}>{children}</AuthContext.Provider>;
}

export function useAuth(){ return useContext(AuthContext); }
