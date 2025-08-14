const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, { method='GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: body?JSON.stringify(body):undefined });
  } catch (netErr) {
    throw new Error('Network error: ' + netErr.message);
  }
  if (!res.ok) {
    let err; try { err = await res.json(); } catch { err = { error: res.status + ' ' + res.statusText }; }
    throw new Error(err.error || 'Request failed');
  }
  try { return await res.json(); } catch { return null; }
}

export const api = {
  register: (u,p) => request('/auth/register',{method:'POST', body:{username:u,password:p}}),
  login: (u,p) => request('/auth/login',{method:'POST', body:{username:u,password:p}}),
  listTransactions: (token, query={}) => {
    const qs = new URLSearchParams(query).toString();
    return request(`/transactions${qs?`?${qs}`:''}`, { token });
  },
  createTransaction: (token, data) => request('/transactions', { method:'POST', token, body:data }),
  updateTransaction: (token, id, patch) => request(`/transactions/${id}`, { method:'PUT', token, body:patch }),
  deleteTransaction: (token, id) => request(`/transactions/${id}`, { method:'DELETE', token }),
  monthlySummary: (token) => request('/transactions/summary/monthly', { token }),
  categories: (token) => request('/transactions/categories', { token })
};
