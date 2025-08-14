import React, { useState } from 'react';
import { useAuth } from '../authContext.jsx';

export function AuthForm() {
  const { login, register, loading, error } = useAuth();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  async function handleSubmit(e){
    e.preventDefault();
    setLocalError(null);
    try {
      if (mode === 'login') await login(username, password); else await register(username, password);
    } catch (e) { setLocalError(e.message); }
  }

  return (
    <div style={{ maxWidth: 360, margin: '4rem auto', padding: '2rem', background:'#fff', borderRadius:8, boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginTop:0 }}>{mode === 'login' ? 'Login' : 'Register'}</h2>
      <form onSubmit={handleSubmit}>
        <label style={{ display:'block', marginBottom:8 }}>Username
          <input value={username} onChange={e=>setUsername(e.target.value)} required style={inputStyle} />
        </label>
        <label style={{ display:'block', marginBottom:8 }}>Password
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required style={inputStyle} />
        </label>
        {(error || localError) && <div style={{ color:'crimson', marginBottom:8 }}>{error || localError}</div>}
        <button disabled={loading} style={buttonStyle}>{loading? '...' : (mode==='login' ? 'Login' : 'Create Account')}</button>
      </form>
      <div style={{ marginTop:12, fontSize:14 }}>
        {mode==='login' ? (<span>Need an account? <button onClick={()=>setMode('register')} style={linkBtn}>Register</button></span>) : (<span>Have an account? <button onClick={()=>setMode('login')} style={linkBtn}>Login</button></span>)}
      </div>
    </div>
  );
}

const inputStyle = { width:'100%', padding:'8px 10px', marginTop:4, border:'1px solid #ccc', borderRadius:4 };
const buttonStyle = { width:'100%', padding:'10px 12px', background:'#2563eb', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontWeight:600 };
const linkBtn = { background:'none', border:'none', color:'#2563eb', cursor:'pointer', padding:0 };
