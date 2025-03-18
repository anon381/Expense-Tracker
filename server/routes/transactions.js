// Transactions API routes.
// All endpoints require a valid access token (router.use(requireAuth)).
// Capabilities:
//   GET    /          : list transactions with optional filtering (date range, category, type, search)
//   POST   /          : create a transaction (amount can be string or number)
//   PUT    /:id       : partial update (supports changing amount/date/type/category/description)
//   DELETE /:id       : remove a transaction
//   GET    /summary/monthly : aggregated net for current month (UTC)
//   GET    /categories      : list category metadata
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { initTransactionStore, listTransactions, createTransaction, updateTransaction, deleteTransaction } from '../store/transactionStore.js';
import { listCategories } from '../store/categoryStore.js';

initTransactionStore();

const router = Router();

router.use(requireAuth);

function parseAmountToMinor(amount) {
  if (typeof amount === 'number') return Math.round(amount * 100);
  if (typeof amount === 'string') return Math.round(parseFloat(amount) * 100);
  return 0;
}

router.get('/', (req, res) => {
  const { start, end, category, type, search } = req.query;
  const data = listTransactions(req.user.id, { start, end, category, type, search });
  res.json(data);
});

router.post('/', (req, res) => {
  const { type, amount, currency = 'USD', category, description = '', date } = req.body || {};
  if (!['expense','income'].includes(type)) return res.status(400).json({ error: 'invalid type' });
  if (amount == null) return res.status(400).json({ error: 'amount required' });
  const minor = parseAmountToMinor(amount);
  if (Number.isNaN(minor)) return res.status(400).json({ error: 'amount invalid' });
  const when = date ? new Date(date).toISOString() : new Date().toISOString();
  const cat = category || 'Uncategorized';
  const txn = createTransaction(req.user.id, { type, amountMinor: minor, currency, category: cat, description, date: when });
  res.status(201).json(txn);
});

router.put('/:id', (req, res) => {
  const patch = { ...req.body };
  if (patch.amount !== undefined) {
    patch.amountMinor = parseAmountToMinor(patch.amount);
    delete patch.amount;
  }
  if (patch.date) patch.date = new Date(patch.date).toISOString();
  const updated = updateTransaction(req.user.id, req.params.id, patch);
  if (!updated) return res.status(404).json({ error: 'not found' });
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const ok = deleteTransaction(req.user.id, req.params.id);
  if (!ok) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

router.get('/summary/monthly', (req, res) => {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const txns = listTransactions(req.user.id, { start: monthStart });
  let income = 0, expense = 0;
  txns.forEach(t => { if (t.type === 'income') income += t.amountMinor; else expense += t.amountMinor; });
  res.json({ month: now.toISOString().slice(0,7), incomeMinor: income, expenseMinor: expense, netMinor: income - expense });
});

router.get('/categories', (_req, res) => {
  res.json(listCategories());
});

export default router;
