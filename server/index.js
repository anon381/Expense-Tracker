// Express server bootstrap: wires middleware, routes, and error handling.
import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import transactionsRouter from './routes/transactions.js';
import { initCategoryStore } from './store/categoryStore.js';
import { initTransactionStore } from './store/transactionStore.js';
import { resetAll as resetUsers } from './store/userStore.js';

const app = express();
initCategoryStore();
initTransactionStore();
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

// CORS: verbose origin logger to help diagnose fetch failures. Allows all origins in dev.
app.use(cors({
  origin: (origin, cb) => {
    console.log('[CORS] origin', origin);
    // Basic allow list if env provided, else allow all.
    const allowed = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : null;
    if (!allowed || !origin || allowed.includes(origin) || /localhost|127\.0\.0\.1|\[::1\]/.test(origin)) {
      return cb(null, true);
    }
    console.log('[CORS] blocked origin', origin);
    return cb(null, false);
  },
  credentials: true
}));
app.use(express.json());
// Debug: log parsed JSON bodies (auth focus). Remove for production.
app.use((req, _res, next) => {
  if (req.is('application/json')) {
    console.log('[BODY]', req.method, req.url, JSON.stringify(req.body));
  }
  next();
});
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Root quick-probe (used by tooling & manual curl tests)
app.get('/', (_req, res) => res.send('OK'));

// Dev-only reset (not for production)
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/dev/reset-users', (_req, res) => { resetUsers(); res.json({ ok: true }); });
}

app.use('/api/auth', authRouter);
app.use('/api/transactions', transactionsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const srv = app.listen(PORT, HOST, () => {
  console.log(`API server listening on http://${HOST}:${PORT}`);
  // Internal self-connect probe (no network stack beyond loopback) to ensure event loop + route wiring.
  import('http').then(http => {
    const opts = { host: '127.0.0.1', port: PORT, path: '/api/health', method: 'GET' };
    const req = http.request(opts, r => {
      let data=''; r.on('data', d=>data+=d); r.on('end', ()=>console.log('[SELFTEST] /api/health status', r.statusCode, 'body', data));
    });
    req.on('error', e => console.error('[SELFTEST] failed', e.message));
    req.end();
  });
});
srv.on('error', (e) => { console.error('Server listen error', e); });

process.on('unhandledRejection', (reason) => {
  console.error('UnhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('UncaughtException:', err);
});

// EOF note: kept for commit granularity; no runtime impact.
