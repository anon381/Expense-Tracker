import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../authContext.jsx';
import { api } from '../api.js';

export function Dashboard(){
  const { token, user, logout } = useAuth();
  const [txns, setTxns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({ type:'expense', amount:'', category:'', description:'', date:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ search:'' });

  async function loadAll(){
    if(!token) return;
    setLoading(true); setError(null);
    try {
      const [cats, list, sum] = await Promise.all([
        api.categories(token),
        api.listTransactions(token, filter.search?{search:filter.search}:{}),
        api.monthlySummary(token)
      ]);
      setCategories(cats);
      setTxns(list);
      setSummary(sum);
    } catch(e){ setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(()=>{ loadAll(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filter.search]);

  async function addTxn(e){
    e.preventDefault();
    try {
      await api.createTransaction(token, { ...form, amount: parseFloat(form.amount) });
      setForm(f=>({ ...f, amount:'', description:'' }));
      loadAll();
    } catch(e){ alert(e.message); }
  }

  async function delTxn(id){
    if(!confirm('Delete transaction?')) return;
    await api.deleteTransaction(token, id);
    loadAll();
  }

  const totals = useMemo(()=>{
    let income=0, expense=0;
    txns.forEach(t=>{ if(t.type==='income') income+=t.amountMinor; else expense+=t.amountMinor; });
    return { income: income/100, expense: expense/100, net:(income-expense)/100 };
  }, [txns]);

  return (
    <div style={{ maxWidth:1000, margin:'0 auto', padding:'2rem' }}>
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h2 style={{ margin:0 }}>Dashboard</h2>
        <div style={{ fontSize:14 }}>
          <strong>{user?.username}</strong>{' '}<button onClick={logout} style={btnLink}>Logout</button>
        </div>
      </header>
      {error && <div style={{ color:'crimson', marginBottom:12 }}>{error}</div>}
      <section style={{ display:'grid', gap:'1rem', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', marginBottom:'1.5rem' }}>
        <StatCard label="Income" value={totals.income.toFixed(2)} />
        <StatCard label="Expense" value={totals.expense.toFixed(2)} />
        <StatCard label="Net" value={totals.net.toFixed(2)} />
        {summary && <StatCard label={`Month ${summary.month}`} value={(summary.netMinor/100).toFixed(2)} />}
      </section>
      <div style={{ display:'flex', gap:'2rem', flexWrap:'wrap' }}>
        <form onSubmit={addTxn} style={{ flex:'1 1 300px', minWidth:280, background:'#fff', padding:'1rem', borderRadius:8, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop:0 }}>Add Transaction</h3>
          <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={input}> 
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input placeholder="Amount" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} required style={input} />
          <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={input}>
            <option value="">Select category</option>
            {categories.map(c=> <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <input placeholder="Description" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={input} />
          <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={input} />
          <button style={primaryBtn} disabled={loading}>{loading? 'Saving...' : 'Add'}</button>
        </form>
        <div style={{ flex:'2 1 480px', minWidth:320 }}>
          <h3 style={{ marginTop:0 }}>Transactions</h3>
          <input placeholder="Search description" value={filter.search} onChange={e=>setFilter(f=>({...f,search:e.target.value}))} style={{ ...input, maxWidth:260 }} />
          <div style={{ overflowX:'auto', marginTop:8 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
              <thead>
                <tr style={thRow}><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th style={{ textAlign:'right' }}>Amount</th><th></th></tr>
              </thead>
              <tbody>
                {txns.map(t => (
                  <tr key={t.id} style={{ borderBottom:'1px solid #eee' }}>
                    <td>{t.date?.slice(0,10)}</td>
                    <td>{t.type}</td>
                    <td>{t.category}</td>
                    <td>{t.description}</td>
                    <td style={{ textAlign:'right', color: t.type==='expense' ? '#dc2626' : '#059669' }}>{(t.amountMinor/100).toFixed(2)}</td>
                    <td><button onClick={()=>delTxn(t.id)} style={delBtn}>✕</button></td>
                  </tr>
                ))}
                {txns.length===0 && !loading && <tr><td colSpan={6} style={{ textAlign:'center', padding:'1rem', color:'#666' }}>No transactions</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }){
  return (
    <div style={{ background:'#fff', padding:'1rem', borderRadius:8, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize:12, textTransform:'uppercase', letterSpacing:0.5, color:'#555' }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:600, marginTop:4 }}>{value}</div>
    </div>
  );
}

const input = { width:'100%', padding:'8px 10px', marginBottom:8, border:'1px solid #ccc', borderRadius:4 };
const primaryBtn = { ...input, background:'#2563eb', color:'#fff', cursor:'pointer', fontWeight:600, border:'none', marginBottom:0 };
const delBtn = { background:'none', border:'none', color:'#dc2626', cursor:'pointer' };
const btnLink = { background:'none', border:'none', color:'#2563eb', cursor:'pointer', fontSize:12 };
const thRow = { background:'#f1f5f9', textAlign:'left' };
