// Express server bootstrap: wires middleware, routes, and error handling.
import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import transactionsRouter from './routes/transactions.js';
import { initCategoryStore } from './store/categoryStore.js';
import { initTransactionStore } from './store/transactionStore.js';

const app = express();
initCategoryStore();
initTransactionStore();
const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0';

// CORS: supports comma-separated origins; '*' fallback for simplicity (dev only).
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*'}));
app.use(express.json());
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/transactions', transactionsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, HOST, () => {
  console.log(`API server listening on http://${HOST}:${PORT}`);
});
