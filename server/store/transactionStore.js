// Transaction store: file-backed in-memory list with lightweight filtering & CRUD.
// Added support to ignore special objects containing a _comment field in the JSON array.
import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_FILE = join(__dirname, '..', 'data', 'transactions.json');

let transactions = [];
let initialized = false;
let writePending = false;

function load() {
  if (!existsSync(DATA_FILE)) { persist(); return; }
  try {
    const parsed = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
    transactions = Array.isArray(parsed) ? parsed.filter(t => !t?._comment) : [];
  } catch { transactions = []; }
}

function persist() {
  if (writePending) return;
  writePending = true;
  setTimeout(() => {
    try { writeFileSync(DATA_FILE, JSON.stringify(transactions, null, 2), 'utf8'); } catch(e) { console.error('txn write fail', e);} finally { writePending = false; }
  }, 25);
}

export function initTransactionStore() { if (!initialized) { load(); initialized = true; } }

export function listTransactions(userId, filters = {}) {
  let list = transactions.filter(t => t.userId === userId);
  const { start, end, category, type, search } = filters;
  if (start) list = list.filter(t => t.date >= start);
  if (end) list = list.filter(t => t.date <= end);
  if (category) list = list.filter(t => t.category === category);
  if (type) list = list.filter(t => t.type === type);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(t => (t.description||'').toLowerCase().includes(q));
  }
  return list.sort((a,b)=> b.date.localeCompare(a.date));
}

export function createTransaction(userId, data) {
  const now = new Date().toISOString();
  const txn = { id: randomUUID(), userId, createdAt: now, updatedAt: now, ...data };
  transactions.push(txn);
  persist();
  return txn;
}

export function updateTransaction(userId, id, patch) {
  const idx = transactions.findIndex(t => t.id === id && t.userId === userId);
  if (idx === -1) return null;
  transactions[idx] = { ...transactions[idx], ...patch, updatedAt: new Date().toISOString() };
  persist();
  return transactions[idx];
}

export function deleteTransaction(userId, id) {
  const before = transactions.length;
  transactions = transactions.filter(t => !(t.id === id && t.userId === userId));
  if (transactions.length !== before) persist();
  return before !== transactions.length;
}

export function getTransaction(userId, id) {
  return transactions.find(t => t.userId === userId && t.id === id) || null;
}
